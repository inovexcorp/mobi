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

public interface Statement extends Serializable {

    /**
     * Compares a statement object to another object.
     *
     * @param object - The object to compare this statement to.
     * @return true if the other object is an instance of Statement and if their subjects, predicates, objects and
     * contexts are equal.
     */
    boolean equals(Object object);

    /**
     * Gets the context of this statement.
     *
     * @return The statement's context, or Optional.empty() if it doesn't have one.
     */
    Optional<Resource> getContext();

    /**
     * Gets the object of this statement.
     *
     * @return The statement's object.
     */
    Value getObject();

    /**
     * Gets the predicate of this statement.
     *
     * @return The statement's predicate.
     */
    IRI getPredicate();

    /**
     * Gets the subject of this statement.
     *
     * @return The statement's subject.
     */
    Resource getSubject();

    /**
     * The hash code of a statement.
     *
     * @return A hash code for the statement.
     */
    int hashCode();
}
