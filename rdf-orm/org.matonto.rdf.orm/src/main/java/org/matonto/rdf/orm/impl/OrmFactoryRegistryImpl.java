package org.matonto.rdf.orm.impl;

/*-
 * #%L
 * org.matonto.rdf.orm
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.orm.OrmException;
import org.matonto.rdf.orm.OrmFactory;
import org.matonto.rdf.orm.OrmFactoryRegistry;
import org.matonto.rdf.orm.Thing;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.function.Consumer;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component(immediate = true)
public class OrmFactoryRegistryImpl implements OrmFactoryRegistry {
    private ValueFactory valueFactory;
    private List<OrmFactory<? extends Thing>> factories = new ArrayList<>();

    @Reference
    protected void setValueFactory(ValueFactory valueFactory) {
        this.valueFactory = valueFactory;
    }

    @Reference(type = '*', dynamic = true)
    protected void addFactory(OrmFactory<? extends Thing> factory) {
        factories.add(factory);
    }

    protected void removeFactory(OrmFactory<Thing> factory) {
        factories.remove(factory);
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T extends Thing> Optional<OrmFactory<T>> getFactoryOfType(Class<T> type) {
        return factories.stream()
                .filter(factory -> type.equals(factory.getType()))
                .map(factory -> (OrmFactory<T>) factory)
                .findFirst();
    }

    @Override
    public Optional<OrmFactory<? extends Thing>> getFactoryOfType(String typeIRI) {
        return getFactoryOfType(valueFactory.createIRI(typeIRI));
    }

    @Override
    public Optional<OrmFactory<? extends Thing>> getFactoryOfType(IRI typeIRI) {
        return factories.stream()
                .filter(factory -> factory.getTypeIRI().equals(typeIRI))
                .findFirst();
    }

    @Override
    public <T extends Thing> List<OrmFactory<? extends T>> getFactoriesOfType(Class<T> type) {
        return getFactoryStreamOfType(type).collect(Collectors.toList());
    }

    @Override
    public <T extends Thing> List<OrmFactory<? extends T>> getSortedFactoriesOfType(Class<T> type) {
        return getFactoryStreamOfType(type)
                .sorted((factory1, factory2) -> factory1.getType().isAssignableFrom(factory2.getType()) ? 1 : -1)
                .collect(Collectors.toList());
    }

    @Override
    public List<OrmFactory<? extends Thing>> getFactoriesOfType(String typeIRI) {
        return getFactoriesOfType(valueFactory.createIRI(typeIRI));
    }

    @Override
    public List<OrmFactory<? extends Thing>> getSortedFactoriesOfType(String typeIRI) {
        return getSortedFactoriesOfType(valueFactory.createIRI(typeIRI));
    }

    @Override
    public List<OrmFactory<? extends Thing>> getFactoriesOfType(IRI typeIRI) {
        return getFactoryStreamOfType(typeIRI).collect(Collectors.toList());
    }

    @Override
    public List<OrmFactory<? extends Thing>> getSortedFactoriesOfType(IRI typeIRI) {
        return getFactoryStreamOfType(typeIRI)
                .sorted((factory1, factory2) ->
                        factory1.getType().isAssignableFrom(factory2.getType()) ? 1 : -1)
                .collect(Collectors.toList());
    }

    @Override
    public <T extends Thing> T createNew(Resource resource, Model model, Class<T> type) throws OrmException {
        OrmFactory<T> factory = getFactoryOfType(type)
                .orElseThrow(() -> new OrmException("No OrmFactory present of type: " + type.getName()));
        return factory.createNew(resource, model);
    }

    @Override
    public <T extends Thing> Optional<T> getExisting(Resource resource, Model model, Class<T> type) throws OrmException {
        OrmFactory<T> factory = getFactoryOfType(type)
                .orElseThrow(() -> new OrmException("No OrmFactory present of type: " + type.getName()));
        return factory.getExisting(resource, model);
    }

    @Override
    public <T extends Thing> Collection<T> getAllExisting(Model model, Class<T> type) throws OrmException {
        OrmFactory<T> factory = getFactoryOfType(type)
                .orElseThrow(() -> new OrmException("No OrmFactory present of type: " + type.getName()));
        return factory.getAllExisting(model);
    }

    @Override
    public <T extends Thing> void processAllExisting(Model model, Consumer<T> consumer, Class<T> type) {
        OrmFactory<T> factory = getFactoryOfType(type)
                .orElseThrow(() -> new OrmException("No OrmFactory present of type: " + type.getName()));
        factory.processAllExisting(model, consumer);
    }

    @SuppressWarnings("unchecked")
    private <T extends Thing> Stream<OrmFactory<? extends T>> getFactoryStreamOfType(Class<T> type) {
        return factories.stream()
                .filter(factory -> type.equals(Thing.class)
                        ? factory.getType().equals(Thing.class) : type.isAssignableFrom(factory.getType()))
                .map(factory -> (OrmFactory<T>) factory);
    }


    private Stream<OrmFactory<? extends Thing>> getFactoryStreamOfType(IRI typeIRI) {
        return factories.stream()
                .filter(factory -> factory.getParentTypeIRIs().contains(typeIRI)
                        || factory.getTypeIRI().equals(typeIRI));
    }
}
