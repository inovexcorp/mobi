package com.mobi.meaning.extraction.expression.context.impl;

import com.mobi.meaning.extraction.expression.DefaultIriExpressionProcessor;
import com.mobi.meaning.extraction.expression.context.InstanceIriExpressionContext;
import com.mobi.meaning.extraction.ontology.ExtractedClass;
import com.mobi.meaning.extraction.ontology.ExtractedOntology;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import org.springframework.util.MultiValueMap;

import java.util.Optional;
import java.util.UUID;

public class DefaultInstanceIriExpressionContext extends AbstractIriExpressionContext implements InstanceIriExpressionContext {

    private final ExtractedClass instanceClass;

    private final MultiValueMap<IRI, Value> properties;

    private final ValueFactory valueFactory;

    public DefaultInstanceIriExpressionContext(ExtractedOntology managedOntology, ExtractedClass instanceClass,
                                               MultiValueMap<IRI, Value> properties, ValueFactory valueFactory) {
        super(managedOntology);
        this.instanceClass = instanceClass;
        this.properties = properties;
        this.valueFactory = valueFactory;
    }

    @Override
    public String classIri() {
        return instanceClass.getResource().stringValue();
    }

    @Override
    public Optional<String> propertyValue(String predicate) {
        IRI predicateIri = valueFactory.createIRI(predicate);
        return properties.containsKey(predicateIri) ? Optional.ofNullable(properties.getFirst(predicateIri).stringValue())
                : Optional.empty();
    }

    @Override
    public String propertyValueOrUUID(String predicate) {
        return propertyValue(predicate).orElse(UUID.randomUUID().toString());
    }
}
