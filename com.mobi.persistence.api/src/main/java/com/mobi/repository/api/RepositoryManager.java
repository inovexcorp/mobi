package com.mobi.repository.api;

/*-
 * #%L
 * com.mobi.persistence.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import java.util.Map;
import java.util.Optional;

public interface RepositoryManager {

    /**
     * Gets the repository that is known by the specified ID from this manager.
     *
     * @param id - A repository ID.
     * @return An initialized Repository object, or Optional.empty if no repository was known for the specified ID.
     */
    Optional<OsgiRepository> getRepository(String id);

    /**
     * Returns all configured repositories.
     *
     * @return The Map of all initialized repository IDs mapped to their Repository objects.
     */
    Map<String, OsgiRepository> getAllRepositories();

    /**
     * Creates and returns a new Repository backed by the default memory store implementation.
     *
     * @return a new OsgiRepository backed by the default memory store implementation.
     */
    OsgiRepository createMemoryRepository();
}
