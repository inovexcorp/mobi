package com.mobi.rest.test.util;

/*-
 * #%L
 * com.mobi.rest.test.util
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import org.apache.commons.lang3.NotImplementedException;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.query.BindingSet;
import org.eclipse.rdf4j.query.QueryEvaluationException;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.query.impl.ListBindingSet;

import java.util.List;
import java.util.Objects;
import java.util.function.Consumer;
import java.util.stream.Collectors;

public class TestQueryResult implements TupleQueryResult {
    private List<String> bindings;
    private List<Value> values;
    private int size;

    public TestQueryResult(List<String> bindings, List<String> values, int size, ValueFactory vf) {
        if (bindings.size() != values.size()) {
            throw new IllegalArgumentException("Bindings and values must be equal in size");
        }
        if (size < 0) {
            throw new IllegalArgumentException("Size cannot be negative");
        }
        this.bindings = bindings;
        this.size = size;
        this.values = values.stream()
                .map(vf::createIRI)
                .collect(Collectors.toList());
    }

    @Override
    public List<String> getBindingNames() throws QueryEvaluationException {
        return bindings;
    }

    @Override
    public void close() {
        this.size = 0;
    }

    @Override
    public boolean hasNext() {
        return this.size-- > 0;
    }

    @Override
    public BindingSet next() {
        return new ListBindingSet(this.bindings, this.values);
    }

    @Override
    public void remove() throws QueryEvaluationException {
        throw new NotImplementedException("Not implemented for test class");
    }

    @Override
    public void forEach(Consumer<? super BindingSet> action) {
        Objects.requireNonNull(action);
        if (this.values.size() > 0) {
            action.accept(new ListBindingSet(this.bindings, this.values));
        }
    }
}
