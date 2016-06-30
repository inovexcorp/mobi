package org.matonto.persistence.utils;

/*-
 * #%L
 * org.matonto.persistence.utils
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

import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Statement;
import org.matonto.rdf.api.Value;

import java.util.Optional;

public class Statements {

    /**
     * Retrieves an Object (Resource) from the statement.
     *
     * @param statement The statement to retrieve the resource
     * @return an object resource from the statement or an empty Optional.
     */
    public static Optional<Resource> objectResource(Statement statement) {
        Value object = statement.getObject();
        if (object instanceof Resource) {
            return Optional.of((Resource) object);
        } else {
            return Optional.empty();
        }
    }
}