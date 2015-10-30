package org.matonto.rdf.core.impl.sesame;

import org.matonto.rdf.core.api.Model;
import org.matonto.rdf.core.api.ModelFactory;

public class TreeModelFactory implements ModelFactory {

    @Override
    public Model createEmptyModel() {
        return new TreeModel();
    }
}
