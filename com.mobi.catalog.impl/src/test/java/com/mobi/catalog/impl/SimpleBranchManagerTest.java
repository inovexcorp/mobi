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

import static junit.framework.TestCase.assertEquals;
import static junit.framework.TestCase.assertFalse;
import static junit.framework.TestCase.assertNotNull;
import static junit.framework.TestCase.assertNotSame;
import static junit.framework.TestCase.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Distribution;
import com.mobi.catalog.api.ontologies.mcat.UserBranch;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.record.RecordService;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.io.InputStream;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;
import java.util.Set;

public class SimpleBranchManagerTest extends OrmEnabledTestCase {
    private AutoCloseable closeable;
    private MemoryRepositoryWrapper repo;
    private SimpleBranchManager manager;
    private final OrmFactory<Branch> branchFactory = getRequiredOrmFactory(Branch.class);
    private final OrmFactory<UserBranch> userBranchFactory = getRequiredOrmFactory(UserBranch.class);
    private final OrmFactory<VersionedRDFRecord> versionedRDFRecordFactory = getRequiredOrmFactory(VersionedRDFRecord.class);
    private final OrmFactory<Distribution> distributionFactory = getRequiredOrmFactory(Distribution.class);

    private final SimpleThingManager thingManager = spy(new SimpleThingManager());
    private final SimpleRecordManager recordManager = spy(new SimpleRecordManager());
    private final SimpleRevisionManager revisionManager = spy(new SimpleRevisionManager());

    @Rule
    public ExpectedException thrown = ExpectedException.none();

    @Mock
    private RecordService<VersionedRDFRecord> versionedRDFRecordService;

