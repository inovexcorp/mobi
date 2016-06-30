package org.matonto.rdf.api;

/*-
 * #%L
 * org.matonto.persistence.api
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

import java.io.Serializable;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

public interface StatementSet extends Set<Statement>, Serializable {

    /**
     * Returns a Set view of the subjects contained in this model.
     *
     * @return a set view of the subjects contained in this model
     */
    default Set<Resource> subjects() {
        return stream().map(Statement::getSubject).collect(Collectors.toSet());
    }

    /**
     * Returns a Set view of the predicates contained in this model.
     *
     * @return a set view of the predicates contained in this model
     */
    default Set<IRI> predicates() {
        return stream().map(Statement::getPredicate).collect(Collectors.toSet());
    }

    /**
     * Returns a Set view of the objects contained in this model.
     *
     * @return a set view of the objects contained in this model
     */
    default Set<Value> objects() {
        return stream().map(Statement::getObject).collect(Collectors.toSet());
    }

    /**
     * Returns a Set view of the contexts contained in this model.
     *
     * @return a set view of the contexts contained in this model
     */
    default Set<Resource> contexts() {
        return stream().
                map(Statement::getContext).
                filter(Optional::isPresent).
                map(Optional::get).
                collect(Collectors.toSet());
    }

    /**
     * Gets the namespace that is associated with the specified prefix, if any.
     *
     * @param prefix - A namespace prefix.
     * @return The namespace name that is associated with the specified prefix, or {@link Optional#empty()} if there
     * is no such namespace.
     */
    default Optional<Namespace> getNamespace(String prefix) {
        return getNamespaces().stream().filter(t -> t.getPrefix().equals(prefix)).findAny();
    }

    /**
     * Gets the map that contains the assigned namespaces.
     *
     * @return Map of prefix to namespace
     */
    Set<Namespace> getNamespaces();

    /**
     * Removes a namespace declaration by removing the association between a prefix and a namespace name.
     *
     * @param prefix - The namespace prefix of which the assocation with a namespace name is to be removed.
     * @return the previous namespace bound to the prefix or Optional.empty()
     */
    Optional<Namespace> removeNamespace(String prefix);

    /**
     * Sets the prefix for a namespace. This will replace any existing namespace associated to the prefix.
     *
     * @param namespace - A Namespace object to use in this Model.
     */
    void setNamespace(Namespace namespace);

    /**
     * Sets the prefix for a namespace. This will replace any existing namespace associated to the prefix.
     *
     * @param prefix - The new prefix.
     * @param name - The namespace name that the prefix maps to.
     * @return The Namespace object for the given namespace.
     */
    Namespace setNamespace(String prefix, String name);
}
