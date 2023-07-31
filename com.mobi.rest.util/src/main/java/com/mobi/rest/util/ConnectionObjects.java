package com.mobi.rest.util;

/*-
 * #%L
 * com.mobi.rest.util
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

import com.mobi.dataset.api.DatasetManager;
import com.mobi.repository.api.RepositoryManager;

import java.util.Objects;

public class ConnectionObjects {
    RepositoryManager repositoryManager;
    DatasetManager datasetManager;

    public ConnectionObjects(RepositoryManager repositoryManager, DatasetManager datasetManager) {
        this.repositoryManager = repositoryManager;
        this.datasetManager = datasetManager;
    }

    public RepositoryManager getRepositoryManager() {
        return repositoryManager;
    }

    public void setRepositoryManager(RepositoryManager repositoryManager) {
        this.repositoryManager = repositoryManager;
    }

    public DatasetManager getDatasetManager() {
        return datasetManager;
    }

    public void setDatasetManager(DatasetManager datasetManager) {
        this.datasetManager = datasetManager;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ConnectionObjects that = (ConnectionObjects) o;
        return Objects.equals(repositoryManager, that.repositoryManager) &&
                Objects.equals(datasetManager, that.datasetManager);
    }

    @Override
    public int hashCode() {
        return Objects.hash(repositoryManager, datasetManager);
    }
}
