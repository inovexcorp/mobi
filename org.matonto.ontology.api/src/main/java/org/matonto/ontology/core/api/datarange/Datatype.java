package org.matonto.ontology.core.api.datarange;

import org.matonto.ontology.core.api.Entity;

public interface Datatype extends Entity, DataRange {

    boolean isString();

    boolean isInteger();

    boolean isFloat();

    boolean isDouble();

    boolean isBoolean();

    boolean isRDFPlainLiteral();
}
