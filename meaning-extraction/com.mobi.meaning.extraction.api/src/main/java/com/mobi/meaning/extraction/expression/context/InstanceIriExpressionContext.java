package com.mobi.meaning.extraction.expression.context;

import com.mobi.meaning.extraction.expression.IriExpressionProcessor;
import com.mobi.rdf.api.Value;

import java.util.Optional;

public interface InstanceIriExpressionContext extends IriExpressionContext {

    String classIri();

    Optional<String> propertyValue(String predicate);

    String propertyValueOrUUID(String predicate);

}
