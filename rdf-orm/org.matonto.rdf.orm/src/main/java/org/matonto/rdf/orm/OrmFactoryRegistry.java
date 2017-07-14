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
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.Resource;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.function.Consumer;

public interface OrmFactoryRegistry {
    /**
     * Attempts to retrieve a registered OrmFactory of the passed type.
     *
     * @param type A Class that extends Thing
     * @param <T>  A class that extends Thing
     * @return A registered OrmFactory for the passed type if found
     */
    <T extends Thing> Optional<OrmFactory<T>> getFactoryOfType(Class<T> type);

    /**
     * Attempts retrieve a registered OrmFactory of the type identified by the passed
     * class IRI string.
     *
     * @param typeIRI An IRI string of a class
     * @return A registered OrmFactory for the type identified by the passed IRI string
     * if found
     */
    Optional<OrmFactory<? extends Thing>> getFactoryOfType(String typeIRI);

    /**
     * Attempts retrieve a registered OrmFactory of the type identified by the passed class IRI.
     *
     * @param typeIRI An IRI of a class
     * @return A registered OrmFactory for the type identified by the passed IRI if found
     */
    Optional<OrmFactory<? extends Thing>> getFactoryOfType(IRI typeIRI);

    /**
     * A List of OrmFactories of types that extend the passed type including the OrmFactory of the
     * type itself.
     *
     * @param type A Class that extends Thing
     * @param <T>  A class that extends Thing
     * @return A List of OrmFactories of types that extend the passed type
     */
    <T extends Thing> List<OrmFactory<? extends T>> getFactoriesOfType(Class<T> type);

    /**
     * A List of OrmFactories of types that extend the type identified by the passed class IRI
     * string including the OrmFactory of the type itself.
     *
     * @param typeIRI An IRI string of a class
     * @return A List of OrmFactories of types that extend the type identified by the passed IRI
     * string
     */
    List<OrmFactory<? extends Thing>> getFactoriesOfType(String typeIRI);

    /**
     * A List of OrmFactories of types that extend the type identified by the passed class IRI
     * including the OrmFactory of the type itself.
     *
     * @param typeIRI An IRI of a class
     * @return A List of OrmFactories of types that extend the type identified by the passed IRI
     */
    List<OrmFactory<? extends Thing>> getFactoriesOfType(IRI typeIRI);

    /**
     * A sorted List of OrmFactories of types that extend the passed type including the OrmFactory of the
     * type itself. The list is sorted so that factories of subclass types are first.
     *
     * @param type A Class that extends Thing
     * @param <T>  A class that extends Thing
     * @return A sorted List of OrmFactories of types that extend the passed type
     */
    <T extends Thing> List<OrmFactory<? extends T>> getSortedFactoriesOfType(Class<T> type);

    /**
     * A sorted List of OrmFactories of types that extend the type identified by the passed class IRI
     * string including the OrmFactory of the type itself. The list is sorted so that factories of subclass
     * types are first.
     *
     * @param typeIRI An IRI string of a class
     * @return A sorted List of OrmFactories of types that extend the type identified by the passed IRI
     * string
     */
    List<OrmFactory<? extends Thing>> getSortedFactoriesOfType(String typeIRI);

    /**
     * A sorted List of OrmFactories of types that extend the type identified by the passed class IRI
     * including the OrmFactory of the type itself. The list is sorted so that factories of subclass
     * types are first.
     *
     * @param typeIRI An IRI of a class
     * @return A sorted List of OrmFactories of types that extend the type identified by the passed IRI
     */
    List<OrmFactory<? extends Thing>> getSortedFactoriesOfType(IRI typeIRI);

    /**
     * Create a new instance of the specified type in the specified model.
     *
     * @param resource The {@link Resource} identifying your new instance
     * @param model    The {@link Model} to write your new instance into
     * @param type     The type of thing you want to create
     * @param <T>      The type identifier for your thing
     * @return The new instance of your thing
     * @throws OrmException If the factory for your thing isn't found, or there is an issue creating it
     */
    <T extends Thing> T createNew(final Resource resource, final Model model, Class<T> type) throws OrmException;

    /**
     * @param resource The {@link Resource} identifying your existing instance
     * @param model    The {@link Model} to read your existing instance from
     * @param type     The type of thing you want to find
     * @param <T>      The type identifier for your thing
     * @return The existing instance of your thing (or an empty optional if it doesn't exist)
     * @throws OrmException If the factory for your thing isn't found, or there is an issue building it
     */
    <T extends Thing> Optional<T> getExisting(Resource resource, Model model, Class<T> type) throws OrmException;

    /**
     * Get all existing instances out of the given model.
     *
     * @param model The {@link Model} to read instances out of
     * @param type  The type of thing you want to find
     * @param <T>   The Java type of your thing
     * @return All the instances in the given model
     * @throws OrmException If the factory for your thing isn't found, or there is an issue building instances
     */
    <T extends Thing> Collection<T> getAllExisting(final Model model, Class<T> type) throws OrmException;

    /**
     * Execute a process against a given model for each thing of a given type.
     *
     * @param model    The {@link Model} to read instances out of
     * @param consumer The {@link Consumer} that will execute against each instance
     * @param type     The class of the thing you're trying to find
     * @param <T>      The java type of the thing
     */
    <T extends Thing> void processAllExisting(final Model model, final Consumer<T> consumer, Class<T> type);

}
