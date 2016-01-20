package org.matonto.repository.impl.sesame.query;

import org.matonto.query.api.Binding;
import org.matonto.rdf.api.Value;

public class SesameBinding implements Binding {

    private org.openrdf.query.Binding binding;

    public SesameBinding(org.openrdf.query.Binding binding) {
        this.binding = binding;
    }

    @Override
    public String getName() {
        return null;
    }

    @Override
    public Value getValue() {
        return null;
    }

}
