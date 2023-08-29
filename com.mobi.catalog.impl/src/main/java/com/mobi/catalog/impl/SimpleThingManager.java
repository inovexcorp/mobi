package com.mobi.catalog.impl;

/*-
 * #%L
 * com.mobi.catalog.impl
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

import com.mobi.catalog.api.ThingManager;
import com.mobi.exception.MobiException;
import com.mobi.persistence.utils.ConnectionUtils;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.Thing;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryResult;
import org.osgi.service.component.annotations.Component;

import java.util.Optional;

@Component
public class SimpleThingManager implements ThingManager {

    final ValueFactory vf = new ValidatingValueFactory();
    final ModelFactory mf = new DynamicModelFactory();

    @Override
    public <T extends Thing> void addObject(T object, RepositoryConnection conn) {
        conn.add(object.getModel(), object.getResource());
    }

    @Override
    public <T extends Thing> T getExpectedObject(Resource id, OrmFactory<T> factory, RepositoryConnection conn) {
        return optObject(id, factory, conn).orElseThrow(() ->
                new IllegalStateException(factory.getTypeIRI().getLocalName() + " " + id + " could not be found"));
    }

    @Override
    public <T extends Thing> T getObject(Resource id, OrmFactory<T> factory, RepositoryConnection conn) {
        return optObject(id, factory, conn).orElseThrow(() ->
                new IllegalArgumentException(factory.getTypeIRI().getLocalName() + " " + id + " could not be found"));
    }

    @Override
    public <T extends Thing> Optional<T> optObject(Resource id, OrmFactory<T> factory, RepositoryConnection conn) {
        try (RepositoryResult repositoryResult = conn.getStatements(null, null, null, id)) {
            Model model = QueryResults.asModel(repositoryResult, mf);
            return factory.getExisting(id, model);
        } catch (Exception e) {
            throw new MobiException(e);
        }
    }

    @Override
    public void remove(Resource resourceId, RepositoryConnection conn) {
        // https://github.com/eclipse/rdf4j/issues/3796
        // The explicit graph removal while within a transaction is causing issues. Using this alternate solution
        // until a fix is made.
        // conn.remove((Resource) null, null, null, resourceId);
        conn.getStatements(null, null, null, resourceId).forEach(conn::remove);
    }

    @Override
    public <T extends Thing> void removeObject(T object, RepositoryConnection conn) {
        remove(object.getResource(), conn);
    }

    @Override
    public void removeObjectWithRelationship(Resource objectId, Resource removeFromId, String predicate,
                                             RepositoryConnection conn) {
        remove(objectId, conn);
        conn.remove(removeFromId, vf.createIRI(predicate), objectId, removeFromId);
    }

    @Override
    public <T extends Thing> IllegalArgumentException throwAlreadyExists(Resource id, OrmFactory<T> factory) {
        return new IllegalArgumentException(String.format("%s %s already exists", factory.getTypeIRI().getLocalName(),
                id));
    }

    @Override
    public <T extends Thing, S extends Thing> IllegalArgumentException throwDoesNotBelong(Resource child,
                                                                                          OrmFactory<T> childFactory,
                                                                                          Resource parent,
                                                                                          OrmFactory<S> parentFactory) {
        return new IllegalArgumentException(String.format("%s %s does not belong to %s %s",
                childFactory.getTypeIRI().getLocalName(), child, parentFactory.getTypeIRI().getLocalName(), parent));
    }

    @Override
    public <T extends Thing> void updateObject(T object, RepositoryConnection conn) {
        removeObject(object, conn);
        addObject(object, conn);
    }

    @Override
    public void validateResource(Resource resource, IRI classId, RepositoryConnection conn) {
        if (!ConnectionUtils.contains(conn, resource, vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI),
                classId, resource)) {
            throw new IllegalArgumentException(classId.getLocalName() + " " + resource + " could not be found");
        }
    }
}
