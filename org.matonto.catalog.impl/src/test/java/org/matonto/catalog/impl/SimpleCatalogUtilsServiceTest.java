package org.matonto.catalog.impl;

/*-
 * #%L
 * org.matonto.catalog.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.matonto.catalog.api.ontologies.mcat.Branch;
import org.matonto.catalog.api.ontologies.mcat.BranchFactory;
import org.matonto.catalog.api.ontologies.mcat.CatalogFactory;
import org.matonto.catalog.api.ontologies.mcat.Record;
import org.matonto.catalog.api.ontologies.mcat.RecordFactory;
import org.matonto.catalog.api.ontologies.mcat.VersionedRDFRecordFactory;
import org.matonto.persistence.utils.RepositoryResults;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.matonto.rdf.core.utils.Values;
import org.matonto.rdf.orm.conversion.ValueConverterRegistry;
import org.matonto.rdf.orm.conversion.impl.DefaultValueConverterRegistry;
import org.matonto.rdf.orm.conversion.impl.DoubleValueConverter;
import org.matonto.rdf.orm.conversion.impl.FloatValueConverter;
import org.matonto.rdf.orm.conversion.impl.IRIValueConverter;
import org.matonto.rdf.orm.conversion.impl.IntegerValueConverter;
import org.matonto.rdf.orm.conversion.impl.LiteralValueConverter;
import org.matonto.rdf.orm.conversion.impl.ResourceValueConverter;
import org.matonto.rdf.orm.conversion.impl.ShortValueConverter;
import org.matonto.rdf.orm.conversion.impl.StringValueConverter;
import org.matonto.rdf.orm.conversion.impl.ValueValueConverter;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.impl.sesame.SesameRepositoryWrapper;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.openrdf.sail.memory.MemoryStore;

import java.io.InputStream;

public class SimpleCatalogUtilsServiceTest {
    private SimpleCatalogUtilsService service;
    private Repository repo;
    private ValueFactory vf = SimpleValueFactory.getInstance();
    private ModelFactory mf = LinkedHashModelFactory.getInstance();
    private ValueConverterRegistry vcr = new DefaultValueConverterRegistry();
    private CatalogFactory catalogFactory = new CatalogFactory();
    private RecordFactory recordFactory = new RecordFactory();
    private VersionedRDFRecordFactory versionedRDFRecordFactory = new VersionedRDFRecordFactory();
    private BranchFactory branchFactory = new BranchFactory();

    private static Resource missingIRI;
    private static Resource emptyIRI;
    private static Resource randomIRI;
    private static Resource differentIRI;
    private static Resource catalogIRI;
    private static Resource recordNoCatalogIRI;
    private static Resource versionedRDFRecordNoCatalogIRI;
    private static Resource versionedRDFRecordNoBranchIRI;
    private static Resource recordIRI;
    private static Resource versionedRDFRecordIRI;
    private static Resource branchIRI;

    @Rule
    public ExpectedException thrown = ExpectedException.none();

    @Before
    public void setUp() throws Exception {
        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();

        try (RepositoryConnection conn = repo.getConnection()) {
            InputStream testData = getClass().getResourceAsStream("/testCatalogUtilsData.trig");
            conn.add(Values.matontoModel(Rio.parse(testData, "", RDFFormat.TRIG)));
        }

        missingIRI = vf.createIRI("http://test.com#missing");
        emptyIRI = vf.createIRI("http://test.com#empty");
        randomIRI = vf.createIRI("http://test.com#random");
        differentIRI = vf.createIRI("http://test.com#different");
        catalogIRI = vf.createIRI("http://test.com#catalog");
        recordNoCatalogIRI = vf.createIRI("http://test.com#just-a-record");
        versionedRDFRecordNoCatalogIRI = vf.createIRI("http://test.com#versionedRDFRecord-no-catalog");
        versionedRDFRecordNoBranchIRI = vf.createIRI("http://test.com#versionedRDFRecord-no-branch");
        recordIRI = vf.createIRI("http://test.com#record");
        versionedRDFRecordIRI = vf.createIRI("http://test.com#versionedRDFRecord");
        branchIRI = vf.createIRI("http://test.com#branch");

        catalogFactory.setModelFactory(mf);
        catalogFactory.setValueFactory(vf);
        catalogFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(catalogFactory);

        recordFactory.setModelFactory(mf);
        recordFactory.setValueFactory(vf);
        recordFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(recordFactory);

        versionedRDFRecordFactory.setModelFactory(mf);
        versionedRDFRecordFactory.setValueFactory(vf);
        versionedRDFRecordFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(versionedRDFRecordFactory);

        branchFactory.setModelFactory(mf);
        branchFactory.setValueFactory(vf);
        branchFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(branchFactory);

        vcr.registerValueConverter(new ResourceValueConverter());
        vcr.registerValueConverter(new IRIValueConverter());
        vcr.registerValueConverter(new DoubleValueConverter());
        vcr.registerValueConverter(new IntegerValueConverter());
        vcr.registerValueConverter(new FloatValueConverter());
        vcr.registerValueConverter(new ShortValueConverter());
        vcr.registerValueConverter(new StringValueConverter());
        vcr.registerValueConverter(new ValueValueConverter());
        vcr.registerValueConverter(new LiteralValueConverter());

        service = new SimpleCatalogUtilsService();
        service.setMf(mf);
        service.setVf(vf);
        service.setCatalogFactory(catalogFactory);
        service.setRecordFactory(recordFactory);
        service.setVersionedRDFRecordFactory(versionedRDFRecordFactory);
        service.setBranchFactory(branchFactory);
    }

    /* resourceExists(Resource, String, RepositoryConnection) */

    @Test
    public void resourceExistsWithTypeTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(service.resourceExists(missingIRI, Record.TYPE, conn));
            assertFalse(service.resourceExists(emptyIRI, Record.TYPE, conn));
            assertFalse(service.resourceExists(randomIRI, Record.TYPE, conn));
            assertFalse(service.resourceExists(differentIRI, Record.TYPE, conn));
            assertTrue(service.resourceExists(recordIRI, Record.TYPE, conn));
        }
    }

    /* resourceExists(Resource, RepositoryConnection) */

    @Test
    public void resourceExistsTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(service.resourceExists(missingIRI, conn));
            assertFalse(service.resourceExists(emptyIRI, conn));
            assertTrue(service.resourceExists(randomIRI, conn));
            assertTrue(service.resourceExists(recordIRI, conn));
        }
    }

    /* testObjectId */

    @Test
    public void testObjectIdOfMissing() {
        testBadObjectId(missingIRI);
    }

    @Test
    public void testObjectIdOfEmpty() {
        testBadObjectId(emptyIRI);
    }

    @Test
    public void testObjectIdOfRandom() {
        testBadObjectId(randomIRI);
    }

    @Test
    public void testObjectIdOfDifferent() {
        testBadObjectId(differentIRI);
    }

    /* addObject */

    @Test
    public void addObjectTest() throws Exception {
        // Setup
        Record record = recordFactory.createNew(emptyIRI);

        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(conn.getStatements(null, null, null, emptyIRI).hasNext());

            service.addObject(record, conn);
            assertEquals(record.getModel().size(), RepositoryResults.asModel(conn.getStatements(null, null, null, emptyIRI), mf).size());
        }
    }

    /* optObject */

    @Test
    public void optObjectTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(service.optObject(missingIRI, recordFactory, conn).isPresent());
            assertFalse(service.optObject(emptyIRI, recordFactory, conn).isPresent());
            assertFalse(service.optObject(randomIRI, recordFactory, conn).isPresent());
            assertFalse(service.optObject(differentIRI, recordFactory, conn).isPresent());
            assertTrue(service.optObject(recordIRI, recordFactory, conn).isPresent());
        }
    }

    /* getObject */

    @Test
    public void getMissingObjectTest() {
        getBadObject(missingIRI);
    }

    @Test
    public void getEmptyObjectTest() {
        getBadObject(emptyIRI);
    }

    @Test
    public void getRandomObjectTest() {
        getBadObject(randomIRI);
    }

    @Test
    public void getDifferentObjectTest() {
        getBadObject(differentIRI);
    }

    /* getObject */

    @Test
    public void getObjectTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            Record record = service.getObject(recordIRI, recordFactory, conn);
            assertFalse(record.getModel().isEmpty());
            assertEquals(recordIRI, record.getResource());
        }
    }

    /* remove */

    @Test
    public void removeTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(null, null, null, recordIRI).hasNext());
            service.remove(recordIRI, conn);
            assertFalse(conn.getStatements(null, null, null, recordIRI).hasNext());
        }
    }

    /* removeObject */

    @Test
    public void removeObjectTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(null, null, null, recordIRI).hasNext());
            service.removeObject(recordFactory.createNew(recordIRI), conn);
            assertFalse(conn.getStatements(null, null, null, recordIRI).hasNext());
        }
    }

    /* testRecordPath */

    @Test
    public void testRecordPathWithMissingCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Catalog %s could not be found", missingIRI.stringValue()));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.testRecordPath(missingIRI, recordIRI, recordFactory.getTypeIRI(), conn);
        }
    }

    @Test
    public void testRecordPathWithMissingRecord() {
        // Setup:
        IRI classIRI = recordFactory.getTypeIRI();
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("%s %s could not be found", classIRI.getLocalName(), missingIRI.stringValue()));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.testRecordPath(catalogIRI, missingIRI, recordFactory.getTypeIRI(), conn);
        }
    }

    @Test
    public void testRecordPathWithWrongCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
