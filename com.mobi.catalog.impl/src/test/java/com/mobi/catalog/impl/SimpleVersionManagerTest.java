package com.mobi.catalog.impl;

/*-
 * #%L
 * com.mobi.catalog.impl
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

import static junit.framework.TestCase.assertEquals;
import static junit.framework.TestCase.assertFalse;
import static junit.framework.TestCase.assertTrue;
import static org.junit.Assert.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.CatalogTopics;
import com.mobi.catalog.api.ontologies.mcat.Distribution;
import com.mobi.catalog.api.ontologies.mcat.Tag;
import com.mobi.catalog.api.ontologies.mcat.Version;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.ontologies.mcat.VersionedRecord;
import com.mobi.persistence.utils.ConnectionUtils;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.sse.SSEUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.impl.LinkedHashModel;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.MockitoAnnotations;
import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceReference;
import org.osgi.service.event.EventAdmin;

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

    @Mock
    private EventAdmin eventAdmin;

    @Mock
    private BundleContext context;

    @Mock
    private ServiceReference<EventAdmin> serviceReference;

    @Before
    public void setUp() {
        closeable = MockitoAnnotations.openMocks(this);
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));
        
        recordManager.thingManager = thingManager;
        manager = spy(new SimpleVersionManager());
        manager.thingManager = thingManager;
        manager.recordManager = recordManager;

        when(context.getServiceReference(EventAdmin.class)).thenReturn(serviceReference);
        when(context.getService(serviceReference)).thenReturn(eventAdmin);

        injectOrmFactoryReferencesIntoService(manager);
        injectOrmFactoryReferencesIntoService(recordManager);
        manager.start(context);
    }

    @After
    public void reset() throws Exception {
        closeable.close();
        repo.shutDown();
    }

    /* getVersions */

    @Test
    public void testGetVersions() {
        addData(repo, "/testCatalogData/versionedRecord/versionedRecord.trig", RDFFormat.TRIG);
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
    public void testAddVersion() {
        // Setup:
        VersionedRecord record = versionedRecordFactory.createNew(ManagerTestConstants.VERSIONED_RECORD_IRI);
        doReturn(record).when(recordManager).getRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RECORD_IRI), eq(versionedRecordFactory), any(RepositoryConnection.class));
        Version version = versionFactory.createNew(ManagerTestConstants.NEW_IRI);

        Model testModel = new LinkedHashModel();
        testModel.add(ManagerTestConstants.NEW_IRI, getValueFactory().createIRI(VersionedRecord.TYPE), ManagerTestConstants.VERSIONED_RECORD_IRI);
        testModel.add(ManagerTestConstants.NEW_IRI, RDF.TYPE, getValueFactory().createIRI(Version.TYPE));

        try (RepositoryConnection conn = repo.getConnection(); MockedStatic<SSEUtils> mockedSSE = mockStatic(SSEUtils.class)) {
            manager.addVersion(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI, version, conn);
            verify(recordManager).getRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RECORD_IRI), eq(versionedRecordFactory), any(RepositoryConnection.class));
            verify(thingManager).updateObject(eq(record), any(RepositoryConnection.class));
            verify(thingManager).addObject(eq(version), any(RepositoryConnection.class));
            mockedSSE.verify(() -> SSEUtils.postEvent(any(EventAdmin.class), eq(CatalogTopics.VersionTopic.TOPIC_NAME), eq(testModel)));

            assertTrue(record.getLatestVersion_resource().isPresent());
            assertEquals(ManagerTestConstants.NEW_IRI, record.getLatestVersion_resource().get());
            assertEquals(1, record.getVersion_resource().size());
        }
    }

    @Test
    public void testAddTag() {
        // Setup:
        VersionedRDFRecord record = versionedRDFRecordFactory.createNew(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI);
        doReturn(record).when(recordManager).getRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(versionedRecordFactory), any(RepositoryConnection.class));
        Tag tag = tagFactory.createNew(ManagerTestConstants.NEW_IRI);

        Model testModel = new LinkedHashModel();
        testModel.add(ManagerTestConstants.NEW_IRI, getValueFactory().createIRI(VersionedRecord.TYPE), ManagerTestConstants.VERSIONED_RDF_RECORD_IRI);
        testModel.add(ManagerTestConstants.NEW_IRI, RDF.TYPE, getValueFactory().createIRI(Version.TYPE));

        try (RepositoryConnection conn = repo.getConnection(); MockedStatic<SSEUtils> mockedSSE = mockStatic(SSEUtils.class)) {
            manager.addVersion(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, tag, conn);
            verify(recordManager).getRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(versionedRecordFactory), any(RepositoryConnection.class));
            verify(thingManager).updateObject(eq(record), any(RepositoryConnection.class));
            verify(thingManager).addObject(eq(tag), any(RepositoryConnection.class));
            mockedSSE.verify(() -> SSEUtils.postEvent(any(EventAdmin.class), eq(CatalogTopics.VersionTopic.TOPIC_NAME), eq(testModel)));

            assertTrue(record.getLatestVersion_resource().isPresent());
            assertEquals(ManagerTestConstants.NEW_IRI, record.getLatestVersion_resource().get());
            assertEquals(1, record.getVersion_resource().size());
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddVersionWithTakenResource() {
        addData(repo, "/testCatalogData/versionedRecord/versionedRecord.trig", RDFFormat.TRIG);

        // Setup:
        Version version = versionFactory.createNew(ManagerTestConstants.VERSION_IRI);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.addVersion(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI, version, conn);
            verify(thingManager, times(0)).addObject(eq(version), any(RepositoryConnection.class));
        }
    }

    /* updateVersion */

    @Test
    public void testUpdateVersion() {
        addData(repo, "/testCatalogData/versionedRecord/versionedRecord.trig", RDFFormat.TRIG);

        // Setup:
        Version version = versionFactory.createNew(ManagerTestConstants.VERSION_IRI);
        version.getModel().add(ManagerTestConstants.VERSION_IRI, DCTERMS.TITLE, VALUE_FACTORY.createLiteral("New Title"));
        version.setProperty(VALUE_FACTORY.createLiteral(OffsetDateTime.now().minusDays(1)), DCTERMS.MODIFIED);
        String previousModifiedValue = ManagerTestConstants.getModifiedIriValue(version);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.updateVersion(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI, version, conn);
            verify(manager).validateVersion(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RECORD_IRI), eq(ManagerTestConstants.VERSION_IRI), any(RepositoryConnection.class));
            verify(thingManager).updateObject(eq(version), any(RepositoryConnection.class));
            assertEquals(ManagerTestConstants.getModifiedIriValue(version), previousModifiedValue);
        }
    }

    @Test
    public void testUpdateTag() {
        addData(repo, "/testCatalogData/versionedRdfRecord/versionedRdfRecord.trig", RDFFormat.TRIG);

        // Setup:
        Tag tag = tagFactory.createNew(ManagerTestConstants.TAG_IRI);
        tag.getModel().add(ManagerTestConstants.TAG_IRI, DCTERMS.TITLE, VALUE_FACTORY.createLiteral("New Title"));
        tag.setProperty(VALUE_FACTORY.createLiteral(OffsetDateTime.now().minusDays(1)), DCTERMS.MODIFIED);
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
    public void testRemoveVersion() {
        addData(repo, "/testCatalogData/versionedRecord/versionedRecord.trig", RDFFormat.TRIG);

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
    public void getLatestVersion() {
        addData(repo, "/testCatalogData/versionedRecord/versionedRecord.trig", RDFFormat.TRIG);

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
    public void getLatestTag() {
        addData(repo, "/testCatalogData/versionedRdfRecord/versionedRdfRecord.trig", RDFFormat.TRIG);

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
        addData(repo, "/testCatalogData/versionedRecord/versionedRecordNoCatalog.trig", RDFFormat.TRIG);

        try (RepositoryConnection conn = repo.getConnection()) {
            Exception exception = assertThrows(IllegalArgumentException.class,
                    () -> manager.validateVersion(ManagerTestConstants.MISSING_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI, ManagerTestConstants.VERSION_IRI, conn));
            assertTrue(exception.getMessage().contains("Catalog " + ManagerTestConstants.MISSING_IRI + " could not be found"));
        }
    }

    @Test
    public void testVersionPathWithMissingRecord() {
        addData(repo, "/testCatalogData/versionedRecord/versionedRecord.trig", RDFFormat.TRIG);

        try (RepositoryConnection conn = repo.getConnection()) {
            Exception exception = assertThrows(IllegalArgumentException.class,
                    () -> manager.validateVersion(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.MISSING_IRI, ManagerTestConstants.VERSION_IRI, conn));
            assertEquals("VersionedRecord " + ManagerTestConstants.MISSING_IRI + " could not be found", exception.getMessage());
        }
    }

    @Test
    public void testVersionPathWithWrongCatalog() {
        addData(repo, "/testCatalogData/versionedRecord/versionedRecord.trig", RDFFormat.TRIG);
        addData(repo, "/testCatalogData/versionedRecord/versionedRecordNoCatalog.trig", RDFFormat.TRIG);

        try (RepositoryConnection conn = repo.getConnection()) {
            Exception exception = assertThrows(IllegalArgumentException.class,
                    () -> manager.validateVersion(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RECORD_NO_CATALOG_IRI, ManagerTestConstants.VERSION_IRI, conn));
            assertEquals(String.format("Record %s does not belong to Catalog %s", ManagerTestConstants.VERSIONED_RECORD_NO_CATALOG_IRI, ManagerTestConstants.CATALOG_IRI), exception.getMessage());
        }
    }

    @Test
    public void testVersionPathWithWrongRecord() {
        addData(repo, "/testCatalogData/versionedRecord/versionedRecord.trig", RDFFormat.TRIG);

        try (RepositoryConnection conn = repo.getConnection()) {
            Exception exception = assertThrows(IllegalArgumentException.class,
                    () -> manager.validateVersion(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI, ManagerTestConstants.LONE_VERSION_IRI, conn));
            assertEquals(exception.getMessage(), String.format("Version %s does not belong to VersionedRecord %s", ManagerTestConstants.LONE_VERSION_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI));
        }
    }

    /* getVersion */

    @Test
    public void getVersionTest() {
        addData(repo, "/testCatalogData/versionedRecord/versionedRecord.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            Version version = manager.getVersion(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI, ManagerTestConstants.VERSION_IRI, versionFactory, conn);
            assertFalse(version.getModel().isEmpty());
            assertEquals(ManagerTestConstants.VERSION_IRI, version.getResource());
        }
    }

    @Test
    public void getVersionWithMissingCatalogTest() {
        addData(repo, "/testCatalogData/versionedRecord/versionedRecordNoCatalog.trig", RDFFormat.TRIG);

        try (RepositoryConnection conn = repo.getConnection()) {
            Exception exception = assertThrows(IllegalArgumentException.class,
                    () -> manager.getVersion(ManagerTestConstants.MISSING_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI, ManagerTestConstants.VERSION_IRI, versionFactory, conn));
            assertEquals("Catalog " + ManagerTestConstants.MISSING_IRI + " could not be found", exception.getMessage());
        }
    }

    @Test
    public void getVersionWithMissingRecordTest() {
        addData(repo, "/testCatalogData/versionedRecord/versionedRecord.trig", RDFFormat.TRIG);

        try (RepositoryConnection conn = repo.getConnection()) {
            Exception exception = assertThrows(IllegalArgumentException.class,
                    () -> manager.getVersion(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.MISSING_IRI, ManagerTestConstants.VERSION_IRI, versionFactory, conn));
            assertEquals("VersionedRecord " + ManagerTestConstants.MISSING_IRI + " could not be found", exception.getMessage());
        }
    }

    @Test
    public void getVersionWithWrongCatalogTest() {
        addData(repo, "/testCatalogData/versionedRecord/versionedRecordNoCatalog.trig", RDFFormat.TRIG);
        addData(repo, "/testCatalogData/versionedRecord/versionedRecord.trig", RDFFormat.TRIG);

        try (RepositoryConnection conn = repo.getConnection()) {
            Exception exception = assertThrows(IllegalArgumentException.class,
                    () -> manager.getVersion(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RECORD_NO_CATALOG_IRI, ManagerTestConstants.VERSION_IRI, versionFactory, conn));
            assertEquals(String.format("Record %s does not belong to Catalog %s", ManagerTestConstants.VERSIONED_RECORD_NO_CATALOG_IRI, ManagerTestConstants.CATALOG_IRI), exception.getMessage());
        }
    }

    @Test
    public void getVersionWithWrongRecordTest() {
        addData(repo, "/testCatalogData/versionedRecord/versionedRecord.trig", RDFFormat.TRIG);

        try (RepositoryConnection conn = repo.getConnection()) {
            Exception exception = assertThrows(IllegalArgumentException.class,
                    () -> manager.getVersion(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI, ManagerTestConstants.LONE_VERSION_IRI, versionFactory, conn));
            assertEquals(String.format("Version %s does not belong to VersionedRecord %s", ManagerTestConstants.LONE_VERSION_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI), exception.getMessage());
        }
    }

    @Test
    public void getMissingVersionTest() {
        addData(repo, "/testCatalogData/versionedRecord/versionedRecordMissingVersion.trig", RDFFormat.TRIG);

        try (RepositoryConnection conn = repo.getConnection()) {
            Exception exception = assertThrows(IllegalArgumentException.class,
                    () -> manager.getVersion(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RECORD_MISSING_VERSION_IRI, ManagerTestConstants.RANDOM_IRI, versionFactory, conn));
            assertEquals("Version " + ManagerTestConstants.RANDOM_IRI + " could not be found", exception.getMessage());
        }
    }

    /* removeVersion */

    @Test
    public void removeVersionWithObjectTest() {
        addData(repo, "/testCatalogData/versionedRecord/versionedRecord.trig", RDFFormat.TRIG);

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
    public void removeVersionWithResourceTest() {
        addData(repo, "/testCatalogData/versionedRecord/versionedRecord.trig", RDFFormat.TRIG);

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
