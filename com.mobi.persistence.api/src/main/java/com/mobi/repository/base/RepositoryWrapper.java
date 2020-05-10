package com.mobi.repository.base;

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

import aQute.bnd.annotation.metatype.Configurable;
import com.mobi.repository.api.Repository;
import com.mobi.repository.config.RepositoryConfig;
import com.mobi.repository.exception.RepositoryConfigException;
import com.mobi.repository.exception.RepositoryException;

import java.util.Map;

/**
 * @deprecated New implementations should prefer the ConfigurationBasedRepositoryWrapper for a cleaner implementation
 * API.
 */
@Deprecated
public abstract class RepositoryWrapper extends AbstractRepositoryWrapper {

    protected static final String REPOSITORY_TYPE = "default";

    /**
     * Creates a new <tt>RepositoryWrapper</tt>.
     */
    public RepositoryWrapper() {
    }

    /**
     * Creates a new <tt>RepositoryWrapper</tt> and calls
     * {@link #setDelegate(Repository)} with the supplied delegate repository.
     */
    public RepositoryWrapper(Repository delegate) {
        setDelegate(delegate);
    }

    protected void start(Map<String, Object> props) {
        validateConfig(props);
        RepositoryConfig config = Configurable.createConfigurable(RepositoryConfig.class, props);

        Repository repo = getRepo(props);
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

    protected void modified(Map<String, Object> props) {
        stop();
        start(props);
    }

    protected abstract Repository getRepo(Map<String, Object> props);

    public void validateConfig(Map<String, Object> props) {
        RepositoryConfig config = Configurable.createConfigurable(RepositoryConfig.class, props);

        if (config.id().equals(""))
            throw new RepositoryConfigException(
                    new IllegalArgumentException("Repository property 'id' cannot be empty.")
            );
        if (config.title().equals(""))
            throw new RepositoryConfigException(
                    new IllegalArgumentException("Repository property 'title' cannot be empty.")
            );
    }
}
