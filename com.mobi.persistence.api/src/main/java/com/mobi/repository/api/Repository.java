package com.mobi.repository.api;

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

import com.mobi.repository.config.RepositoryConfig;
import com.mobi.repository.exception.RepositoryException;
import com.mobi.repository.config.RepositoryConfig;
import com.mobi.repository.exception.RepositoryException;

import java.io.File;
import java.util.Optional;

public interface Repository {

    /**
     * Opens a connection to this repository that can be used for querying and updating the contents of the
     * repository. Created connections need to be closed to make sure that any resources they keep hold of are
     * released. The best way to do this is to use a try-finally-block.
     *
     * Note that RepositoryConnection is not guaranteed to be thread-safe! The recommended pattern for repository
     * access in a multithreaded application is to share the Repository object between threads, but have each
     * thread create and use its own RepositoryConnections.
     *
     * @return A connection that allows operations on this repository.
     * @throws RepositoryException - If something went wrong during the creation of the Connection.
     */
    RepositoryConnection getConnection() throws RepositoryException;

    RepositoryConfig getConfig();

    /**
     * Get the directory, if set, where data and logging for this repository is stored.
     *
     * @return The directory where data for this repository is stored if it is set.
     */
    Optional<File> getDataDir();

    /**
     * Initializes this repository. A repository needs to be initialized before it can be used.
     *
     * @throws RepositoryException - If the initialization failed.
     */
    void initialize() throws RepositoryException;

    /**
     * Indicates if the Repository has been initialized. Note that the initialization status may change
     * if the Repository is shut down.
     *
     * @return true iff the repository has been initialized.
     */
    boolean isInitialized();

    /**
     * Shuts the repository down, releasing any resources that it keeps hold of. Once shut down, the repository
     * can no longer be used until it is re-initialized.
     *
     * @throws RepositoryException - If the shutdown failed.
     */
    void shutDown() throws RepositoryException;
}
