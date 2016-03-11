package org.matonto.repository.impl.sesame.query;

import org.matonto.query.api.Binding;
import org.matonto.query.api.BindingSet;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.core.utils.Values;

import java.util.Iterator;
import java.util.Optional;
import java.util.Set;

public class SesameBindingSet implements BindingSet {

    private org.openrdf.query.BindingSet bindingSet;

    public SesameBindingSet(org.openrdf.query.BindingSet bindingSet) {
        this.bindingSet = bindingSet;
    }

    @Override
    public Iterator<Binding> iterator() {
        return new SesameBindingSetIterator(bindingSet.iterator());
    }

    @Override
    public Set<String> getBindingNames() {
        return bindingSet.getBindingNames();
    }

    @Override
    public Optional<Binding> getBinding(String bindingName) {
        return Optional.of(new SesameBinding(bindingSet.getBinding(bindingName)));
    }

    @Override
    public boolean hasBinding(String bindingName) {
        return bindingSet.hasBinding(bindingName);
    }

    @Override
    public Optional<Value> getValue(String bindingName) {
        return Optional.of(Values.matontoValue(bindingSet.getValue(bindingName)));
    }

    @Override
    public int size() {
        return bindingSet.size();
    }

    private class SesameBindingSetIterator implements Iterator<Binding> {

        Iterator<org.openrdf.query.Binding> sesameBindingSetIterator;

        public SesameBindingSetIterator(Iterator<org.openrdf.query.Binding> sesameBindingSetIterator) {
            this.sesameBindingSetIterator = sesameBindingSetIterator;
        }

        @Override
        public boolean hasNext() {
            return sesameBindingSetIterator.hasNext();
        }

        @Override
        public Binding next() {
            return new SesameBinding(sesameBindingSetIterator.next());
        }
    }

}