//        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", recordNoCatalogIRI.stringValue(), catalogIRI.stringValue()));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.testRecordPath(catalogIRI, recordNoCatalogIRI, recordFactory.getTypeIRI(), conn);
        }
    }

    /* getRecord */

    @Test
    public void getRecordTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            Record record = service.getRecord(catalogIRI, recordIRI, recordFactory, conn);
            assertFalse(record.getModel().isEmpty());
            assertEquals(recordIRI, record.getResource());
        }
    }

    @Test
    public void getRecordWithMissingCatalog(){
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Catalog %s could not be found", missingIRI.stringValue()));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getRecord(missingIRI, recordIRI, recordFactory, conn);
        }
    }

    @Test
    public void getRecordWithMissingRecord() {
        // Setup:
        IRI classIRI = recordFactory.getTypeIRI();
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("%s %s could not be found", classIRI.getLocalName(), missingIRI.stringValue()));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getRecord(catalogIRI, missingIRI, recordFactory, conn);
        }
    }

    @Test
    public void getRecordWithWrongCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
//        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", recordNoCatalogIRI.stringValue(), catalogIRI.stringValue()));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getRecord(catalogIRI, recordNoCatalogIRI, recordFactory, conn);
        }
    }

    /* testBranchPath */

    @Test
    public void testBranchPathWithMissingCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Catalog %s could not be found", missingIRI.stringValue()));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.testBranchPath(missingIRI, recordIRI, branchIRI, conn);
        }
    }

    @Test
    public void testBranchPathWithMissingRecord() {
        // Setup:
        IRI classIRI = versionedRDFRecordFactory.getTypeIRI();
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("%s %s could not be found", classIRI.getLocalName(), missingIRI.stringValue()));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.testBranchPath(catalogIRI, missingIRI, branchIRI, conn);
        }
    }

    @Test
    public void testBranchPathWithWrongCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", versionedRDFRecordNoCatalogIRI.stringValue(), catalogIRI.stringValue()));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.testBranchPath(catalogIRI, versionedRDFRecordNoCatalogIRI, branchIRI, conn);
        }
    }

    @Test
    public void testBranchPathWithWrongRecord() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
