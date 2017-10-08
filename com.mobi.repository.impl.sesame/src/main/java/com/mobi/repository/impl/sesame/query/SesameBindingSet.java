package com.mobi.repository.impl.sesame.query;

/*-
 * #%L
 * com.mobi.repository.impl.sesame
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

import com.mobi.query.api.Binding;
import com.mobi.query.api.BindingSet;
import com.mobi.rdf.api.Value;
import com.mobi.query.api.Binding;
import com.mobi.query.api.BindingSet;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.core.utils.Values;

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
        org.openrdf.query.Binding sesameBinding = bindingSet.getBinding(bindingName);
        if (sesameBinding == null) {
            return Optional.empty();
        } else {
            return Optional.of(new SesameBinding(sesameBinding));
        }
    }

    @Override
    public boolean hasBinding(String bindingName) {
        return bindingSet.hasBinding(bindingName);
    }

    @Override
    public Optional<Value> getValue(String bindingName) {
        org.openrdf.model.Value value = bindingSet.getValue(bindingName);
        if (value == null) {
            return Optional.empty();
        } else {
            return Optional.of(Values.matontoValue(value));
        }
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
