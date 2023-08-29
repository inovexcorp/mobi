package com.mobi.catalog.api;

/*-
 * #%L
 * com.mobi.catalog.api
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

import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.Thing;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.repository.RepositoryConnection;

import java.util.Optional;

public interface ThingManager {
    /**
     * Adds the provided object to the Repository in a named graph of its Resource.
     *
     * @param object An object to add to the Repository.
     * @param conn   A RepositoryConnection to use for lookup.
     * @param <T>    A Class that extends Thing.
     */
    <T extends Thing> void addObject(T object, RepositoryConnection conn);

    /**
     * Retrieves an object identified by the provided Resource from the Repository using the provided OrmFactory.
     * Throws a IllegalStateException if the object cannot be found.
     *
     * @param id      The Resource identifying the object to retrieve.
     * @param factory The OrmFactory which specifies the type the object should be.
     * @param conn    A RepositoryConnection to use for lookup.
     * @param <T>     A Class that extends Thing.
     * @return The identified object.
     * @throws IllegalStateException Thrown if the object cannot be found.
     */
    <T extends Thing> T getExpectedObject(Resource id, OrmFactory<T> factory, RepositoryConnection conn);

    /**
     * Retrieves an object identified by the provided Resource from the Repository using the provided OrmFactory.
     * Throws a IllegalArgumentException if the object cannot be found.
     *
     * @param id      The Resource identifying the object to retrieve.
     * @param factory The OrmFactory which specifies the type the object should be.
     * @param conn    A RepositoryConnection to use for lookup.
     * @param <T>     A Class that extends Thing.
     * @return The identified object.
     * @throws IllegalArgumentException Thrown if the object cannot be found.
     */
    <T extends Thing> T getObject(Resource id, OrmFactory<T> factory, RepositoryConnection conn);

    /**
     * Retrieves an object identified by the provided Resource from the Repository using the provided OrmFactory if
     * found.
     *
     * @param id      The Resource identifying the object to retrieve.
     * @param factory The OrmFactory which specifies the type the object should be.
     * @param conn    A RepositoryConnection to use for lookup.
     * @param <T>     A Class that extends Thing.
     * @return The identified object if found; empty Optional otherwise.
     */
    <T extends Thing> Optional<T> optObject(Resource id, OrmFactory<T> factory, RepositoryConnection conn);

    /**
     * Removes the object identified by the provided Resource.
     *
     * @param resourceId The Resource identifying the object to be removed.
     * @param conn       A RepositoryConnection to use for lookup.
     */
    void remove(Resource resourceId, RepositoryConnection conn);

    /**
     * Removes the provided Object from the Repository.
     *
     * @param object The Object in the Repository to remove.
     * @param conn   A RepositoryConnection to use for lookup.
     * @param <T>    A Class that extends Thing.
     */
    <T extends Thing> void removeObject(T object, RepositoryConnection conn);

    /**
     * Removes the provided Object from the Repository along with other relationship statements.
     *
     * @param objectId     The ID of the Object in the Repository to remove.
     * @param removeFromId The Subject of the statements to remove
     * @param predicate    The Predicate of the statements to remove
     * @param conn         A RepositoryConnection to use for lookup.
     */
    void removeObjectWithRelationship(Resource objectId, Resource removeFromId, String predicate,
                                      RepositoryConnection conn);

    /**
     * Returns an IllegalArgumentException stating that an object of the type determined by the provided OrmFactory with
     * the provided Resource ID already exists within the Repository.
     *
     * @param id      The Resource ID of the object that already exists.
     * @param factory The OrmFactory of the type of the object.
     * @param <T>     A Class that extends Thing.
     * @return An IllegalArgumentException with an appropriate message.
     */
    <T extends Thing> IllegalArgumentException throwAlreadyExists(Resource id, OrmFactory<T> factory);

    /**
     * Returns an IllegalArgumentException stating that an object of the type determined by the first provided
     * OrmFactory with the first provided Resource ID does not belong to an object of the type determined by the second
     * provided OrmFactory with the second provided Resource ID.
     *
     * @param child         The Resource ID of the child object that does not belong to the parent.
     * @param childFactory  The OrmFactory of the type of the child object.
     * @param parent        The Resource ID of the parent object that does not have the child.
     * @param parentFactory The OrmFactory of the type of the parent object.
     * @param <T>           A Class that extends Thing.
     * @param <S>           A Class that extends Thing.
     * @return An IllegalArgumentException with an appropriate message.
     */
    <T extends Thing, S extends Thing> IllegalArgumentException throwDoesNotBelong(Resource child,
                                                                                   OrmFactory<T> childFactory,
                                                                                   Resource parent,
                                                                                   OrmFactory<S> parentFactory);

    /**
     * Updates the provided object in the Repository by first removing it, then adding the new model back in.
     *
     * @param object A new version of an object to update in the Repository.
     * @param conn   A RepositoryConnection to use for lookup.
     * @param <T>    A Class that extends Thing.
     */
    <T extends Thing> void updateObject(T object, RepositoryConnection conn);

    /**
     * Validates the type and existence of the provided Resource.
     *
     * @param resource The Resource to search for in the Repository.
     * @param classId  The IRI identifying the type the entity should be.
     * @param conn     A RepositoryConnection to use for lookup.
     * @throws IllegalArgumentException Thrown if the Resource does not exist as the provided type.
     */
    void validateResource(Resource resource, IRI classId, RepositoryConnection conn);
}
