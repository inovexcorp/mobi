package com.mobi.repository.base;

/*-
 * #%L
 * com.mobi.persistence.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2020 iNovex Information Systems, Inc.
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

import com.mobi.repository.api.Repository;
import com.mobi.repository.config.RepositoryConfig;
import com.mobi.repository.exception.RepositoryConfigException;
import com.mobi.repository.exception.RepositoryException;

public abstract class ConfigurationBasedRepositoryWrapper<T extends RepositoryConfig> extends AbstractRepositoryWrapper {

    protected static final String REPOSITORY_TYPE = "default";

    /**
     * Creates a new <tt>RepositoryWrapper</tt>.
     */
    public ConfigurationBasedRepositoryWrapper() {
    }

    /**
     * Creates a new <tt>RepositoryWrapper</tt> and calls
     * {@link #setDelegate(Repository)} with the supplied delegate repository.
     */
    public ConfigurationBasedRepositoryWrapper(Repository delegate) {
        setDelegate(delegate);
    }

    protected void start(T config) {
        validateConfig(config);

        Repository repo = getRepo(config);
        try {
            repo.initialize();
        } catch (RepositoryException e) {
            throw new RepositoryException("Could not initialize Repository \"" + config.id() + "\".", e);
        }
        setDelegate(repo);

        setRepositoryID(config.id());
    }

    protected void stop() {
        try {
            getDelegate().shutDown();
        } catch (RepositoryException e) {
            throw new RepositoryException("Could not shutdown Repository \"" + repositoryID + "\".", e);
        }
    }

    protected void modified(T config) {
        stop();
        start(config);
    }

    public void validateConfig(T config) {
        if (config.id().equals(""))
            throw new RepositoryConfigException(
                    new IllegalArgumentException("Repository property 'id' cannot be empty.")
            );
        if (config.title().equals(""))
            throw new RepositoryConfigException(
                    new IllegalArgumentException("Repository property 'title' cannot be empty.")
            );
    }

    protected abstract Repository getRepo(T config);
}
