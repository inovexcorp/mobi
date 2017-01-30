package org.matonto.rdf.orm;

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

import org.matonto.rdf.api.IRI;

import java.util.List;

public interface OrmFactoryRegistry {
    /**
     * Retrieves a registered OrmFactory of the passed type.
     *
     * @param type A Class that extends Thing
     * @param <T> A class that extends Thing
     * @return A registered OrmFactory for the passed type
     */
    <T extends Thing> OrmFactory getFactoryOfType(Class<T> type);

    /**
     * Retrieves a registered OrmFactory of the type identified by the passed class IRI string.
     *
     * @param typeIRI An IRI string of a class
     * @return A registered OrmFactory for the type identified by the passed IRI string
     */
    OrmFactory getFactoryOfType(String typeIRI);

    /**
     * Retrieves a registered OrmFactory of the type identified by the passed class IRI.
     *
     * @param typeIRI An IRI of a class
     * @return A registered OrmFactory for the type identified by the passed IRI
     */
    OrmFactory getFactoryOfType(IRI typeIRI);

    /**
     * A List of OrmFactories of types that extend the passed type, following the subclass
     * relationships.
     *
     * @param type A Class that extends Thing
     * @param <T> A class that extends Thing
     * @return A List of OrmFactories of types that extend the passed type
     */
    <T extends Thing> List<OrmFactory> getFactoriesOfType(Class<T> type);

    /**
     * A List of OrmFactories of types that extend the type identified by the passed class IRI
     * string, following the subclass relationships.
     *
     * @param typeIRI An IRI string of a class
     * @return A List of OrmFactories of types that extend the type identified by the passed IRI
     *      string
     */
    List<OrmFactory> getFactoriesOfType(String typeIRI);

    /**
     *  A List of OrmFactories of types that extend the type identified by the passed class IRI,
     * following the subclass relationships.
     *
     * @param typeIRI An IRI of a class
     * @return A List of OrmFactories of types that extend the type identified by the passed IRI
     */
    List<OrmFactory> getFactoriesOfType(IRI typeIRI);
}
