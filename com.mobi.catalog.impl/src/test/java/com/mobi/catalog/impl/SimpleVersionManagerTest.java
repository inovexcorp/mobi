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
import static junit.framework.TestCase.assertEquals;
import static junit.framework.TestCase.assertFalse;
import static junit.framework.TestCase.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import com.mobi.catalog.api.ontologies.mcat.Distribution;
import com.mobi.catalog.api.ontologies.mcat.Tag;
import com.mobi.catalog.api.ontologies.mcat.Version;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.ontologies.mcat.VersionedRecord;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.persistence.utils.ConnectionUtils;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.mockito.MockitoAnnotations;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.Optional;
import java.util.Set;

public class SimpleVersionManagerTest extends OrmEnabledTestCase {
    private AutoCloseable closeable;
    private SimpleVersionManager manager;
    private MemoryRepositoryWrapper repo;
    private final OrmFactory<VersionedRDFRecord> versionedRDFRecordFactory = getRequiredOrmFactory(VersionedRDFRecord.class);
    private final OrmFactory<VersionedRecord> versionedRecordFactory = getRequiredOrmFactory(VersionedRecord.class);
    private final OrmFactory<Version> versionFactory = getRequiredOrmFactory(Version.class);
    private final OrmFactory<Distribution> distributionFactory = getRequiredOrmFactory(Distribution.class);
    private final OrmFactory<Tag> tagFactory = getRequiredOrmFactory(Tag.class);
    private final SimpleThingManager thingManager = spy(new SimpleThingManager());
    private final SimpleRecordManager recordManager = spy(new SimpleRecordManager());
    private static final IRI LATEST_VERSION_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/versions#latest-version");
    private static final IRI VERSION_CATALOG_IRI = VALUE_FACTORY.createIRI(VersionedRecord.version_IRI);
    private static final IRI LATEST_VERSION_CATALOG_IRI = VALUE_FACTORY.createIRI(VersionedRecord.latestVersion_IRI);

    @Rule
    public ExpectedException thrown = ExpectedException.none();

