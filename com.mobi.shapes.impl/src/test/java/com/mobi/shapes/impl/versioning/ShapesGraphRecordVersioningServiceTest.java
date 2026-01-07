package com.mobi.shapes.impl.versioning;

/*-
 * #%L
 * com.mobi.shapes.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.BranchManager;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.CompiledResourceManager;
import com.mobi.catalog.api.DifferenceManager;
import com.mobi.catalog.api.ThingManager;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.MasterBranch;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.shapes.api.ShapesGraphManager;
import com.mobi.shapes.api.ontologies.shapesgrapheditor.ShapesGraphRecord;
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
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.osgi.framework.BundleContext;

import java.io.InputStream;
import java.util.Optional;

public class ShapesGraphRecordVersioningServiceTest extends OrmEnabledTestCase {
    private AutoCloseable closeable;
    private MemoryRepositoryWrapper repo;
    private ShapesGraphRecordVersioningService service;
    private final OrmFactory<ShapesGraphRecord> shapesGraphRecordOrmFactory = getRequiredOrmFactory(ShapesGraphRecord.class);
    private final OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);

    private final IRI originalIRI = VALUE_FACTORY.createIRI("https://mobi.com/records#NewShapeGraphId");
    private final IRI originalIRIHeadGraph = VALUE_FACTORY.createIRI("https://mobi.com/records#NewShapeGraphId/HEAD");
    private final IRI usedIRI = VALUE_FACTORY.createIRI("http://test.com/ontology/used");
    private final IRI commitID = VALUE_FACTORY.createIRI("https://mobi.com/commits#NewShapeGraphIdCommit000");
    private final IRI catalogIri = VALUE_FACTORY.createIRI("http://mobi.com/catalog-local");

    private ShapesGraphRecord record;
    private Commit commit;

    // ShapesGraphRecordVersioningService Dependencies
    @Mock
    private ShapesGraphManager shapesGraphManager;

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
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));

        try (RepositoryConnection conn = repo.getConnection()) {
            InputStream testData = getClass().getResourceAsStream("/testData.trig");
            conn.add(Rio.parse(testData, "", RDFFormat.TRIG));
            record = spy(optObject(originalIRI, shapesGraphRecordOrmFactory, conn).orElseThrow(() -> new Exception("Can't find record")));
            commit = optObject(commitID, commitFactory, conn).orElseThrow(() -> new Exception("Can't find commit"));
        }
        closeable = MockitoAnnotations.openMocks(this);

        when(thingManager.getObject(any(Resource.class), eq(commitFactory), any(RepositoryConnection.class))).thenReturn(commit);
        when(thingManager.getObject(any(Resource.class), eq(shapesGraphRecordOrmFactory), any(RepositoryConnection.class))).thenReturn(record);
        when(shapesGraphManager.shapesGraphIriExists(usedIRI)).thenReturn(true);
        when(branchManager.getMasterBranch(eq(catalogIri), eq(originalIRI), any(RepositoryConnection.class))).thenReturn(masterBranch);
        when(branchManager.getHeadGraph(masterBranch)).thenReturn(originalIRIHeadGraph);
        when(configProvider.getLocalCatalogIRI()).thenReturn(catalogIri);

        service = new ShapesGraphRecordVersioningService();
        injectOrmFactoryReferencesIntoService(service);
        service.configProvider = configProvider;
        service.commitManager = commitManager;
        service.branchManager = branchManager;
        service.compiledResourceManager = compiledResourceManager;
        service.differenceManager = differenceManager;
        service.thingManager = thingManager;
        service.shapesGraphManager = shapesGraphManager;
        service.start(context);
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
    }

    // addMasterCommit, addBranchCommit, mergeIntoMaster, mergeIntoBranch test coverage provided by BaseVersioningServiceTest

    @Test
    public void getTypeIRITest() throws Exception {
        assertEquals(ShapesGraphRecord.TYPE, service.getTypeIRI());
    }

    @Test(expected=IllegalStateException.class)
    public void updateMasterRecordIRINotContainOntologyDefinitionTest() throws Exception {
        try(RepositoryConnection conn = repo.getConnection()) {
            conn.clear();
            service.updateMasterRecordIRI(record, commit, conn);
        }
    }

    @Test(expected=IllegalArgumentException.class)
    public void updateMasterRecordIRIOntologyIRISameTest() throws Exception {
        when(shapesGraphManager.shapesGraphIriExists(any(Resource.class))).thenReturn(true);
        when(thingManager.getObject(eq(record.getResource()), eq(service.shapesGraphRecordFactory), any(RepositoryConnection.class))).thenReturn(record);
        IRI newIRI = getValueFactory().createIRI("http://new");

        try(RepositoryConnection conn = repo.getConnection()) {
            record.setTrackedIdentifier(newIRI);
            Mockito.reset(record);
            service.updateMasterRecordIRI(record, commit, conn);
        } finally {
            assertTrue(record.getTrackedIdentifier().isPresent());
            assertEquals(newIRI, record.getTrackedIdentifier().get());
            verify(thingManager, never()).updateObject(any(ShapesGraphRecord.class), any(RepositoryConnection.class));
        }
    }

    @Test
    public void updateMasterRecordIRIOntologyIRITest() throws Exception {
        IRI newShapeIRI = getValueFactory().createIRI("http://mobi.solutions/ontologies/shapes-graph/NewShapeGraph");
        when(shapesGraphManager.shapesGraphIriExists(any(Resource.class))).thenReturn(false);
        when(thingManager.getObject(eq(record.getResource()), eq(service.shapesGraphRecordFactory), any(RepositoryConnection.class))).thenReturn(record);

        try(RepositoryConnection conn = repo.getConnection()) {
            record.setTrackedIdentifier(getValueFactory().createIRI("http://new"));
            Mockito.reset(record);
            service.updateMasterRecordIRI(record, commit, conn);
        } finally {
            verify(shapesGraphManager).shapesGraphIriExists(eq(newShapeIRI));
            assertTrue(record.getTrackedIdentifier().isPresent());
            assertEquals(newShapeIRI, record.getTrackedIdentifier().get());
            verify(thingManager).updateObject(any(ShapesGraphRecord.class), any(RepositoryConnection.class));
        }
    }
}