//        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", versionedRDFRecordNoBranchIRI.stringValue(), catalogIRI.stringValue()));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.testBranchPath(catalogIRI, versionedRDFRecordNoBranchIRI, branchIRI, conn);
        }
    }

    /* getBranch */

    /*@Test
    public void getBranchTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            Branch branch = service.getBranch(catalogIRI, recordIRI, branchIRI, branchFactory, conn);
            assertFalse(branch.getModel().isEmpty());
            assertEquals(branchIRI, branch.getResource());
        }
    }*/

    @Test
    public void getBranchWithMissingCatalogTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Catalog %s could not be found", missingIRI.stringValue()));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getBranch(missingIRI, recordIRI, branchIRI, branchFactory, conn);
        }
    }

    @Test
    public void getBranchWithMissingRecordTest() {
        // Setup:
        IRI classIRI = versionedRDFRecordFactory.getTypeIRI();
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("%s %s could not be found", classIRI.getLocalName(), missingIRI.stringValue()));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getBranch(catalogIRI, missingIRI, branchIRI, branchFactory, conn);
        }
    }

    @Test
    public void getBranchPathWithWrongCatalogTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", versionedRDFRecordNoCatalogIRI.stringValue(), catalogIRI.stringValue()));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getBranch(catalogIRI, versionedRDFRecordNoCatalogIRI, branchIRI, branchFactory, conn);
        }
    }

    @Test
    public void getBranchPathWithWrongRecordTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
//        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", versionedRDFRecordNoBranchIRI.stringValue(), catalogIRI.stringValue()));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getBranch(catalogIRI, versionedRDFRecordNoBranchIRI, branchIRI, branchFactory, conn);
        }
    }

    @Test
    public void getBranchPathWithMissingBranchTest() {
        // Setup:
        IRI classIRI = branchFactory.getTypeIRI();
        thrown.expect(IllegalArgumentException.class);
//        thrown.expectMessage(String.format("%s %s could not be found", classIRI.getLocalName(), missingIRI.stringValue()));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getBranch(catalogIRI, versionedRDFRecordIRI, missingIRI, branchFactory, conn);
        }
    }



    private void testBadObjectId(Resource resource) {
        // Setup:
        IRI classIRI = vf.createIRI(Record.TYPE);
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("%s %s could not be found", classIRI.getLocalName(), resource.stringValue()));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.testObjectId(resource, classIRI, conn);
        }
    }

    private void getBadObject(Resource resource) {
        // Setup:
        IRI classIRI = vf.createIRI(Record.TYPE);
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("%s %s could not be found", classIRI.getLocalName(), resource.stringValue()));

        try (RepositoryConnection conn = repo.getConnection()) {
            service.getObject(resource, recordFactory, conn);
        }
    }
}
