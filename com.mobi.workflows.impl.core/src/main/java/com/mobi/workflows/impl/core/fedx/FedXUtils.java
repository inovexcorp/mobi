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

import org.eclipse.rdf4j.federated.FedXFactory;
import org.eclipse.rdf4j.federated.endpoint.Endpoint;
import org.eclipse.rdf4j.federated.endpoint.EndpointClassification;
import org.eclipse.rdf4j.federated.endpoint.EndpointType;
import org.eclipse.rdf4j.federated.endpoint.ManagedRepositoryEndpoint;
import org.eclipse.rdf4j.federated.endpoint.RepositoryEndpoint;
import org.eclipse.rdf4j.federated.endpoint.provider.NativeRepositoryInformation;
import org.eclipse.rdf4j.federated.endpoint.provider.ResolvableRepositoryInformation;
import org.eclipse.rdf4j.federated.exception.FedXException;
import org.eclipse.rdf4j.federated.repository.FedXRepository;
import org.eclipse.rdf4j.federated.util.Vocabulary;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.LinkedHashModel;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.repository.Repository;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;

import java.util.ArrayList;
import java.util.List;

public class FedXUtils {
    private static final ValueFactory vf = new ValidatingValueFactory();

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
        for (Repository repo: repositories) {
            id = id + 1;
            endpoints.add(getRepositoryEndpoint(repo, String.format("%s", id)));
        }
        return FedXFactory.createFederation(endpoints);
    }

    /**
     * Get a un-writeable Repository Endpoint for the provided repository depending on its type for use in a Federated
     * Repository.
     *
     * @param repository The repository to generate an endpoint for
     * @param id The id of the repository if needed
     * @return A RepositoryEndpoint to use in a Federated Repository
     */
    public RepositoryEndpoint getRepositoryEndpoint(Repository repository, String id) {
        if (repository.getDataDir() != null) {
            return getNativeRepositoryEndpoint(repository);
        } else {
            return getResolvableRepositoryEndpoint(repository, id);
        }
    }

    /**
     * Get a Repository Endpoint for the provided repository depending on its type for use in a Federated
     * Repository.Has the option to be writeable or not.
     *
     * @param repository The repository to generate an endpoint for
     * @param id The id of the repository if needed
     * @param writeable Whether the endpoint should be considered writeable
     * @return A RepositoryEndpoint to use in a Federated Repository
     */
    public RepositoryEndpoint getRepositoryEndpoint(Repository repository, String id, boolean writeable) {
        if (repository.getDataDir() != null) {
            return getNativeRepositoryEndpoint(repository, writeable);
        } else {
            return getResolvableRepositoryEndpoint(repository, id, writeable);
        }
    }

    /**
     * Get a Resolvable un-writeable RepositoryEndpoint for a non-native repository with the provided id for use in a
     * Federated Repository.
     *
     * @param repository A Repository to generate an endpoint for
     * @param id The identifier of the repository to use for the endpoint
     * @return A RepositoryEndpoint to use in a Federated Repository
     */
    public RepositoryEndpoint getResolvableRepositoryEndpoint(Repository repository, String id) {
        return this.getResolvableRepositoryEndpoint(repository, id, false);
    }

    /**
     * Get a Resolvable RepositoryEndpoint for a non-native repository with the provided id for use in a
     * Federated Repository. Has the option to be writeable or not.
     *
     * @param repository A Repository to generate an endpoint for
     * @param id The identifier of the repository to use for the endpoint
     * @param writeable Whether the endpoint should be considered writeable
     * @return A RepositoryEndpoint to use in a Federated Repository
     */
    public RepositoryEndpoint getResolvableRepositoryEndpoint(Repository repository, String id, boolean writeable) {
        IRI viewableRepoId = vf.createIRI("urn:ResolvableRepositoryEndpoint-" + id);
        Model resolvableRepositoryInformationModel = new LinkedHashModel();
        resolvableRepositoryInformationModel.add(viewableRepoId, Vocabulary.FEDX.REPOSITORY_NAME, viewableRepoId);

        ResolvableRepositoryInformation resolvableRepositoryInformation = new ResolvableRepositoryInformation(
                resolvableRepositoryInformationModel, viewableRepoId);
        resolvableRepositoryInformation.setType(EndpointType.NativeStore);
        resolvableRepositoryInformation.setWritable(writeable);

        ManagedRepositoryEndpoint viewableRecordEndpoint = new ManagedRepositoryEndpoint(
                resolvableRepositoryInformation,
                resolvableRepositoryInformation.getLocation(),
                EndpointClassification.Local,
                repository);
        viewableRecordEndpoint.setEndpointConfiguration(resolvableRepositoryInformation.getEndpointConfiguration());
        return viewableRecordEndpoint;
    }

    /**
     * Get a un-writeable RepositoryEndpoint for a native repository, meaning one stored on local disk, for use in a
     * Federated Repository.
     *
     * @param repository Native Repository to generate an endpoint for
     * @return A RepositoryEndpoint to use in a Federated Repository
     */
    public RepositoryEndpoint getNativeRepositoryEndpoint(Repository repository) {
        return getNativeRepositoryEndpoint(repository, false);
    }

    /**
     * Get a RepositoryEndpoint for a native repository, meaning one stored on local disk, for use in a Federated
     * Repository. Has the option to be writeable or not.
     *
     * @param repository Native Repository to generate an endpoint for
     * @param writeable Whether the endpoint should be considered writeable
     * @return A RepositoryEndpoint to use in a Federated Repository
     */
    public RepositoryEndpoint getNativeRepositoryEndpoint(Repository repository, boolean writeable) {
        assert repository.getDataDir() != null;
        NativeRepositoryInformation repoInfo = new NativeRepositoryInformation("repo",
                repository.getDataDir().getAbsolutePath());
        repoInfo.setWritable(writeable);
        ManagedRepositoryEndpoint repositoryEndpoint = new ManagedRepositoryEndpoint(repoInfo,
                repoInfo.getLocation(), EndpointClassification.Local, repository);
        repositoryEndpoint.setEndpointConfiguration(repoInfo.getEndpointConfiguration());
        return repositoryEndpoint;
    }
}