    @Before
    public void setup() throws Exception {
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));
        closeable = MockitoAnnotations.openMocks(this);

        try (RepositoryConnection conn = repo.getConnection()) {
            InputStream testData = getClass().getResourceAsStream("/testCatalogData.trig");
            conn.add(Rio.parse(testData, "", RDFFormat.TRIG));
        }

        when(versionedRDFRecordService.getTypeIRI()).thenReturn(VersionedRDFRecord.TYPE);
        when(versionedRDFRecordService.getType()).thenReturn(VersionedRDFRecord.class);

        recordManager.thingManager = thingManager;
        recordManager.addRecordService(versionedRDFRecordService);
        recordManager.factoryRegistry = ORM_FACTORY_REGISTRY;
        revisionManager.thingManager = thingManager;
        manager = spy(new SimpleBranchManager());
        manager.thingManager = thingManager;
        manager.recordManager = recordManager;
        injectOrmFactoryReferencesIntoService(manager);
        injectOrmFactoryReferencesIntoService(recordManager);
        injectOrmFactoryReferencesIntoService(revisionManager);
        injectOrmFactoryReferencesIntoService(thingManager);
    }

    @After
    public void tearDown() throws Exception {
        repo.shutDown();
        closeable.close();
    }
    
    /* getBranches */

    @Test
    public void testGetBranches() throws Exception {
        // Setup:
        try (RepositoryConnection conn = repo.getConnection()) {
            VersionedRDFRecord record = versionedRDFRecordFactory.createNew(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI);
            record.setBranch(Collections.singleton(branchFactory.createNew(ManagerTestConstants.BRANCH_IRI)));
            doReturn(record).when(recordManager).getRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));

            Set<Branch> branches = manager.getBranches(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, conn);
            verify(recordManager).getRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
            record.getBranch_resource().forEach(resource -> verify(thingManager).getExpectedObject(eq(resource), eq(branchFactory), any(RepositoryConnection.class)));
            assertEquals(1, branches.size());
        }
    }

    /* addBranch */

    @Test
    public void testAddBranch() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {

            // Setup:
            VersionedRDFRecord record = versionedRDFRecordFactory.createNew(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI);
            record.setProperty(VALUE_FACTORY.createLiteral(OffsetDateTime.now().minusDays(1)), VALUE_FACTORY.createIRI(_Thing.modified_IRI));
            String previousModifiedValue = ManagerTestConstants.getModifiedIriValue(record);
            doReturn(record).when(recordManager).getRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));

            Branch branch = branchFactory.createNew(ManagerTestConstants.NEW_IRI);
            branch.setProperty(VALUE_FACTORY.createLiteral(OffsetDateTime.now().minusDays(1)), VALUE_FACTORY.createIRI(_Thing.modified_IRI));

            manager.addBranch(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, branch, conn);
            verify(recordManager).getRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
            verify(thingManager).updateObject(eq(record), any(RepositoryConnection.class));
            verify(thingManager).addObject(eq(branch), any(RepositoryConnection.class));
            assertEquals(1, record.getBranch_resource().size());

            assertNotSame(ManagerTestConstants.getModifiedIriValue(record), previousModifiedValue);
            assertNotNull(ManagerTestConstants.getModifiedIriValue(branch));
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddBranchWithTakenResource() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Branch branch = branchFactory.createNew(ManagerTestConstants.BRANCH_IRI);

            manager.addBranch(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, branch, conn);
            verify(thingManager, times(0)).addObject(eq(branch), any(RepositoryConnection.class));
            verify(thingManager).throwAlreadyExists(ManagerTestConstants.BRANCH_IRI, distributionFactory);
        }
    }

    /* updateBranch */

    @Test
    public void testUpdateBranch() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Branch branch = branchFactory.createNew(ManagerTestConstants.BRANCH_IRI);
            branch.getModel().add(ManagerTestConstants.BRANCH_IRI, DCTERMS.TITLE, VALUE_FACTORY.createLiteral("New Title"));
            branch.setProperty(VALUE_FACTORY.createLiteral(OffsetDateTime.now().minusDays(1)), VALUE_FACTORY.createIRI(_Thing.modified_IRI));
            String previousModifiedValue = ManagerTestConstants.getModifiedIriValue(branch);

            manager.updateBranch(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, branch, conn);
            verify(manager).validateBranch(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(ManagerTestConstants.BRANCH_IRI), any(RepositoryConnection.class));
            verify(thingManager).updateObject(eq(branch), any(RepositoryConnection.class));
            assertNotSame(ManagerTestConstants.getModifiedIriValue(branch), previousModifiedValue);
        }
    }

    @Test
    public void testUpdateUserBranch() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            UserBranch branch = userBranchFactory.createNew(ManagerTestConstants.USER_BRANCH_IRI);
            branch.getModel().add(ManagerTestConstants.USER_BRANCH_IRI, DCTERMS.TITLE, VALUE_FACTORY.createLiteral("New Title"));
            branch.setProperty(VALUE_FACTORY.createLiteral(OffsetDateTime.now().minusDays(1)), VALUE_FACTORY.createIRI(_Thing.modified_IRI));
            String previousModifiedValue = ManagerTestConstants.getModifiedIriValue(branch);

            manager.updateBranch(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, branch, conn);
            verify(manager).validateBranch(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(ManagerTestConstants.USER_BRANCH_IRI), any(RepositoryConnection.class));
            verify(thingManager).updateObject(eq(branch), any(RepositoryConnection.class));
            assertNotSame(ManagerTestConstants.getModifiedIriValue(branch), previousModifiedValue);
        }
    }

    @Test
    public void testUpdateMasterBranch() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Branch branch = branchFactory.createNew(ManagerTestConstants.MASTER_BRANCH_IRI);
            thrown.expect(IllegalArgumentException.class);
            thrown.expectMessage("Branch " + ManagerTestConstants.MASTER_BRANCH_IRI + " is the master Branch and cannot be updated.");
            branch.setProperty(VALUE_FACTORY.createLiteral(OffsetDateTime.now().minusDays(1)), VALUE_FACTORY.createIRI(_Thing.modified_IRI));
            String previousModifiedValue = ManagerTestConstants.getModifiedIriValue(branch);

            manager.updateBranch(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, branch, conn);
            verify(thingManager, times(0)).updateObject(eq(branch), any(RepositoryConnection.class));
            assertNotSame(ManagerTestConstants.getModifiedIriValue(branch), previousModifiedValue);
        }
    }

    /* removeBranch */

    @Test
    public void testRemoveBranch() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            when(versionedRDFRecordService.deleteBranch(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(ManagerTestConstants.BRANCH_IRI), any(RepositoryConnection.class)))
                    .thenReturn(Optional.of(Arrays.asList()));
            manager.removeBranch(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, ManagerTestConstants.BRANCH_IRI, conn);
        }
    }

    @Test
    public void testDeleteBranchWithMissingIdentifier() {
        try (RepositoryConnection conn = repo.getConnection()) {
            thrown.expect(IllegalArgumentException.class);
            thrown.expectMessage("Record does not support Delete Branch operation");

            when(versionedRDFRecordService.deleteBranch(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(ManagerTestConstants.BRANCH_IRI), any(RepositoryConnection.class)))
                    .thenReturn(Optional.empty());
            manager.removeBranch(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, ManagerTestConstants.BRANCH_IRI, conn);
        }
    }

    @Test
    public void testRemoveMasterBranch() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            when(versionedRDFRecordService.deleteBranch(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(ManagerTestConstants.MASTER_BRANCH_IRI), any(RepositoryConnection.class)))
                    .thenThrow(new IllegalStateException("Branch " + ManagerTestConstants.MASTER_BRANCH_IRI + " is the master Branch and cannot be removed."));
            thrown.expect(IllegalStateException.class);
            thrown.expectMessage("Branch " + ManagerTestConstants.MASTER_BRANCH_IRI + " is the master Branch and cannot be removed.");

            manager.removeBranch(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, ManagerTestConstants.MASTER_BRANCH_IRI, conn);
        }
    }


    /* getBranch */

    @Test
    public void testGetBranch() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            VersionedRDFRecord record = versionedRDFRecordFactory.createNew(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI);
            Branch branch = branchFactory.createNew(ManagerTestConstants.BRANCH_IRI);
            record.setBranch(Collections.singleton(branch));
            doReturn(record).when(recordManager).getRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
            doReturn(branch).when(thingManager).getExpectedObject(eq(ManagerTestConstants.BRANCH_IRI), eq(branchFactory), any(RepositoryConnection.class));

            Optional<Branch> result = manager.getBranchOpt(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, ManagerTestConstants.BRANCH_IRI, branchFactory, conn);
            verify(recordManager).getRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
            verify(thingManager).getExpectedObject(eq(ManagerTestConstants.BRANCH_IRI), eq(branchFactory), any(RepositoryConnection.class));
            assertTrue(result.isPresent());
            assertEquals(branch, result.get());
        }
    }

    @Test
    public void testGetUserBranch() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            VersionedRDFRecord record = versionedRDFRecordFactory.createNew(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI);
            UserBranch branch = userBranchFactory.createNew(ManagerTestConstants.USER_BRANCH_IRI);
            record.setBranch(Collections.singleton(branch));
            doReturn(record).when(recordManager).getRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
            doReturn(branch).when(thingManager).getExpectedObject(eq(ManagerTestConstants.USER_BRANCH_IRI), eq(userBranchFactory), any(RepositoryConnection.class));

            Optional<UserBranch> result = manager.getBranchOpt(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, ManagerTestConstants.USER_BRANCH_IRI, userBranchFactory, conn);
            verify(recordManager).getRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
            verify(thingManager).getExpectedObject(eq(ManagerTestConstants.USER_BRANCH_IRI), eq(userBranchFactory), any(RepositoryConnection.class));
            assertTrue(result.isPresent());
            assertEquals(branch, result.get());
        }
    }

    @Test
    public void testGetBranchOfWrongRecord() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            Optional<Branch> result = manager.getBranchOpt(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, ManagerTestConstants.EMPTY_IRI, branchFactory, conn);
            assertFalse(result.isPresent());
        }
    }

    /* getMasterBranch */

    @Test
    public void testGetMasterBranch() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            VersionedRDFRecord record = versionedRDFRecordFactory.createNew(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI);
            Branch branch = branchFactory.createNew(ManagerTestConstants.MASTER_BRANCH_IRI);
            record.setMasterBranch(branch);
            doReturn(record).when(recordManager).getRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
            doReturn(branch).when(thingManager).getExpectedObject(eq(ManagerTestConstants.MASTER_BRANCH_IRI), eq(branchFactory), any(RepositoryConnection.class));

            Branch result = manager.getMasterBranch(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, conn);
            verify(recordManager).getRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
            verify(thingManager).getExpectedObject(eq(ManagerTestConstants.MASTER_BRANCH_IRI), eq(branchFactory), any(RepositoryConnection.class));
            assertEquals(branch, result);
        }
    }

    @Test
    public void testGetMasterBranchOfRecordWithoutMasterSet() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            thrown.expect(IllegalStateException.class);
            thrown.expectMessage("Record " + ManagerTestConstants.VERSIONED_RDF_RECORD_NO_MASTER_IRI + " does not have a master Branch set.");

            manager.getMasterBranch(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_NO_MASTER_IRI, conn);
        }
    }

    /* validateBranch */

    @Test
    public void testBranchPathWithMissingCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Catalog " + ManagerTestConstants.MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.validateBranch(ManagerTestConstants.MISSING_IRI, ManagerTestConstants.RECORD_IRI, ManagerTestConstants.BRANCH_IRI, conn);
        }
    }

    @Test
    public void testBranchPathWithMissingRecord() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("VersionedRDFRecord " + ManagerTestConstants.MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.validateBranch(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.MISSING_IRI, ManagerTestConstants.BRANCH_IRI, conn);
        }
    }

    @Test
    public void testBranchPathWithWrongCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", ManagerTestConstants.VERSIONED_RDF_RECORD_NO_CATALOG_IRI, ManagerTestConstants.CATALOG_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.validateBranch(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_NO_CATALOG_IRI, ManagerTestConstants.BRANCH_IRI, conn);
        }
    }

    @Test
    public void testBranchPathWithWrongRecord() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Branch %s does not belong to VersionedRDFRecord %s", ManagerTestConstants.LONE_BRANCH_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.validateBranch(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, ManagerTestConstants.LONE_BRANCH_IRI, conn);
        }
    }

    /* getBranch(Resource, Resource, Resource, OrmFactory, RepositoryConnection) */

    @Test
    public void getBranchTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            Branch branch = manager.getBranch(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, ManagerTestConstants.BRANCH_IRI, branchFactory, conn);
            assertFalse(branch.getModel().isEmpty());
            assertEquals(ManagerTestConstants.BRANCH_IRI, branch.getResource());
        }
    }

    @Test
    public void getBranchWithMissingCatalogTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Catalog " + ManagerTestConstants.MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.getBranch(ManagerTestConstants.MISSING_IRI, ManagerTestConstants.RECORD_IRI, ManagerTestConstants.BRANCH_IRI, branchFactory, conn);
        }
    }

    @Test
    public void getBranchWithMissingRecordTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("VersionedRDFRecord " + ManagerTestConstants.MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.getBranch(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.MISSING_IRI, ManagerTestConstants.BRANCH_IRI, branchFactory, conn);
        }
    }

    @Test
    public void getBranchWithWrongCatalogTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", ManagerTestConstants.VERSIONED_RDF_RECORD_NO_CATALOG_IRI, ManagerTestConstants.CATALOG_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.getBranch(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_NO_CATALOG_IRI, ManagerTestConstants.BRANCH_IRI, branchFactory, conn);
        }
    }

    @Test
    public void getBranchWithWrongRecordTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Branch %s does not belong to VersionedRDFRecord %s", ManagerTestConstants.LONE_BRANCH_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.getBranch(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, ManagerTestConstants.LONE_BRANCH_IRI, branchFactory, conn);
        }
    }

    @Test
    public void getMissingBranchTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Branch " + ManagerTestConstants.RANDOM_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.getBranch(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_MISSING_BRANCH_IRI, ManagerTestConstants.RANDOM_IRI, branchFactory, conn);
        }
    }

    /* getBranch(VersionedRDFRecord, Resource, OrmFactory, RepositoryConnection) */

    @Test
    public void getBranchWithRecordTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            VersionedRDFRecord record = versionedRDFRecordFactory.createNew(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI);
            record.setBranch(Collections.singleton(branchFactory.createNew(ManagerTestConstants.BRANCH_IRI)));
            Branch branch = manager.getBranch(record, ManagerTestConstants.BRANCH_IRI, branchFactory, conn);
            assertFalse(branch.getModel().isEmpty());
            assertEquals(ManagerTestConstants.BRANCH_IRI, branch.getResource());
        }
    }

    @Test
    public void getBranchWithRecordAndWrongRecordTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Branch %s does not belong to VersionedRDFRecord %s", ManagerTestConstants.LONE_BRANCH_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            VersionedRDFRecord record = versionedRDFRecordFactory.createNew(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI);
            manager.getBranch(record, ManagerTestConstants.LONE_BRANCH_IRI, branchFactory, conn);
        }
    }

    @Test
    public void getMissingBranchWithRecordTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Branch " + ManagerTestConstants.RANDOM_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            VersionedRDFRecord record = versionedRDFRecordFactory.createNew(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI);
            record.setBranch(Collections.singleton(branchFactory.createNew(ManagerTestConstants.RANDOM_IRI)));
            manager.getBranch(record, ManagerTestConstants.RANDOM_IRI, branchFactory, conn);
        }
    }
}
