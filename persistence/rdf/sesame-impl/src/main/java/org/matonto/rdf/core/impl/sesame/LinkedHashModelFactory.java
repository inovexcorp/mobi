package org.matonto.rdf.core.impl.sesame;

import org.matonto.rdf.core.api.ModelFactory;

public class LinkedHashModelFactory implements ModelFactory {

    @Override
    public LinkedHashModel createEmptyModel() {
        return new LinkedHashModel();
    }
}
