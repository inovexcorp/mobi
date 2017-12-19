package com.mobi.meaning.extraction.stack;

        /*-
         * #%L
 * meaning.extraction.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

import com.mobi.meaning.extraction.AbstractMeaningExtractor;
import com.mobi.meaning.extraction.MeaningExtractionException;
import com.mobi.meaning.extraction.MeaningExtractor;
import com.mobi.meaning.extraction.expression.context.impl.DefaultClassIriExpressionContext;
import com.mobi.meaning.extraction.expression.context.impl.DefaultInstanceIriExpressionContext;
import com.mobi.meaning.extraction.expression.context.impl.DefaultPropertyIriExpressionContext;
import com.mobi.meaning.extraction.ontology.ExtractedClass;
import com.mobi.meaning.extraction.ontology.ExtractedDatatypeProperty;
import com.mobi.meaning.extraction.ontology.ExtractedObjectProperty;
import com.mobi.meaning.extraction.ontology.ExtractedOntology;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.Thing;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import java.util.Optional;
import java.util.Stack;
import java.util.stream.Collectors;

public abstract class AbstractStackingMeaningExtractor<T extends StackItem> extends AbstractMeaningExtractor implements MeaningExtractor, StackingMeaningExtractor<T> {

    private static final Logger LOG = LoggerFactory.getLogger(AbstractStackingMeaningExtractor.class);

    private static final String DEFAULT_PROPERTY_IRI_EXPRESSION = "getOntologyIri().concat('#_').concat(getName())";

    private static final String DEFAULT_CLASS_IRI_EXPRESSION = "getOntologyIri().concat('#').concat(getName())";

    private static final String DEFAULT_INSTANCE_IRI_EXPRESSION = "classIri().concat('/').concat(uuid())";

    private final String delimiter;

    private final String prefix;

    private final String suffix;

    private final Stack<T> stack;

    private IRI domainIri = null;

    private IRI rangeIri = null;

    private IRI labelIri = null;

    private IRI commentIri = null;

    private IRI rdfType = null;


    protected AbstractStackingMeaningExtractor() {
        this("|", "{", "}");
    }

    protected AbstractStackingMeaningExtractor(String delimiter, String prefix, String suffix) {
        this.delimiter = delimiter;
        this.prefix = prefix;
        this.suffix = suffix;
        this.stack = new Stack<>();
    }

    @Override
    public T pushStack(T item) {
        stack.add(item);
        return item;
    }

    @Override
    public Optional<T> popStack() {
        return stack.isEmpty() ? Optional.empty() : Optional.of(stack.pop());
    }

    @Override
    public Optional<T> peekStack() {
        return stack.isEmpty() ? Optional.empty() : Optional.of(stack.peek());
    }

    @Override
    public String getCurrentLocation() {
        return stack.stream().map(StackItem::getIdentifier).collect(Collectors.joining(delimiter, prefix, suffix));
    }

    @Override
    public Model extractMeaning(Path rawFile, ExtractedOntology managedOntology) throws MeaningExtractionException {
        try (final InputStream is = new FileInputStream(rawFile.toFile())) {
            return extractMeaning(is, rawFile.toAbsolutePath().toString(), managedOntology);
        } catch (IOException e) {
            throw new MeaningExtractionException("Issue reading specified file to extract meaning", e);
        }
    }

    private <T extends Thing> OrmFactory<T> factory(Class<T> clazz) throws MeaningExtractionException {
        return ormFactoryRegistry.getFactoryOfType(clazz).orElseThrow(() -> new MeaningExtractionException("ORM services not initialized correctly!"));
    }


    protected ExtractedDatatypeProperty getOrCreateDatatypeProperty(ExtractedOntology managedOntology, IRI domain,
                                                                    IRI range, String name, String address) throws MeaningExtractionException {
        OrmFactory<ExtractedDatatypeProperty> factory = factory(ExtractedDatatypeProperty.class);
        final String expression = managedOntology.getSpelPropertyUri().orElse(DEFAULT_PROPERTY_IRI_EXPRESSION);
        final IRI iri = this.expressionProcessor.processExpression(expression, new DefaultPropertyIriExpressionContext(managedOntology, name, address, domain, range));
        ExtractedDatatypeProperty prop = factory.getExisting(iri, managedOntology.getModel())
                .orElseGet(() -> {
                    LOG.debug("Creating new data type property {}", iri);
                    ExtractedDatatypeProperty val = factory.createNew(iri, managedOntology.getModel());
                    val.addProperty(valueFactory.createLiteral(name), getLabelIri());
                    return val;
                });
        // Add domain/range/comment.
        prop.addProperty(domain, getDomainIri());
        prop.addProperty(range, getRangeIri());
        prop.addProperty(valueFactory.createLiteral(address), getCommentIri());
        return prop;
    }

    protected ExtractedObjectProperty getOrCreateObjectProperty(ExtractedOntology managedOntology, IRI domain,
                                                                IRI range, String name, String address) throws MeaningExtractionException {
        OrmFactory<ExtractedObjectProperty> factory = factory(ExtractedObjectProperty.class);
        final String expression = managedOntology.getSpelPropertyUri().orElse(DEFAULT_PROPERTY_IRI_EXPRESSION);
        final IRI iri = this.expressionProcessor.processExpression(expression, new DefaultPropertyIriExpressionContext(managedOntology, name, address, domain, range));
        ExtractedObjectProperty prop = factory.getExisting(iri, managedOntology.getModel())
                .orElseGet(() -> {
                    LOG.debug("Creating new object property {}", iri);
                    ExtractedObjectProperty val = factory.createNew(iri, managedOntology.getModel());
                    val.addProperty(valueFactory.createLiteral(name), getLabelIri());
                    return val;
                });
        // Add domain/range/comment.
        prop.addProperty(domain, getDomainIri());
        prop.addProperty(range, getRangeIri());
        prop.addProperty(valueFactory.createLiteral(address), getCommentIri());
        return prop;
    }

    protected ExtractedClass getOrCreateClass(ExtractedOntology managedOntology, IRI classIri, String name, String address)
            throws MeaningExtractionException {
        OrmFactory<ExtractedClass> factory = factory(ExtractedClass.class);
        ExtractedClass extractedClass = factory.getExisting(classIri, managedOntology.getModel())
                .orElseGet(() -> {
                    LOG.debug("Creating new class {}", classIri);
                    ExtractedClass clazz = factory.createNew(classIri, managedOntology.getModel());
                    clazz.addProperty(valueFactory.createLiteral(name), getLabelIri());
                    return clazz;
                });
        extractedClass.addProperty(valueFactory.createLiteral(address), getCommentIri());
        return extractedClass;
    }

    protected IRI createInstance(Model result, ExtractedOntology managedOntology, T stackItem, ExtractedClass instanceClass,
                                 Optional<T> parentOpt)
            throws MeaningExtractionException {
        final IRI instance = generateInstanceIri(instanceClass, managedOntology, stackItem);
        // Create instance.
        result.add(instance, getRdfType(), instanceClass.getResource());
        // Add properties.
        stackItem.getProperties().keySet().forEach(predicate ->
                stackItem.getProperties().get(predicate).forEach(val -> result.add(instance, predicate, val))
        );
        if (parentOpt.isPresent()) {
            T parent = parentOpt.get();
            ExtractedObjectProperty objectProperty = getOrCreateObjectProperty(managedOntology, parent.getClassIri(), stackItem.getClassIri(), stackItem.getIdentifier(), getCurrentLocation());
            parent.getProperties().add((IRI) objectProperty.getResource(), instance);
        }
        return instance;
    }

    protected IRI generateInstanceIri(ExtractedClass instanceClass, ExtractedOntology managedOntology, T stackItem)
            throws MeaningExtractionException {
        final String expression = instanceClass.getSpelInstanceUri().orElse(DEFAULT_INSTANCE_IRI_EXPRESSION);
        return this.expressionProcessor.processExpression(expression,
                new DefaultInstanceIriExpressionContext(managedOntology, instanceClass, stackItem.getProperties(), this.valueFactory));
    }

    protected IRI generateClassIri(ExtractedOntology managedOntology, final String name, final String address) throws MeaningExtractionException {
        final String expression = managedOntology.getSpelClassUri().orElse(DEFAULT_CLASS_IRI_EXPRESSION);
        return this.expressionProcessor.processExpression(expression, new DefaultClassIriExpressionContext(managedOntology, name, address));
    }


    private IRI getDomainIri() {
        if (domainIri == null) {
            domainIri = valueFactory.createIRI("http://www.w3.org/2000/01/rdf-schema#", "domain");
        }
        return domainIri;
    }

    private IRI getRangeIri() {
        if (rangeIri == null) {
            rangeIri = valueFactory.createIRI("http://www.w3.org/2000/01/rdf-schema#", "range");
        }
        return rangeIri;
    }

    private IRI getLabelIri() {
        if (labelIri == null) {
            labelIri = valueFactory.createIRI("http://www.w3.org/2000/01/rdf-schema#", "label");
        }
        return labelIri;
    }

    private IRI getCommentIri() {
        if (commentIri == null) {
            commentIri = valueFactory.createIRI("http://www.w3.org/2000/01/rdf-schema#", "comment");
        }
        return commentIri;
    }

    private IRI getRdfType() {
        if (rdfType == null) {
            rdfType = valueFactory.createIRI("http://www.w3.org/1999/02/22-rdf-syntax-ns#", "type");
        }
        return rdfType;
    }
}
