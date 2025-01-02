package com.mobi.catalog.impl;

/*-
 * #%L
 * com.mobi.catalog.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import static junit.framework.TestCase.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.ontologies.mcat.Distribution;
import com.mobi.catalog.api.ontologies.mcat.UnversionedRecord;
import com.mobi.catalog.api.ontologies.mcat.Version;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.persistence.utils.ConnectionUtils;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Collections;
import java.util.Set;

public class SimpleDistributionManagerTest extends OrmEnabledTestCase {
    private AutoCloseable closeable;
    private SimpleDistributionManager manager;
    private MemoryRepositoryWrapper repo;
    private final OrmFactory<UnversionedRecord> unversionedRecordFactory = getRequiredOrmFactory(UnversionedRecord.class);
    private final OrmFactory<Version> versionFactory = getRequiredOrmFactory(Version.class);
    private final OrmFactory<Distribution> distributionFactory = getRequiredOrmFactory(Distribution.class);
    private static final IRI VERSION_MISSING_DISTRIBUTION_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/versions#version-missing-distribution");
    private static final IRI UNVERSIONED_RECORD_NO_CATALOG_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/records#unversioned-record-no-catalog");
    private static final IRI UNVERSIONED_RECORD_MISSING_DISTRIBUTION_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/records#unversioned-record-missing-distribution");
    private static final IRI LONE_DISTRIBUTION_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/distributions#lone-distribution");

    private final SimpleThingManager thingManager = spy(new SimpleThingManager());
    private final SimpleRecordManager recordManager = spy(new SimpleRecordManager());
    private final SimpleVersionManager versionManager = spy(new SimpleVersionManager());

    @Rule
    public ExpectedException thrown = ExpectedException.none();

    @Mock
    CatalogConfigProvider configProvider;

    @Before
    public void setUp() {
        closeable = MockitoAnnotations.openMocks(this);
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));
        addData(repo, "/testCatalogData/distributions.trig", RDFFormat.TRIG);
        addData(repo, "/testCatalogData/unversionedRecord/unversionedRecord.trig", RDFFormat.TRIG);
        addData(repo, "/testCatalogData/unversionedRecord/unversionedRecordMissingDistribution.trig", RDFFormat.TRIG);
        addData(repo, "/testCatalogData/unversionedRecord/unversionedRecordNoCatalog.trig", RDFFormat.TRIG);
        addData(repo, "/testCatalogData/versionedRecord/versionedRecord.trig", RDFFormat.TRIG);
        addData(repo, "/testCatalogData/versionedRecord/versionedRecordMissingVersion.trig", RDFFormat.TRIG);
        addData(repo, "/testCatalogData/versionedRecord/versionedRecordNoCatalog.trig", RDFFormat.TRIG);

        when(configProvider.getRepository()).thenReturn(repo);

        recordManager.thingManager = thingManager;
        versionManager.recordManager = recordManager;
        versionManager.thingManager = thingManager;
        manager = spy(new SimpleDistributionManager());
        manager.thingManager = thingManager;
        manager.versionManager = versionManager;
        manager.recordManager = recordManager;
        injectOrmFactoryReferencesIntoService(manager);
        injectOrmFactoryReferencesIntoService(versionManager);
        injectOrmFactoryReferencesIntoService(recordManager);
    }

    @After
    public void reset() throws Exception {
        closeable.close();
        repo.shutDown();
    }

    /* getUnversionedDistributions */

    @Test
    public void testGetUnversionedDistributions() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            UnversionedRecord record = unversionedRecordFactory.createNew(ManagerTestConstants.UNVERSIONED_RECORD_IRI);
            Distribution dist = distributionFactory.createNew(ManagerTestConstants.DISTRIBUTION_IRI);
            record.setUnversionedDistribution(Collections.singleton(dist));
            doReturn(record).when(recordManager).getRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.UNVERSIONED_RECORD_IRI), eq(unversionedRecordFactory), any(RepositoryConnection.class));

            Set<Distribution> distributions = manager.getUnversionedDistributions(ManagerTestConstants.CATALOG_IRI, record.getResource(), conn);
            verify(recordManager).getRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.UNVERSIONED_RECORD_IRI), eq(unversionedRecordFactory), any(RepositoryConnection.class));
            record.getUnversionedDistribution_resource().forEach(resource -> verify(thingManager).getExpectedObject(eq(resource), eq(distributionFactory), any(RepositoryConnection.class)));
            assertEquals(1, distributions.size());
        }
    }

    /* addUnversionedDistribution */

    @Test
    public void testAddUnversionedDistribution() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            UnversionedRecord record = unversionedRecordFactory.createNew(ManagerTestConstants.NEW_IRI);
            doReturn(record).when(recordManager).getRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.UNVERSIONED_RECORD_IRI), eq(unversionedRecordFactory), any(RepositoryConnection.class));
            Distribution dist = distributionFactory.createNew(ManagerTestConstants.NEW_IRI);

            manager.addUnversionedDistribution(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.UNVERSIONED_RECORD_IRI, dist, conn);
            verify(recordManager).getRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.UNVERSIONED_RECORD_IRI), eq(unversionedRecordFactory), any(RepositoryConnection.class));
            verify(thingManager).updateObject(eq(record), any(RepositoryConnection.class));
            verify(thingManager).addObject(eq(dist), any(RepositoryConnection.class));
            assertEquals(1, record.getUnversionedDistribution_resource().size());
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddUnversionedDistributionWithTakenResource() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Distribution dist = distributionFactory.createNew(ManagerTestConstants.DISTRIBUTION_IRI);

            manager.addUnversionedDistribution(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.UNVERSIONED_RECORD_IRI, dist, conn);
            verify(thingManager, times(0)).addObject(eq(dist), any(RepositoryConnection.class));
            verify(thingManager).throwAlreadyExists(ManagerTestConstants.DISTRIBUTION_IRI, distributionFactory);
        }
    }

    /* updateUnversionedDistribution */

    @Test
    public void testUpdateUnversionedDistribution() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Distribution dist = distributionFactory.createNew(ManagerTestConstants.DISTRIBUTION_IRI);
            dist.getModel().add(ManagerTestConstants.DISTRIBUTION_IRI, DCTERMS.TITLE, VALUE_FACTORY.createLiteral("New Title"));

            manager.updateUnversionedDistribution(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.UNVERSIONED_RECORD_IRI, dist, conn);
            verify(manager).validateUnversionedDistribution(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.UNVERSIONED_RECORD_IRI), eq(ManagerTestConstants.DISTRIBUTION_IRI), any(RepositoryConnection.class));
            verify(thingManager).updateObject(eq(dist), any(RepositoryConnection.class));
        }
    }

    /* removeUnversionedDistribution */

    @Test
    public void testRemoveUnversionedDistribution() throws Exception {
        // Setup:
        IRI distributionIRI = VALUE_FACTORY.createIRI(UnversionedRecord.unversionedDistribution_IRI);
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(ConnectionUtils.contains(conn, ManagerTestConstants.UNVERSIONED_RECORD_IRI, distributionIRI, ManagerTestConstants.DISTRIBUTION_IRI, ManagerTestConstants.UNVERSIONED_RECORD_IRI));

            manager.removeUnversionedDistribution(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.UNVERSIONED_RECORD_IRI, ManagerTestConstants.DISTRIBUTION_IRI, conn);
            verify(manager).getUnversionedDistribution(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.UNVERSIONED_RECORD_IRI), eq(ManagerTestConstants.DISTRIBUTION_IRI), any(RepositoryConnection.class));
            verify(thingManager).removeObjectWithRelationship(eq(ManagerTestConstants.DISTRIBUTION_IRI), eq(ManagerTestConstants.UNVERSIONED_RECORD_IRI),
                    eq(UnversionedRecord.unversionedDistribution_IRI), any(RepositoryConnection.class));
        }
    }

    /* getVersionedDistributions */

    @Test
    public void testGetVersionedDistributions() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Version version = versionFactory.createNew(ManagerTestConstants.VERSION_IRI);
            Distribution dist = distributionFactory.createNew(ManagerTestConstants.DISTRIBUTION_IRI);
            version.setVersionedDistribution(Collections.singleton(dist));
            doReturn(version).when(versionManager).getVersion(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RECORD_IRI), eq(ManagerTestConstants.VERSION_IRI), eq(versionFactory), any(RepositoryConnection.class));

            Set<Distribution> distributions = manager.getVersionedDistributions(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI, ManagerTestConstants.VERSION_IRI, conn);
            verify(versionManager).getVersion(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RECORD_IRI), eq(ManagerTestConstants.VERSION_IRI), eq(versionFactory), any(RepositoryConnection.class));
            version.getVersionedDistribution_resource().forEach(resource -> verify(thingManager).getExpectedObject(eq(resource), eq(distributionFactory), any(RepositoryConnection.class)));
            assertEquals(1, distributions.size());
        }
    }

    /* addVersionedDistribution */

    @Test
    public void testAddVersionedDistribution() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Version version = versionFactory.createNew(ManagerTestConstants.VERSION_IRI);
            Distribution dist = distributionFactory.createNew(ManagerTestConstants.NEW_IRI);
            doReturn(version).when(versionManager).getVersion(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RECORD_IRI), eq(ManagerTestConstants.VERSION_IRI), eq(versionFactory), any(RepositoryConnection.class));

            manager.addVersionedDistribution(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI, ManagerTestConstants.VERSION_IRI, dist, conn);
            verify(versionManager).getVersion(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RECORD_IRI), eq(ManagerTestConstants.VERSION_IRI), eq(versionFactory), any(RepositoryConnection.class));
            verify(thingManager).updateObject(eq(version), any(RepositoryConnection.class));
            verify(thingManager).addObject(eq(dist), any(RepositoryConnection.class));
            assertEquals(1, version.getVersionedDistribution_resource().size());
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddVersionedDistributionWithTakenResource() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Distribution dist = distributionFactory.createNew(ManagerTestConstants.DISTRIBUTION_IRI);

            manager.addVersionedDistribution(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI, ManagerTestConstants.VERSION_IRI, dist, conn);
            verify(thingManager, times(0)).addObject(eq(dist), any(RepositoryConnection.class));
            verify(thingManager).throwAlreadyExists(ManagerTestConstants.DISTRIBUTION_IRI, distributionFactory);
        }
    }

    /* updateVersionedDistribution */

    @Test
    public void testUpdateVersionedDistribution() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Distribution dist = distributionFactory.createNew(ManagerTestConstants.DISTRIBUTION_IRI);
            dist.getModel().add(ManagerTestConstants.DISTRIBUTION_IRI, DCTERMS.TITLE, VALUE_FACTORY.createLiteral("New Title"));

            manager.updateVersionedDistribution(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI, ManagerTestConstants.VERSION_IRI, dist, conn);
            verify(manager).validateVersionedDistribution(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RECORD_IRI), eq(ManagerTestConstants.VERSION_IRI), eq(ManagerTestConstants.DISTRIBUTION_IRI), any(RepositoryConnection.class));
            verify(thingManager).updateObject(eq(dist), any(RepositoryConnection.class));
        }
    }

    /* removeVersionedDistribution */

    @Test
    public void testRemoveVersionedDistribution() throws Exception {
        // Setup:
        IRI distributionIRI = VALUE_FACTORY.createIRI(Version.versionedDistribution_IRI);
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(ConnectionUtils.contains(conn, ManagerTestConstants.VERSION_IRI, distributionIRI, ManagerTestConstants.DISTRIBUTION_IRI, ManagerTestConstants.VERSION_IRI));

            manager.removeVersionedDistribution(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI, ManagerTestConstants.VERSION_IRI, ManagerTestConstants.DISTRIBUTION_IRI, conn);
            verify(manager).getVersionedDistribution(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RECORD_IRI), eq(ManagerTestConstants.VERSION_IRI), eq(ManagerTestConstants.DISTRIBUTION_IRI), any(RepositoryConnection.class));
            verify(thingManager).removeObjectWithRelationship(eq(ManagerTestConstants.DISTRIBUTION_IRI), eq(ManagerTestConstants.VERSION_IRI),
                    eq(Version.versionedDistribution_IRI), any(RepositoryConnection.class));
        }
    }

    /* validateVersionedDistribution */

    @Test
    public void testVersionedDistributionPathWithMissingCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Catalog " + ManagerTestConstants.MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.validateVersionedDistribution(ManagerTestConstants.MISSING_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI, ManagerTestConstants.VERSION_IRI, ManagerTestConstants.DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void testVersionedDistributionPathWithMissingRecord() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("VersionedRecord " + ManagerTestConstants.MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.validateVersionedDistribution(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.MISSING_IRI, ManagerTestConstants.VERSION_IRI, ManagerTestConstants.DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void testVersionedDistributionPathWithWrongCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", ManagerTestConstants.VERSIONED_RECORD_NO_CATALOG_IRI, ManagerTestConstants.CATALOG_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.validateVersionedDistribution(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RECORD_NO_CATALOG_IRI, ManagerTestConstants.VERSION_IRI, ManagerTestConstants.DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void testVersionedDistributionPathWithWrongRecord() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Version %s does not belong to VersionedRecord %s", ManagerTestConstants.LONE_VERSION_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.validateVersionedDistribution(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI, ManagerTestConstants.LONE_VERSION_IRI, ManagerTestConstants.DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void testVersionedDistributionPathWithMissingVersion() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Version " + ManagerTestConstants.RANDOM_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.validateVersionedDistribution(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RECORD_MISSING_VERSION_IRI, ManagerTestConstants.RANDOM_IRI, ManagerTestConstants.DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void testVersionedDistributionPathWithWrongVersion() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Distribution %s does not belong to Version %s", LONE_DISTRIBUTION_IRI, ManagerTestConstants.VERSION_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.validateVersionedDistribution(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI, ManagerTestConstants.VERSION_IRI, LONE_DISTRIBUTION_IRI, conn);
        }
    }

    /* getVersionedDistribution */

    @Test
    public void getVersionedDistributionTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            Distribution dist = manager.getVersionedDistribution(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI, ManagerTestConstants.VERSION_IRI, ManagerTestConstants.DISTRIBUTION_IRI, conn);
            assertFalse(dist.getModel().isEmpty());
            assertEquals(ManagerTestConstants.DISTRIBUTION_IRI, dist.getResource());
        }
    }

    @Test
    public void getVersionedDistributionWithMissingCatalogTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Catalog " + ManagerTestConstants.MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.getVersionedDistribution(ManagerTestConstants.MISSING_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI, ManagerTestConstants.VERSION_IRI, ManagerTestConstants.DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void getVersionedDistributionWithMissingRecordTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("VersionedRecord " + ManagerTestConstants.MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.getVersionedDistribution(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.MISSING_IRI, ManagerTestConstants.VERSION_IRI, ManagerTestConstants.DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void getVersionedDistributionWithWrongCatalogTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", ManagerTestConstants.VERSIONED_RECORD_NO_CATALOG_IRI, ManagerTestConstants.CATALOG_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.getVersionedDistribution(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RECORD_NO_CATALOG_IRI, ManagerTestConstants.VERSION_IRI, ManagerTestConstants.DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void getVersionedDistributionWithWrongRecordTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Version %s does not belong to VersionedRecord %s", ManagerTestConstants.LONE_VERSION_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.getVersionedDistribution(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI, ManagerTestConstants.LONE_VERSION_IRI, ManagerTestConstants.DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void getVersionedDistributionWithMissingVersionTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Version " + ManagerTestConstants.RANDOM_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.getVersionedDistribution(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RECORD_MISSING_VERSION_IRI, ManagerTestConstants.RANDOM_IRI, ManagerTestConstants.DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void getVersionedDistributionWithWrongVersionTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Distribution %s does not belong to Version %s", LONE_DISTRIBUTION_IRI, ManagerTestConstants.VERSION_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.getVersionedDistribution(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI, ManagerTestConstants.VERSION_IRI, LONE_DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void getMissingVersionedDistributionTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Distribution " + ManagerTestConstants.RANDOM_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.getVersionedDistribution(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RECORD_MISSING_VERSION_IRI, VERSION_MISSING_DISTRIBUTION_IRI, ManagerTestConstants.RANDOM_IRI, conn);
        }
    }

    /* validateUnversionedDistribution */

    @Test
    public void testUnversionedDistributionPathWithMissingCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Catalog " + ManagerTestConstants.MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.validateUnversionedDistribution(ManagerTestConstants.MISSING_IRI, ManagerTestConstants.UNVERSIONED_RECORD_IRI, ManagerTestConstants.DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void testUnversionedDistributionPathWithMissingRecord() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("UnversionedRecord " + ManagerTestConstants.MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.validateUnversionedDistribution(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.MISSING_IRI, ManagerTestConstants.DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void testUnversionedDistributionPathWithWrongCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", UNVERSIONED_RECORD_NO_CATALOG_IRI, ManagerTestConstants.CATALOG_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.validateUnversionedDistribution(ManagerTestConstants.CATALOG_IRI, UNVERSIONED_RECORD_NO_CATALOG_IRI, ManagerTestConstants.DISTRIBUTION_IRI, conn);
        }
    }

    /* getUnversionedDistribution */

    @Test
    public void getUnversionedDistributionTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            Distribution dist = manager.getUnversionedDistribution(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.UNVERSIONED_RECORD_IRI, ManagerTestConstants.DISTRIBUTION_IRI, conn);
            assertFalse(dist.getModel().isEmpty());
            assertEquals(ManagerTestConstants.DISTRIBUTION_IRI, dist.getResource());
        }
    }

    @Test
    public void getUnversionedDistributionWithMissingCatalogTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Catalog " + ManagerTestConstants.MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.getUnversionedDistribution(ManagerTestConstants.MISSING_IRI, ManagerTestConstants.UNVERSIONED_RECORD_IRI, ManagerTestConstants.DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void getUnversionedDistributionWithMissingRecordTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("UnversionedRecord " + ManagerTestConstants.MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.getUnversionedDistribution(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.MISSING_IRI, ManagerTestConstants.DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void getUnversionedDistributionWithWrongCatalogTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", UNVERSIONED_RECORD_NO_CATALOG_IRI, ManagerTestConstants.CATALOG_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.getUnversionedDistribution(ManagerTestConstants.CATALOG_IRI, UNVERSIONED_RECORD_NO_CATALOG_IRI, ManagerTestConstants.DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void getUnversionedDistributionWithWrongRecordTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Distribution %s does not belong to UnversionedRecord %s", LONE_DISTRIBUTION_IRI, ManagerTestConstants.UNVERSIONED_RECORD_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.validateUnversionedDistribution(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.UNVERSIONED_RECORD_IRI, LONE_DISTRIBUTION_IRI, conn);
        }
    }

    @Test
    public void getMissingUnversionedDistributionTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Distribution " + ManagerTestConstants.RANDOM_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.getUnversionedDistribution(ManagerTestConstants.CATALOG_IRI, UNVERSIONED_RECORD_MISSING_DISTRIBUTION_IRI, ManagerTestConstants.RANDOM_IRI, conn);
        }
    }
}
