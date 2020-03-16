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

import com.mobi.repository.api.DelegatingRepository;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.config.RepositoryConfig;
import com.mobi.repository.exception.RepositoryException;

import java.io.File;
import java.util.Optional;

public class AbstractRepositoryWrapper implements DelegatingRepository {

    private volatile Repository delegate;
    protected String repositoryID;

    @Override
    public Repository getDelegate() {
        return delegate;
    }

    @Override
    public void setDelegate(Repository delegate) {
        this.delegate = delegate;
    }

    public String getRepositoryID() {
        return this.repositoryID;
    }

    public void setRepositoryID(String repositoryID) {
        this.repositoryID = repositoryID;
    }

    @Override
    public RepositoryConnection getConnection() throws RepositoryException {
        return delegate.getConnection();
    }

    @Override
    public RepositoryConfig getConfig() {
        return delegate.getConfig();
    }

    @Override
    public Optional<File> getDataDir() {
        return delegate.getDataDir();
    }

    @Override
    public void initialize() {
        throw new UnsupportedOperationException("A shared service cannot be initialized by a third party");
    }

    @Override
    public boolean isInitialized() {
        return delegate.isInitialized();
    }

    @Override
    public void shutDown() {
        throw new UnsupportedOperationException("A shared service cannot be destroyed by a third party");
    }
}
