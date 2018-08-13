package com.mobi.rdf.orm.impl;

/*-
 * #%L
 * RDF ORM
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

import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.conversion.ValueConverterRegistry;

import java.util.Collection;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * This is the core {@link Thing} implementation that will provide the API hooks
 * that generated {@link Thing} extensions will take advantage of.
 *
 * @author bdgould
 */
public class ThingImpl implements Thing {

    /**
     * The {@link Resource} identifier for this {@link Thing}.
     */
    protected final Resource resource;

    /**
     * The backing {@link Model} for this Thing entity.
     */
    protected final Model model;

    /**
     * The {@link ValueFactory} to use.
     */
    protected final ValueFactory valueFactory;

    /**
     * The {@link ValueConverterRegistry} to convert
     */
    protected final ValueConverterRegistry valueConverterRegistry;

    /**
     * Construct a new {@link ThingImpl}.
     *
     * @param resource               The {@link Resource} identifying this {@link Thing}
     * @param model                  The {@link Model} containing the backing statements about this
     *                               {@link Thing}
     * @param valueFactory           The {@link ValueFactory} to construct RDF data with
     * @param valueConverterRegistry The {@link ValueConverterRegistry} to use for converting
     *                               {@link Value} data to objects
     */
    public ThingImpl(final Resource resource, final Model model, final ValueFactory valueFactory,
                     final ValueConverterRegistry valueConverterRegistry) {
        this.resource = resource;
        this.model = model;
        this.valueFactory = valueFactory;
        this.valueConverterRegistry = valueConverterRegistry;
    }

    /**
     * Construct a new {@link ThingImpl}.
     *
     * @param resourceString         The String IRI identifying this {@link Thing}
     * @param model                  The {@link Model} containing the backing statements about this
     *                               {@link Thing}
     * @param valueFactory           The {@link ValueFactory} to construct RDF data with
     * @param valueConverterRegistry The {@link ValueConverterRegistry} to use to convert
     *                               {@link Value} data to objects
     */
    public ThingImpl(final String resourceString, final Model model, final ValueFactory valueFactory,
                     final ValueConverterRegistry valueConverterRegistry) {
        this(valueFactory.createIRI(resourceString), model, valueFactory, valueConverterRegistry);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Resource getResource() {
        return resource;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Model getModel() {
        return model;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Optional<Value> getProperty(IRI predicate, IRI... context) {
        final Collection<Value> values = getProperties(predicate, context);
        return values.isEmpty() ? Optional.empty() : Optional.of(values.iterator().next());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Set<Value> getProperties(final IRI predicate, final IRI... context) {
        return model.filter(resource, predicate, null, context).stream().map(stmt -> {
            return stmt.getObject();
        }).collect(Collectors.toSet());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public boolean setProperty(Value value, IRI predicate, IRI... context) {
        // Remove other properties with same prediciate...
        boolean removed = model.remove(getResource(), predicate, null, context);
        return value != null ? model.add(getResource(), predicate, value, context)
                : removed;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void setProperties(Set<Value> values, IRI predicate, IRI... context) {
        // Remove other properties with same prediciate...
        model.remove(getResource(), predicate, null, context);
        values.forEach(value -> {
            model.add(getResource(), predicate, value, context);
        });
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public boolean addProperty(Value value, IRI predicate, IRI... context) {
        return model.add(getResource(), predicate, value, context);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public boolean removeProperty(Value value, IRI predicate, IRI... context) {
        return model.remove(resource, predicate, value, context);
    }

    @Override
    public boolean clearProperty(IRI predicate, IRI... context) {
        return model.remove(resource, predicate, null, context);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ValueFactory getValueFactory() {
        return valueFactory;
    }

}
