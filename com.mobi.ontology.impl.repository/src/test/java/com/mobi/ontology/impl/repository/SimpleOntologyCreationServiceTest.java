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

import static org.junit.Assert.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mockConstruction;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.BranchManager;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.dataset.api.DatasetUtilsService;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.utils.imports.ImportsResolver;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.OsgiRepository;
import com.mobi.repository.api.RepositoryManager;
import org.eclipse.rdf4j.model.IRI;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockedConstruction;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.osgi.framework.Bundle;
import org.osgi.framework.BundleContext;
import org.osgi.framework.FrameworkUtil;
import org.osgi.framework.ServiceReference;

import java.io.File;
import java.util.Optional;

public class SimpleOntologyCreationServiceTest extends OrmEnabledTestCase {
    SimpleOntologyCreationService service;
    AutoCloseable closeable;
    IRI recordId;
    IRI commitId;

    @Mock
    DatasetUtilsService dsUtilsService;

    @Mock
    ImportsResolver importsResolver;

    @Mock
    BNodeService bNodeService;

    @Mock
    RepositoryManager repositoryManager;

    @Mock
    BranchManager branchManager;

    @Mock
    CommitManager commitManager;

    @Mock
    OsgiRepository catalogRepo;

    @Mock
    CatalogConfigProvider configProvider;

    @Mock
    OsgiRepository ontologyCacheRepo;

    @Mock
    File file;

    @Mock
    private Bundle bundle;

    @Mock
    private BundleContext bundleContext;

    @Mock
    private OntologyManager ontologyManager;

    @Mock
    private ServiceReference<OntologyManager> serviceReference;

    @Before
    public void setUp() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);
        recordId = VALUE_FACTORY.createIRI("urn:recordId");
        commitId = VALUE_FACTORY.createIRI("urn:commitId");
        when(repositoryManager.getRepository(anyString())).thenReturn(Optional.of(ontologyCacheRepo));
        when(bundle.getBundleContext()).thenReturn(bundleContext);
        when(bundleContext.getServiceReference(OntologyManager.class)).thenReturn(serviceReference);
        when(bundleContext.getService(serviceReference)).thenReturn(ontologyManager);
        when(configProvider.getRepository()).thenReturn(catalogRepo);

        service = Mockito.spy(new SimpleOntologyCreationService());
        service.dsUtilsService = dsUtilsService;
        service.bNodeService = bNodeService;
        service.repositoryManager = repositoryManager;
        service.branchManager = branchManager;
        service.commitManager = commitManager;
        service.importsResolver = importsResolver;
        service.configProvider = configProvider;
    }

    @After
    public void tearDown() throws Exception {
        closeable.close();
    }

    @Test
    public void createOntologyFromCommitTest() {
        try (MockedConstruction<SimpleOntology> ontology = mockConstruction(SimpleOntology.class);
             MockedStatic<FrameworkUtil> frameworkUtil = Mockito.mockStatic(FrameworkUtil.class)) {
            frameworkUtil.when(() -> FrameworkUtil.getBundle(any(Class.class))).thenReturn(bundle);
            service.createOntologyFromCommit(recordId, commitId);
            verify(repositoryManager).getRepository(eq("ontologyCache"));

            assertEquals(1, ontology.constructed().size());
        }
    }

    @Test(expected = IllegalStateException.class)
    public void createOntologyFromCommitNoRepoTest() {
        when(repositoryManager.getRepository(anyString())).thenReturn(Optional.empty());
        service.createOntologyFromCommit(recordId, commitId);
    }

    @Test
    public void createOntologyFileTest() {
        try (MockedConstruction<SimpleOntology> ontology = mockConstruction(SimpleOntology.class);
             MockedStatic<FrameworkUtil> frameworkUtil = Mockito.mockStatic(FrameworkUtil.class)) {
            frameworkUtil.when(() -> FrameworkUtil.getBundle(any(Class.class))).thenReturn(bundle);
            service.createOntology(file, recordId, commitId);
            verify(repositoryManager).getRepository(eq("ontologyCache"));

            assertEquals(1, ontology.constructed().size());
        }
    }

    @Test(expected = IllegalStateException.class)
    public void createOntologyFileNoRepoTest() {
        when(repositoryManager.getRepository(anyString())).thenReturn(Optional.empty());
        service.createOntology(file, recordId, commitId);
    }

    @Test
    public void createOntologyTest() {
        try (MockedConstruction<SimpleOntology> ontology = mockConstruction(SimpleOntology.class);
             MockedStatic<FrameworkUtil> frameworkUtil = Mockito.mockStatic(FrameworkUtil.class)) {
            frameworkUtil.when(() -> FrameworkUtil.getBundle(any(Class.class))).thenReturn(bundle);
            service.createOntology(recordId, commitId);
            verify(repositoryManager).getRepository(eq("ontologyCache"));

            assertEquals(1, ontology.constructed().size());
        }
    }

    @Test(expected = IllegalStateException.class)
    public void createOntologyNoRepoTest() {
        when(repositoryManager.getRepository(anyString())).thenReturn(Optional.empty());
        service.createOntology(recordId, commitId);
    }
}
