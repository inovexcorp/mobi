package org.matonto.rdf.core.impl.sesame.factory;

public interface SesameMatOntoValueFactory<T, U> {

    T asMatOntoObject(U object);
}
