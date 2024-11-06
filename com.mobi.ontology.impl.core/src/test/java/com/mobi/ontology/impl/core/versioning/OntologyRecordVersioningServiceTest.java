package com.mobi.ontology.impl.core.versioning;

/*-
 * #%L
 * com.mobi.ontology.api
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.mobi.catalog.api.*;
import com.mobi.catalog.api.ontologies.mcat.*;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecord;
import com.mobi.ontology.utils.cache.OntologyCache;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.base.OsgiRepositoryWrapper;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryResult;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.*;
import org.junit.rules.ExpectedException;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.osgi.framework.BundleContext;

import java.io.InputStream;
import java.util.Optional;

public class OntologyRecordVersioningServiceTest extends OrmEnabledTestCase {

    private AutoCloseable closeable;
    private OsgiRepositoryWrapper repo;
    private OntologyRecordVersioningService service;

    // OrmFactories
    private final OrmFactory<OntologyRecord> ontologyRecordFactory = getRequiredOrmFactory(OntologyRecord.class);
    private final OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);

    // Constant
    private final IRI originalIRI = VALUE_FACTORY.createIRI("https://mobi.com/records#NewOntologyId");
    private final IRI originalIRIHeadGraph = VALUE_FACTORY.createIRI("https://mobi.com/records#NewOntologyId/HEAD");
    private final IRI originalOntologyIRI = VALUE_FACTORY.createIRI("https://mobi.com/ontologies/NewOntology");
    private final IRI newIRI = VALUE_FACTORY.createIRI("http://test.com/ontology/new");
    private final IRI commitID = VALUE_FACTORY.createIRI("https://mobi.com/commits#31c00edf-d95c-4228-bbd1-e57bc71c19fa");
    private final IRI catalogIri = VALUE_FACTORY.createIRI("http://mobi.com/catalog-local");

    // Variables
    private OntologyRecord record;
    private Commit commit;

    @Rule
    public ExpectedException thrown = ExpectedException.none();

    // Mock Variables
    @Mock
    private OntologyManager ontologyManager;

    @Mock
    private OntologyCache ontologyCache;

    // BaseVersioningService Dependencies
    @Mock
    private CatalogConfigProvider configProvider;

    @Mock
    private ThingManager thingManager;

    @Mock
    private BranchManager branchManager;

    @Mock
    private CommitManager commitManager;

    @Mock
    private DifferenceManager differenceManager;

    @Mock
    private RevisionManager revisionManager;

    @Mock
    private CompiledResourceManager compiledResourceManager;

    @Mock
    private BundleContext context;

    @Mock
    private MasterBranch masterBranch;

    public <T extends Thing> Optional<T> optObject(Resource id, OrmFactory<T> factory, RepositoryConnection conn) {
        try (RepositoryResult<Statement> repositoryResult = conn.getStatements(null, null, null, id)) {
            Model model = QueryResults.asModel(repositoryResult, getModelFactory());
            return factory.getExisting(id, model);
        } catch (Exception e) {
            throw new MobiException(e);
        }
    }

    @Before
    public void setUp() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);

        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));

        try (RepositoryConnection conn = repo.getConnection()) {
            InputStream testData = getClass().getResourceAsStream("/testData.trig");
            conn.add(Rio.parse(testData, "", RDFFormat.TRIG));
            record = spy(optObject(originalIRI, ontologyRecordFactory, conn).orElseThrow(() -> new Exception("Can't find record")));
            commit = optObject(commitID, commitFactory, conn).orElseThrow(() -> new Exception("Can't find commit"));
        }

        when(branchManager.getMasterBranch(eq(catalogIri), eq(originalIRI), any(RepositoryConnection.class))).thenReturn(masterBranch);
        when(branchManager.getHeadGraph(masterBranch)).thenReturn(originalIRIHeadGraph);
        when(configProvider.getLocalCatalogIRI()).thenReturn(catalogIri);

        service = new OntologyRecordVersioningService();
        injectOrmFactoryReferencesIntoService(service);
        service.configProvider = configProvider;
        service.thingManager = thingManager;
        service.commitManager = commitManager;
        service.branchManager = branchManager;
        service.differenceManager = differenceManager;
        service.compiledResourceManager = compiledResourceManager;
        service.ontologyManager = ontologyManager;
        service.ontologyCache = ontologyCache;
        service.revisionManager = revisionManager;
        service.start(context);
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
    }

    // addMasterCommit, addBranchCommit, mergeIntoMaster, mergeIntoBranch test coverage provided by BaseVersioningServiceTest

    @Test
    public void getTypeIRITest() throws Exception {
        assertEquals(OntologyRecord.TYPE, service.getTypeIRI());
    }

    @Test(expected=IllegalStateException.class)
    public void updateMasterRecordIRINotContainOntologyDefinitionTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.clear();
        }
        service.updateMasterRecordIRI(record.getResource(), commit, repo.getConnection());
    }

    @Test(expected=IllegalArgumentException.class)
    public void updateMasterRecordIRIOntologyIRISameTest() throws Exception {
        OntologyId ontologyIdMock = mock(OntologyId.class);
        when(ontologyIdMock.getOntologyIRI()).thenReturn(Optional.of(newIRI));
        when(ontologyManager.createOntologyId(any(Model.class))).thenReturn(ontologyIdMock);
        when(ontologyManager.ontologyIriExists(newIRI)).thenReturn(true);
        when(thingManager.getObject(eq(record.getResource()), eq(service.ontologyRecordFactory), any(RepositoryConnection.class))).thenReturn(record);

        try(RepositoryConnection conn = repo.getConnection()) {
            service.updateMasterRecordIRI(record.getResource(), commit, conn);
        } finally {
            verify(ontologyCache).clearCacheImports(originalOntologyIRI);
            verify(ontologyManager).ontologyIriExists(eq(newIRI));
            verify(record, never()).setOntologyIRI(eq(newIRI));
            verify(thingManager, never()).updateObject(any(OntologyRecord.class), any(RepositoryConnection.class));
            verify(ontologyCache, never()).clearCacheImports(newIRI);
        }
    }

    @Test
    public void updateMasterRecordIRITest() throws Exception {
        OntologyId ontologyIdMock = mock(OntologyId.class);
        when(ontologyIdMock.getOntologyIRI()).thenReturn(Optional.of(newIRI));
        when(ontologyManager.createOntologyId(any(Model.class))).thenReturn(ontologyIdMock);
        when(ontologyManager.ontologyIriExists(newIRI)).thenReturn(false);
        when(thingManager.getObject(eq(record.getResource()), eq(service.ontologyRecordFactory), any(RepositoryConnection.class))).thenReturn(record);

        try (RepositoryConnection conn = repo.getConnection()) {
            service.updateMasterRecordIRI(record.getResource(), commit, conn);
        } finally {
            verify(ontologyCache).clearCacheImports(originalOntologyIRI);
            verify(ontologyManager).ontologyIriExists(eq(newIRI));
            verify(record).setOntologyIRI(eq(newIRI));
            verify(thingManager).updateObject(any(OntologyRecord.class), any(RepositoryConnection.class));
            verify(ontologyCache).clearCacheImports(newIRI);
        }
    }
}
