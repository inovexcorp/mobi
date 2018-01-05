package com.mobi.rdf.orm.test;

/*-
 * #%L
 * rdf-orm-test
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.conversion.ValueConversionException;
import com.mobi.rdf.orm.conversion.ValueConverterRegistry;

import java.util.Collection;
import java.util.Optional;
import java.util.Set;
import java.util.function.Consumer;
import java.util.stream.Stream;
import javax.annotation.Nonnull;

/**
 * This is a test domain object that will provide both a {@link Thing} and {@link OrmFactory} implementation
 * for itself.  This generally will not ever happen, but it is useful here just for testing purposes...
 */
class FakeThing implements Thing, OrmFactory<FakeThing> {

    //Factory stuff.

    @Override
    public FakeThing createNew(Resource resource, Model model, ValueFactory valueFactory, ValueConverterRegistry valueConverterRegistry) {
        return null;
    }

    @Override
    public FakeThing createNew(Resource resource, Model model, ValueFactory valueFactory) {
        return null;
    }

    @Override
    public FakeThing createNew(Resource resource, Model model) {
        return null;
    }

    @Override
    public FakeThing createNew(Resource resource) {
        return null;
    }

    @Override
    public Optional<FakeThing> getExisting(Resource resource, Model model, ValueFactory valueFactory, ValueConverterRegistry valueConverterRegistry) {
        return null;
    }

    @Override
    public Optional<FakeThing> getExisting(Resource resource, Model model, ValueFactory valueFactory) {
        return null;
    }

    @Override
    public Optional<FakeThing> getExisting(Resource resource, Model model) {
        return null;
    }

    @Override
    public Collection<FakeThing> getAllExisting(Model model) {
        return null;
    }

    @Override
    public void processAllExisting(Model model, Consumer<FakeThing> consumer) {

    }

    @Override
    public Stream<FakeThing> streamExisting(Model model) {
        return null;
    }

    @Override
    public Class<FakeThing> getType() {
        return null;
    }

    @Override
    public IRI getTypeIRI() {
        return null;
    }

    @Override
    public Set<IRI> getParentTypeIRIs() {
        return null;
    }

    @Override
    public Class<? extends FakeThing> getImpl() {
        return null;
    }

    @Override
    public FakeThing convertValue(@Nonnull Value value, Thing thing, @Nonnull Class<? extends FakeThing> desiredType) throws ValueConversionException {
        return null;
    }

    @Override
    public Value convertType(@Nonnull FakeThing fakeThing, Thing thing) throws ValueConversionException {
        return null;
    }

    //Thing stuff

    @Override
    public Resource getResource() {
        return null;
    }

    @Override
    public Model getModel() {
        return null;
    }

    @Override
    public Optional<Value> getProperty(IRI predicate, IRI... context) {
        return null;
    }

    @Override
    public Set<Value> getProperties(IRI predicate, IRI... context) {
        return null;
    }

    @Override
    public boolean setProperty(Value value, IRI predicate, IRI... context) {
        return false;
    }

    @Override
    public void setProperties(Set<Value> value, IRI predicate, IRI... context) {

    }

    @Override
    public boolean addProperty(Value value, IRI predicate, IRI... context) {
        return false;
    }

    @Override
    public boolean removeProperty(Value value, IRI predicate, IRI... context) {
        return false;
    }

    @Override
    public ValueFactory getValueFactory() {
        return null;
    }
}
