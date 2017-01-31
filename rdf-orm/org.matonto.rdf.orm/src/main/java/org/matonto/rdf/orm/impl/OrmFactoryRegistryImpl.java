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
import org.matonto.exception.MatOntoException;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.orm.OrmFactory;
import org.matonto.rdf.orm.OrmFactoryRegistry;
import org.matonto.rdf.orm.Thing;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component(immediate = true)
public class OrmFactoryRegistryImpl implements OrmFactoryRegistry {
    private ValueFactory valueFactory;
    private List<OrmFactory> factories = new ArrayList<>();

    @Reference
    protected void setValueFactory(ValueFactory valueFactory) {
        this.valueFactory = valueFactory;
    }

    @Reference(type = '*', dynamic = true)
    protected void addFactory(OrmFactory factory) {
        factories.add(factory);
    }

    protected void removeFactory(OrmFactory factory) {
        factories.remove(factory);
    }

    @Override
    public <T extends Thing> OrmFactory getFactoryOfType(Class<T> type) {
        return factories.stream()
                .filter(factory -> factory.getType().equals(type))
                .findFirst()
                .orElseThrow(() -> new MatOntoException("Factory not found"));
    }

    @Override
    public OrmFactory getFactoryOfType(String typeIRI) {
        return getFactoryOfType(valueFactory.createIRI(typeIRI));
    }

    @Override
    public OrmFactory getFactoryOfType(IRI typeIRI) {
        return factories.stream()
                .filter(factory -> factory.getTypeIRI().equals(typeIRI))
                .findFirst()
                .orElseThrow(() -> new MatOntoException("Factory not found"));
    }

    @Override
    public <T extends Thing> List<OrmFactory> getFactoriesOfType(Class<T> type) {
        return factories.stream()
                .filter(factory -> type.equals(Thing.class)
                        ? factory.getType().equals(Thing.class) : type.isAssignableFrom(factory.getType()))
                .collect(Collectors.toList());
    }

    @Override
    public List<OrmFactory> getFactoriesOfType(String typeIRI) {
        return getFactoriesOfType(valueFactory.createIRI(typeIRI));
    }

    @Override
    public List<OrmFactory> getFactoriesOfType(IRI typeIRI) {
        return factories.stream()
                .filter(factory -> factory.getParentTypeIRIs().contains(typeIRI)
                        || factory.getTypeIRI().equals(typeIRI))
                .collect(Collectors.toList());
    }
}
