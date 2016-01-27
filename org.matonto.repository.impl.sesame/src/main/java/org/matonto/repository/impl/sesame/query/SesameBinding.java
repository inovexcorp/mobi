package org.matonto.repository.impl.sesame.query;

import org.matonto.query.api.Binding;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.core.utils.Values;

public class SesameBinding implements Binding {

    private org.openrdf.query.Binding binding;

    public SesameBinding(org.openrdf.query.Binding binding) {
        this.binding = binding;
    }

    @Override
    public String getName() {
        return binding.getName();
    }

    @Override
    public Value getValue() {
        return Values.matontoValue(binding.getValue());
    }

}
