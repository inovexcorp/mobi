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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import com.mobi.catalog.api.ThingManager;
import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.persistence.utils.ConnectionUtils;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;

import java.io.InputStream;

public class SimpleThingManagerTest extends OrmEnabledTestCase {
    private ThingManager service;
    private MemoryRepositoryWrapper repo;
    private static final OrmFactory<Catalog> catalogFactory = getRequiredOrmFactory(Catalog.class);
    private static final OrmFactory<Record> recordFactory = getRequiredOrmFactory(Record.class);
    private static final IRI DIFFERENT_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test#different");

    @Rule
    public ExpectedException thrown = ExpectedException.none();

    @Before
    public void setup() throws Exception {
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));

        try (RepositoryConnection conn = repo.getConnection()) {
            InputStream testData = getClass().getResourceAsStream("/testCatalogData.trig");
            conn.add(Rio.parse(testData, "", RDFFormat.TRIG));
        }

        service = new SimpleThingManager();
        injectOrmFactoryReferencesIntoService(service);
    }

    /* validateResource */

    @Test
    public void testObjectIdOfMissing() {
        testBadRecordId(ManagerTestConstants.MISSING_IRI);
    }

    @Test
    public void testObjectIdOfEmpty() {
        testBadRecordId(ManagerTestConstants.EMPTY_IRI);
    }

    @Test
    public void testObjectIdOfRandom() {
        testBadRecordId(ManagerTestConstants.RANDOM_IRI);
    }

    @Test
    public void testObjectIdOfDifferent() {
        testBadRecordId(DIFFERENT_IRI);
    }

    /* addObject */

    @Test
    public void addObjectTest() throws Exception {
        // Setup
        Record record = recordFactory.createNew(ManagerTestConstants.EMPTY_IRI);

        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(ConnectionUtils.contains(conn, null, null, null, ManagerTestConstants.EMPTY_IRI));

            service.addObject(record, conn);
            assertEquals(record.getModel().size(), QueryResults.asModel(conn.getStatements(null, null, null, ManagerTestConstants.EMPTY_IRI), MODEL_FACTORY).size());
        }
    }

    /* updateObject */

    @Test
    public void updateObjectTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            assertTrue(ConnectionUtils.contains(conn, null, null, null, ManagerTestConstants.RECORD_IRI));
            Record newRecord = recordFactory.createNew(ManagerTestConstants.RECORD_IRI);

            service.updateObject(newRecord, conn);
            QueryResults.asModel(conn.getStatements(null, null, null, ManagerTestConstants.RECORD_IRI), MODEL_FACTORY).forEach(statement ->
                    assertTrue(newRecord.getModel().contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
        }
    }

    /* optObject */

    @Test
    public void optObjectTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(service.optObject(ManagerTestConstants.MISSING_IRI, recordFactory, conn).isPresent());
            assertFalse(service.optObject(ManagerTestConstants.EMPTY_IRI, recordFactory, conn).isPresent());
            assertFalse(service.optObject(ManagerTestConstants.RANDOM_IRI, recordFactory, conn).isPresent());
            assertFalse(service.optObject(DIFFERENT_IRI, recordFactory, conn).isPresent());
            assertTrue(service.optObject(ManagerTestConstants.RECORD_IRI, recordFactory, conn).isPresent());
        }
    }

    /* getObject */

    @Test
    public void getObjectTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            Record record = service.getExpectedObject(ManagerTestConstants.RECORD_IRI, recordFactory, conn);
            assertFalse(record.getModel().isEmpty());
            assertEquals(ManagerTestConstants.RECORD_IRI, record.getResource());
        }
    }

    @Test
    public void getMissingExpectedObjectTest() {
        getBadExpectedRecord(ManagerTestConstants.MISSING_IRI);
    }

    @Test
    public void getEmptyExpectedObjectTest() {
        getBadExpectedRecord(ManagerTestConstants.EMPTY_IRI);
    }

    @Test
    public void getRandomExpectedObjectTest() {
        getBadExpectedRecord(ManagerTestConstants.RANDOM_IRI);
    }

    @Test
    public void getDifferentExpectedObjectTest() {
        getBadExpectedRecord(DIFFERENT_IRI);
    }

    /* getExpectedObject */

    @Test
    public void getExpectedObjectTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            Record record = service.getObject(ManagerTestConstants.RECORD_IRI, recordFactory, conn);
            assertFalse(record.getModel().isEmpty());
            assertEquals(ManagerTestConstants.RECORD_IRI, record.getResource());
        }
    }

    @Test
    public void getMissingObjectTest() {
        getBadRecord(ManagerTestConstants.MISSING_IRI);
    }

    @Test
    public void getEmptyObjectTest() {
        getBadRecord(ManagerTestConstants.EMPTY_IRI);
    }

    @Test
    public void getRandomObjectTest() {
        getBadRecord(ManagerTestConstants.RANDOM_IRI);
    }

    @Test
    public void getDifferentObjectTest() {
        getBadRecord(DIFFERENT_IRI);
    }

    /* remove */

    @Test
    public void removeTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(ConnectionUtils.contains(conn, null, null, null, ManagerTestConstants.RECORD_IRI));
            service.remove(ManagerTestConstants.RECORD_IRI, conn);
            assertFalse(ConnectionUtils.contains(conn, null, null, null, ManagerTestConstants.RECORD_IRI));
        }
    }

    /* removeObject */

    @Test
    public void removeObjectTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(ConnectionUtils.contains(conn, null, null, null, ManagerTestConstants.RECORD_IRI));
            service.removeObject(recordFactory.createNew(ManagerTestConstants.RECORD_IRI), conn);
            assertFalse(ConnectionUtils.contains(conn, null, null, null, ManagerTestConstants.RECORD_IRI));
        }
    }

    /* removeObjectWithRelationship */

    @Test
    public void removeObjectWithRelationshipTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(ConnectionUtils.contains(conn, null, null, null, ManagerTestConstants.BRANCH_IRI));
            service.removeObjectWithRelationship(ManagerTestConstants.BRANCH_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, VersionedRDFRecord.branch_IRI, conn);
            assertFalse(ConnectionUtils.contains(conn, null, null, null, ManagerTestConstants.BRANCH_IRI));
            assertFalse(ConnectionUtils.contains(conn, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, VALUE_FACTORY.createIRI(VersionedRDFRecord.branch_IRI), ManagerTestConstants.BRANCH_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI));
        }
    }

    /* throwAlreadyExists */

    @Test
    public void throwAlreadyExistsTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Record " + ManagerTestConstants.RECORD_IRI + " already exists");

        throw service.throwAlreadyExists(ManagerTestConstants.RECORD_IRI, recordFactory);
    }

    /* throwDoesNotBelong */

    @Test
    public void throwDoesNotBelongTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Record " + ManagerTestConstants.RECORD_IRI + " does not belong to Catalog " + ManagerTestConstants.CATALOG_IRI);

        throw service.throwDoesNotBelong(ManagerTestConstants.RECORD_IRI, recordFactory, ManagerTestConstants.CATALOG_IRI, catalogFactory);
    }

    private void testBadRecordId(Resource resource) {
        // Setup:
        IRI classIRI = VALUE_FACTORY.createIRI(Record.TYPE);
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("%s %s could not be found", classIRI.getLocalName(), resource));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.validateResource(resource, classIRI, conn);
        }
    }

    private void getBadRecord(Resource resource) {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("%s %s could not be found", recordFactory.getTypeIRI().getLocalName(), resource.stringValue()));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getObject(resource, recordFactory, conn);
        }
    }

    private void getBadExpectedRecord(Resource resource) {
        // Setup:
        thrown.expect(IllegalStateException.class);
        thrown.expectMessage(String.format("%s %s could not be found", recordFactory.getTypeIRI().getLocalName(), resource.stringValue()));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getExpectedObject(resource, recordFactory, conn);
        }
    }
}
