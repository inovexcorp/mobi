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
     * Attempts to retrieve a registered {@link OrmFactory} of the passed type.
     *
     * @param type The {@link Class} of the {@link Thing} whose factory you want to find.
     * @param <T> A {@link Class} that extends {@link Thing}.
     * @return A registered {@link OrmFactory} for the passed type (or {@link Optional#EMPTY} if it doesn't exist).
     */
    <T extends Thing> Optional<OrmFactory<T>> getFactoryOfType(Class<T> type);

    /**
     * Attempts retrieve a registered {@link OrmFactory} of the type identified by the passed class IRI string.
     *
     * @param typeIRI An IRI string of a class
     * @return A registered {@link OrmFactory} for the type identified by the passed IRI string (or
     * {@link Optional#EMPTY} if it doesn't exist).
     */
    Optional<OrmFactory<? extends Thing>> getFactoryOfType(String typeIRI);

    /**
     * Attempts retrieve a registered {@link OrmFactory} of the type identified by the passed class IRI.
     *
     * @param typeIRI An {@link IRI} of a class
     * @return A registered {@link OrmFactory} for the type identified by the passed IRI (or {@link Optional#EMPTY} if
     * it doesn't exist).
     */
    Optional<OrmFactory<? extends Thing>> getFactoryOfType(IRI typeIRI);

    /**
     * A {@link List} of OrmFactories of types that extend the passed type including the {@link OrmFactory} of the type
     * itself.
     *
     * @param type The {@link Class} of the {@link Thing} whose factories you want to find.
     * @param <T> A {@link Class} that extends {@link Thing}.
     * @return A {@link List} of OrmFactories of types that extend the passed type
     */
    <T extends Thing> List<OrmFactory<? extends T>> getFactoriesOfType(Class<T> type);

    /**
     * A {@link List} of OrmFactories of types that extend the type identified by the passed class IRI string including
     * the {@link OrmFactory} of the type itself.
     *
     * @param typeIRI An IRI string of a class
     * @return A {@link List} of OrmFactories of types that extend the type identified by the passed IRI string
     */
    List<OrmFactory<? extends Thing>> getFactoriesOfType(String typeIRI);

    /**
     * A {@link List} of OrmFactories of types that extend the type identified by the passed class IRI including the
     * {@link OrmFactory} of the type itself.
     *
     * @param typeIRI An {@link IRI} of a class
     * @return A {@link List} of OrmFactories of types that extend the type identified by the passed IRI
     */
    List<OrmFactory<? extends Thing>> getFactoriesOfType(IRI typeIRI);

    /**
     * A sorted {@link List} of OrmFactories of types that extend the passed type including the {@link OrmFactory} of
     * the type itself. The list is sorted so that factories of subclass types are first.
     *
     * @param type The {@link Class} of the {@link Thing} whose factory you want to find.
     * @param <T> A {@link Class} that extends {@link Thing}.
     * @return A sorted {@link List} of OrmFactories of types that extend the passed type
     */
    <T extends Thing> List<OrmFactory<? extends T>> getSortedFactoriesOfType(Class<T> type);

    /**
     * A sorted {@link List} of OrmFactories of types that extend the type identified by the passed class IRI string
     * including the {@link OrmFactory} of the type itself. The list is sorted so that factories of subclass types are
     * first.
     *
     * @param typeIRI An IRI string of a class
     * @return A sorted {@link List} of OrmFactories of types that extend the type identified by the passed IRI string
     */
    List<OrmFactory<? extends Thing>> getSortedFactoriesOfType(String typeIRI);

    /**
     * A sorted {@link List} of OrmFactories of types that extend the type identified by the passed class {@link IRI}
     * including the {@link OrmFactory} of the type itself. The list is sorted so that factories of subclass types are
     * first.
     *
     * @param typeIRI An {@link IRI} of a class
     * @return A sorted {@link List} of OrmFactories of types that extend the type identified by the passed {@link IRI}
     */
    List<OrmFactory<? extends Thing>> getSortedFactoriesOfType(IRI typeIRI);

    /**
     * Create a new instance of the specified type from the specified model.
     *
     * @param resource The {@link Resource} identifying your new instance
     * @param model    The {@link Model} to write your new instance into
     * @param type The {@link Class} of the {@link Thing} you want to create
     * @param <T> A {@link Class} that extends {@link Thing}.
     * @return The new instance of your thing
     * @throws {@link OrmException} If the factory for your thing isn't found, or there is an issue creating it
     */
    <T extends Thing> T createNew(final Resource resource, final Model model, Class<T> type) throws OrmException;

    /**
     * Finds an existing instance of the specified type from the specified model.
     *
     * @param resource The {@link Resource} identifying your existing instance
     * @param model    The {@link Model} to read your existing instance from
     * @param type The {@link Class} of the {@link Thing} you want to find
     * @param <T> A {@link Class} that extends {@link Thing}.
     * @return The existing instance of your thing (or {@link Optional#EMPTY} if it doesn't exist)
     * @throws {@link OrmException} If the factory for your thing isn't found, or there is an issue building it
     */
    <T extends Thing> Optional<T> getExisting(Resource resource, Model model, Class<T> type) throws OrmException;

    /**
     * Get all existing instances out of the given model.
     *
     * @param model The {@link Model} to read instances out of
     * @param type The {@link Class} of the {@link Thing} you want to find
     * @param <T> A {@link Class} that extends {@link Thing}.
     * @return All the instances in the given model
     * @throws {@link OrmException} If the factory for your thing isn't found, or there is an issue building instances
     */
    <T extends Thing> Collection<T> getAllExisting(final Model model, Class<T> type) throws OrmException;

    /**
     * Execute a process against a given model for each thing of a given type.
     *
     * @param model    The {@link Model} to read instances out of
     * @param consumer The {@link Consumer} that will execute against each instance
     * @param type The {@link Class} of the {@link Thing} you're trying to find
     * @param <T> A {@link Class} that extends {@link Thing}.
     */
    <T extends Thing> void processAllExisting(final Model model, final Consumer<T> consumer, Class<T> type);

}
