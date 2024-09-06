package com.mobi.catalog.impl;

/*-
 * #%L
 * com.mobi.catalog.impl
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

import static com.mobi.catalog.impl.TestResourceUtils.trigRequired;
import static junit.framework.TestCase.assertTrue;
import static org.junit.Assert.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.jaas.engines.RdfEngine;
import com.mobi.persistence.utils.Models;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Objects;
import java.util.function.Function;

public class SimpleCompiledResourceManagerTest extends OrmEnabledTestCase {
    public static final String BLANK_NODE_GEN_ID = "urn:genId";
    public static final Function<Statement, String> STATEMENT_STRING_FUNCTION = statement -> {
        String sub = statement.getSubject().isBNode() ? BLANK_NODE_GEN_ID : statement.getSubject().stringValue();
        String pred = statement.getPredicate().stringValue();
        String obj = statement.getObject().isBNode() ? BLANK_NODE_GEN_ID : statement.getObject().stringValue();
        String context = statement.getContext() != null ? statement.getContext().stringValue() : null;
        return String.format("%s, %s, %s, %s", sub, pred, obj, context);
    };

    private AutoCloseable closeable;
    private SimpleCompiledResourceManager manager;
    private MemoryRepositoryWrapper repo;

    private final OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);
//    private final Us thingManager = spy(new SimpleThingManager());

    private final RdfEngine rdfEngine = new RdfEngine();
    private final SimpleThingManager thingManager = spy(new SimpleThingManager());
    private final SimpleCommitManager commitManager = spy(new SimpleCommitManager());
    private final SimpleRevisionManager revisionManager = spy(new SimpleRevisionManager());
    private final SimpleBranchManager branchManager = spy(new SimpleBranchManager());
    private final SimpleRecordManager recordManager = spy(new SimpleRecordManager());

    @Mock
    CatalogConfigProvider configProvider;

    @Before
    public void setUp() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));

        when(configProvider.getRepository()).thenReturn(repo);
        when(configProvider.getLocalCatalogIRI()).thenReturn(ManagerTestConstants.CATALOG_IRI);

        recordManager.thingManager = thingManager;
        branchManager.recordManager = recordManager;
        commitManager.branchManager = branchManager;
        commitManager.thingManager = thingManager;
        revisionManager.thingManager = thingManager;
        manager = spy(new SimpleCompiledResourceManager());
        manager.configProvider = configProvider;
        manager.commitManager = commitManager;
        manager.revisionManager = revisionManager;
        manager.thingManager = thingManager;
        injectOrmFactoryReferencesIntoService(manager);
        injectOrmFactoryReferencesIntoService(commitManager);
        injectOrmFactoryReferencesIntoService(revisionManager);
        injectOrmFactoryReferencesIntoService(branchManager);
    }

    @After
    public void reset() throws Exception {
        closeable.close();
        repo.shutDown();
        Mockito.reset(configProvider, thingManager, commitManager, revisionManager, branchManager, recordManager);
    }
    
    /* getCompiledResource */

    @Test
    public void testGetCompiledResourceWithList() throws Exception {
        // Setup:
        Model expected = MODEL_FACTORY.createEmptyModel();
        expected.add(VALUE_FACTORY.createIRI("http://mobi.com/test/ontology"), RDF.TYPE, VALUE_FACTORY.createIRI("http://www.w3.org/2002/07/owl#Ontology"));
        doReturn(expected).when(manager).getCompiledResource(eq(VALUE_FACTORY.createIRI("http://mobi.com/test/ontology")), any(RepositoryConnection.class));

        try (RepositoryConnection conn = repo.getConnection()) {
            Model result = manager.getCompiledResource(VALUE_FACTORY.createIRI("http://mobi.com/test/ontology"), conn);
            verify(manager).getCompiledResource(eq(VALUE_FACTORY.createIRI("http://mobi.com/test/ontology")), any(RepositoryConnection.class));
            result.forEach(statement -> assertTrue(expected.contains(statement)));
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetCompiledResourceWithNull() throws Exception {
        // Setup:
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.getCompiledResource(null, conn);
        } finally {
            verify(thingManager).validateResource(eq(null), any(), any(RepositoryConnection.class));
            verify(manager).getCompiledResource(eq(null), any(RepositoryConnection.class));
        }
    }

    @Test
    public void testGetCompiledResourceWithUnmergedPast() throws Exception {
        // Setup:
        Resource commitId = VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "test0");
        Model expected = MODEL_FACTORY.createEmptyModel();
        expected.add(VALUE_FACTORY.createIRI("http://mobi.com/test/ontology"), RDF.TYPE, VALUE_FACTORY.createIRI("http://www.w3.org/2002/07/owl#Ontology"));
        doReturn(expected).when(manager).getCompiledResource(eq(commitId), any(RepositoryConnection.class));

        try (RepositoryConnection conn = repo.getConnection()) {
            Model result = manager.getCompiledResource(commitId, conn);
            verify(manager).getCompiledResource(eq(commitId), any(RepositoryConnection.class));
            result.forEach(statement -> assertTrue(expected.contains(statement)));
        }
    }

    @Test
    public void testGetCompiledResourceWithPathAndUnmergedPast() throws Exception {
//        // Setup:
//        Resource commitId = VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "commitA1");
//
//        try (RepositoryConnection conn = repo.getConnection()) {
//            manager.getCompiledResource(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, ManagerTestConstants.BRANCH_IRI, commitId, conn);
//            verify(commitManager).validateCommitPath(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(ManagerTestConstants.BRANCH_IRI), eq(commitId), any(RepositoryConnection.class));
//            verify(manager).getCompiledResource(any(Resource.class), any(RepositoryConnection.class));
//        }
    }

    /* getCompiledResource(Resource, RepositoryConnection) */

    @Test
    public void simpleCompiledResource001Test() throws IOException {
        trigRequired(repo, "/systemRepo/differenceSimple001.trig");
        String[] commitsToCompare = new String[] {
                "https://mobi.com/commits#5c60742e-515e-4c91-8e71-2daf31fc235c",
                "https://mobi.com/commits#2cf9b3e3-ddbb-41bb-b9cd-c8401cf2aaa1",
                "https://mobi.com/commits#3b4f2bf0-4523-482c-a8b3-43623db57333"
        };
        getCompiledResourceCompareToFile(commitsToCompare, "/expected/simpleCompiledResource001.txt");
    }

    @Test
    public void simpleCompiledResource002Test() throws IOException {
        trigRequired(repo, "/systemRepo/mergingSimple002.trig");
        String[] commitsToCompare = new String[] {
                "https://mobi.com/commits#d184b5da-cc66-41f0-8be4-fa94bf773dec",
                "https://mobi.com/commits#f15f3967-2b8f-4431-b4fd-0e4b888f5de2",
                "https://mobi.com/commits#e08f32de-1917-4bc8-89a7-2180521e4762",
                "https://mobi.com/commits#6d5096b4-169e-48d2-ab3b-c0bd1adbe3b7",
                "https://mobi.com/commits#b3b16bf5-a484-4ec7-ae66-973f070bc9b5",
                "https://mobi.com/commits#8c8d2221-d72b-442d-a4f6-9793cc31e5a8",
                "https://mobi.com/commits#edfeb5d5-dc0f-46b2-a420-9b4161f00699",
                "https://mobi.com/commits#d3153bf3-ccbe-44cc-a479-8c7d671256cc",
                "https://mobi.com/commits#5dddf67e-23a4-4c5a-94c5-e4c6c466eee2",
                "https://mobi.com/commits#cf9ad171-36f7-4106-aea2-1e552e15059b",
                "https://mobi.com/commits#21a7ad3b-f3c5-4dc0-8633-4433c8f00920",
                "https://mobi.com/commits#8259b01b-a229-430d-ab0f-e53315a96aaf",
                "https://mobi.com/commits#b6af0da2-7335-4624-ac13-7c846b052725",
                "https://mobi.com/commits#ebbdae8d-3c06-4ae7-8ff2-43588fc16001"
        };
        getCompiledResourceCompareToFile(commitsToCompare, "/expected/simpleCompiledResource002.txt");
    }

    @Test
    public void twoBranchesMergedIntoMaster001Test() throws Exception {
        trigRequired(repo, "/twoBranchesMergedIntoMaster.trig");

        String[] commitsToCompare = new String[] {
                "https://mobi.com/commits#b158b0b6-c119-4e09-8270-5e775d6b9703",
        };
        getCompiledResourceCompareToFile(commitsToCompare, "/expected/twoBranchesMergedIntoMaster001.txt");
    }

    @Test()
    public void simpleCompiledResource004Test() {
        trigRequired(repo, "/systemRepo/differenceSimple001.trig");

        String[] commitsToCompare = new String[] {
                "https://mobi.com/commits#df690842-19a2-463d-810e-8eed8df78b60",
                "https://mobi.com/commits#e1a96215-0b90-4d29-8547-5fc4eca6c58b",
                "https://mobi.com/commits#bf3979fd-00ee-4378-98e9-ce4b0fa018f7",
                "https://mobi.com/commits#ontology-simple-id-002-commit-004",
                "https://mobi.com/commits#ontology-simple-id-002-commit-005",
                "https://mobi.com/commits#ef808973-b377-4a10-80f6-dcb3bf0e9b3c",
                "https://mobi.com/commits#729fd411-7f27-40bb-93cb-fad9a325c338",
                "https://mobi.com/commits#2e5d1127-1e03-4e69-85a2-ffbffea44510",
                "https://mobi.com/commits#5c1b960f-e88f-4ec3-a826-92e072c35025",
                "https://mobi.com/commits#52ac25f2-f8a8-477a-8ecc-94c31736976b"
        };
        // TODO FIX FILE OUTPUT
        getCompiledResourceCompareToFile(commitsToCompare, "/expected/simpleCompiledResource004.txt");
    }

    /* getCompiledResourceFile(Resource, RDFFormat, RepositoryConnection) */

    @Test
    public void simpleCompiledResource001FileTest() throws IOException {
        trigRequired(repo, "/systemRepo/differenceSimple001.trig");
        String[] commitsToCompare = new String[] {
                "https://mobi.com/commits#5c60742e-515e-4c91-8e71-2daf31fc235c",
                "https://mobi.com/commits#2cf9b3e3-ddbb-41bb-b9cd-c8401cf2aaa1",
                "https://mobi.com/commits#3b4f2bf0-4523-482c-a8b3-43623db57333"
        };
        getCompiledResourceFileCompareToFile(commitsToCompare, "/expected/simpleCompiledResource001.txt");
    }

    @Test
    public void simpleCompiledResource002FileTest() throws IOException {
        trigRequired(repo, "/systemRepo/mergingSimple002.trig");
        String[] commitsToCompare = new String[] {
                "https://mobi.com/commits#d184b5da-cc66-41f0-8be4-fa94bf773dec",
                "https://mobi.com/commits#f15f3967-2b8f-4431-b4fd-0e4b888f5de2",
                "https://mobi.com/commits#e08f32de-1917-4bc8-89a7-2180521e4762",
                "https://mobi.com/commits#6d5096b4-169e-48d2-ab3b-c0bd1adbe3b7",
                "https://mobi.com/commits#b3b16bf5-a484-4ec7-ae66-973f070bc9b5",
                "https://mobi.com/commits#8c8d2221-d72b-442d-a4f6-9793cc31e5a8",
                "https://mobi.com/commits#edfeb5d5-dc0f-46b2-a420-9b4161f00699",
                "https://mobi.com/commits#d3153bf3-ccbe-44cc-a479-8c7d671256cc",
                "https://mobi.com/commits#5dddf67e-23a4-4c5a-94c5-e4c6c466eee2",
                "https://mobi.com/commits#cf9ad171-36f7-4106-aea2-1e552e15059b",
                "https://mobi.com/commits#21a7ad3b-f3c5-4dc0-8633-4433c8f00920",
                "https://mobi.com/commits#8259b01b-a229-430d-ab0f-e53315a96aaf",
                "https://mobi.com/commits#b6af0da2-7335-4624-ac13-7c846b052725",
                "https://mobi.com/commits#ebbdae8d-3c06-4ae7-8ff2-43588fc16001"
        };
        getCompiledResourceFileCompareToFile(commitsToCompare, "/expected/simpleCompiledResource002.txt");
    }

    @Test
    public void twoBranchesMergedIntoMaster001FileTest() throws Exception {
        trigRequired(repo, "/twoBranchesMergedIntoMaster.trig");

        String[] commitsToCompare = new String[] {
                "https://mobi.com/commits#b158b0b6-c119-4e09-8270-5e775d6b9703",
        };
        getCompiledResourceFileCompareToFile(commitsToCompare, "/expected/twoBranchesMergedIntoMaster001.txt");
    }

    /* getCompiledResourceFile(Resource, RDFFormat, RepositoryConnection, Resource...) */

    @Test
    public void simpleCompiledResource002EntityFileTest() throws IOException {
        trigRequired(repo, "/systemRepo/mergingSimple002.trig");
        String[] commitsToCompare = new String[] {
                "https://mobi.com/commits#d184b5da-cc66-41f0-8be4-fa94bf773dec,https://mobi.com/ontologies/SimpleMergeOntology",
                "https://mobi.com/commits#d184b5da-cc66-41f0-8be4-fa94bf773dec,https://mobi.com/ontologies/SimpleMergeOntologyNotExist",
                "https://mobi.com/commits#f15f3967-2b8f-4431-b4fd-0e4b888f5de2,https://mobi.com/ontologies/SimpleMergeOntology#Class001",
                "https://mobi.com/commits#e08f32de-1917-4bc8-89a7-2180521e4762,https://mobi.com/ontologies/SimpleMergeOntology#Class002",
                "https://mobi.com/commits#6d5096b4-169e-48d2-ab3b-c0bd1adbe3b7,https://mobi.com/ontologies/SimpleMergeOntology#Class003",
                "https://mobi.com/commits#b3b16bf5-a484-4ec7-ae66-973f070bc9b5,https://mobi.com/ontologies/SimpleMergeOntology#Class003",
                "https://mobi.com/commits#8c8d2221-d72b-442d-a4f6-9793cc31e5a8,https://mobi.com/ontologies/SimpleMergeOntology#Class04",
                "https://mobi.com/commits#edfeb5d5-dc0f-46b2-a420-9b4161f00699,https://mobi.com/ontologies/SimpleMergeOntology#Class001",
                "https://mobi.com/commits#d3153bf3-ccbe-44cc-a479-8c7d671256cc,https://mobi.com/ontologies/SimpleMergeOntology#Class001",
                "https://mobi.com/commits#5dddf67e-23a4-4c5a-94c5-e4c6c466eee2,https://mobi.com/ontologies/SimpleMergeOntology#Class04V2",
                "https://mobi.com/commits#cf9ad171-36f7-4106-aea2-1e552e15059b,https://mobi.com/ontologies/SimpleMergeOntology#dataProperty01",
                "https://mobi.com/commits#21a7ad3b-f3c5-4dc0-8633-4433c8f00920,https://mobi.com/ontologies/SimpleMergeOntology",
                "https://mobi.com/commits#8259b01b-a229-430d-ab0f-e53315a96aaf,https://mobi.com/ontologies/SimpleMergeOntology#Class001",
                "https://mobi.com/commits#b6af0da2-7335-4624-ac13-7c846b052725,https://mobi.com/ontologies/SimpleMergeOntology#Class003V2",
                "https://mobi.com/commits#ebbdae8d-3c06-4ae7-8ff2-43588fc16001,https://mobi.com/ontologies/SimpleMergeOntology#Class001"
        };
        getCompiledResourceEntityCompareToFile(commitsToCompare, "/expected/simpleCompiledResource002Filter.txt");
    }

    /* getCompiledResource(List<Resource>, RepositoryConnection, Resource... subjectIds) */

    @Test
    public void getCompiledResourceWithIdEntityIdsTest() {
        trigRequired(repo, "/systemRepo/differenceSimple001.trig");
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            // COMMIT COMPARISON
//            compareCompileResourcesWithEntityIriIteration(SimpleMergeOntology.commit001, SimpleMergeOntology.commit001Compiled(), conn);
//            // COMMIT COMPARISON
//            compareCompileResourcesWithEntityIriIteration(SimpleMergeOntology.commit002, SimpleMergeOntology.commit002Compiled(), conn);
//            // COMMIT COMPARISON - Create Branch
//            compareCompileResourcesWithEntityIriIteration(SimpleMergeOntology.commit002Branch, SimpleMergeOntology.commit002BranchCompiled(), conn);
//            // COMMIT COMPARISON - Branch was merged into master
//            compareCompileResourcesWithEntityIriIteration(SimpleMergeOntology.commit004, SimpleMergeOntology.commit004Compiled(), conn);
//            // COMMIT COMPARISON
//            compareCompileResourcesWithEntityIriIteration(SimpleMergeOntology.commit005, SimpleMergeOntology.commit005Compiled(), conn);
//            // COMMIT COMPARISON - Change Entity
//            compareCompileResourcesWithEntityIriIteration(SimpleMergeOntology.commit006, SimpleMergeOntology.commit006Compiled(), conn);
//            // COMMIT COMPARISON
//            compareCompileResourcesWithEntityIriIteration(SimpleMergeOntology.commit007, SimpleMergeOntology.commit007Compiled(), conn);
//            // COMMIT COMPARISON
//            compareCompileResourcesWithEntityIriIteration(SimpleMergeOntology.commit008, SimpleMergeOntology.commit008Compiled(), conn);
//            // COMMIT COMPARISON
//            compareCompileResourcesWithEntityIriIteration(SimpleMergeOntology.commit009Branch, SimpleMergeOntology.commit009BranchCompiled(), conn);
//            // COMMIT COMPARISON
//            compareCompileResourcesWithEntityIriIteration(SimpleMergeOntology.commit010, SimpleMergeOntology.getExpected010(), conn);
        }
    }

    /* === HELPER METHODS === */

    private void getCompiledResourceCompareToFile(String[] commitsToCompare, String expectedFilePath) {
        String expected = null;
        try {
            expected = IOUtils.toString(Objects.requireNonNull(this.getClass().getResourceAsStream(expectedFilePath)), StandardCharsets.UTF_8);
        } catch (IOException e) {
            Assert.fail(e.getMessage());
        }
        try (RepositoryConnection conn = repo.getConnection()) {
            StringBuilder actualResults = new StringBuilder();
            for (String commitToCompare : commitsToCompare) {
                Model actualModel = manager.getCompiledResource(getValueFactory().createIRI(commitToCompare), conn);
                List<String> actual = actualModel.stream().map(STATEMENT_STRING_FUNCTION).sorted().toList();
                actualResults.append("====== commit: ").append(commitToCompare).append(" ======\n");
                actualResults.append(String.join("\n", actual)).append("\n").append("\n").append("\n");
            }
            assertEquals(expected, actualResults.toString());
        }
    }

    private void getCompiledResourceEntityCompareToFile(String[] commitsToCompareWithEntity, String expectedFilePath) {
        String expected = null;
        try {
            expected = IOUtils.toString(Objects.requireNonNull(this.getClass().getResourceAsStream(expectedFilePath)), StandardCharsets.UTF_8);
        } catch (IOException e) {
            Assert.fail(e.getMessage());
        }
        try (RepositoryConnection conn = repo.getConnection()) {
            StringBuilder actualResults = new StringBuilder();
            for (String commitToCompareWithEntity : commitsToCompareWithEntity) {
                String commitToCompare = commitToCompareWithEntity.substring(0, commitToCompareWithEntity.indexOf(","));
                String entityId = commitToCompareWithEntity.substring(commitToCompareWithEntity.indexOf(",") + 1);

                Model actualModel = manager.getCompiledResource(getValueFactory().createIRI(commitToCompare), conn, new IRI[]{getValueFactory().createIRI(entityId)});
                List<String> actual = actualModel.stream().map(STATEMENT_STRING_FUNCTION).sorted().toList();
                actualResults.append("====== commit: ").append(commitToCompare).append(" Filter: ").append(entityId).append(" ======\n");
                actualResults.append(String.join("\n", actual)).append("\n").append("\n").append("\n");
            }
            assertEquals(expected, actualResults.toString());
        }
    }

    private void getCompiledResourceFileCompareToFile(String[] commitsToCompare, String expectedFilePath) {
        String expected = null;
        try {
            expected = IOUtils.toString(Objects.requireNonNull(this.getClass().getResourceAsStream(expectedFilePath)), StandardCharsets.UTF_8);
        } catch (IOException e) {
            Assert.fail(e.getMessage());
        }
        try (RepositoryConnection conn = repo.getConnection()) {
            StringBuilder actualResults = new StringBuilder();
            for (String commitToCompare : commitsToCompare) {
                File fileA = manager.getCompiledResourceFile(getValueFactory().createIRI(commitToCompare), RDFFormat.TURTLE, conn);
                Model actualModel = Models.createModel(new FileInputStream(fileA));
                assert fileA.delete();
                List<String> actual = actualModel.stream().map(STATEMENT_STRING_FUNCTION).sorted().toList();
                actualResults.append("====== commit: ").append(commitToCompare).append(" ======\n");
                actualResults.append(String.join("\n", actual)).append("\n").append("\n").append("\n");
            }
            assertEquals(expected, actualResults.toString());
        } catch (IOException e) {
            Assert.fail(e.getMessage());
        }
    }

}
