package com.mobi.repository.api;

/*-
 * #%L
 * com.mobi.persistence.api
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

import org.eclipse.rdf4j.repository.Repository;

public interface OsgiRepository extends Repository {

    /**
     * Returns the ID of this Repository Object.
     *
     * @return String representing the ID of this Repository Object.
     */
    String getRepositoryID();

    /**
     * Returns the ID of this Repository Object.
     *
     * @return String representing the ID of this Repository Object.
     */
    String getRepositoryTitle();

    /**
     * Returns the class type of the OSGi Config.
     *
     * @return A Class of the OSGi Config.
     */
    Class<?> getConfigType();

    /**
     * Returns a string representation of the type of repository.
     *
     * @return A string identifier for repository type.
     */
    String getRepositoryType();

}
