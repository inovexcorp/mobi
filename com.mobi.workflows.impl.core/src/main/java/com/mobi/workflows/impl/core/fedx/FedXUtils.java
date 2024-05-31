package com.mobi.workflows.impl.core.fedx;

/*-
 * #%L
 * com.mobi.workflows.impl.core
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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

import com.mobi.repository.api.OsgiRepository;
import org.eclipse.rdf4j.federated.FedXFactory;
import org.eclipse.rdf4j.federated.endpoint.Endpoint;
import org.eclipse.rdf4j.federated.endpoint.EndpointFactory;
import org.eclipse.rdf4j.federated.exception.FedXException;
import org.eclipse.rdf4j.federated.repository.FedXRepository;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.repository.Repository;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;

import java.util.ArrayList;
import java.util.List;

public class FedXUtils {
    /**
     * Creates a Federated Repository of the provided repositories with an additional in memory repo containing the
     * provided Model.
     *
     * @param memoryView Model to join to the Federated Repository
     * @param repositories The repositories that should be part of the Federated Repository
     * @return A Federated Repository with the provided repositories and the provided model
     * @throws FedXException If an error occurs constructing the Federated Repository
     */
    public Repository getFedXRepoWithModel(Model memoryView, Repository... repositories) throws FedXException {
        Repository inMemoryRepo = new SailRepository(new MemoryStore());
        try (RepositoryConnection conn = inMemoryRepo.getConnection()) {
            conn.add(memoryView);
        }

        Repository[] repos = new Repository[repositories.length + 1];
        System.arraycopy(repositories, 0, repos, 0, repositories.length);
        repos[repositories.length] = inMemoryRepo;

        return getFedXRepo(repos);
    }

    /**
     * Creates a Federated Repository of the provided repositories.
     *
     * @param repositories The repositories to include in the federation
     * @return A Federated Repository of the provided list of repositories
     * @throws FedXException If an error occurs constructing the Federated Repository
     */
    public FedXRepository getFedXRepo(Repository ...repositories) throws FedXException {
        List<Endpoint> endpoints = new ArrayList<>();
        int id = 0;
        for (Repository repo : repositories) {
            id = id + 1;
            String idStr = String.format("%s", id);
            if (repo instanceof OsgiRepository && ((OsgiRepository) repo).getRepositoryID() != null) {
                idStr = ((OsgiRepository) repo).getRepositoryID();
            }
            endpoints.add(EndpointFactory.loadEndpoint(idStr, repo));
        }
        return FedXFactory.createFederation(endpoints);
    }
}