    @Before
    public void setUp() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));
        
        recordManager.thingManager = thingManager;
        manager = spy(new SimpleVersionManager());
        manager.thingManager = thingManager;
        manager.recordManager = recordManager;
        injectOrmFactoryReferencesIntoService(manager);
        injectOrmFactoryReferencesIntoService(recordManager);
    }

    @After
    public void reset() throws Exception {
        closeable.close();
        repo.shutDown();
    }

    /* getVersions */

    @Test
    public void testGetVersions() throws Exception {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        // Setup:
        VersionedRecord record = versionedRecordFactory.createNew(ManagerTestConstants.VERSIONED_RECORD_IRI);
        Version version = versionFactory.createNew(ManagerTestConstants.VERSION_IRI);
        record.setVersion(Collections.singleton(version));
        doReturn(record).when(recordManager).getRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RECORD_IRI), eq(versionedRecordFactory), any(RepositoryConnection.class));

        try (RepositoryConnection conn = repo.getConnection()) {
            Set<Version> versions = manager.getVersions(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI, conn);
            verify(recordManager).getRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RECORD_IRI), eq(versionedRecordFactory), any(RepositoryConnection.class));
            record.getVersion_resource().forEach(resource -> verify(thingManager).getExpectedObject(eq(resource), eq(versionFactory), any(RepositoryConnection.class)));
            assertEquals(1, versions.size());
        }
    }

    /* addVersion */

    @Test
    public void testAddVersion() throws Exception {
        // Setup:
        VersionedRecord record = versionedRecordFactory.createNew(ManagerTestConstants.VERSIONED_RECORD_IRI);
        doReturn(record).when(recordManager).getRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RECORD_IRI), eq(versionedRecordFactory), any(RepositoryConnection.class));
        Version version = versionFactory.createNew(ManagerTestConstants.NEW_IRI);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.addVersion(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI, version, conn);
            verify(recordManager).getRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RECORD_IRI), eq(versionedRecordFactory), any(RepositoryConnection.class));
            verify(thingManager).updateObject(eq(record), any(RepositoryConnection.class));
            verify(thingManager).addObject(eq(version), any(RepositoryConnection.class));
            assertTrue(record.getLatestVersion_resource().isPresent());
            assertEquals(ManagerTestConstants.NEW_IRI, record.getLatestVersion_resource().get());
            assertEquals(1, record.getVersion_resource().size());
        }
    }

    @Test
    public void testAddTag() throws Exception {
        // Setup:
        VersionedRDFRecord record = versionedRDFRecordFactory.createNew(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI);
        doReturn(record).when(recordManager).getRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(versionedRecordFactory), any(RepositoryConnection.class));
        Tag tag = tagFactory.createNew(ManagerTestConstants.NEW_IRI);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.addVersion(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, tag, conn);
            verify(recordManager).getRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(versionedRecordFactory), any(RepositoryConnection.class));
            verify(thingManager).updateObject(eq(record), any(RepositoryConnection.class));
            verify(thingManager).addObject(eq(tag), any(RepositoryConnection.class));
            assertTrue(record.getLatestVersion_resource().isPresent());
            assertEquals(ManagerTestConstants.NEW_IRI, record.getLatestVersion_resource().get());
            assertEquals(1, record.getVersion_resource().size());
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddVersionWithTakenResource() {
        // Setup:
        Version version = versionFactory.createNew(ManagerTestConstants.VERSION_IRI);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.addVersion(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI, version, conn);
            verify(thingManager, times(0)).addObject(eq(version), any(RepositoryConnection.class));
            verify(thingManager).throwAlreadyExists(ManagerTestConstants.VERSION_IRI, distributionFactory);
        }
    }

    /* updateVersion */

    @Test
    public void testUpdateVersion() throws Exception {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        // Setup:
        Version version = versionFactory.createNew(ManagerTestConstants.VERSION_IRI);
        version.getModel().add(ManagerTestConstants.VERSION_IRI, DCTERMS.TITLE, VALUE_FACTORY.createLiteral("New Title"));
        version.setProperty(VALUE_FACTORY.createLiteral(OffsetDateTime.now().minusDays(1)), VALUE_FACTORY.createIRI(_Thing.modified_IRI));
        String previousModifiedValue = ManagerTestConstants.getModifiedIriValue(version);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.updateVersion(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI, version, conn);
            verify(manager).validateVersion(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RECORD_IRI), eq(ManagerTestConstants.VERSION_IRI), any(RepositoryConnection.class));
            verify(thingManager).updateObject(eq(version), any(RepositoryConnection.class));
            assertEquals(ManagerTestConstants.getModifiedIriValue(version), previousModifiedValue);
        }
    }

    @Test
    public void testUpdateTag() throws Exception {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        // Setup:
        Tag tag = tagFactory.createNew(ManagerTestConstants.TAG_IRI);
        tag.getModel().add(ManagerTestConstants.TAG_IRI, DCTERMS.TITLE, VALUE_FACTORY.createLiteral("New Title"));
        tag.setProperty(VALUE_FACTORY.createLiteral(OffsetDateTime.now().minusDays(1)), VALUE_FACTORY.createIRI(_Thing.modified_IRI));
        String previousModifiedValue = ManagerTestConstants.getModifiedIriValue(tag);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.updateVersion(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, tag, conn);
            verify(manager).validateVersion(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(ManagerTestConstants.TAG_IRI), any(RepositoryConnection.class));
            verify(thingManager).updateObject(eq(tag), any(RepositoryConnection.class));
            assertEquals(ManagerTestConstants.getModifiedIriValue(tag), previousModifiedValue);
        }
    }

    /* removeVersion */

    @Test
    public void testRemoveVersion() throws Exception {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        // Setup:
        IRI versionIRI = VALUE_FACTORY.createIRI(VersionedRecord.version_IRI);
        IRI latestIRI = VALUE_FACTORY.createIRI(VersionedRecord.latestVersion_IRI);
        Version version = versionFactory.createNew(LATEST_VERSION_IRI);
        version.setVersionedDistribution(Collections.singleton(distributionFactory.createNew(ManagerTestConstants.DISTRIBUTION_IRI)));
        doReturn(version).when(manager).getVersion(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RECORD_IRI), eq(LATEST_VERSION_IRI), eq(versionFactory), any(RepositoryConnection.class));
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(ConnectionUtils.contains(conn, ManagerTestConstants.VERSIONED_RECORD_IRI, latestIRI, LATEST_VERSION_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI));
            assertTrue(ConnectionUtils.contains(conn, ManagerTestConstants.VERSIONED_RECORD_IRI, versionIRI, LATEST_VERSION_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI));

            manager.removeVersion(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI, LATEST_VERSION_IRI, conn);
            verify(manager).getVersion(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RECORD_IRI), eq(LATEST_VERSION_IRI), eq(versionFactory), any(RepositoryConnection.class));
            verify(manager).removeVersion(eq(ManagerTestConstants.VERSIONED_RECORD_IRI), eq(version), any(RepositoryConnection.class));
        }
    }

    /* getLatestVersion */

    @Test
    public void getLatestVersion() throws Exception {
        // Setup:
        VersionedRecord record = versionedRecordFactory.createNew(ManagerTestConstants.VERSIONED_RECORD_IRI);
        Version version = versionFactory.createNew(LATEST_VERSION_IRI);
        record.setLatestVersion(version);
        doReturn(record).when(recordManager).getRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RECORD_IRI), eq(versionedRecordFactory), any(RepositoryConnection.class));
        doReturn(version).when(thingManager).getExpectedObject(eq(LATEST_VERSION_IRI), eq(versionFactory), any(RepositoryConnection.class));

        try (RepositoryConnection conn = repo.getConnection()) {
            Optional<Version> result = manager.getLatestVersion(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI, versionFactory, conn);
            verify(recordManager).getRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RECORD_IRI), eq(versionedRecordFactory), any(RepositoryConnection.class));
            verify(thingManager).getExpectedObject(eq(LATEST_VERSION_IRI), eq(versionFactory), any(RepositoryConnection.class));
            assertTrue(result.isPresent());
            assertEquals(version, result.get());
        }
    }

    @Test
    public void getLatestTag() throws Exception {
        // Setup:
        VersionedRDFRecord record = versionedRDFRecordFactory.createNew(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI);
        Tag tag = tagFactory.createNew(ManagerTestConstants.TAG_IRI);
        record.setLatestVersion(tag);
        doReturn(record).when(recordManager).getRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(versionedRecordFactory), any(RepositoryConnection.class));
        doReturn(tag).when(thingManager).getExpectedObject(eq(ManagerTestConstants.TAG_IRI), eq(tagFactory), any(RepositoryConnection.class));

        try (RepositoryConnection conn = repo.getConnection()) {
            Optional<Tag> result = manager.getLatestVersion(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, tagFactory, conn);
            verify(recordManager).getRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(versionedRecordFactory), any(RepositoryConnection.class));
            verify(thingManager).getExpectedObject(eq(ManagerTestConstants.TAG_IRI), eq(tagFactory), any(RepositoryConnection.class));
            assertTrue(result.isPresent());
            assertEquals(tag, result.get());
        }
    }

    /* validateVersion */

    @Test
    public void testVersionPathWithMissingCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Catalog " + ManagerTestConstants.MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.validateVersion(ManagerTestConstants.MISSING_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI, ManagerTestConstants.VERSION_IRI, conn);
        }
    }

    @Test
    public void testVersionPathWithMissingRecord() {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("VersionedRecord " + ManagerTestConstants.MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.validateVersion(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.MISSING_IRI, ManagerTestConstants.VERSION_IRI, conn);
        }
    }

    @Test
    public void testVersionPathWithWrongCatalog() {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", ManagerTestConstants.VERSIONED_RECORD_NO_CATALOG_IRI, ManagerTestConstants.CATALOG_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.validateVersion(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RECORD_NO_CATALOG_IRI, ManagerTestConstants.VERSION_IRI, conn);
        }
    }

    @Test
    public void testVersionPathWithWrongRecord() {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Version %s does not belong to VersionedRecord %s", ManagerTestConstants.LONE_VERSION_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.validateVersion(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI, ManagerTestConstants.LONE_VERSION_IRI, conn);
        }
    }

    /* getVersion */

    @Test
    public void getVersionTest() {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        try (RepositoryConnection conn = repo.getConnection()) {
            Version version = manager.getVersion(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI, ManagerTestConstants.VERSION_IRI, versionFactory, conn);
            assertFalse(version.getModel().isEmpty());
            assertEquals(ManagerTestConstants.VERSION_IRI, version.getResource());
        }
    }

    @Test
    public void getVersionWithMissingCatalogTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Catalog " + ManagerTestConstants.MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.getVersion(ManagerTestConstants.MISSING_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI, ManagerTestConstants.VERSION_IRI, versionFactory, conn);
        }
    }

    @Test
    public void getVersionWithMissingRecordTest() {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("VersionedRecord " + ManagerTestConstants.MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.getVersion(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.MISSING_IRI, ManagerTestConstants.VERSION_IRI, versionFactory, conn);
        }
    }

    @Test
    public void getVersionWithWrongCatalogTest() {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", ManagerTestConstants.VERSIONED_RECORD_NO_CATALOG_IRI, ManagerTestConstants.CATALOG_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.getVersion(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RECORD_NO_CATALOG_IRI, ManagerTestConstants.VERSION_IRI, versionFactory, conn);
        }
    }

    @Test
    public void getVersionWithWrongRecordTest() {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Version %s does not belong to VersionedRecord %s", ManagerTestConstants.LONE_VERSION_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.getVersion(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI, ManagerTestConstants.LONE_VERSION_IRI, versionFactory, conn);
        }
    }

    @Test
    public void getMissingVersionTest() {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Version " + ManagerTestConstants.RANDOM_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.getVersion(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RECORD_MISSING_VERSION_IRI, ManagerTestConstants.RANDOM_IRI, versionFactory, conn);
        }
    }

    /* removeVersion */

    @Test
    public void removeVersionWithObjectTest() throws Exception {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        // Setup:
        Version version = versionFactory.createNew(LATEST_VERSION_IRI);
        version.setVersionedDistribution(Collections.singleton(distributionFactory.createNew(ManagerTestConstants.DISTRIBUTION_IRI)));
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(ConnectionUtils.contains(conn, ManagerTestConstants.VERSIONED_RECORD_IRI, LATEST_VERSION_CATALOG_IRI, LATEST_VERSION_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI));
            assertTrue(ConnectionUtils.contains(conn, ManagerTestConstants.VERSIONED_RECORD_IRI, VERSION_CATALOG_IRI, LATEST_VERSION_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI));
            assertTrue(ConnectionUtils.contains(conn, ManagerTestConstants.VERSIONED_RECORD_IRI, VERSION_CATALOG_IRI, ManagerTestConstants.VERSION_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI));

            manager.removeVersion(ManagerTestConstants.VERSIONED_RECORD_IRI, version, conn);

            assertTrue(ConnectionUtils.contains(conn, ManagerTestConstants.VERSIONED_RECORD_IRI, LATEST_VERSION_CATALOG_IRI, ManagerTestConstants.VERSION_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI));
            assertTrue(ConnectionUtils.contains(conn, ManagerTestConstants.VERSIONED_RECORD_IRI, VERSION_CATALOG_IRI, ManagerTestConstants.VERSION_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI));
            assertFalse(ConnectionUtils.contains(conn, ManagerTestConstants.VERSIONED_RECORD_IRI, LATEST_VERSION_CATALOG_IRI, LATEST_VERSION_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI));
            assertFalse(ConnectionUtils.contains(conn, ManagerTestConstants.VERSIONED_RECORD_IRI, VERSION_CATALOG_IRI, LATEST_VERSION_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI));
        }
    }

    @Test
    public void removeVersionWithResourceTest() throws Exception {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        // Setup:
        Version version = versionFactory.createNew(LATEST_VERSION_IRI);
        version.setVersionedDistribution(Collections.singleton(distributionFactory.createNew(ManagerTestConstants.DISTRIBUTION_IRI)));
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(ConnectionUtils.contains(conn, ManagerTestConstants.VERSIONED_RECORD_IRI, LATEST_VERSION_CATALOG_IRI, LATEST_VERSION_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI));
            assertTrue(ConnectionUtils.contains(conn, ManagerTestConstants.VERSIONED_RECORD_IRI, VERSION_CATALOG_IRI, LATEST_VERSION_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI));
            assertTrue(ConnectionUtils.contains(conn, ManagerTestConstants.VERSIONED_RECORD_IRI, VERSION_CATALOG_IRI, ManagerTestConstants.VERSION_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI));

            manager.removeVersion(ManagerTestConstants.VERSIONED_RECORD_IRI, version.getResource(), conn);

            assertTrue(ConnectionUtils.contains(conn, ManagerTestConstants.VERSIONED_RECORD_IRI, LATEST_VERSION_CATALOG_IRI, ManagerTestConstants.VERSION_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI));
            assertTrue(ConnectionUtils.contains(conn, ManagerTestConstants.VERSIONED_RECORD_IRI, VERSION_CATALOG_IRI, ManagerTestConstants.VERSION_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI));
            assertFalse(ConnectionUtils.contains(conn, ManagerTestConstants.VERSIONED_RECORD_IRI, LATEST_VERSION_CATALOG_IRI, LATEST_VERSION_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI));
            assertFalse(ConnectionUtils.contains(conn, ManagerTestConstants.VERSIONED_RECORD_IRI, VERSION_CATALOG_IRI, LATEST_VERSION_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI));
        }
    }
}
