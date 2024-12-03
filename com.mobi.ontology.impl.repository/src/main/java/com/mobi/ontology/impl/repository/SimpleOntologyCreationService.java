package com.mobi.ontology.impl.repository;

/*-
 * #%L
 * com.mobi.ontology.impl.repository
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

import com.mobi.catalog.api.BranchManager;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.dataset.api.DatasetUtilsService;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyCreationService;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.utils.imports.ImportsResolver;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.repository.api.OsgiRepository;
import com.mobi.repository.api.RepositoryManager;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.osgi.framework.BundleContext;
import org.osgi.framework.FrameworkUtil;
import org.osgi.framework.ServiceReference;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import java.io.File;

@Component(service = { SimpleOntologyCreationService.class, OntologyCreationService.class })
public class SimpleOntologyCreationService implements OntologyCreationService {
    protected final ValueFactory valueFactory = new ValidatingValueFactory();

    @Reference
    protected DatasetUtilsService dsUtilsService;

    @Reference
    protected ImportsResolver importsResolver;

    @Reference
    protected BNodeService bNodeService;

    @Reference
    protected RepositoryManager repositoryManager;

    @Reference
    protected BranchManager branchManager;

    @Reference
    protected CommitManager commitManager;

    @Reference
    protected CatalogConfigProvider configProvider;

    @Override
    public Ontology createOntologyFromCommit(Resource recordId, Resource commitId) {
        File ontologyFile = importsResolver.retrieveOntologyLocalFileFromCommitIRI(commitId);
        return createOntology(ontologyFile, recordId, commitId);
    }

    @Override
    public Ontology createOntology(File ontologyFile, Resource recordId, Resource commitId) {
        OsgiRepository repository = repositoryManager.getRepository("ontologyCache").orElseThrow(
                () -> new IllegalStateException("ontologyCache repository does not exist"));

        String key = String.format("%s&%s", recordId.stringValue(), commitId.stringValue());
        return new SimpleOntology(key, ontologyFile, repository, getOntologyManager(), configProvider, dsUtilsService,
                importsResolver, bNodeService, branchManager, commitManager);
    }

    @Override
    public Ontology createOntology(Resource recordId, Resource commitId) {
        OsgiRepository repository = repositoryManager.getRepository("ontologyCache").orElseThrow(
                () -> new IllegalStateException("ontologyCache repository does not exist"));

        String key = String.format("%s&%s", recordId.stringValue(), commitId.stringValue());
        return new SimpleOntology(key, repository, getOntologyManager(), configProvider, dsUtilsService,
                importsResolver, bNodeService, branchManager, commitManager);
    }

    private OntologyManager getOntologyManager() {
        BundleContext bundleContext = FrameworkUtil.getBundle(OntologyManager.class).getBundleContext();
        ServiceReference<OntologyManager> serviceReference = bundleContext
                .getServiceReference(OntologyManager.class);
        return bundleContext.getService(serviceReference);
    }
}
