package com.mobi.document.translator.impl.xml;

/*-
 * #%L
 * com.mobi.document.translator.xml
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.document.translator.SemanticTranslationException;
import com.mobi.document.translator.SemanticTranslator;
import com.mobi.document.translator.expression.IriExpressionProcessor;
import com.mobi.document.translator.ontology.ExtractedClass;
import com.mobi.document.translator.ontology.ExtractedDatatypeProperty;
import com.mobi.document.translator.ontology.ExtractedOntology;
import com.mobi.document.translator.stack.AbstractStackingSemanticTranslator;
import com.mobi.document.translator.stack.StackingSemanticTranslator;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import org.apache.commons.lang.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import javax.xml.stream.XMLInputFactory;
import javax.xml.stream.XMLStreamConstants;
import javax.xml.stream.XMLStreamException;
import javax.xml.stream.XMLStreamReader;

@Component(immediate = true, provide = {SemanticTranslator.class, StackingSemanticTranslator.class})
public class XmlStackingSemanticTranslator extends AbstractStackingSemanticTranslator<XmlStackItem>
        implements StackingSemanticTranslator<XmlStackItem>, SemanticTranslator {

    private static final String ATTRIBUTE_PROPERTY_NAME_TEMPLATE = "_%s-attr-%s";

    private static final Logger LOG = LoggerFactory.getLogger(XmlStackingSemanticTranslator.class);

    private static final XMLInputFactory XML_INPUT_FACTORY = XMLInputFactory.newFactory();

    private List<String> rootComments = new ArrayList<>();

    public XmlStackingSemanticTranslator() {
        super("xml", "application/xml");
    }

    @Reference
    public void setValueFactory(ValueFactory valueFactory) {
        super.valueFactory = valueFactory;
    }

    @Reference
    public void setModelFactory(ModelFactory modelFactory) {
        super.modelFactory = modelFactory;
    }

    @Reference
    public void setExpressionProcessor(IriExpressionProcessor expressionProcessor) {
        super.expressionProcessor = expressionProcessor;
    }

    @Reference
    public void setOrmFactoryRegistry(OrmFactoryRegistry ormFactoryRegistry) {
        super.ormFactoryRegistry = ormFactoryRegistry;
    }

    @Override
    public Model translate(InputStream dataStream, String entityIdentifier, ExtractedOntology managedOntology)
            throws SemanticTranslationException {
        final Model resultsModel = modelFactory.createModel();
        final XMLStreamReader reader = initXmlStreamReader(dataStream);
        try {
            final StringBuilder stringBuffer = new StringBuilder();
            for (int event = reader.next(); event != XMLStreamConstants.END_DOCUMENT; event = reader.next()) {
                final String address = getCurrentLocation();
                switch (event) {
                    case XMLStreamConstants.START_ELEMENT:
                        // Process the start of an element.
                        startElement(reader, managedOntology);
                        break;
                    case XMLStreamConstants.COMMENT:
                        // Handle a comment on the document.
                        handleComment(reader.getText());
                        break;
                    case XMLStreamConstants.END_ELEMENT:
                        // Pull the item corresponding to this element end off the stack.
                        final XmlStackItem endingItem = popStack()
                                // End of element requires a corresponding stack item.
                                .orElseThrow(() -> new SemanticTranslationException("Element ending without a " +
                                        "corresponding stack item."));
                        // Get the content for this ending element.
                        final String val = stringBuffer.toString();
                        stringBuffer.setLength(0);
                        LOG.trace("Ending '{}' - Value: '{}'", reader.getLocalName(), val);
                        // Handle the end of a root element.
                        rootElementEnding(endingItem);
                        // Handle the ending element.
                        handleElementEnd(endingItem, val, managedOntology, address, resultsModel);
                        break;
                    case XMLStreamConstants.CHARACTERS:
                        stringBuffer.append(reader.getText().trim());
                        break;
                    default:
                        break;
                }
            }
        } catch (XMLStreamException e) {
            throw new SemanticTranslationException("Issue reading XML from incoming data stream", e);
        } finally {
            silentlyCloseReader(reader);
        }
        return resultsModel;
    }

    private void handleElementEnd(XmlStackItem endingItem, String val, ExtractedOntology managedOntology,
                                  String address, Model resultsModel) throws SemanticTranslationException {
        if (endingItem.getProperties().isEmpty()) {
            if (StringUtils.isNotBlank(val)) {
                Optional<XmlStackItem> optParent = peekStack();
                if (optParent.isPresent()) {
                    final XmlStackItem parent = optParent.get();
                    final ExtractedDatatypeProperty datatypeProperty = getOrCreateDatatypeProperty(
                            managedOntology, parent.getClassIri(), xsdString(),
                            endingItem.getIdentifier(), getCurrentLocation());
                    parent.getProperties().add((IRI) datatypeProperty.getResource(),
                            valueFactory.createLiteral(val));
                } else {
                    LOG.warn("Datatype Property not attached to object...");
                }
            }
        } else {
            final ExtractedClass clazz = getOrCreateClass(managedOntology,
                    endingItem.getClassIri(), endingItem.getIdentifier(), address);
            if (StringUtils.isNotBlank(val)) {
                endingItem.getProperties().add(getRdfValue(), valueFactory.createLiteral(val));
            }
            final IRI instanceIri = createInstance(resultsModel, managedOntology, endingItem, clazz, peekStack().orElse(null));
            LOG.debug("Created instance of '{}' - '{}'", clazz.getResource(), instanceIri);
        }
    }

    private void rootElementEnding(XmlStackItem endingItem) {
        if (endingItem.isRoot()) {
            rootComments.forEach(comment -> {
                addComment(endingItem, comment);
            });
        }
    }

    private void handleComment(String commentText) {
        final Optional<XmlStackItem> opt = peekStack();
        if (opt.isPresent()) {
            addComment(opt.get(), commentText);
        } else {
            rootComments.add(commentText);
        }
    }

    private void startElement(XMLStreamReader reader, ExtractedOntology managedOntology)
            throws SemanticTranslationException {
        final XmlStackItem item = pushStack(new XmlStackItem(reader.getLocalName(),
                !peekStack().isPresent()));
        LOG.debug("Thing: '{}' at: {}", item.getIdentifier(), getCurrentLocation());
        item.setClassIri(generateClassIri(managedOntology, item.getIdentifier(), getCurrentLocation()));
        for (int i = 0; i < reader.getAttributeCount(); i++) {
            final String attributeProperty =
                    String.format(ATTRIBUTE_PROPERTY_NAME_TEMPLATE, item.getIdentifier(),
                            reader.getAttributeName(i));
            final ExtractedDatatypeProperty attrProp =
                    getOrCreateDatatypeProperty(managedOntology, item.getClassIri(), xsdString(),
                            attributeProperty, getCurrentLocation());
            item.getProperties().add((IRI) attrProp.getResource(),
                    valueFactory.createLiteral(reader.getAttributeValue(i)));
        }
    }

    private void silentlyCloseReader(final XMLStreamReader reader) {
        try {
            if (reader != null) {
                reader.close();
            }
        } catch (Exception e) {
            LOG.error("Issue closing the streaming XML reader", e);
        }
    }

    private XMLStreamReader initXmlStreamReader(final InputStream is) throws SemanticTranslationException {
        try {
            return XML_INPUT_FACTORY.createXMLStreamReader(is);
        } catch (XMLStreamException e) {
            throw new SemanticTranslationException("", e);
        }
    }

    private void addComment(XmlStackItem item, String comment) {
        item.getProperties().add(getCommentIri(), valueFactory.createLiteral(comment));
    }
}
