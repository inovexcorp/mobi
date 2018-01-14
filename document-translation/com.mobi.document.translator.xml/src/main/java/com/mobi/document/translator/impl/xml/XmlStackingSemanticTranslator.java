package com.mobi.document.translator.impl.xml;

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
import org.apache.commons.io.input.XmlStreamReader;
import org.apache.commons.lang.StringUtils;
import org.openrdf.model.vocabulary.RDFS;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.xml.stream.*;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

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
                        break;
                    case XMLStreamConstants.COMMENT:
                        final String commentText = reader.getText();
                        final Optional<XmlStackItem> opt = peekStack();
                        if (opt.isPresent()) {
                            addComment(opt.get(), commentText);
                        } else {
                            rootComments.add(commentText);
                        }
                        break;
                    case XMLStreamConstants.END_ELEMENT:
                        final XmlStackItem offItem = popStack()
                                // End of element requires a corresponding stack item.
                                .orElseThrow(() -> new SemanticTranslationException("Element ending without a " +
                                        "corresponding stack item."));
                        String val = stringBuffer.toString();
                        LOG.trace("Ending '{}' - Value: '{}'", reader.getLocalName(), val);
                        stringBuffer.setLength(0);
                        if (offItem.isRoot()) {
                            rootComments.forEach(comment -> {
                                addComment(offItem, comment);
                            });
                        }

                        if (offItem.getProperties().isEmpty()) {
                            if (StringUtils.isNotBlank(val)) {
                                Optional<XmlStackItem> optParent = peekStack();
                                if (optParent.isPresent()) {
                                    final XmlStackItem parent = optParent.get();
                                    final ExtractedDatatypeProperty datatypeProperty = getOrCreateDatatypeProperty(
                                            managedOntology, parent.getClassIri(), xsdString(),
                                            offItem.getIdentifier(), getCurrentLocation());
                                    parent.getProperties().add((IRI) datatypeProperty.getResource(),
                                            valueFactory.createLiteral(val));
                                } else {
                                    //TODO
                                    LOG.warn("Datatype Property not attached to object...");
                                }
                            }
                        } else {
                            final ExtractedClass clazz = getOrCreateClass(managedOntology,
                                    offItem.getClassIri(), offItem.getIdentifier(), address);
                            if (StringUtils.isNotBlank(val)) {
                                offItem.getProperties().add(getRdfValue(), valueFactory.createLiteral(val));
                            }
                            final IRI instanceIri = createInstance(resultsModel, managedOntology, offItem, clazz, peekStack());
                            LOG.debug("Created instance of '{}' - '{}'", clazz.getResource(), instanceIri);
                        }
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
