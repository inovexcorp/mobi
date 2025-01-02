package com.mobi.document.translator.stack;

/*-
 * #%L
 * meaning.extraction.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import com.mobi.document.translator.AbstractSemanticTranslator;
import com.mobi.document.translator.SemanticTranslationException;
import com.mobi.document.translator.SemanticTranslator;
import com.mobi.document.translator.expression.context.impl.DefaultClassIriExpressionContext;
import com.mobi.document.translator.expression.context.impl.DefaultInstanceIriExpressionContext;
import com.mobi.document.translator.expression.context.impl.DefaultPropertyIriExpressionContext;
import com.mobi.document.translator.ontology.ExtractedClass;
import com.mobi.document.translator.ontology.ExtractedObjectProperty;
import com.mobi.document.translator.ontology.ExtractedOntology;
import com.mobi.document.translator.ontology.ExtractedProperty;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.Thing;
import com.mobi.document.translator.ontology.ExtractedDatatypeProperty;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * This abstract implementation of the {@link StackingSemanticTranslator} provides some boiler plate code so that
 * implementors won't need to rewrite the stacking logic over and over.
 *
 * @param <T> The type of {@link StackItem} your implementation will use.
 */
public abstract class AbstractStackingSemanticTranslator<T extends StackItem> extends AbstractSemanticTranslator
        implements SemanticTranslator, StackingSemanticTranslator<T> {

    private static final Logger LOG = LoggerFactory.getLogger(AbstractStackingSemanticTranslator.class);

    private static final String DEFAULT_PROPERTY_IRI_EXPRESSION = "getOntologyIri().concat('#_').concat(getName())";

    private static final String DEFAULT_CLASS_IRI_EXPRESSION = "getOntologyIri().concat('#').concat(getName())";

    private static final String DEFAULT_INSTANCE_IRI_EXPRESSION = "classIri().replace('#','/').concat('/').concat(uuid())";

    protected final String delimiter;

    protected final String prefix;

    protected final String suffix;

    private final Deque<T> stack;

    protected AbstractStackingSemanticTranslator(String... supportedTypes) {
        this("|", "{", "}", supportedTypes);
    }

    protected AbstractStackingSemanticTranslator(String delimiter, String prefix, String suffix, String... supportedTypes) {
        super(supportedTypes);
        this.delimiter = delimiter;
        this.prefix = prefix;
        this.suffix = suffix;
        this.stack = new ArrayDeque<>();
    }

    @Override
    public T pushStack(T item) {
        stack.add(item);
        return item;
    }

    @Override
    public Optional<T> popStack() {
        return stack.isEmpty() ? Optional.empty() : Optional.of(stack.removeLast());
    }

    @Override
    public Optional<T> peekStack() {
        return stack.isEmpty() ? Optional.empty() : Optional.of(stack.getLast());
    }

    @Override
    public String getCurrentLocation() {
        return stack.stream().map(StackItem::getIdentifier).sequential()
                .collect(Collectors.joining(delimiter, prefix, suffix));
    }

    @Override
    public Model translate(Path rawFile, ExtractedOntology managedOntology) throws SemanticTranslationException {
        try (final InputStream is = new FileInputStream(rawFile.toFile())) {
            return translate(is, rawFile.toAbsolutePath().toString(), managedOntology);
        } catch (IOException e) {
            throw new SemanticTranslationException("Issue reading specified file to extract meaning", e);
        }
    }

    private <X extends Thing> OrmFactory<X> factory(Class<X> clazz) throws SemanticTranslationException {
        return ormFactoryRegistry.getFactoryOfType(clazz)
                .orElseThrow(() -> new SemanticTranslationException("ORM services not initialized correctly!"));
    }

    protected ExtractedDatatypeProperty getOrCreateDatatypeProperty(ExtractedOntology managedOntology, IRI domain,
                                                                    IRI range, String name, String address)
            throws SemanticTranslationException {
        return getOrCreateProperty(ExtractedDatatypeProperty.class, managedOntology, domain, range, name, address);
    }

    private ExtractedObjectProperty getOrCreateObjectProperty(ExtractedOntology managedOntology, IRI domain,
                                                                IRI range, String name, String address)
            throws SemanticTranslationException {
        return getOrCreateProperty(ExtractedObjectProperty.class, managedOntology, domain, range, name, address);
    }

    private <X extends ExtractedProperty> X getOrCreateProperty(Class<X> type, ExtractedOntology managedOntology, IRI domain,
                                                                IRI range, String name, String address)
            throws SemanticTranslationException {
        final OrmFactory<X> factory = factory(type);
        final String expression = managedOntology.getSpelPropertyUri().orElse(DEFAULT_PROPERTY_IRI_EXPRESSION);
        final IRI iri = this.expressionProcessor.processExpression(expression,
                new DefaultPropertyIriExpressionContext(managedOntology, name, address, domain, range));
        final X prop = factory.getExisting(iri, managedOntology.getModel())
                .orElseGet(() -> {
                    LOG.debug("Creating new property {}", iri);
                    X val = factory.createNew(iri, managedOntology.getModel());
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
            throws SemanticTranslationException {
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

    protected IRI createInstance(Model result, ExtractedOntology managedOntology, T stackItem,
                                 ExtractedClass instanceClass, T parent)
            throws SemanticTranslationException {
        final IRI instance = generateInstanceIri(instanceClass, managedOntology, stackItem);
        // Create instance.
        result.add(instance, getRdfType(), instanceClass.getResource());
        // Add properties.
        stackItem.getProperties().keySet().forEach(predicate ->
                stackItem.getProperties().get(predicate).forEach(val -> result.add(instance, predicate, val))
        );
        if (parent != null) {
            ExtractedObjectProperty objectProperty = getOrCreateObjectProperty(managedOntology,
                    parent.getClassIri(), stackItem.getClassIri(), stackItem.getIdentifier(), getCurrentLocation());
            parent.getProperties().add((IRI) objectProperty.getResource(), instance);
        }
        return instance;
    }

    private IRI generateInstanceIri(ExtractedClass instanceClass, ExtractedOntology managedOntology, T stackItem)
            throws SemanticTranslationException {
        final String expression = instanceClass.getSpelInstanceUri().orElse(DEFAULT_INSTANCE_IRI_EXPRESSION);
        return this.expressionProcessor.processExpression(expression,
                new DefaultInstanceIriExpressionContext(managedOntology, instanceClass,
                        stackItem.getProperties(), this.valueFactory));
    }

    protected IRI generateClassIri(final ExtractedOntology managedOntology, final String name, final String address)
            throws SemanticTranslationException {
        final String expression = managedOntology.getSpelClassUri().orElse(DEFAULT_CLASS_IRI_EXPRESSION);
        return this.expressionProcessor.processExpression(expression,
                new DefaultClassIriExpressionContext(managedOntology, name, address));
    }

    protected Deque<T> getStack() {
        return stack;
    }
}
