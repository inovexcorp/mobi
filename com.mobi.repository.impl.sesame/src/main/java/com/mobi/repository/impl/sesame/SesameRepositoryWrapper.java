package com.mobi.repository.impl.sesame;

/*-
 * #%L
 * com.mobi.repository.impl.sesame
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

import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.config.RepositoryConfig;
import com.mobi.repository.exception.RepositoryException;

import java.io.File;
import java.util.Optional;

public class SesameRepositoryWrapper implements Repository {

    org.openrdf.repository.Repository sesameRepository;
    RepositoryConfig config;

    public SesameRepositoryWrapper() {
    }

    public SesameRepositoryWrapper(org.openrdf.repository.Repository repository) {
        setDelegate(repository);
    }

    protected void setDelegate(org.openrdf.repository.Repository repository) {
        this.sesameRepository = repository;
    }

    public RepositoryConnection getConnection() throws RepositoryException {
        try {
            return new SesameRepositoryConnectionWrapper(sesameRepository.getConnection());
        } catch (org.openrdf.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }

    @Override
    public RepositoryConfig getConfig() {
        return config;
    }

    public void setConfig(RepositoryConfig config) {
        this.config = config;
    }

    public Optional<File> getDataDir() {
        File file = sesameRepository.getDataDir();

        return file == null ? Optional.empty() : Optional.of(file);
    }

    @Override
    public void initialize() throws RepositoryException {
        try {
            sesameRepository.initialize();
        } catch (org.openrdf.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }

    public boolean isInitialized() {
        return sesameRepository.isInitialized();
    }

    @Override
    public void shutDown() throws RepositoryException {
        try {
            sesameRepository.shutDown();
        } catch (org.openrdf.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }
}