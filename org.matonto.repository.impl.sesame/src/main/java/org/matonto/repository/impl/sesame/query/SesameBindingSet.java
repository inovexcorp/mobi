package org.matonto.repository.impl.sesame.query;

import org.matonto.query.api.Binding;
import org.matonto.query.api.BindingSet;
import org.matonto.rdf.api.Value;

import java.util.Iterator;
import java.util.Set;

public class SesameBindingSet implements BindingSet {

    private org.openrdf.query.BindingSet bindingSet;

    public SesameBindingSet(org.openrdf.query.BindingSet bindingSet) {
        this.bindingSet = bindingSet;
    }

    @Override
    public Iterator<Binding> iterator() {
        return null;
    }

    @Override
    public Set<String> getBindingNames() {
        return null;
    }

    @Override
    public Binding getBinding(String bindingName) {
        return null;
    }

    @Override
    public boolean hasBinding(String bindingName) {
        return false;
    }

    @Override
    public Value getValue(String bindingName) {
        return null;
    }

    @Override
    public int size() {
        return 0;
    }

}
