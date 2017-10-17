package com.mobi.rdf.api;

/*-
 * #%L
 * com.mobi.persistence.api
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

public interface BNode extends Resource {

    /**
     * Compares a blank node object to another object.
     *
     * @param object - The object to compare this blank node to.
     * @return true if the other object is an instance of BNode and their IDs are equal, false otherwise.
     */
    boolean equals(Object object);

    /**
     * Retrieves this blank node's identifier.
     *
     * @return - A blank node identifier.
     */
    String getID();

    /**
     * The hash code of a blank node is defined as the hash code of its identifier: id.hashCode().
     *
     * @return A hash code for the blank node.
     */
    int hashCode();
}
