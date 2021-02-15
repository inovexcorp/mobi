package com.mobi.repository.base;

/*-
 * #%L
 * com.mobi.persistence.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

import com.mobi.repository.api.DelegatingRepositoryConnection;
import com.mobi.repository.api.IsolationLevels;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.exception.RepositoryException;

public abstract class RepositoryConnectionWrapper implements DelegatingRepositoryConnection {

    private volatile RepositoryConnection delegate;

    public RepositoryConnectionWrapper() {
    }

    public RepositoryConnectionWrapper(RepositoryConnection delegate) {
        setDelegate(delegate);
    }

    @Override
    public RepositoryConnection getDelegate() {
        return this.delegate;
    }

    @Override
    public void setDelegate(RepositoryConnection delegate) {
        this.delegate = delegate;
    }

    @Override
    public void close() throws RepositoryException {
        getDelegate().close();
    }

    @Override
    public void begin() throws RepositoryException {
        getDelegate().begin();
    }

    @Override
    public void begin(IsolationLevels isolationLevel) throws RepositoryException {
        switch (isolationLevel){
            case NONE:
                getDelegate().begin(IsolationLevels.NONE);
                return;
            case READ_UNCOMMITTED:
                getDelegate().begin(IsolationLevels.READ_UNCOMMITTED);
                return;
            case READ_COMMITTED:
                getDelegate().begin(IsolationLevels.READ_COMMITTED);
                return;
            case SNAPSHOT_READ:
                getDelegate().begin(IsolationLevels.SNAPSHOT_READ);
                return;
            case SNAPSHOT:
                getDelegate().begin(IsolationLevels.SNAPSHOT);
                return;
            case SERIALIZABLE:
                getDelegate().begin(IsolationLevels.SERIALIZABLE);
                return;
            default:
                getDelegate().begin();
        }
    }

    @Override
    public void commit() throws RepositoryException {
        getDelegate().commit();
    }

    @Override
    public void rollback() throws RepositoryException {
        getDelegate().rollback();
    }

    @Override
    public boolean isActive() throws RepositoryException {
        return getDelegate().isActive();
    }
}
