package org.matonto.catalog.impl;
/*-
 * #%L
 * org.matonto.catalog.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.matonto.catalog.api.Conflict;
import org.matonto.catalog.api.Difference;
import org.matonto.catalog.api.PaginatedSearchParams;
import org.matonto.catalog.api.PaginatedSearchResults;
import org.matonto.catalog.api.ontologies.mcat.Branch;
import org.matonto.catalog.api.ontologies.mcat.BranchFactory;
import org.matonto.catalog.api.ontologies.mcat.Catalog;
import org.matonto.catalog.api.ontologies.mcat.CatalogFactory;
import org.matonto.catalog.api.ontologies.mcat.Commit;
import org.matonto.catalog.api.ontologies.mcat.CommitFactory;
import org.matonto.catalog.api.ontologies.mcat.Distribution;
import org.matonto.catalog.api.ontologies.mcat.DistributionFactory;
import org.matonto.catalog.api.ontologies.mcat.InProgressCommit;
import org.matonto.catalog.api.ontologies.mcat.InProgressCommitFactory;
import org.matonto.catalog.api.ontologies.mcat.MappingRecord;
import org.matonto.catalog.api.ontologies.mcat.MappingRecordFactory;
import org.matonto.catalog.api.ontologies.mcat.OntologyRecord;
import org.matonto.catalog.api.ontologies.mcat.OntologyRecordFactory;
import org.matonto.catalog.api.ontologies.mcat.Record;
import org.matonto.catalog.api.ontologies.mcat.RecordFactory;
import org.matonto.catalog.api.ontologies.mcat.Revision;
import org.matonto.catalog.api.ontologies.mcat.RevisionFactory;
import org.matonto.catalog.api.ontologies.mcat.Tag;
import org.matonto.catalog.api.ontologies.mcat.TagFactory;
import org.matonto.catalog.api.ontologies.mcat.UnversionedRecord;
import org.matonto.catalog.api.ontologies.mcat.UnversionedRecordFactory;
import org.matonto.catalog.api.ontologies.mcat.UserBranch;
import org.matonto.catalog.api.ontologies.mcat.UserBranchFactory;
import org.matonto.catalog.api.ontologies.mcat.Version;
import org.matonto.catalog.api.ontologies.mcat.VersionFactory;
import org.matonto.catalog.api.ontologies.mcat.VersionedRDFRecord;
import org.matonto.catalog.api.ontologies.mcat.VersionedRDFRecordFactory;
import org.matonto.catalog.api.ontologies.mcat.VersionedRecord;
import org.matonto.catalog.api.ontologies.mcat.VersionedRecordFactory;
import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.matonto.jaas.api.ontologies.usermanagement.UserFactory;
import org.matonto.ontologies.provo.Activity;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Statement;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.matonto.rdf.core.utils.Values;
import org.matonto.rdf.orm.Thing;
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
import org.matonto.rdf.orm.impl.ThingFactory;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.impl.sesame.SesameRepositoryWrapper;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.openrdf.sail.memory.MemoryStore;

import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class SimpleCatalogManagerTest {

    private Repository repo;
    private SimpleCatalogManager manager;
    private ValueFactory vf = SimpleValueFactory.getInstance();
    private ModelFactory mf = LinkedHashModelFactory.getInstance();
    private ValueConverterRegistry vcr = new DefaultValueConverterRegistry();
    private CatalogFactory catalogFactory = new CatalogFactory();
    private RecordFactory recordFactory = new RecordFactory();
    private UnversionedRecordFactory unversionedRecordFactory = new UnversionedRecordFactory();
    private VersionedRecordFactory versionedRecordFactory = new VersionedRecordFactory();
    private VersionedRDFRecordFactory versionedRDFRecordFactory = new VersionedRDFRecordFactory();
    private OntologyRecordFactory ontologyRecordFactory = new OntologyRecordFactory();
    private MappingRecordFactory mappingRecordFactory = new MappingRecordFactory();
    private DistributionFactory distributionFactory = new DistributionFactory();
    private BranchFactory branchFactory = new BranchFactory();
    private InProgressCommitFactory inProgressCommitFactory = new InProgressCommitFactory();
    private CommitFactory commitFactory = new CommitFactory();
    private RevisionFactory revisionFactory = new RevisionFactory();
    private ThingFactory thingFactory = new ThingFactory();
    private VersionFactory versionFactory = new VersionFactory();
    private TagFactory tagFactory = new TagFactory();
    private UserBranchFactory userBranchFactory = new UserBranchFactory();
    private UserFactory userFactory = new UserFactory();
    private IRI distributedCatalogId;
    private IRI localCatalogId;
    private Resource notPresentId;
    private Resource differentId;
    private IRI dcIdentifier;

    private static final String RDF_TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";

    private static final String DC_TERMS = "http://purl.org/dc/terms/";
    private static final String DC_TITLE = DC_TERMS + "title";
    private static final String DC_DESCRIPTION = DC_TERMS + "description";
    private static final String DC_ISSUED = DC_TERMS + "issued";
    private static final String DC_MODIFIED = DC_TERMS + "modified";
    private static final String DC_IDENTIFIER = DC_TERMS + "identifier";

    private static final String PROV_O = "http://www.w3.org/ns/prov#";
    private static final String PROV_AT_TIME = PROV_O + "atTime";
    private static final String PROV_WAS_ASSOCIATED_WITH = PROV_O + "wasAssociatedWith";
    private static final String PROV_WAS_INFORMED_BY = PROV_O + "wasInformedBy";
    private static final String PROV_GENERATED = PROV_O + "generated";
    private static final String PROV_WAS_DERIVED_FROM = PROV_O + "wasDerivedFrom";

    private IRI ONT_TYPE;
    private IRI MAPPING_TYPE;
    private static final int TOTAL_SIZE = 10;

    @Rule
    public ExpectedException thrown = ExpectedException.none();

    @Before
    public void setUp() throws Exception {
        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();

        ONT_TYPE = vf.createIRI("http://matonto.org/ontologies/catalog#OntologyRecord");
        MAPPING_TYPE = vf.createIRI("http://matonto.org/ontologies/catalog#MappingRecord");

        catalogFactory.setModelFactory(mf);
        catalogFactory.setValueFactory(vf);
        catalogFactory.setValueConverterRegistry(vcr);

        recordFactory.setModelFactory(mf);
        recordFactory.setValueFactory(vf);
        recordFactory.setValueConverterRegistry(vcr);

        unversionedRecordFactory.setModelFactory(mf);
        unversionedRecordFactory.setValueFactory(vf);
        unversionedRecordFactory.setValueConverterRegistry(vcr);

        versionedRecordFactory.setModelFactory(mf);
        versionedRecordFactory.setValueFactory(vf);
        versionedRecordFactory.setValueConverterRegistry(vcr);

        versionedRDFRecordFactory.setModelFactory(mf);
        versionedRDFRecordFactory.setValueFactory(vf);
        versionedRDFRecordFactory.setValueConverterRegistry(vcr);

        ontologyRecordFactory.setModelFactory(mf);
        ontologyRecordFactory.setValueFactory(vf);
        ontologyRecordFactory.setValueConverterRegistry(vcr);

        mappingRecordFactory.setModelFactory(mf);
        mappingRecordFactory.setValueFactory(vf);
        mappingRecordFactory.setValueConverterRegistry(vcr);

        commitFactory.setModelFactory(mf);
        commitFactory.setValueFactory(vf);
        commitFactory.setValueConverterRegistry(vcr);

        inProgressCommitFactory.setModelFactory(mf);
        inProgressCommitFactory.setValueFactory(vf);
        inProgressCommitFactory.setValueConverterRegistry(vcr);

        revisionFactory.setModelFactory(mf);
        revisionFactory.setValueFactory(vf);
        revisionFactory.setValueConverterRegistry(vcr);

        branchFactory.setModelFactory(mf);
        branchFactory.setValueFactory(vf);
        branchFactory.setValueConverterRegistry(vcr);

        distributionFactory.setModelFactory(mf);
        distributionFactory.setValueFactory(vf);
        distributionFactory.setValueConverterRegistry(vcr);

        versionFactory.setModelFactory(mf);
        versionFactory.setValueFactory(vf);
        versionFactory.setValueConverterRegistry(vcr);

        tagFactory.setModelFactory(mf);
        tagFactory.setValueFactory(vf);
        tagFactory.setValueConverterRegistry(vcr);

        userFactory.setModelFactory(mf);
        userFactory.setValueFactory(vf);
        userFactory.setValueConverterRegistry(vcr);

        versionedRDFRecordFactory.setModelFactory(mf);
        versionedRDFRecordFactory.setValueFactory(vf);
        versionedRDFRecordFactory.setValueConverterRegistry(vcr);

        userBranchFactory.setModelFactory(mf);
        userBranchFactory.setValueFactory(vf);
        userBranchFactory.setValueConverterRegistry(vcr);

        thingFactory.setModelFactory(mf);
        thingFactory.setValueFactory(vf);
        thingFactory.setValueConverterRegistry(vcr);

        vcr.registerValueConverter(catalogFactory);
        vcr.registerValueConverter(recordFactory);
        vcr.registerValueConverter(unversionedRecordFactory);
        vcr.registerValueConverter(versionedRecordFactory);
        vcr.registerValueConverter(versionedRDFRecordFactory);
        vcr.registerValueConverter(ontologyRecordFactory);
        vcr.registerValueConverter(mappingRecordFactory);
        vcr.registerValueConverter(distributionFactory);
        vcr.registerValueConverter(branchFactory);
        vcr.registerValueConverter(inProgressCommitFactory);
        vcr.registerValueConverter(commitFactory);
        vcr.registerValueConverter(revisionFactory);
        vcr.registerValueConverter(versionFactory);
        vcr.registerValueConverter(tagFactory);
        vcr.registerValueConverter(thingFactory);
        vcr.registerValueConverter(userFactory);
        vcr.registerValueConverter(versionedRDFRecordFactory);
        vcr.registerValueConverter(userBranchFactory);
        vcr.registerValueConverter(new ResourceValueConverter());
        vcr.registerValueConverter(new IRIValueConverter());
        vcr.registerValueConverter(new DoubleValueConverter());
        vcr.registerValueConverter(new IntegerValueConverter());
        vcr.registerValueConverter(new FloatValueConverter());
        vcr.registerValueConverter(new ShortValueConverter());
        vcr.registerValueConverter(new StringValueConverter());
        vcr.registerValueConverter(new ValueValueConverter());
        vcr.registerValueConverter(new LiteralValueConverter());

        manager = new SimpleCatalogManager();
        manager.setRepository(repo);
        manager.setValueFactory(vf);
        manager.setModelFactory(mf);
        manager.setCatalogFactory(catalogFactory);
        manager.setRecordFactory(recordFactory);
        manager.setDistributionFactory(distributionFactory);
        manager.setBranchFactory(branchFactory);
        manager.setInProgressCommitFactory(inProgressCommitFactory);
        manager.setCommitFactory(commitFactory);
        manager.setRevisionFactory(revisionFactory);
        manager.setVersionedRDFRecordFactory(versionedRDFRecordFactory);
        manager.setVersionFactory(versionFactory);
        manager.setTagFactory(tagFactory);
        manager.setUnversionedRecordFactory(unversionedRecordFactory);
        manager.setVersionedRecordFactory(versionedRecordFactory);

        InputStream testData = getClass().getResourceAsStream("/testCatalogData.trig");

        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(Values.matontoModel(Rio.parse(testData, "", RDFFormat.TRIG)));
        }

        Map<String, Object> props = new HashMap<>();
        props.put("title", "MatOnto Test Catalog");
        props.put("description", "This is a test catalog");
        props.put("iri", "http://matonto.org/test/catalog");

        manager.start(props);

        distributedCatalogId = vf.createIRI("http://matonto.org/test/catalog-distributed");
        localCatalogId = vf.createIRI("http://matonto.org/test/catalog-local");
        notPresentId = vf.createIRI("http://matonto.org/test/records#not-present");
        differentId = vf.createIRI("http://matonto.org/test/different");
        dcIdentifier = vf.createIRI(DC_IDENTIFIER);
    }

    @After
    public void tearDown() throws Exception {
        repo.shutDown();
    }

    @Test
    public void testGetDistributedCatalogIRI() throws Exception {
        IRI iri = manager.getDistributedCatalogIRI();
        assertEquals(distributedCatalogId, iri);
    }

    @Test
    public void testGetLocalCatalogIRI() throws Exception {
        IRI iri = manager.getLocalCatalogIRI();
        assertEquals(localCatalogId, iri);
    }

    @Test
    public void testGetDistributedCatalog() throws Exception {
        Catalog catalog = manager.getDistributedCatalog();
        Optional<Value> title = catalog.getProperty(vf.createIRI(DC_TITLE));
        Optional<Value> description = catalog.getProperty(vf.createIRI(DC_DESCRIPTION));
        Optional<Value> issued = catalog.getProperty(vf.createIRI(DC_ISSUED));
        Optional<Value> modified = catalog.getProperty(vf.createIRI(DC_MODIFIED));

        assertTrue(title.isPresent());
        assertEquals("MatOnto Test Catalog (Distributed)", title.get().stringValue());
        assertTrue(description.isPresent());
        assertEquals("This is a test catalog", description.get().stringValue());
        assertTrue(issued.isPresent());
        assertTrue(modified.isPresent());
    }

    @Test
    public void testGetLocalCatalog() throws Exception {
        Catalog catalog = manager.getLocalCatalog();
        Optional<Value> title = catalog.getProperty(vf.createIRI(DC_TITLE));
        Optional<Value> description = catalog.getProperty(vf.createIRI(DC_DESCRIPTION));
        Optional<Value> issued = catalog.getProperty(vf.createIRI(DC_ISSUED));
        Optional<Value> modified = catalog.getProperty(vf.createIRI(DC_MODIFIED));

        assertTrue(title.isPresent());
        assertEquals("MatOnto Test Catalog (Local)", title.get().stringValue());
        assertTrue(description.isPresent());
        assertEquals("This is a test catalog", description.get().stringValue());
        assertTrue(issued.isPresent());
        assertTrue(modified.isPresent());
    }

    @Test
    public void testGetRecordIds() throws Exception {
        Set<Resource> results = manager.getRecordIds(distributedCatalogId);
        assertEquals(TOTAL_SIZE, results.size());
        assertTrue(results.contains(vf.createIRI("http://matonto.org/test/records#update")));
        assertTrue(results.contains(vf.createIRI("http://matonto.org/test/records#remove")));
        assertTrue(results.contains(vf.createIRI("http://matonto.org/test/records#get")));
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetRecordIdsFromMissingCatalog(){
        Resource notPresentId = vf.createIRI("http://matonto.org/test/catalog-not-there");
        manager.getRecordIds(notPresentId);
    }

    /* addRecord */

    @Test
    public void testAddRecord() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("https://matonto.org/records#new");
        Record record = recordFactory.createNew(recordId);
        record.addProperty(vf.createLiteral("record"), dcIdentifier);
        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(conn.getStatements(recordId, null, null, recordId).hasNext());

            manager.addRecord(distributedCatalogId, record);
            assertTrue(conn.getStatements(recordId, null, vf.createIRI(Record.TYPE), recordId).hasNext());
            assertTrue(conn.getStatements(recordId, null, null, recordId).hasNext());
            assertTrue(conn.getStatements(recordId, null, distributedCatalogId, recordId).hasNext());
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddRecordToMissingCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("https://matonto.org/records#new");
        Record record = recordFactory.createNew(recordId);
        record.addProperty(vf.createLiteral("record"), dcIdentifier);

        manager.addRecord(differentId, record);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddRecordWithTakenResource() {
        // Setup:
        Resource existingId = vf.createIRI("http://matonto.org/test/records#just-a-record");
        Record record = recordFactory.createNew(existingId);
        record.addProperty(vf.createLiteral("record"), dcIdentifier);

        manager.addRecord(distributedCatalogId, record);
    }

    @Test
    public void testAddUnversionedRecord() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("https://matonto.org/records#new");
        UnversionedRecord record = unversionedRecordFactory.createNew(recordId);
        record.addProperty(vf.createLiteral("record"), dcIdentifier);
        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(conn.getStatements(recordId, null, null, recordId).hasNext());

            manager.addRecord(distributedCatalogId, record);
            assertTrue(conn.getStatements(recordId, null, vf.createIRI(UnversionedRecord.TYPE), recordId).hasNext());
            assertTrue(conn.getStatements(recordId, null, null, recordId).hasNext());
            assertTrue(conn.getStatements(recordId, null, distributedCatalogId, recordId).hasNext());
        }
    }

    @Test
    public void testAddVersionedRecord() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("https://matonto.org/records#new");
        VersionedRecord record = versionedRecordFactory.createNew(recordId);
        record.addProperty(vf.createLiteral("record"), dcIdentifier);
        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(conn.getStatements(recordId, null, null, recordId).hasNext());

            manager.addRecord(distributedCatalogId, record);
            assertTrue(conn.getStatements(recordId, null, vf.createIRI(VersionedRecord.TYPE), recordId).hasNext());
            assertTrue(conn.getStatements(recordId, null, null, recordId).hasNext());
            assertTrue(conn.getStatements(recordId, null, distributedCatalogId, recordId).hasNext());
        }
    }

    @Test
    public void testAddVersionedRDFRecord() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("https://matonto.org/records#new");
        VersionedRDFRecord record = versionedRDFRecordFactory.createNew(recordId);
        record.addProperty(vf.createLiteral("record"), dcIdentifier);
        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(conn.getStatements(recordId, null, null, recordId).hasNext());

            manager.addRecord(distributedCatalogId, record);
            assertTrue(conn.getStatements(recordId, null, vf.createIRI(VersionedRDFRecord.TYPE), recordId).hasNext());
            assertTrue(conn.getStatements(recordId, null, null, recordId).hasNext());
            assertTrue(conn.getStatements(recordId, null, distributedCatalogId, recordId).hasNext());
            assertTrue(conn.getStatements(recordId, vf.createIRI(VersionedRDFRecord.masterBranch_IRI), null, recordId).hasNext());
            assertTrue(conn.getStatements(recordId, vf.createIRI(VersionedRDFRecord.branch_IRI), null, recordId).hasNext());
        }
    }

    @Test
    public void testAddOntologyRecord() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("https://matonto.org/records#new");
        OntologyRecord record = ontologyRecordFactory.createNew(recordId);
        record.addProperty(vf.createLiteral("record"), dcIdentifier);
        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(conn.getStatements(recordId, null, null, recordId).hasNext());

            manager.addRecord(distributedCatalogId, record);
            assertTrue(conn.getStatements(recordId, null, vf.createIRI(OntologyRecord.TYPE), recordId).hasNext());
            assertTrue(conn.getStatements(recordId, null, null, recordId).hasNext());
            assertTrue(conn.getStatements(recordId, null, distributedCatalogId, recordId).hasNext());
            assertTrue(conn.getStatements(recordId, vf.createIRI(VersionedRDFRecord.masterBranch_IRI), null, recordId).hasNext());
            assertTrue(conn.getStatements(recordId, vf.createIRI(VersionedRDFRecord.branch_IRI), null, recordId).hasNext());
        }
    }

    @Test
    public void testAddMappingRecord() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("https://matonto.org/records#new");
        MappingRecord record = mappingRecordFactory.createNew(recordId);
        record.addProperty(vf.createLiteral("record"), dcIdentifier);
        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(conn.getStatements(recordId, null, null, recordId).hasNext());

            manager.addRecord(distributedCatalogId, record);
            assertTrue(conn.getStatements(recordId, null, vf.createIRI(MappingRecord.TYPE), recordId).hasNext());
            assertTrue(conn.getStatements(recordId, null, null, recordId).hasNext());
            assertTrue(conn.getStatements(recordId, null, distributedCatalogId, recordId).hasNext());
        }
    }

    /* updateRecord */

    @Test
    public void testUpdateRecord() throws Exception {
        Resource recordId = vf.createIRI("http://matonto.org/test/records#update");

        try (RepositoryConnection conn = repo.getConnection()) {
            Model recordModel = mf.createModel();
            conn.getStatements(recordId, null, null, recordId).forEachRemaining(recordModel::add);

            Record record = recordFactory.getExisting(recordId, recordModel).get();

            record.setKeyword(Stream.of(vf.createLiteral("keyword1")).collect(Collectors.toSet()));

            assertFalse(conn.getStatements(recordId, vf.createIRI(Record.keyword_IRI), vf.createLiteral("keyword1"),
                    recordId).hasNext());

            manager.updateRecord(distributedCatalogId, record);
            assertTrue(conn.getStatements(recordId, vf.createIRI(Record.catalog_IRI), distributedCatalogId, recordId).hasNext());
            assertTrue(conn.getStatements(recordId, vf.createIRI(Record.keyword_IRI), vf.createLiteral("keyword1"),
                    recordId).hasNext());
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateRecordInMissingCatalog() {
        Resource recordId = vf.createIRI("https://matonto.org/records#test");
        Record record = recordFactory.createNew(recordId);
        manager.updateRecord(differentId, record);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateMissingRecord() {
        Record record = recordFactory.createNew(notPresentId);
        manager.updateRecord(distributedCatalogId, record);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateRecordInWrongCatalog() {
        Resource recordId = vf.createIRI("https://matonto.org/records#test");
        Record record = recordFactory.createNew(recordId);
        manager.updateRecord(distributedCatalogId, record);
    }

    @Test
    public void testUpdateUnversionedRecord() throws Exception {
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");

        try (RepositoryConnection conn = repo.getConnection()) {
            Model recordModel = mf.createModel();
            conn.getStatements(recordId, null, null, recordId).forEachRemaining(recordModel::add);

            UnversionedRecord record = unversionedRecordFactory.getExisting(recordId, recordModel).get();

            record.setKeyword(Stream.of(vf.createLiteral("keyword1")).collect(Collectors.toSet()));

            assertFalse(conn.getStatements(recordId, vf.createIRI(Record.keyword_IRI), vf.createLiteral("keyword1"),
                    recordId).hasNext());

            manager.updateRecord(distributedCatalogId, record);
            assertTrue(conn.getStatements(recordId, vf.createIRI(Record.catalog_IRI), distributedCatalogId, recordId).hasNext());
            assertTrue(conn.getStatements(recordId, vf.createIRI(Record.keyword_IRI), vf.createLiteral("keyword1"),
                    recordId).hasNext());
        }
    }

    @Test
    public void testUpdateVersionedRecord() throws Exception {
        Resource recordId = vf.createIRI("http://matonto.org/test/records#update");

        try (RepositoryConnection conn = repo.getConnection()) {
            Model recordModel = mf.createModel();
            conn.getStatements(recordId, null, null, recordId).forEachRemaining(recordModel::add);

           VersionedRecord record = versionedRecordFactory.getExisting(recordId, recordModel).get();
            record.setKeyword(Stream.of(vf.createLiteral("keyword1")).collect(Collectors.toSet()));

            assertFalse(conn.getStatements(recordId, vf.createIRI(Record.keyword_IRI), vf.createLiteral("keyword1"),
                    recordId).hasNext());

            manager.updateRecord(distributedCatalogId, record);
            assertTrue(conn.getStatements(recordId, vf.createIRI(Record.catalog_IRI), distributedCatalogId, recordId).hasNext());
            assertTrue(conn.getStatements(recordId, vf.createIRI(Record.keyword_IRI), vf.createLiteral("keyword1"),
                    recordId).hasNext());
        }
    }

    @Test
    public void testUpdateVersionedRDFRecord() throws Exception {
        Resource recordId = vf.createIRI("http://matonto.org/test/records#update");

        try (RepositoryConnection conn = repo.getConnection()) {
            Model recordModel = mf.createModel();
            conn.getStatements(recordId, null, null, recordId).forEachRemaining(recordModel::add);

            VersionedRDFRecord record = versionedRDFRecordFactory.getExisting(recordId, recordModel).get();
            record.setKeyword(Stream.of(vf.createLiteral("keyword1")).collect(Collectors.toSet()));

            assertTrue(conn.getStatements(recordId, vf.createIRI(Record.catalog_IRI), distributedCatalogId, recordId).hasNext());
            assertFalse(conn.getStatements(recordId, vf.createIRI(Record.keyword_IRI), vf.createLiteral("keyword1"),
                    recordId).hasNext());

            manager.updateRecord(distributedCatalogId, record);
            assertTrue(conn.getStatements(recordId, vf.createIRI(Record.catalog_IRI), distributedCatalogId, recordId).hasNext());
            assertTrue(conn.getStatements(recordId, vf.createIRI(Record.keyword_IRI), vf.createLiteral("keyword1"),
                    recordId).hasNext());
        }
    }

    @Test
    public void testUpdateOntologyRecord() throws Exception {
        Resource recordId = vf.createIRI("http://matonto.org/test/records#update");

        try (RepositoryConnection conn = repo.getConnection()) {
            Model recordModel = mf.createModel();
            conn.getStatements(recordId, null, null, recordId).forEachRemaining(recordModel::add);

            OntologyRecord record = ontologyRecordFactory.getExisting(recordId, recordModel).get();
            record.setKeyword(Stream.of(vf.createLiteral("keyword1")).collect(Collectors.toSet()));

            assertFalse(conn.getStatements(recordId, vf.createIRI(Record.keyword_IRI), vf.createLiteral("keyword1"),
                    recordId).hasNext());

            manager.updateRecord(distributedCatalogId, record);
            assertTrue(conn.getStatements(recordId, vf.createIRI(Record.catalog_IRI), distributedCatalogId, recordId).hasNext());
            assertTrue(conn.getStatements(recordId, vf.createIRI(Record.keyword_IRI), vf.createLiteral("keyword1"),
                    recordId).hasNext());
        }
    }

    @Test
    public void testUpdateMappingRecord() throws Exception {
        Resource recordId = vf.createIRI("http://matonto.org/test/records#remove");

        try (RepositoryConnection conn = repo.getConnection()) {
            Model recordModel = mf.createModel();
            conn.getStatements(recordId, null, null, recordId).forEachRemaining(recordModel::add);

            MappingRecord record = mappingRecordFactory.getExisting(recordId, recordModel).get();
            record.setKeyword(Stream.of(vf.createLiteral("keyword1")).collect(Collectors.toSet()));

            assertTrue(conn.getStatements(recordId, vf.createIRI(Record.catalog_IRI), distributedCatalogId, recordId).hasNext());
            assertFalse(conn.getStatements(recordId, vf.createIRI(Record.keyword_IRI), vf.createLiteral("keyword1"),
                    recordId).hasNext());

            manager.updateRecord(distributedCatalogId, record);
            assertTrue(conn.getStatements(recordId, vf.createIRI(Record.catalog_IRI), distributedCatalogId, recordId).hasNext());
            assertTrue(conn.getStatements(recordId, vf.createIRI(Record.keyword_IRI), vf.createLiteral("keyword1"),
                    recordId).hasNext());
        }
    }

    /* removeRecord */

    @Test
    public void testRemoveRecord() throws Exception {
        Resource recordId = vf.createIRI("http://matonto.org/test/records#just-a-record");

        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(recordId, null, null, recordId).hasNext());

            manager.removeRecord(distributedCatalogId, recordId);
            assertFalse(conn.getStatements(recordId, null, null, recordId).hasNext());
        }
    }

    @Test
    public void testRemoveUnversionedRecord() throws Exception {
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test");

        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(recordId, null, null, recordId).hasNext());
            assertTrue(conn.getStatements(distributionId, null, null, distributionId).hasNext());

            manager.removeRecord(distributedCatalogId, recordId);
            assertFalse(conn.getStatements(recordId, null, null, recordId).hasNext());
            assertFalse(conn.getStatements(distributionId, null, null, distributionId).hasNext());
        }
    }

    @Test
    public void testRemoveVersionedRecord() throws Exception {
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Set<Resource> versions = Stream.of(vf.createIRI("http://matonto.org/test/versions#test"),
                vf.createIRI("http://matonto.org/test/versions#test2"),
                vf.createIRI("http://matonto.org/test/versions#test3"),
                vf.createIRI("http://matonto.org/test/versions#remove")).collect(Collectors.toSet());

        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(recordId, null, null, recordId).hasNext());
            versions.forEach(r -> assertTrue(conn.getStatements(r, null, null, r).hasNext()));

            manager.removeRecord(distributedCatalogId, recordId);
            assertFalse(conn.getStatements(recordId, null, null, recordId).hasNext());
            versions.forEach(r -> assertFalse(conn.getStatements(r, null, null, r).hasNext()));
        }
    }

    @Test
    public void testRemoveVersionedRDFRecord() throws Exception {
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Set<Resource> branches = Stream.of(vf.createIRI("http://matonto.org/test/branches#test"),
                vf.createIRI("http://matonto.org/test/branches#master")).collect(Collectors.toSet());

        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(recordId, null, null, recordId).hasNext());
            branches.forEach(r -> assertTrue(conn.getStatements(r, null, null, r).hasNext()));

            manager.removeRecord(distributedCatalogId, recordId);
            assertFalse(conn.getStatements(recordId, null, null, recordId).hasNext());
            branches.forEach(r -> assertFalse(conn.getStatements(r, null, null, r).hasNext()));
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRemoveRecordFromMissingCatalog() {
        Resource recordId = vf.createIRI("https://matonto.org/records#test");
        manager.removeRecord(differentId, recordId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRemoveMissingRecord() {
        manager.removeRecord(distributedCatalogId, notPresentId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRemoveRecordFromWrongCatalog() {
        Resource recordId = vf.createIRI("https://matonto.org/records#test");
        Resource distributedCatalogId = vf.createIRI("http://matonto.org/test/catalog-local");
        manager.removeRecord(distributedCatalogId, recordId);
    }

    /* getRecord */

    @Test
    public void testGetRecord() throws Exception {
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(recordId, null, null, recordId).hasNext());
        }

        Optional<Record> result = manager.getRecord(distributedCatalogId, recordId, recordFactory);
        assertTrue(result.isPresent());
        Record record = result.get();
        assertTrue(record.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals("Get", record.getProperty(vf.createIRI(DC_TITLE)).get().stringValue());
        assertTrue(record.getProperty(vf.createIRI(DC_DESCRIPTION)).isPresent());
        assertEquals("Description", record.getProperty(vf.createIRI(DC_DESCRIPTION)).get().stringValue());
        assertTrue(record.getProperty(vf.createIRI(DC_MODIFIED)).isPresent());
        assertTrue(record.getProperty(vf.createIRI(DC_ISSUED)).isPresent());
    }

    @Test
    public void testUnversionedRecord() throws Exception {
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");

        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(recordId, null, null, recordId).hasNext());
        }

        Optional<UnversionedRecord> result= manager.getRecord(distributedCatalogId, recordId, unversionedRecordFactory);
        assertTrue(result.isPresent());
        UnversionedRecord record = result.get();
        assertTrue(record.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals("Unversioned", record.getProperty(vf.createIRI(DC_TITLE)).get().stringValue());
        assertTrue(record.getProperty(vf.createIRI(DC_DESCRIPTION)).isPresent());
        assertEquals("Description", record.getProperty(vf.createIRI(DC_DESCRIPTION)).get().stringValue());
        assertTrue(record.getProperty(vf.createIRI(DC_MODIFIED)).isPresent());
        assertTrue(record.getProperty(vf.createIRI(DC_ISSUED)).isPresent());
    }

    @Test
    public void testGetVersionedRecord() throws Exception {
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");

        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(recordId, null, null, recordId).hasNext());
        }

        Optional<VersionedRecord> result = manager.getRecord(distributedCatalogId, recordId, versionedRecordFactory);
        assertTrue(result.isPresent());
        VersionedRecord record = result.get();
        assertTrue(record.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals("Get", record.getProperty(vf.createIRI(DC_TITLE)).get().stringValue());
        assertTrue(record.getProperty(vf.createIRI(DC_DESCRIPTION)).isPresent());
        assertEquals("Description", record.getProperty(vf.createIRI(DC_DESCRIPTION)).get().stringValue());
        assertTrue(record.getProperty(vf.createIRI(DC_MODIFIED)).isPresent());
        assertTrue(record.getProperty(vf.createIRI(DC_ISSUED)).isPresent());
    }

    @Test
    public void testGetVersionedRDFRecord() throws Exception {
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");

        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(recordId, null, null, recordId).hasNext());
        }

        Optional<VersionedRDFRecord> result = manager.getRecord(distributedCatalogId, recordId, versionedRDFRecordFactory);
        assertTrue(result.isPresent());
        VersionedRDFRecord record = result.get();
        assertTrue(record.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals("Versioned RDF", record.getProperty(vf.createIRI(DC_TITLE)).get().stringValue());
        assertTrue(record.getProperty(vf.createIRI(DC_DESCRIPTION)).isPresent());
        assertEquals("Description", record.getProperty(vf.createIRI(DC_DESCRIPTION)).get().stringValue());
        assertTrue(record.getProperty(vf.createIRI(DC_MODIFIED)).isPresent());
        assertTrue(record.getProperty(vf.createIRI(DC_ISSUED)).isPresent());
    }

    @Test
    public void testGetOntologyRecord() throws Exception {
        Resource recordId = vf.createIRI("http://matonto.org/test/records#update");

        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(recordId, null, null, recordId).hasNext());
        }

        Optional<OntologyRecord> result = manager.getRecord(distributedCatalogId, recordId, ontologyRecordFactory);
        assertTrue(result.isPresent());
        OntologyRecord record = result.get();
        assertTrue(record.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals("Update", record.getProperty(vf.createIRI(DC_TITLE)).get().stringValue());
        assertTrue(record.getProperty(vf.createIRI(DC_DESCRIPTION)).isPresent());
        assertEquals("Description", record.getProperty(vf.createIRI(DC_DESCRIPTION)).get().stringValue());
        assertTrue(record.getProperty(vf.createIRI(DC_MODIFIED)).isPresent());
        assertTrue(record.getProperty(vf.createIRI(DC_ISSUED)).isPresent());
    }

    @Test
    public void testGetMappingRecord() throws Exception {
        Resource recordId = vf.createIRI("http://matonto.org/test/records#remove");

        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(recordId, null, null, recordId).hasNext());
        }

        Optional<MappingRecord> result = manager.getRecord(distributedCatalogId, recordId, mappingRecordFactory);
        assertTrue(result.isPresent());
        MappingRecord record = result.get();
        assertTrue(record.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals("Remove", record.getProperty(vf.createIRI(DC_TITLE)).get().stringValue());
        assertTrue(record.getProperty(vf.createIRI(DC_DESCRIPTION)).isPresent());
        assertEquals("Description", record.getProperty(vf.createIRI(DC_DESCRIPTION)).get().stringValue());
        assertTrue(record.getProperty(vf.createIRI(DC_MODIFIED)).isPresent());
        assertTrue(record.getProperty(vf.createIRI(DC_ISSUED)).isPresent());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetRecordFromMissingCatalog() {
        Resource recordId = vf.createIRI("https://matonto.org/records#test");
        manager.getRecord(differentId, recordId, recordFactory);
    }

    @Test
    public void testGetMissingRecordFromCatalog() {
        Optional<Record> result = manager.getRecord(distributedCatalogId, notPresentId, recordFactory);
        assertFalse(result.isPresent());
    }

    @Test
    public void testGetRecordFromWrongCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("https://matonto.org/records#test");

        Optional<Record> result = manager.getRecord(localCatalogId, recordId, recordFactory);
        assertFalse(result.isPresent());
    }

    /* findRecords */

    @Test
    public void testFindRecordsReturnsCorrectDataFirstPage() throws Exception {
        // given
        int limit = 1;
        int offset = 0;
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().limit(limit).offset(offset).build();
        // when
        PaginatedSearchResults<Record> records = manager.findRecord(distributedCatalogId, searchParams);
        // then
        assertEquals(1, records.getPage().size());
        assertEquals(TOTAL_SIZE, records.getTotalSize());
        assertEquals(1, records.getPageSize());
        assertEquals(1, records.getPageNumber());
    }

    @Test
    public void testFindRecordsReturnsCorrectDataLastPage() throws Exception {
        // given
        int limit = 1;
        int offset = 1;
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().limit(limit).offset(offset).build();
        // when
        PaginatedSearchResults<Record> records = manager.findRecord(distributedCatalogId, searchParams);
        // then
        assertEquals(1, records.getPage().size());
        assertEquals(TOTAL_SIZE, records.getTotalSize());
        assertEquals(1, records.getPageSize());
        assertEquals(2, records.getPageNumber());
    }

    @Test
    public void testFindRecordsReturnsCorrectDataOnePage() throws Exception {
        // given
        int limit = 1000;
        int offset = 0;
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().limit(limit).offset(offset).build();
        // when
        PaginatedSearchResults<Record> records = manager.findRecord(distributedCatalogId, searchParams);
        // then
        assertEquals(TOTAL_SIZE, records.getPage().size());
        assertEquals(TOTAL_SIZE, records.getTotalSize());
        assertEquals(1000, records.getPageSize());
        assertEquals(1, records.getPageNumber());
    }

    @Test
    public void testFindRecordsOrdering() throws Exception {
        // given
        IRI modified = vf.createIRI(DC_MODIFIED);
        IRI issued = vf.createIRI(DC_ISSUED);
        IRI title = vf.createIRI(DC_TITLE);
        int limit = 1;
        int offset = 0;
        PaginatedSearchParams searchParams1 = new PaginatedSearchParams.Builder().limit(limit).offset(offset).sortBy(modified).ascending(true).build();
        PaginatedSearchParams searchParams2 = new PaginatedSearchParams.Builder().limit(limit).offset(offset).sortBy(modified).ascending(false).build();
        PaginatedSearchParams searchParams3 = new PaginatedSearchParams.Builder().limit(limit).offset(offset).sortBy(issued).ascending(true).build();
        PaginatedSearchParams searchParams4 = new PaginatedSearchParams.Builder().limit(limit).offset(offset).sortBy(issued).ascending(false).build();
        PaginatedSearchParams searchParams5 = new PaginatedSearchParams.Builder().limit(limit).offset(offset).sortBy(title).ascending(true).build();
        PaginatedSearchParams searchParams6 = new PaginatedSearchParams.Builder().limit(limit).offset(offset).sortBy(title).ascending(false).build();
        // when
        PaginatedSearchResults<Record> resources1 = manager.findRecord(distributedCatalogId, searchParams1);
        PaginatedSearchResults<Record> resources2 = manager.findRecord(distributedCatalogId, searchParams2);
        PaginatedSearchResults<Record> resources3 = manager.findRecord(distributedCatalogId, searchParams3);
        PaginatedSearchResults<Record> resources4 = manager.findRecord(distributedCatalogId, searchParams4);
        PaginatedSearchResults<Record> resources5 = manager.findRecord(distributedCatalogId, searchParams5);
        PaginatedSearchResults<Record> resources6 = manager.findRecord(distributedCatalogId, searchParams6);
        // then
        assertEquals(resources1.getPage().iterator().next().getResource().stringValue(), "http://matonto.org/test/records#get");
        assertEquals(resources2.getPage().iterator().next().getResource().stringValue(), "http://matonto.org/test/records#update");
        assertEquals(resources3.getPage().iterator().next().getResource().stringValue(), "http://matonto.org/test/records#update");
        assertEquals(resources4.getPage().iterator().next().getResource().stringValue(), "http://matonto.org/test/records#get");
        assertEquals(resources5.getPage().iterator().next().getResource().stringValue(), "http://matonto.org/test/records#dataset");
        assertEquals(resources6.getPage().iterator().next().getResource().stringValue(), "http://matonto.org/test/records#versionedRDF");
    }

    @Test
    public void testFindRecordsWithSearchText() throws Exception {
        // given
        int limit = 10;
        int offset = 0;
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().limit(limit).offset(offset).searchText("Get").build();
        // when
        PaginatedSearchResults<Record> records = manager.findRecord(distributedCatalogId, searchParams);
        // then
        assertEquals(2, records.getPage().size());
        assertEquals(2, records.getTotalSize());
        assertEquals(10, records.getPageSize());
        assertEquals(1, records.getPageNumber());
    }

    @Test
    public void testFindRecordWithEmptyRepository() throws Exception {
        // given
        Repository repo2 = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo2.initialize();
        manager.setRepository(repo2);
        int limit = 1;
        int offset = 0;
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().limit(limit).offset(offset).build();
        // when
        PaginatedSearchResults<Record> records = manager.findRecord(distributedCatalogId, searchParams);
        // then
        assertEquals(records.getPage().size(), 0);
        assertEquals(records.getTotalSize(), 0);
    }

    @Test
    public void testFindRecordWithNoEntries() throws Exception {
        // given
        int limit = 1;
        int offset = 0;
        IRI localCatalogId = vf.createIRI("http://matonto.org/test/catalog-missing");
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().limit(limit).offset(offset).build();
        // when
        PaginatedSearchResults<Record> records = manager.findRecord(localCatalogId, searchParams);
        // then
        assertEquals(records.getPage().size(), 0);
        assertEquals(records.getTotalSize(), 0);
    }

    @Test
    public void testFindRecordsWithTypeFilter() throws Exception {
        // given
        int limit = 1000;
        int offset = 0;
        PaginatedSearchParams ontSearchParams = new PaginatedSearchParams.Builder().limit(limit).offset(offset).typeFilter(ONT_TYPE).build();
        PaginatedSearchParams mappingSearchParams = new PaginatedSearchParams.Builder().limit(limit).offset(offset).typeFilter(MAPPING_TYPE).build();
        PaginatedSearchParams fullSearchParams = new PaginatedSearchParams.Builder().limit(limit).offset(offset).build();
        // when
        PaginatedSearchResults<Record> ontRecords = manager.findRecord(distributedCatalogId, ontSearchParams);
        PaginatedSearchResults<Record> mappingRecords = manager.findRecord(distributedCatalogId, mappingSearchParams);
        PaginatedSearchResults<Record> fullRecords = manager.findRecord(distributedCatalogId, fullSearchParams);
        // then
        assertEquals(1, ontRecords.getPage().size());
        assertEquals(1, ontRecords.getTotalSize());
        assertEquals(1, mappingRecords.getPage().size());
        assertEquals(1, mappingRecords.getTotalSize());
        assertEquals(TOTAL_SIZE, fullRecords.getPage().size());
        assertEquals(TOTAL_SIZE, fullRecords.getTotalSize());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testFindRecordWithOffsetThatIsTooLarge() {
        // given
        int limit = 10;
        int offset = 11;
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().limit(limit).offset(offset).build();
        // when
        manager.findRecord(distributedCatalogId, searchParams);
    }

    /* getUnversionedDistributions */

    @Test
    public void testGetUnversionedDistributions() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");

        Set<Distribution> distributions = manager.getUnversionedDistributions(distributedCatalogId, recordId);
        assertEquals(1, distributions.size());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetUnversionedDistributionsOfRecordInMissingCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");

        manager.getUnversionedDistributions(differentId, recordId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetUnversionedDistributionsOfMissingRecord() {
        manager.getUnversionedDistributions(distributedCatalogId, notPresentId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetUnversionedDistributionsOfWrongTypeOfRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");

        manager.getUnversionedDistributions(distributedCatalogId, recordId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetUnversionedDistributionsOfRecordInWrongCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");

        manager.getUnversionedDistributions(localCatalogId, recordId);
    }

    /* addUnversionedDistribution */

    @Test
    public void testAddUnversionedDistribution() throws Exception {
        // Setup:
        IRI distributionIRI = vf.createIRI(UnversionedRecord.unversionedDistribution_IRI);
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Resource distributionId = vf.createIRI("https://matonto.org/distributions#new");
        Distribution distribution = distributionFactory.createNew(distributionId);

        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(conn.getStatements(distributionId, null, null, distributionId).hasNext());

            manager.addUnversionedDistribution(distributedCatalogId, recordId, distribution);
            assertTrue(conn.getStatements(distributionId, null, null, distributionId).hasNext());
            assertTrue(conn.getStatements(recordId, distributionIRI, distributionId, recordId).hasNext());
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddUnversionedDistributionToRecordFromMissingCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Distribution distribution = distributionFactory.createNew(vf.createIRI("https://matonto.org/distributions#new"));

        manager.addUnversionedDistribution(differentId, recordId, distribution);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddUnversionedDistributionToMissingRecord() {
        // Setup:
        Distribution distribution = distributionFactory.createNew(vf.createIRI("https://matonto.org/distributions#new"));

        manager.addUnversionedDistribution(distributedCatalogId, notPresentId, distribution);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddUnversionedDistributionToWrongTypeOfRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Distribution distribution = distributionFactory.createNew(vf.createIRI("https://matonto.org/distributions#new"));

        manager.addUnversionedDistribution(distributedCatalogId, recordId, distribution);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddUnversionedDistributionToRecordFromWrongCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Distribution distribution = distributionFactory.createNew(vf.createIRI("https://matonto.org/distributions#new"));

        manager.addUnversionedDistribution(localCatalogId, recordId, distribution);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddUnversionedDistributionWithTakenResource() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Distribution distribution = distributionFactory.createNew(vf.createIRI("http://matonto.org/test/distributions#test"));

        manager.addUnversionedDistribution(distributedCatalogId, recordId, distribution);
    }

    /* updateUnversionedDistribution */

    @Test
    public void testUpdateUnversionedDistribution() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test");
        Model distributionModel = mf.createModel();
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.getStatements(distributionId, null, null, distributionId).forEach(distributionModel::add);
            Distribution distribution = distributionFactory.getExisting(distributionId, distributionModel).get();
            distribution.getModel().add(distributionId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"));
            assertFalse(conn.getStatements(distributionId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"))
                    .hasNext());

            manager.updateUnversionedDistribution(distributedCatalogId, recordId, distribution);
            assertTrue(conn.getStatements(distributionId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"),
                    distributionId).hasNext());
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateUnversionedDistributionOfRecordFromMissingCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Distribution distribution = distributionFactory.createNew(vf.createIRI("http://matonto.org/test/distributions#test"));

        manager.updateUnversionedDistribution(differentId, recordId, distribution);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateUnversionedDistributionOfMissingRecord() {
        // Setup:
        Distribution distribution = distributionFactory.createNew(vf.createIRI("http://matonto.org/test/distributions#test"));

        manager.updateUnversionedDistribution(distributedCatalogId, notPresentId, distribution);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateUnversionedDistributionOfWrongTypeOfRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Distribution distribution = distributionFactory.createNew(vf.createIRI("http://matonto.org/test/distributions#test"));

        manager.updateUnversionedDistribution(distributedCatalogId, recordId, distribution);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateUnversionedDistributionOfRecordFromWrongCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Distribution distribution = distributionFactory.createNew(vf.createIRI("http://matonto.org/test/distributions#test"));

        manager.updateUnversionedDistribution(localCatalogId, recordId, distribution);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateMissingUnversionedDistribution() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Distribution distribution = distributionFactory.createNew(notPresentId);

        manager.updateUnversionedDistribution(distributedCatalogId, recordId, distribution);
    }

    /* removeUnversionedDistribution */

    @Test
    public void testRemoveUnversionedDistribution() throws Exception {
        // Setup:
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test");
        Resource unversionedId = vf.createIRI("http://matonto.org/test/records#unversioned");
        IRI distributionIRI = vf.createIRI(UnversionedRecord.unversionedDistribution_IRI);

        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(distributionId, null, null, distributionId).hasNext());
            assertTrue(conn.getStatements(unversionedId, distributionIRI, distributionId, unversionedId).hasNext());

            manager.removeUnversionedDistribution(distributedCatalogId, unversionedId, distributionId);
            assertFalse(conn.getStatements(distributionId, null, null, distributionId).hasNext());
            assertFalse(conn.getStatements(unversionedId, distributionIRI, distributionId, unversionedId).hasNext());
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRemoveUnversionedDistributionFromRecordInMissingCatalog() {
        // Setup:
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test");
        Resource unversionedId = vf.createIRI("http://matonto.org/test/records#unversioned");

        manager.removeUnversionedDistribution(differentId, unversionedId, distributionId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRemoveUnversionedDistributionFromMissingRecord() {
        // Setup:
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test");

        manager.removeUnversionedDistribution(distributedCatalogId, notPresentId, distributionId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRemoveUnverisonedDistributionFromWrongTypeOfRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test");

        manager.removeUnversionedDistribution(distributedCatalogId, recordId, distributionId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRemoveUnversionedDistributionFromRecordInWrongCatalog() {
        // Setup:
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test");
        Resource unversionedId = vf.createIRI("http://matonto.org/test/records#unversioned");

        manager.removeUnversionedDistribution(localCatalogId, unversionedId, distributionId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRemoveMissingUnversionedDistribution() {
        // Setup:
        Resource unversionedId = vf.createIRI("http://matonto.org/test/records#unversioned");

        manager.removeUnversionedDistribution(distributedCatalogId, unversionedId, notPresentId);
    }

    /* getUnversionedDistribution */

    @Test
    public void testGetUnversionedDistribution() throws Exception {
        // Setup:
        Resource unversionedId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test");
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(distributionId, null, null, distributionId).hasNext());
        }

        Optional<Distribution> result = manager.getUnversionedDistribution(distributedCatalogId, unversionedId, distributionId);
        assertTrue(result.isPresent());
        Distribution distribution = result.get();
        assertTrue(distribution.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals("Distribution", distribution.getProperty(vf.createIRI(DC_TITLE)).get().stringValue());
        assertTrue(distribution.getProperty(vf.createIRI(DC_ISSUED)).isPresent());
        assertTrue(distribution.getProperty(vf.createIRI(DC_MODIFIED)).isPresent());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetUnversionedDistributionOfRecordInMissingCatalog() {
        // Setup:
        Resource unversionedId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test");

        manager.getUnversionedDistribution(differentId, unversionedId, distributionId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetUnversionedDistributionOfMissingRecord() {
        // Setup:
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test");

        manager.getUnversionedDistribution(distributedCatalogId, notPresentId, distributionId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetUnversionedDistributionOfWrongTypeOfRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test");

        manager.getUnversionedDistribution(distributedCatalogId, recordId, distributionId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetUnversionedDistributionOfRecordInWrongCatalog() {
        // Setup:
        Resource unversionedId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test");

        manager.getUnversionedDistribution(localCatalogId, unversionedId, distributionId);
    }

    @Test
    public void testGetUnversionedDistributionOfWrongRecord() throws Exception {
        // Setup:
        Resource unversionedId = vf.createIRI("http://matonto.org/test/records#unversioned");

        Optional<Distribution> result = manager.getUnversionedDistribution(distributedCatalogId, unversionedId, notPresentId);
        assertFalse(result.isPresent());
    }

    @Test(expected = IllegalStateException.class)
    public void testGetMissingUnversionedDistribution() {
        // Setup:
        Resource unversionedId = vf.createIRI("http://matonto.org/test/records#unversioned-missing");

        manager.getUnversionedDistribution(distributedCatalogId, unversionedId, notPresentId);
    }

    /* getVersions */

    @Test
    public void testGetVersions() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");

        Set<Version> versions = manager.getVersions(distributedCatalogId, recordId);
        assertEquals(4, versions.size());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetVersionsOfRecordInMissingCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");

        manager.getVersions(differentId, recordId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetVersionsOfMissingRecord() {
        manager.getVersions(distributedCatalogId, notPresentId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetVersionsOfWrongTypeOfRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");

        manager.getVersions(distributedCatalogId, recordId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetVersionsOfRecordInWrongCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");

        manager.getVersions(localCatalogId, recordId);
    }

    /* addVersion */

    @Test
    public void testAddVersion() throws Exception {
        // Setup:
        IRI latestVersionIRI = vf.createIRI(VersionedRecord.latestVersion_IRI);
        IRI versionPropIRI = vf.createIRI(VersionedRecord.version_IRI);
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Resource versionId = vf.createIRI("https://matonto.org/versions#new");
        Version version = versionFactory.createNew(versionId);

        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(conn.getStatements(versionId, null, null, versionId).hasNext());
            assertTrue(conn.getStatements(recordId, latestVersionIRI, null, recordId).hasNext());
            assertFalse(conn.getStatements(recordId, latestVersionIRI, versionId, recordId).hasNext());
            assertTrue(conn.getStatements(recordId, versionPropIRI, null, recordId).hasNext());
            assertFalse(conn.getStatements(recordId, versionPropIRI, versionId, recordId).hasNext());

            manager.addVersion(distributedCatalogId, recordId, version);
            assertTrue(conn.getStatements(versionId, null, null, versionId).hasNext());
            assertTrue(conn.getStatements(recordId, latestVersionIRI, versionId, recordId).hasNext());
            assertTrue(conn.getStatements(recordId, versionPropIRI, versionId, recordId).hasNext());
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddVersionToRecordInMissingCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Version version = versionFactory.createNew(vf.createIRI("https://matonto.org/versions#new"));

        manager.addVersion(differentId, recordId, version);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddVersionToMissingRecord() {
        // Setup:
        Version version = versionFactory.createNew(vf.createIRI("https://matonto.org/versions#new"));

        manager.addVersion(distributedCatalogId, notPresentId, version);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddVersionToWrongTypeOfRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Version version = versionFactory.createNew(vf.createIRI("https://matonto.org/versions#new"));

        manager.addVersion(distributedCatalogId, recordId, version);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddVersionToRecordInWrongCatalog() {
        // Setup:
        Resource versionedRecordId = vf.createIRI("http://matonto.org/test/records#get");
        Version version = versionFactory.createNew(vf.createIRI("https://matonto.org/versions#new"));

        manager.addVersion(localCatalogId, versionedRecordId, version);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddVersionWithTakenResource() {
        // Setup:
        Resource versionedRecordId = vf.createIRI("http://matonto.org/test/records#get");
        Version version = versionFactory.createNew(vf.createIRI("http://matonto.org/test/versions#test"));

        manager.addVersion(distributedCatalogId, versionedRecordId, version);
    }

    @Test
    public void testAddTag() throws Exception {
        IRI latestVersionIRI = vf.createIRI(VersionedRecord.latestVersion_IRI);
        Resource versionId = vf.createIRI("https://matonto.org/versions#new");
        Resource versionedRecordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");

        Tag version = tagFactory.createNew(versionId);
        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(conn.getStatements(versionId, null, null, versionId).hasNext());
            assertTrue(conn.getStatements(versionedRecordId, latestVersionIRI, null, versionedRecordId).hasNext());
            assertFalse(conn.getStatements(versionedRecordId, latestVersionIRI, versionId, versionedRecordId).hasNext());

            manager.addVersion(distributedCatalogId, versionedRecordId, version);
            assertTrue(conn.getStatements(versionId, null, null, versionId).hasNext());
            assertTrue(conn.getStatements(versionedRecordId, latestVersionIRI, versionId, versionedRecordId).hasNext());
        }
    }

    /* updateVersion */

    @Test
    public void testUpdateVersion() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");
        Model versionModel = mf.createModel();
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.getStatements(versionId, null, null, versionId).forEach(versionModel::add);
            Version version = versionFactory.getExisting(versionId, versionModel).get();
            version.getModel().add(versionId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"));
            assertFalse(conn.getStatements(versionId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title")).hasNext());

            manager.updateVersion(distributedCatalogId, recordId, version);
            assertTrue(conn.getStatements(versionId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"), versionId)
                    .hasNext());
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateVersionOfRecordInMissingCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Version version = versionFactory.createNew(vf.createIRI("http://matonto.org/test/versions#test"));

        manager.updateVersion(differentId, recordId, version);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateVersionOfMissingRecord() {
        // Setup:
        Version version = versionFactory.createNew(vf.createIRI("http://matonto.org/test/versions#test"));

        manager.updateVersion(distributedCatalogId, notPresentId, version);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateVersionOfWrongTypeOfRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Version version = versionFactory.createNew(vf.createIRI("http://matonto.org/test/versions#test"));

        manager.updateVersion(distributedCatalogId, recordId, version);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateVersionOfRecordInWrongCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Version version = versionFactory.createNew(vf.createIRI("http://matonto.org/test/versions#test"));

        manager.updateVersion(localCatalogId, recordId, version);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateMissingVersion() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Version version = versionFactory.createNew(notPresentId);

        manager.updateVersion(distributedCatalogId, recordId, version);
    }

    @Test
    public void testUpdateTag() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource tagId = vf.createIRI("http://matonto.org/test/tags#test");
        try (RepositoryConnection conn = repo.getConnection()) {
            Model tagModel = mf.createModel();
            conn.getStatements(tagId, null, null, tagId).forEach(tagModel::add);
            Tag tag = tagFactory.getExisting(tagId, tagModel).get();
            tag.getModel().add(tagId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"));
            assertFalse(conn.getStatements(tagId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title")).hasNext());

            manager.updateVersion(distributedCatalogId, recordId, tag);
            assertTrue(conn.getStatements(tagId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"), tagId).hasNext());
        }
    }

    /* removeVersion */

    @Test
    public void testRemoveVersion() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#remove");
        Resource latestVersionId = vf.createIRI("http://matonto.org/test/versions#test");
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test2");
        IRI versionIRI = vf.createIRI(VersionedRecord.version_IRI);
        IRI latestIRI = vf.createIRI(VersionedRecord.latestVersion_IRI);
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(recordId, versionIRI, latestVersionId, recordId).hasNext());
            assertTrue(conn.getStatements(distributionId, null, null, distributionId).hasNext());

            manager.removeVersion(distributedCatalogId, recordId, versionId);
            assertFalse(conn.getStatements(versionId, null, null, versionId).hasNext());
            assertTrue(conn.getStatements(recordId, latestIRI, latestVersionId, recordId).hasNext());
            assertFalse(conn.getStatements(recordId, versionIRI, versionId, recordId).hasNext());
            assertFalse(conn.getStatements(distributionId, null, null, distributionId).hasNext());
        }
    }

    @Test
    public void testRemoveLatestVersion() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Resource newLatestVersionId = vf.createIRI("http://matonto.org/test/versions#test2");
        Resource latestVersionId = vf.createIRI("http://matonto.org/test/versions#test");
        IRI versionIRI = vf.createIRI(VersionedRecord.version_IRI);
        IRI latestIRI = vf.createIRI(VersionedRecord.latestVersion_IRI);
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(recordId, versionIRI, latestVersionId, recordId).hasNext());

            manager.removeVersion(distributedCatalogId, recordId, latestVersionId);
            assertFalse(conn.getStatements(latestVersionId, null, null, latestVersionId).hasNext());
            assertTrue(conn.getStatements(recordId, versionIRI, newLatestVersionId, recordId).hasNext());
            assertTrue(conn.getStatements(recordId, latestIRI, newLatestVersionId, recordId).hasNext());
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRemoveVersionOfRecordInMissingCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#remove");

        manager.removeVersion(differentId, recordId, versionId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRemoveVersionOfMissingRecord() {
        // Setup:
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#remove");

        manager.removeVersion(distributedCatalogId, notPresentId, versionId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRemoveVersionOfWrongTypeOfRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversinoed");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#remove");

        manager.removeVersion(distributedCatalogId, recordId, versionId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRemoveVersionOfRecordInWrongCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#remove");

        manager.removeVersion(localCatalogId, recordId, versionId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRemoveMissingVersion() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");

        manager.removeVersion(distributedCatalogId, recordId, notPresentId);
    }

    /* getVersion */

    @Test
    public void testGetVersion() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(versionId, null, null, versionId).hasNext());
        }

        Optional<Version> result = manager.getVersion(distributedCatalogId, recordId, versionId, versionFactory);
        assertTrue(result.isPresent());
        Version version = result.get();
        assertTrue(version.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals("Version", version.getProperty(vf.createIRI(DC_TITLE)).get().stringValue());
        assertTrue(version.getProperty(vf.createIRI(DC_ISSUED)).isPresent());
        assertTrue(version.getProperty(vf.createIRI(DC_MODIFIED)).isPresent());
    }

    @Test
    public void testGetTag() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource versionId = vf.createIRI("http://matonto.org/test/tags#test");
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(versionId, null, null, versionId).hasNext());
        }

        Optional<Tag> result = manager.getVersion(distributedCatalogId, recordId, versionId, tagFactory);
        assertTrue(result.isPresent());
        Tag version = result.get();
        assertTrue(version.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals("Tag", version.getProperty(vf.createIRI(DC_TITLE)).get().stringValue());
        assertTrue(version.getProperty(vf.createIRI(DC_ISSUED)).isPresent());
        assertTrue(version.getProperty(vf.createIRI(DC_MODIFIED)).isPresent());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetVersionOfRecordInMissingCatalog() {
        // Setup
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");

        manager.getVersion(differentId, recordId, versionId, versionFactory);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetVersionOfMissingRecord() {
        // Setup
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");

        manager.getVersion(distributedCatalogId, notPresentId, versionId, versionFactory);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetVersionOfWrongTypeOfRecord() {
        // Setup
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");

        manager.getVersion(distributedCatalogId, recordId, versionId, versionFactory);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetVersionOfRecordInWrongCatalog() {
        // Setup
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");

        manager.getVersion(localCatalogId, recordId, versionId, versionFactory);
    }

    @Test
    public void testGetVersionOfWrongRecord() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");

        Optional<Version> result = manager.getVersion(distributedCatalogId, recordId, notPresentId, versionFactory);
        assertFalse(result.isPresent());
    }

    @Test(expected = IllegalStateException.class)
    public void testGetMissingVersion() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get-missing");

        manager.getVersion(distributedCatalogId, recordId, notPresentId, versionFactory);
    }

    /* getLatestVersion */

    @Test
    public void getLatestVersion() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");

        Optional<Version> result = manager.getLatestVersion(distributedCatalogId, recordId, versionFactory);
        assertTrue(result.isPresent());
        Version version = result.get();
        assertTrue(version.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals("Version", version.getProperty(vf.createIRI(DC_TITLE)).get().stringValue());
        assertTrue(version.getProperty(vf.createIRI(DC_ISSUED)).isPresent());
        assertTrue(version.getProperty(vf.createIRI(DC_MODIFIED)).isPresent());
    }

    @Test
    public void getLatestTag() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");

        Optional<Tag> result = manager.getLatestVersion(distributedCatalogId, recordId, tagFactory);
        assertTrue(result.isPresent());
        Tag version = result.get();
        assertTrue(version.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals("Tag", version.getProperty(vf.createIRI(DC_TITLE)).get().stringValue());
        assertTrue(version.getProperty(vf.createIRI(DC_ISSUED)).isPresent());
        assertTrue(version.getProperty(vf.createIRI(DC_MODIFIED)).isPresent());
    }

    @Test(expected = IllegalArgumentException.class)
    public void getLatestVersionOfRecordInMissingCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");

        manager.getLatestVersion(differentId, recordId, versionFactory);
    }

    @Test(expected = IllegalArgumentException.class)
    public void getLatestVersionOfMissingRecord() {
        manager.getLatestVersion(distributedCatalogId, notPresentId, versionFactory);
    }

    @Test(expected = IllegalArgumentException.class)
    public void getLatestVersionOfWrongTypeOfRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");

        manager.getLatestVersion(distributedCatalogId, recordId, versionFactory);
    }

    @Test(expected = IllegalArgumentException.class)
    public void getLatestVersionOfRecordInWrongCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");

        manager.getLatestVersion(localCatalogId, recordId, versionFactory);
    }

    @Test
    public void getLatestVersionOnRecordNotSet() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#update");

        Optional<Version> result = manager.getLatestVersion(distributedCatalogId, recordId, versionFactory);
        assertFalse(result.isPresent());
    }

    @Test(expected = IllegalStateException.class)
    public void getMissingLatestVersion() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#update-missing");

        manager.getLatestVersion(distributedCatalogId, recordId, versionFactory);
    }

    /* getTaggedCommit */

    @Test
    public void testGetTaggedCommit() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource versionId = vf.createIRI("http://matonto.org/test/tags#test");

        Commit commit = manager.getTaggedCommit(distributedCatalogId, recordId, versionId);
        assertEquals(vf.createIRI("http://matonto.org/test/commits#conflict2"), commit.getResource());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetTaggedCommitOfRecordInMissingCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource versionId = vf.createIRI("http://matonto.org/test/tags#test");

        manager.getTaggedCommit(differentId, recordId, versionId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetTaggedCommitOfMissingRecord() {
        // Setup:
        Resource versionId = vf.createIRI("http://matonto.org/test/tags#test");

        manager.getTaggedCommit(distributedCatalogId, notPresentId, versionId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetTaggedCommitOfWrongTypeOfRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Resource versionId = vf.createIRI("http://matonto.org/test/tags#test");

        manager.getTaggedCommit(distributedCatalogId, recordId, versionId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetTaggedCommitOfRecordInWrongCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource versionId = vf.createIRI("http://matonto.org/test/tags#test");

        manager.getTaggedCommit(localCatalogId, recordId, versionId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetTaggedCommitOfTaggedOfWrongRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");

        manager.getTaggedCommit(distributedCatalogId, recordId, notPresentId);
    }

    @Test(expected = IllegalStateException.class)
    public void testGetTaggedCommitOfMissingTag() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#update-missing");

        manager.getTaggedCommit(distributedCatalogId, recordId, notPresentId);
    }

    @Test(expected = IllegalStateException.class)
    public void testGetTaggedCommitOfWrongTypeOfVersion() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");

        manager.getTaggedCommit(distributedCatalogId, recordId, versionId);
    }

    @Test(expected = IllegalStateException.class)
    public void testGetTaggedCommitWithoutCommitSet() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource versionId = vf.createIRI("http://matonto.org/test/tags#noCommit");

        manager.getTaggedCommit(distributedCatalogId, recordId, versionId);
    }

    @Test(expected = IllegalStateException.class)
    public void testGetTaggedMissingCommit() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#remove");
        Resource versionId = vf.createIRI("http://matonto.org/test/tags#test-missing");

        manager.getTaggedCommit(distributedCatalogId, recordId, versionId);
    }

    /* getVersionedDistributions */

    @Test
    public void testGetVersionedDistributions() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");

        Set<Distribution> distributions = manager.getVersionedDistributions(distributedCatalogId, recordId, versionId);
        assertEquals(1, distributions.size());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetVersionedDistributionsOfVersionOfRecordInMissingCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");

        manager.getVersionedDistributions(differentId, recordId, versionId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetVersionedDistributionsOfVersionOfMissingRecord() {
        // Setup:
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");

        manager.getVersionedDistributions(distributedCatalogId, notPresentId, versionId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetVersionedDistributionsOfVersionOfWrongTypeOfRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");

        manager.getVersionedDistributions(distributedCatalogId, recordId, versionId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetVersionedDistributionsOfVersionOfRecordInWrongCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");

        manager.getVersionedDistributions(localCatalogId, recordId, versionId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetVersionedDistributionsOfMissingVersion() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");

        manager.getVersionedDistributions(distributedCatalogId, recordId, notPresentId);
    }

    /* addVersionedDistribution */

    @Test
    public void testAddVersionedDistribution() throws Exception {
        // Setup:
        IRI distributionIRI = vf.createIRI(Version.versionedDistribution_IRI);
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");
        Resource distributionId = vf.createIRI("https://matonto.org/distributions#new");
        Distribution distribution = distributionFactory.createNew(distributionId);

        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(conn.getStatements(distributionId, null, null, distributionId).hasNext());

            manager.addVersionedDistribution(distributedCatalogId, recordId, versionId, distribution);
            assertTrue(conn.getStatements(distributionId, null, null, distributionId).hasNext());
            assertTrue(conn.getStatements(versionId, distributionIRI, distributionId, versionId).hasNext());
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddVersionedDistributionToVersionOfRecordInMissingCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");
        Distribution distribution = distributionFactory.createNew(vf.createIRI("https://matonto.org/distributions#new"));

        manager.addVersionedDistribution(differentId, recordId, versionId, distribution);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddVersionedDistributionToVersionOfMissingRecord() {
        // Setup:
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");
        Distribution distribution = distributionFactory.createNew(vf.createIRI("https://matonto.org/distributions#new"));

        manager.addVersionedDistribution(differentId, notPresentId, versionId, distribution);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddVersionedDistributionToVersionOfWrongTypeOfRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");
        Distribution distribution = distributionFactory.createNew(vf.createIRI("https://matonto.org/distributions#new"));

        manager.addVersionedDistribution(distributedCatalogId, recordId, versionId, distribution);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddVersionedDistributionToVersionOfRecordInWrongCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");
        Distribution distribution = distributionFactory.createNew(vf.createIRI("https://matonto.org/distributions#new"));

        manager.addVersionedDistribution(localCatalogId, recordId, versionId, distribution);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddVersionedDistributionToMissingVersion() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Distribution distribution = distributionFactory.createNew(vf.createIRI("https://matonto.org/distributions#new"));

        manager.addVersionedDistribution(distributedCatalogId, recordId, notPresentId, distribution);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddVersionedDistributionWithTakenResource() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");
        Distribution distribution = distributionFactory.createNew(vf.createIRI("http://matonto.org/test/distributions#test"));

        manager.addVersionedDistribution(distributedCatalogId, recordId, versionId, distribution);
    }

    /* updateVersionedDistribution */

    @Test
    public void testUpdateVersionedDistribution() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test2");
        Model distributionModel = mf.createModel();
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.getStatements(distributionId, null, null, distributionId).forEach(distributionModel::add);
            Distribution distribution = distributionFactory.getExisting(distributionId, distributionModel).get();
            distribution.getModel().add(distributionId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"));
            assertFalse(conn.getStatements(distributionId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"))
                    .hasNext());

            manager.updateVersionedDistribution(distributedCatalogId, recordId, versionId, distribution);
            assertTrue(conn.getStatements(distributionId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"),
                    distributionId).hasNext());
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateVersionedDistributionOfVersionOfRecordInMissingCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");
        Distribution distribution = distributionFactory.createNew(vf.createIRI("http://matonto.org/test/distributions#test2"));

        manager.updateVersionedDistribution(differentId, recordId, versionId, distribution);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateVersionedDistributionOfVersionOfMissingRecord() {
        // Setup:
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");
        Distribution distribution = distributionFactory.createNew(vf.createIRI("http://matonto.org/test/distributions#test2"));

        manager.updateVersionedDistribution(distributedCatalogId, notPresentId, versionId, distribution);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateVersionedDistributionOfVersionOfWrongTypeOfRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");
        Distribution distribution = distributionFactory.createNew(vf.createIRI("http://matonto.org/test/distributions#test2"));

        manager.updateVersionedDistribution(distributedCatalogId, recordId, versionId, distribution);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateVersionedDistributionOfVersionOfRecordInWrongCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");
        Distribution distribution = distributionFactory.createNew(vf.createIRI("http://matonto.org/test/distributions#test2"));

        manager.updateVersionedDistribution(localCatalogId, recordId, versionId, distribution);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateVersionedDistributionOfMissingVersion() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Distribution distribution = distributionFactory.createNew(vf.createIRI("http://matonto.org/test/distributions#test2"));

        manager.updateVersionedDistribution(distributedCatalogId, recordId, notPresentId, distribution);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateMissingVersionedDistribution() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");
        Distribution distribution = distributionFactory.createNew(notPresentId);

        manager.updateVersionedDistribution(distributedCatalogId, recordId, versionId, distribution);
    }

    /* removeVersionedDistribution */

    @Test
    public void testRemoveVersionedDistribution() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test2");
        IRI distributionIRI = vf.createIRI(Version.versionedDistribution_IRI);

        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(distributionId, null, null, distributionId).hasNext());
            assertTrue(conn.getStatements(versionId, distributionIRI, distributionId, versionId).hasNext());

            manager.removeVersionedDistribution(distributedCatalogId, recordId, versionId, distributionId);
            assertFalse(conn.getStatements(distributionId, null, null, distributionId).hasNext());
            assertFalse(conn.getStatements(versionId, distributionIRI, distributionId, versionId).hasNext());
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRemoveVersionedDistributionFromVersionOfRecordInMissingCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test2");

        manager.removeVersionedDistribution(differentId, recordId, versionId, distributionId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRemoveVersionedDistributionFromVersionOfMissingRecord() {
        // Setup:
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test2");

        manager.removeVersionedDistribution(distributedCatalogId, notPresentId, versionId, distributionId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRemoveVersionedDistributionFromVersionOfWrongTypeOfRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test2");

        manager.removeVersionedDistribution(distributedCatalogId, recordId, versionId, distributionId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRemoveVersionedDistributionFromVersionOfRecordInWrongCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test2");

        manager.removeVersionedDistribution(localCatalogId, recordId, versionId, distributionId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRemoveVersionedDistributionFromMissingVersion() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test2");

        manager.removeVersionedDistribution(distributedCatalogId, recordId, notPresentId, distributionId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRemoveMissingVersionedDistribution() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");

        manager.removeVersionedDistribution(distributedCatalogId, recordId, versionId, notPresentId);
    }

    /* getVersionedDistribution */

    @Test
    public void testGetVersionedDistribution() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test2");
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(distributionId, null, null, distributionId).hasNext());
        }

        Optional<Distribution> result = manager.getVersionedDistribution(distributedCatalogId, recordId, versionId, distributionId);
        assertTrue(result.isPresent());
        Distribution distribution = result.get();
        assertTrue(distribution.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals("Distribution 2", distribution.getProperty(vf.createIRI(DC_TITLE)).get().stringValue());
        assertTrue(distribution.getProperty(vf.createIRI(DC_ISSUED)).isPresent());
        assertTrue(distribution.getProperty(vf.createIRI(DC_MODIFIED)).isPresent());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetVersionedDistributionOfVersionOfRecordInMissingCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test2");

        manager.getVersionedDistribution(differentId, recordId, versionId, distributionId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetVersionedDistributionOfVersionOfMissingRecord() {
        // Setup:
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test2");

        manager.getVersionedDistribution(distributedCatalogId, notPresentId, versionId, distributionId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetVersionedDistributionOfVersionOfWrongTypeOfRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test2");

        manager.getVersionedDistribution(distributedCatalogId, recordId, versionId, distributionId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetVersionedDistributionOfVersionOfRecordInWrongCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test2");

        manager.getVersionedDistribution(localCatalogId, recordId, versionId, distributionId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetVersionedDistributionOfMissingVersion() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test2");

        manager.getVersionedDistribution(distributedCatalogId, recordId, notPresentId, distributionId);
    }

    @Test
    public void testGetVersionedDistributionOfWrongVersion() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");

        Optional<Distribution> result = manager.getVersionedDistribution(distributedCatalogId, recordId, versionId, notPresentId);
        assertFalse(result.isPresent());
    }

    @Test(expected = IllegalStateException.class)
    public void testGetMissingVersionedDistribution() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test-missing");

        manager.getVersionedDistribution(distributedCatalogId, recordId, versionId, notPresentId);
    }

    /* getVersions */

    @Test
    public void testGetBranches() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");

        Set<Branch> branches = manager.getBranches(distributedCatalogId, recordId);
        assertEquals(4, branches.size());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetBranchesOfRecordInMissingCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");

        manager.getBranches(differentId, recordId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetBranchesOfMissingRecord() {
        manager.getBranches(distributedCatalogId, notPresentId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetBranchesOfWrongTypeOfRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");

        manager.getBranches(distributedCatalogId, recordId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetBranchesOfRecordInWrongCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");

        manager.getBranches(localCatalogId, recordId);
    }

    /* addBranch */

    @Test
    public void testAddBranch() throws Exception {
        // Setup:
        IRI branchIRI = vf.createIRI(VersionedRDFRecord.branch_IRI);
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#new");
        Branch branch = branchFactory.createNew(branchId);
        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(conn.getStatements(branchId, null, null, branchId).hasNext());

            manager.addBranch(distributedCatalogId, recordId, branch);
            assertTrue(conn.getStatements(branchId, null, null, branchId).hasNext());
            assertTrue(conn.getStatements(recordId, branchIRI, branchId, recordId).hasNext());
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddBranchToRecordInMissingCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Branch branch = branchFactory.createNew(vf.createIRI("http://matonto.org/test/branches#new"));

        manager.addBranch(differentId, recordId, branch);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddBranchToMissingRecord() {
        // Setup:
        Branch branch = branchFactory.createNew(vf.createIRI("http://matonto.org/test/branches#new"));

        manager.addBranch(distributedCatalogId, notPresentId, branch);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddBranchToWrongTypeOfRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Branch branch = branchFactory.createNew(vf.createIRI("http://matonto.org/test/branches#new"));

        manager.addBranch(distributedCatalogId, recordId, branch);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddBranchToRecordInWrongCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Branch branch = branchFactory.createNew(vf.createIRI("http://matonto.org/test/branches#new"));

        manager.addBranch(localCatalogId, recordId, branch);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddBranchWithTakenResource() {
        // Setup:
        Resource versionedRDFRecordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Branch branch = branchFactory.createNew(vf.createIRI("http://matonto.org/test/branches#test"));

        manager.addBranch(distributedCatalogId, versionedRDFRecordId, branch);
    }

    /* addMasterBranch */

    @Test
    public void testAddMasterBranch() throws Exception {
        // Setup:
        IRI branchIRI = vf.createIRI(VersionedRDFRecord.branch_IRI);
        IRI masterBranchIRI = vf.createIRI(VersionedRDFRecord.masterBranch_IRI);
        Resource recordId = vf.createIRI("http://matonto.org/test/records#update");

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.addMasterBranch(distributedCatalogId, recordId);
            assertTrue(conn.getStatements(recordId, masterBranchIRI, null, recordId).hasNext());
            assertTrue(conn.getStatements(recordId, branchIRI, null, recordId).hasNext());
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddMasterBranchToRecordInMissingCatalog() {
        manager.addMasterBranch(differentId, vf.createIRI("http://matonto.org/test/records#update"));
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddMasterBranchToMissingRecord() {
        manager.addMasterBranch(distributedCatalogId, notPresentId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddMasterBranchToWrongTypeOfRecord() {
        manager.addMasterBranch(distributedCatalogId, vf.createIRI("http://matonto.org/test/records#unversioned"));
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddMasterBranchToRecordInWrongCatalog() {
        manager.addMasterBranch(localCatalogId, vf.createIRI("http://matonto.org/test/records#update"));
    }

    @Test(expected = IllegalStateException.class)
    public void testAddMasterBranchToRecordWithMasterBranchAlready() {
        manager.addMasterBranch(distributedCatalogId, vf.createIRI("http://matonto.org/test/records#versionedRDF"));
    }

    /* updateBranch */

    @Test
    public void testUpdateBranch() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");
        try (RepositoryConnection conn = repo.getConnection()) {
            Model branchModel = mf.createModel();
            conn.getStatements(branchId, null, null, branchId).forEach(branchModel::add);
            Branch branch = branchFactory.getExisting(branchId, branchModel).get();
            branch.getModel().add(branchId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"));
            assertFalse(conn.getStatements(branchId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"), branchId)
                    .hasNext());

            manager.updateBranch(distributedCatalogId, recordId, branch);
            assertTrue(conn.getStatements(branchId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"), branchId)
                    .hasNext());
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateBranchOfRecordInMissingCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Branch branch = branchFactory.createNew(vf.createIRI("http://matonto.org/test/branches#test"));

        manager.updateBranch(differentId, recordId, branch);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateBranchOfMissingRecord() {
        // Setup:
        Branch branch = branchFactory.createNew(vf.createIRI("http://matonto.org/test/branches#test"));

        manager.updateBranch(distributedCatalogId, notPresentId, branch);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateBranchOfWrongTypeOfRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Branch branch = branchFactory.createNew(vf.createIRI("http://matonto.org/test/branches#test"));

        manager.updateBranch(distributedCatalogId, recordId, branch);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateBranchOfRecordInWrongCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Branch branch = branchFactory.createNew(vf.createIRI("http://matonto.org/test/branches#test"));

        manager.updateBranch(localCatalogId, recordId, branch);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateMissingBranch() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Branch branch = branchFactory.createNew(notPresentId);

        manager.updateBranch(distributedCatalogId, recordId, branch);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateMasterBranch() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Branch branch = branchFactory.createNew(vf.createIRI("http://matonto.org/test/branches#master"));

        manager.updateBranch(distributedCatalogId, recordId, branch);
    }

    @Test
    public void testUpdateUserBranch() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/user-branches#test");
        try (RepositoryConnection conn = repo.getConnection()) {
            Model branchModel = mf.createModel();
            conn.getStatements(branchId, null, null, branchId).forEach(branchModel::add);
            UserBranch branch = userBranchFactory.getExisting(branchId, branchModel).get();
            branch.getModel().add(branchId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"));
            assertFalse(conn.getStatements(branchId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"), branchId)
                    .hasNext());

            manager.updateBranch(distributedCatalogId, recordId, branch);
            assertTrue(conn.getStatements(branchId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"), branchId)
                    .hasNext());
        }
    }

    /* updateHead */

    @Test
    public void testUpdateHead() throws Exception {
        // Setup:
        IRI headIRI = vf.createIRI(Branch.head_IRI);
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");
        Resource commitId = vf.createIRI("https://matonto.org/commits#test");
        Commit commit = commitFactory.createNew(commitId);
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(commit.getModel(), commitId);
            assertFalse(conn.getStatements(branchId, headIRI, commitId, branchId).hasNext());

            manager.updateHead(distributedCatalogId, recordId, branchId, commitId);
            assertTrue(conn.getStatements(branchId, headIRI, commitId, branchId).hasNext());
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateHeadOfBranchOfRecordInMissingCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");
        Resource commitId = vf.createIRI("https://matonto.org/commits#test");

        manager.updateHead(differentId, recordId, branchId, commitId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateHeadOfBranchOfMissingRecord() {
        // Setup:
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");
        Resource commitId = vf.createIRI("https://matonto.org/commits#test");

        manager.updateHead(distributedCatalogId, notPresentId, branchId, commitId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateHeadOfBranchOfWrongTypeOfRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");
        Resource commitId = vf.createIRI("https://matonto.org/commits#test");

        manager.updateHead(distributedCatalogId, recordId, branchId, commitId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateHeadOfBranchOfRecordInWrongCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");
        Resource commitId = vf.createIRI("https://matonto.org/commits#test");

        manager.updateHead(localCatalogId, recordId, branchId, commitId);
    }

    @Test
    public void testUpdateHeadOfMissingBranch() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource commitId = vf.createIRI("https://matonto.org/commits#test");
        thrown.expect(IllegalArgumentException.class);
        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(conn.getStatements(notPresentId, null, null, notPresentId).hasNext());

            manager.updateHead(distributedCatalogId, recordId, notPresentId, commitId);
        }
    }

    @Test
    public void testUpdateHeadToMissingCommit() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");
        thrown.expect(IllegalArgumentException.class);
        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(conn.getStatements(notPresentId, null, null, notPresentId).hasNext());

            manager.updateHead(distributedCatalogId, recordId, branchId, notPresentId);
        }
    }

    /* removeBranch */

    @Test
    public void testRemoveBranch() throws Exception {
        // Setup:
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource commitIdToRemove = vf.createIRI("http://matonto.org/test/commits#conflict2");
        Resource additionsToRemove = vf.createIRI("http://matonto.org/test/additions#conflict2");
        Resource commitIdToKeep = vf.createIRI("http://matonto.org/test/commits#conflict0");
        Resource additionsToKeep = vf.createIRI("http://matonto.org/test/additions#conflict0");
        Resource tagId = vf.createIRI("http://matonto.org/test/tags#test");
        IRI commitIRI = vf.createIRI(Tag.commit_IRI);
        IRI branchIRI = vf.createIRI(VersionedRDFRecord.branch_IRI);
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(branchId, null, null, branchId).hasNext());
            assertTrue(conn.getStatements(recordId, branchIRI, branchId, recordId).hasNext());
            assertTrue(conn.getStatements(null, null, null, commitIdToRemove).hasNext());
            assertTrue(conn.getStatements(null, null, null, commitIdToKeep).hasNext());
            assertTrue(conn.getStatements(null, null, null, additionsToRemove).hasNext());
            assertTrue(conn.getStatements(null, null, null, additionsToKeep).hasNext());
            assertTrue(conn.getStatements(tagId, null, null, tagId).hasNext());
            assertTrue(conn.getStatements(tagId, commitIRI, commitIdToRemove, tagId).hasNext());

            manager.removeBranch(distributedCatalogId, recordId, branchId);
            assertFalse(conn.getStatements(branchId, null, null, branchId).hasNext());
            assertFalse(conn.getStatements(branchId, null, null).hasNext());
            assertFalse(conn.getStatements(recordId, branchIRI, branchId, recordId).hasNext());
            assertFalse(conn.getStatements(null, null, null, commitIdToRemove).hasNext());
            assertTrue(conn.getStatements(null, null, null, commitIdToKeep).hasNext());
            assertFalse(conn.getStatements(null, null, null, additionsToRemove).hasNext());
            assertTrue(conn.getStatements(null, null, null, additionsToKeep).hasNext());
            assertFalse(conn.getStatements(tagId, null, null, tagId).hasNext());
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRemoveBranchFromRecordInMissingCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");

        manager.removeBranch(differentId, recordId, branchId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRemoveBranchFromMissingRecord() {
        // Setup:
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");

        manager.removeBranch(distributedCatalogId, notPresentId, branchId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRemoveBranchFromWrongTypeOfRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");

        manager.removeBranch(distributedCatalogId, recordId, branchId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRemoveBranchFromRecordInWrongCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");

        manager.removeBranch(localCatalogId, recordId, branchId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRemoveMissingBranch() {
        // Setup:
        Resource versionedRDFRecordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");

        manager.removeBranch(distributedCatalogId, versionedRDFRecordId, notPresentId);
    }

    @Test(expected = IllegalStateException.class)
    public void testRemoveMasterBranch() {
        // Setup:
        Resource versionedRDFRecordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#master");

        manager.removeBranch(distributedCatalogId, versionedRDFRecordId, branchId);
    }

    /* getBranch */

    @Test
    public void testGetBranch() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(branchId, null, null, branchId).hasNext());
        }

        Optional<Branch> result = manager.getBranch(distributedCatalogId, recordId, branchId, branchFactory);
        assertTrue(result.isPresent());
        Branch branch = result.get();
        assertTrue(branch.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals("Branch", branch.getProperty(vf.createIRI(DC_TITLE)).get().stringValue());
        assertTrue(branch.getProperty(vf.createIRI(DC_ISSUED)).isPresent());
        assertTrue(branch.getProperty(vf.createIRI(DC_MODIFIED)).isPresent());
    }

    @Test
    public void testGetUserBranch() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/user-branches#test");
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(branchId, null, null, branchId).hasNext());
        }

        Optional<UserBranch> result = manager.getBranch(distributedCatalogId, recordId, branchId, userBranchFactory);
        assertTrue(result.isPresent());
        UserBranch branch = result.get();
        assertTrue(branch.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals("User Branch", branch.getProperty(vf.createIRI(DC_TITLE)).get().stringValue());
        assertTrue(branch.getProperty(vf.createIRI(DC_ISSUED)).isPresent());
        assertTrue(branch.getProperty(vf.createIRI(DC_MODIFIED)).isPresent());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetBranchFromRecordInMissingCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/user-branches#test");

        manager.getBranch(differentId, recordId, branchId, branchFactory);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetBranchFromMissingRecord() {
        // Setup:
        Resource branchId = vf.createIRI("http://matonto.org/test/user-branches#test");

        manager.getBranch(distributedCatalogId, notPresentId, branchId, branchFactory);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetBranchFromWrongTypeOfRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Resource branchId = vf.createIRI("http://matonto.org/test/user-branches#test");

        manager.getBranch(distributedCatalogId, recordId, branchId, branchFactory);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetBranchFromRecordInWrongCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/user-branches#test");

        manager.getBranch(localCatalogId, recordId, branchId, branchFactory);
    }

    @Test(expected = IllegalStateException.class)
    public void testGetMissingBranch() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#update-missing");

        manager.getBranch(distributedCatalogId, recordId, notPresentId, branchFactory);
    }

    @Test
    public void testGetBranchOfWrongRecord() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");

        manager.getBranch(distributedCatalogId, recordId, notPresentId, branchFactory);
    }

    /* getMasterBranch */

    @Test
    public void testGetMasterBranch() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");

        Branch branch = manager.getMasterBranch(distributedCatalogId, recordId);
        assertEquals(vf.createIRI("http://matonto.org/test/branches#master"), branch.getResource());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetMasterBranchOfRecordInMissingCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");

        manager.getMasterBranch(differentId, recordId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetMasterBranchOfMissingRecord() {
        manager.getMasterBranch(distributedCatalogId, notPresentId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetMasterBranchOfWrongTypeOfRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");

        manager.getMasterBranch(distributedCatalogId, recordId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetMasterBranchOfRecordInWrongCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");

        manager.getMasterBranch(localCatalogId, recordId);
    }

    @Test(expected = IllegalStateException.class)
    public void testGetMasterBranchOfRecordWithoutMasterSet() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#update");

        manager.getMasterBranch(distributedCatalogId, recordId);
    }

    @Test(expected = IllegalStateException.class)
    public void testGetMissingMasterBranch() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#update-missing");

        manager.getMasterBranch(distributedCatalogId, recordId);
    }

    /* createCommit */

    @Test
    public void testCreateCommit() throws Exception {
        // Setup:
        IRI dummyId = vf.createIRI("https://matonto.org/dummy");
        IRI revisionId = vf.createIRI("http://matonto.org/revisions#test");
        Resource generation = vf.createIRI("http://matonto.org/test");
        Resource generation2 = vf.createIRI("http://matonto.org/test2");
        Commit base = commitFactory.createNew(vf.createIRI("http://matonto.org/test/base"));
        base.setProperty(generation, vf.createIRI(PROV_GENERATED));
        Commit auxiliary = commitFactory.createNew(vf.createIRI("http://matonto.org/test/auxiliary"));
        auxiliary.setProperty(generation2, vf.createIRI(PROV_GENERATED));
        InProgressCommit inProgressCommit = inProgressCommitFactory.createNew(dummyId);
        inProgressCommit.setProperty(vf.createIRI("http://matonto.org/user"), vf.createIRI(PROV_WAS_ASSOCIATED_WITH));
        inProgressCommit.setProperty(revisionId, vf.createIRI(PROV_GENERATED));
        Revision revision = revisionFactory.createNew(revisionId);
        inProgressCommit.getModel().addAll(revision.getModel());

        Commit result = manager.createCommit(inProgressCommit, "message", null, null);
        assertTrue(result.getProperty(vf.createIRI(PROV_AT_TIME)).isPresent());
        assertEquals("message", result.getProperty(vf.createIRI(DC_TITLE)).get().stringValue());
        assertFalse(result.getBaseCommit().isPresent());
        assertFalse(result.getAuxiliaryCommit().isPresent());
        assertFalse(result.getModel().contains(dummyId, null, null));
        assertTrue(result.getModel().contains(revisionId, null, null));

        result = manager.createCommit(inProgressCommit, "message", base, auxiliary);
        assertTrue(result.getProperty(vf.createIRI(PROV_AT_TIME)).isPresent());
        assertEquals("message", result.getProperty(vf.createIRI(DC_TITLE)).get().stringValue());
        assertTrue(result.getBaseCommit_resource().isPresent() && result.getBaseCommit_resource().get().equals(base.getResource()));
        assertTrue(result.getAuxiliaryCommit_resource().isPresent() && result.getAuxiliaryCommit_resource().get().equals(auxiliary.getResource()));
        assertFalse(result.getModel().contains(dummyId, null, null));
        assertTrue(result.getModel().contains(revisionId, null, null));
    }

    @Test(expected = IllegalArgumentException.class)
    public void testCreateCommitWithOnlyAuxiliary() {
        //Setup:
        InProgressCommit inProgressCommit = inProgressCommitFactory.createNew(vf.createIRI("http://matonto.org/dummy"));
        Commit auxiliary = commitFactory.createNew(vf.createIRI("http://matonto.org/test/auxiliary"));

        manager.createCommit(inProgressCommit, "message", null, auxiliary);
    }

    /* createInProgressCommit */

    @Test
    public void testCreateInProgressCommit() throws Exception {
        // Setup:
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user"));

        InProgressCommit result = manager.createInProgressCommit(user);
        assertTrue(result.getProperty(vf.createIRI(PROV_WAS_ASSOCIATED_WITH)).isPresent());
        assertEquals(user.getResource().stringValue(), result.getProperty(vf.createIRI(PROV_WAS_ASSOCIATED_WITH)).get()
                .stringValue());
        assertTrue(result.getProperty(vf.createIRI(PROV_GENERATED)).isPresent());
        Revision revision = revisionFactory.createNew((Resource)result.getProperty(vf.createIRI(PROV_GENERATED)).get(),
                result.getModel());
        assertTrue(revision.getAdditions().isPresent());
        assertTrue(revision.getDeletions().isPresent());

        result = manager.createInProgressCommit(user);
        assertEquals(user.getResource().stringValue(), result.getProperty(vf.createIRI(PROV_WAS_ASSOCIATED_WITH)).get()
                .stringValue());
        assertTrue(result.getProperty(vf.createIRI(PROV_GENERATED)).isPresent());
        assertFalse(result.getProperty(vf.createIRI(PROV_WAS_INFORMED_BY)).isPresent());
        revision = revisionFactory.createNew((Resource)result.getProperty(vf.createIRI(PROV_GENERATED)).get(),
                result.getModel());
        assertTrue(revision.getAdditions().isPresent());
        assertTrue(revision.getDeletions().isPresent());
        assertFalse(revision.getProperty(vf.createIRI(PROV_WAS_DERIVED_FROM)).isPresent());
    }

    /* updateInProgressCommit(Resource, Resource, Resource, Model, Model) */

    @Test
    public void testUpdateInProgressCommit() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource commitId = vf.createIRI("http://matonto.org/test/in-progress-commits#test");
        Resource additionId = vf.createIRI("http://matonto.org/test/in-additions#test");
        Resource deletionId = vf.createIRI("http://matonto.org/test/in-deletions#test");
        Statement statement1 = vf.createStatement(vf.createIRI("https://matonto.org/test"), vf.createIRI(DC_TITLE),
                vf.createLiteral("Title"));
        Statement statement2 = vf.createStatement(vf.createIRI("https://matonto.org/test"), vf.createIRI(DC_DESCRIPTION),
                vf.createLiteral("Description"));
        Statement statement3 = vf.createStatement(vf.createIRI("https://matonto.org/test"), vf.createIRI(DC_IDENTIFIER),
                vf.createLiteral("Identifier"));
        Statement existingDeleteStatement = vf.createStatement(vf.createIRI("http://matonto.org/test/delete"), vf.createIRI(DC_TITLE),
                vf.createLiteral("Delete"));
        Statement existingAddStatement = vf.createStatement(vf.createIRI("http://matonto.org/test/add"), vf.createIRI(DC_TITLE),
                vf.createLiteral("Add"));
        Model additions = mf.createModel(Stream.of(statement1, statement2, existingDeleteStatement).collect(Collectors.toSet()));
        Model deletions = mf.createModel(Stream.of(statement2, statement3, existingAddStatement).collect(Collectors.toSet()));
        Model expectedAdditions = mf.createModel(Stream.of(statement1).collect(Collectors.toSet()));
        Model expectedDeletions = mf.createModel(Stream.of(statement3).collect(Collectors.toSet()));

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.updateInProgressCommit(distributedCatalogId, recordId, commitId, additions, deletions);
            conn.getStatements(null, null, null, additionId).forEach(statement -> {
                assertTrue(expectedAdditions.contains(statement.getSubject(), statement.getPredicate(), statement.getObject()));
            });
            conn.getStatements(null, null, null, deletionId).forEach(statement -> {
                assertTrue(expectedDeletions.contains(statement.getSubject(), statement.getPredicate(), statement.getObject()));
            });
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateInProgressCommitForRecordInMissingCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource commitId = vf.createIRI("http://matonto.org/test/in-progress-commits#test");

        manager.updateInProgressCommit(differentId, recordId, commitId, null, null);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateInProgressCommitForMissingRecord() {
        // Setup:
        Resource commitId = vf.createIRI("http://matonto.org/test/in-progress-commits#test");

        manager.updateInProgressCommit(distributedCatalogId, notPresentId, commitId, null, null);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateInProgressCommitForWrongTypeOfRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Resource commitId = vf.createIRI("http://matonto.org/test/in-progress-commits#test");

        manager.updateInProgressCommit(distributedCatalogId, recordId, commitId, null, null);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateInProgressCommitForRecordInWrongCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource commitId = vf.createIRI("http://matonto.org/test/in-progress-commits#test");

        manager.updateInProgressCommit(localCatalogId, recordId, commitId, null, null);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateMissingInProgressCommit() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");

        manager.updateInProgressCommit(distributedCatalogId, recordId, notPresentId, null, null);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateInProgressCommitForWrongRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#update");
        Resource commitId = vf.createIRI("http://matonto.org/test/in-progress-commits#test");

        manager.updateInProgressCommit(localCatalogId, recordId, commitId, null, null);
    }

    /* updateInProgressCommit(Resource, Resource, Resource, Model, Model) */

    @Test
    public void testUpdateInProgressCommitWithUser() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user/taken"));
        Resource additionId = vf.createIRI("http://matonto.org/test/in-additions#test");
        Resource deletionId = vf.createIRI("http://matonto.org/test/in-deletions#test");
        Statement statement1 = vf.createStatement(vf.createIRI("https://matonto.org/test"), vf.createIRI(DC_TITLE),
                vf.createLiteral("Title"));
        Statement statement2 = vf.createStatement(vf.createIRI("https://matonto.org/test"), vf.createIRI(DC_DESCRIPTION),
                vf.createLiteral("Description"));
        Statement statement3 = vf.createStatement(vf.createIRI("https://matonto.org/test"), vf.createIRI(DC_IDENTIFIER),
                vf.createLiteral("Identifier"));
        Statement existingDeleteStatement = vf.createStatement(vf.createIRI("http://matonto.org/test/delete"), vf.createIRI(DC_TITLE),
                vf.createLiteral("Delete"));
        Statement existingAddStatement = vf.createStatement(vf.createIRI("http://matonto.org/test/add"), vf.createIRI(DC_TITLE),
                vf.createLiteral("Add"));
        Model additions = mf.createModel(Stream.of(statement1, statement2, existingDeleteStatement).collect(Collectors.toSet()));
        Model deletions = mf.createModel(Stream.of(statement2, statement3, existingAddStatement).collect(Collectors.toSet()));
        Model expectedAdditions = mf.createModel(Stream.of(statement1).collect(Collectors.toSet()));
        Model expectedDeletions = mf.createModel(Stream.of(statement3).collect(Collectors.toSet()));

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.updateInProgressCommit(distributedCatalogId, recordId, user, additions, deletions);
            conn.getStatements(null, null, null, additionId).forEach(statement -> {
                assertTrue(expectedAdditions.contains(statement.getSubject(), statement.getPredicate(), statement.getObject()));
            });
            conn.getStatements(null, null, null, deletionId).forEach(statement -> {
                assertTrue(expectedDeletions.contains(statement.getSubject(), statement.getPredicate(), statement.getObject()));
            });
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateInProgressCommitWithUserForRecordInMissingCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user/taken"));

        manager.updateInProgressCommit(differentId, recordId, user, null, null);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateInProgressCommitWithUserForMissingRecord() {
        // Setup:
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user/taken"));

        manager.updateInProgressCommit(distributedCatalogId, notPresentId, user, null, null);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateInProgressCommitWithUserForWrongTypeOfRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user/taken"));

        manager.updateInProgressCommit(distributedCatalogId, recordId, user, null, null);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateInProgressCommitWithUserForRecordInWrongCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user/taken"));

        manager.updateInProgressCommit(localCatalogId, recordId, user, null, null);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateMissingInProgressCommitWithUser() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user"));

        manager.updateInProgressCommit(distributedCatalogId, recordId, user, null, null);
    }

    /* addCommit(Resource, Resource, Resource, Commit) */

    @Test
    public void testAddCommit() throws Exception {
        // Setup:
        IRI headIRI = vf.createIRI(Branch.head_IRI);
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");
        Resource commitId = vf.createIRI("https://matonto.org/commits#new");
        Commit commit = commitFactory.createNew(commitId);
        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(conn.getStatements(commitId, null, null, commitId).hasNext());

            manager.addCommit(distributedCatalogId, recordId, branchId, commit);
            assertTrue(conn.getStatements(commitId, null, null, commitId).hasNext());
            assertTrue(conn.getStatements(branchId, headIRI, commitId, branchId).hasNext());
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddCommitToBranchOfRecordInMissingCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");
        Commit commit = commitFactory.createNew(vf.createIRI("https://matonto.org/commits#new"));

        manager.addCommit(differentId, recordId, branchId, commit);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddCommitToBranchOfMissingRecord() {
        // Setup:
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");
        Commit commit = commitFactory.createNew(vf.createIRI("https://matonto.org/commits#new"));

        manager.addCommit(distributedCatalogId, notPresentId, branchId, commit);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddCommitToBranchOfWrongTypeOfRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");
        Commit commit = commitFactory.createNew(vf.createIRI("https://matonto.org/commits#new"));

        manager.addCommit(distributedCatalogId, recordId, branchId, commit);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddCommitToBranchOfRecordInWrongCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");
        Commit commit = commitFactory.createNew(vf.createIRI("https://matonto.org/commits#new"));

        manager.addCommit(localCatalogId, recordId, branchId, commit);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddCommitToMissingBranch() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Commit commit = commitFactory.createNew(vf.createIRI("https://matonto.org/commits#new"));

        manager.addCommit(distributedCatalogId, recordId, notPresentId, commit);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddCommitWithTakenResource() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");
        Commit commit = commitFactory.createNew(vf.createIRI("http://matonto.org/test/commits#test"));

        manager.addCommit(distributedCatalogId, recordId, branchId, commit);
    }

    /* addCommit(Resource, Resource, Resource, User, String) */

    @Test
    public void testAddCommitWithUser() throws Exception {
        // Setup:
        IRI headIRI = vf.createIRI(Branch.head_IRI);
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");
        Resource originalHead = vf.createIRI("http://matonto.org/test/commits#conflict2");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user/taken"));
        Resource inProgressCommitId = vf.createIRI("http://matonto.org/test/in-progress-commits#test");
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(inProgressCommitId, null, null, inProgressCommitId).hasNext());
            assertTrue(conn.getStatements(branchId, headIRI, originalHead, branchId).hasNext());

            Resource commitId = manager.addCommit(distributedCatalogId, recordId, branchId, user, "Message");
            assertFalse(conn.getStatements(inProgressCommitId, null, null, inProgressCommitId).hasNext());
            assertFalse(conn.getStatements(branchId, headIRI, originalHead, branchId).hasNext());
            assertTrue(conn.getStatements(branchId, headIRI, commitId, branchId).hasNext());
            assertTrue(conn.getStatements(commitId, null, null, commitId).hasNext());
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddCommitWithUserToBranchOfRecordInMissingCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user/taken"));

        manager.addCommit(differentId, recordId, branchId, user, "Message");
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddCommitWithUserToBranchOfMissingRecord() {
        // Setup:
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user/taken"));

        manager.addCommit(distributedCatalogId, notPresentId, branchId, user, "Message");
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddCommitWithUserToBranchOfWrongTypeOfRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user/taken"));

        manager.addCommit(distributedCatalogId, recordId, branchId, user, "Message");
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddCommitWithUserToBranchOfRecordInWrongCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user/taken"));

        manager.addCommit(localCatalogId, recordId, branchId, user, "Message");
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddCommitWithUserToMissingBranch() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user/taken"));

        manager.addCommit(distributedCatalogId, recordId, notPresentId, user, "Message");
    }

    @Test
    public void testAddCommitWithUserToBranchWithNoHeadSet() {
        // Setup:
        IRI headIRI = vf.createIRI(Branch.head_IRI);
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test2");
        Resource inProgressCommitId = vf.createIRI("http://matonto.org/test/in-progress-commits#test");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user/taken"));
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(inProgressCommitId, null, null, inProgressCommitId).hasNext());
            assertFalse(conn.getStatements(branchId, headIRI, null, branchId).hasNext());

            Resource commitId = manager.addCommit(distributedCatalogId, recordId, branchId, user, "Message");
            assertFalse(conn.getStatements(inProgressCommitId, null, null, inProgressCommitId).hasNext());
            assertTrue(conn.getStatements(branchId, headIRI, commitId, branchId).hasNext());
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddCommitWithUserAndMissingInProgressCommit() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user"));

        manager.addCommit(distributedCatalogId, recordId, branchId, user, "Message");
    }

    /* addCommit(Resource, Resource, Resource, User, String, Model, Model) */

    @Test
    public void testAddCommitWithChanges() throws Exception {
        // Setup:
        IRI headIRI = vf.createIRI(Branch.head_IRI);
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");
        Resource originalHead = vf.createIRI("http://matonto.org/test/commits#conflict2");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user"));
        Statement statement1 = vf.createStatement(vf.createIRI("https://matonto.org/test"), vf.createIRI(DC_TITLE),
                vf.createLiteral("Title"));
        Statement statement2 = vf.createStatement(vf.createIRI("https://matonto.org/test"), vf.createIRI(DC_DESCRIPTION),
                vf.createLiteral("Description"));
        Statement statement3 = vf.createStatement(vf.createIRI("https://matonto.org/test"), vf.createIRI(DC_IDENTIFIER),
                vf.createLiteral("Identifier"));
        Statement existingDeleteStatement = vf.createStatement(vf.createIRI("http://matonto.org/test/delete"), vf.createIRI(DC_TITLE),
                vf.createLiteral("Delete"));
        Statement existingAddStatement = vf.createStatement(vf.createIRI("http://matonto.org/test/add"), vf.createIRI(DC_TITLE),
                vf.createLiteral("Add"));
        Model additions = mf.createModel(Stream.of(statement1, statement2, existingDeleteStatement).collect(Collectors.toSet()));
        Model deletions = mf.createModel(Stream.of(statement2, statement3, existingAddStatement).collect(Collectors.toSet()));
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(branchId, headIRI, originalHead, branchId).hasNext());

            Resource commitId = manager.addCommit(distributedCatalogId, recordId, branchId, user, "Message", additions, deletions);
            assertFalse(conn.getStatements(branchId, headIRI, originalHead, branchId).hasNext());
            assertTrue(conn.getStatements(branchId, headIRI, commitId, branchId).hasNext());
            assertTrue(conn.getStatements(commitId, null, null, commitId).hasNext());
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddCommitWithChangesToBranchOfRecordInMissingCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user/taken"));

        manager.addCommit(differentId, recordId, branchId, user, "Message", mf.createModel(), mf.createModel());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddCommitWithChangesToBranchOfMissingRecord() {
        // Setup:
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user/taken"));

        manager.addCommit(distributedCatalogId, notPresentId, branchId, user, "Message", mf.createModel(), mf.createModel());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddCommitWithChangesToBranchOfWrongTypeOfRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user/taken"));

        manager.addCommit(distributedCatalogId, recordId, branchId, user, "Message", mf.createModel(), mf.createModel());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddCommitWithChangesToBranchOfRecordInWrongCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user/taken"));

        manager.addCommit(localCatalogId, recordId, branchId, user, "Message", mf.createModel(), mf.createModel());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddCommitWithChangesToMissingBranch() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user/taken"));

        manager.addCommit(distributedCatalogId, recordId, notPresentId, user, "Message", mf.createModel(), mf.createModel());
    }

    @Test
    public void testAddCommitWithChangesToBranchWithNoHeadSet() {
        // Setup:
        IRI headIRI = vf.createIRI(Branch.head_IRI);
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test2");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user/taken"));
        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(conn.getStatements(branchId, headIRI, null, branchId).hasNext());

            Resource commitId = manager.addCommit(distributedCatalogId, recordId, branchId, user, "Message", mf.createModel(), mf.createModel());
            assertTrue(conn.getStatements(branchId, headIRI, commitId, branchId).hasNext());
        }
    }

    /* addInProgressCommit */

    @Test
    public void testAddInProgressCommit() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource inProgressCommitId = vf.createIRI("https://matonto.org/in-progress-commits#test");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user"));
        InProgressCommit inProgressCommit = inProgressCommitFactory.createNew(inProgressCommitId);
        inProgressCommit.setProperty(user.getResource(), vf.createIRI(Activity.wasAssociatedWith_IRI));
        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(conn.getStatements(inProgressCommitId, null, null, inProgressCommitId).hasNext());

            manager.addInProgressCommit(distributedCatalogId, recordId, inProgressCommit);
            assertTrue(conn.getStatements(inProgressCommitId, null, null, inProgressCommitId).hasNext());
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddInProgressCommitWithNoUser() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        InProgressCommit inProgressCommit = inProgressCommitFactory.createNew(vf.createIRI("https://matonto.org/in-progress-commits#test"));

        manager.addInProgressCommit(distributedCatalogId, recordId, inProgressCommit);
    }

    @Test(expected = IllegalStateException.class)
    public void testAddInProgressCommitWhenYouAlreadyHaveOne() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user/taken"));
        InProgressCommit inProgressCommit = inProgressCommitFactory.createNew(vf.createIRI("https://matonto.org/in-progress-commits#test"));
        inProgressCommit.setProperty(user.getResource(), vf.createIRI(Activity.wasAssociatedWith_IRI));

        manager.addInProgressCommit(distributedCatalogId, recordId, inProgressCommit);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddInProgressCommitToRecordInMissingCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user"));
        InProgressCommit inProgressCommit = inProgressCommitFactory.createNew(vf.createIRI("https://matonto.org/in-progress-commits#test"));
        inProgressCommit.setProperty(user.getResource(), vf.createIRI(Activity.wasAssociatedWith_IRI));

        manager.addInProgressCommit(differentId, recordId, inProgressCommit);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddInProgressCommitToMissingRecord() {
        // Setup:
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user"));
        InProgressCommit inProgressCommit = inProgressCommitFactory.createNew(vf.createIRI("https://matonto.org/in-progress-commits#test"));
        inProgressCommit.setProperty(user.getResource(), vf.createIRI(Activity.wasAssociatedWith_IRI));

        manager.addInProgressCommit(distributedCatalogId, notPresentId, inProgressCommit);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddInProgressCommitToRecordInWrongCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user"));
        InProgressCommit inProgressCommit = inProgressCommitFactory.createNew(vf.createIRI("https://matonto.org/in-progress-commits#test"));
        inProgressCommit.setProperty(user.getResource(), vf.createIRI(Activity.wasAssociatedWith_IRI));

        manager.addInProgressCommit(localCatalogId, recordId, inProgressCommit);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddInProgressCommitWithTakenResource() {
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user"));
        InProgressCommit inProgressCommit = inProgressCommitFactory.createNew(vf.createIRI("http://matonto.org/test/in-progress-commits#test"));
        inProgressCommit.setProperty(user.getResource(), vf.createIRI(Activity.wasAssociatedWith_IRI));

        manager.addInProgressCommit(distributedCatalogId, recordId, inProgressCommit);
    }

    /* getCommit */

    @Test
    public void testGetCommitThatIsNotTheHead() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#master");
        Resource commitId = vf.createIRI("http://matonto.org/test/commits#test0");
        String revisionIRI = "http://matonto.org/test/revisions#revision0";
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(commitId, null, null, commitId).hasNext());
        }

        Optional<Commit> result = manager.getCommit(distributedCatalogId, recordId, branchId, commitId);
        assertTrue(result.isPresent());
        Commit commit = result.get();
        assertTrue(commit.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals("Commit", commit.getProperty(vf.createIRI(DC_TITLE)).get().stringValue());
        assertTrue(commit.getProperty(vf.createIRI(PROV_AT_TIME)).isPresent());
        assertTrue(commit.getProperty(vf.createIRI(PROV_GENERATED)).isPresent());
        assertEquals(revisionIRI, commit.getProperty(vf.createIRI(PROV_GENERATED)).get().stringValue());
        Revision revision = revisionFactory.createNew(vf.createIRI(revisionIRI), commit.getModel());
        assertTrue(revision.getAdditions().isPresent());
        assertTrue(revision.getDeletions().isPresent());
    }

    @Test
    public void testGetCommitThatIsTheHead() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#master");
        Resource commitId = vf.createIRI("http://matonto.org/test/commits#test4a");
        String revisionIRI = "http://matonto.org/test/revisions#revision4a";
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(commitId, null, null, commitId).hasNext());
        }

        Optional<Commit> result = manager.getCommit(distributedCatalogId, recordId, branchId, commitId);
        assertTrue(result.isPresent());
        Commit commit = result.get();
        assertTrue(commit.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals("Commit", commit.getProperty(vf.createIRI(DC_TITLE)).get().stringValue());
        assertTrue(commit.getProperty(vf.createIRI(PROV_AT_TIME)).isPresent());
        assertTrue(commit.getProperty(vf.createIRI(PROV_GENERATED)).isPresent());
        assertEquals(revisionIRI, commit.getProperty(vf.createIRI(PROV_GENERATED)).get().stringValue());
        Revision revision = revisionFactory.createNew(vf.createIRI(revisionIRI), commit.getModel());
        assertTrue(revision.getAdditions().isPresent());
        assertTrue(revision.getDeletions().isPresent());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetCommitOfBranchOfRecordInMissingCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#master");
        Resource commitId = vf.createIRI("http://matonto.org/test/commits#test4a");

        manager.getCommit(differentId, recordId, branchId, commitId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetCommitOfBranchOfMissingRecord() {
        // Setup:
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#master");
        Resource commitId = vf.createIRI("http://matonto.org/test/commits#test4a");

        manager.getCommit(distributedCatalogId, notPresentId, branchId, commitId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetCommitOfBranchOfWrongTypeOfRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#master");
        Resource commitId = vf.createIRI("http://matonto.org/test/commits#test4a");

        manager.getCommit(distributedCatalogId, recordId, branchId, commitId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetCommitOfBranchOfRecordInWrongCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#master");
        Resource commitId = vf.createIRI("http://matonto.org/test/commits#test4a");

        manager.getCommit(localCatalogId, recordId, branchId, commitId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetCommitOfBranchOfWrongRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource commitId = vf.createIRI("http://matonto.org/test/commits#test4a");

        manager.getCommit(distributedCatalogId, recordId, notPresentId, commitId);
    }

    @Test(expected = IllegalStateException.class)
    public void testGetCommitOfMissingBranch() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#update-missing");
        Resource commitId = vf.createIRI("http://matonto.org/test/commits#test4a");

        manager.getCommit(distributedCatalogId, recordId, notPresentId, commitId);
    }

    @Test(expected = IllegalStateException.class)
    public void testGetCommitOfBranchWithNoHeadCommitSet() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test2");
        Resource commitId = vf.createIRI("http://matonto.org/test/commits#test4a");

        manager.getCommit(distributedCatalogId, recordId, branchId, commitId);
    }

    @Test(expected = IllegalStateException.class)
    public void testGetMissingCommit() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#update-missing");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test-missing");

        manager.getCommit(distributedCatalogId, recordId, branchId, notPresentId);
    }

    @Test
    public void testGetCommitThatDoesNotBelongToBranch() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#master");
        Resource commitId = vf.createIRI("http://matonto.org/test/commits#test");

        Optional<Commit> result = manager.getCommit(distributedCatalogId, recordId, branchId, commitId);
        assertFalse(result.isPresent());
    }

    /* getHeadCommit */

    @Test
    public void getHeadCommit() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#master");
        Resource commitId = vf.createIRI("http://matonto.org/test/commits#test4a");
        String revisionIRI = "http://matonto.org/test/revisions#revision4a";

        Commit commit = manager.getHeadCommit(distributedCatalogId, recordId, branchId);
        assertEquals(commitId, commit.getResource());
        assertTrue(commit.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals("Commit", commit.getProperty(vf.createIRI(DC_TITLE)).get().stringValue());
        assertTrue(commit.getProperty(vf.createIRI(PROV_AT_TIME)).isPresent());
        assertTrue(commit.getProperty(vf.createIRI(PROV_GENERATED)).isPresent());
        assertEquals(revisionIRI, commit.getProperty(vf.createIRI(PROV_GENERATED)).get().stringValue());
        Revision revision = revisionFactory.createNew(vf.createIRI(revisionIRI), commit.getModel());
        assertTrue(revision.getAdditions().isPresent());
        assertTrue(revision.getDeletions().isPresent());
    }

    @Test(expected = IllegalArgumentException.class)
    public void getHeadCommitOfBranchOfRecordInMissingCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#master");

        manager.getHeadCommit(differentId, recordId, branchId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void getHeadCommitOfBranchOfMissingRecord() {
        // Setup:
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#master");

        manager.getHeadCommit(distributedCatalogId, notPresentId, branchId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void getHeadCommitOfBranchOfWrongTypeOfRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#master");

        manager.getHeadCommit(distributedCatalogId, recordId, branchId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void getHeadCommitOfBranchOfRecordInWrongCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#master");

        manager.getHeadCommit(localCatalogId, recordId, branchId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void getHeadCommitOfBranchOfWrongRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");

        manager.getHeadCommit(distributedCatalogId, recordId, notPresentId);
    }

    @Test(expected = IllegalStateException.class)
    public void getHeadCommitOfMissingBranch() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#update-missing");

        manager.getHeadCommit(distributedCatalogId, recordId, notPresentId);
    }

    @Test(expected = IllegalStateException.class)
    public void getHeadCommitOfBranchWithNoHeadSet() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test2");

        manager.getHeadCommit(distributedCatalogId, recordId, branchId);
    }

    @Test(expected = IllegalStateException.class)
    public void getMissingHeadCommit() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#update-missing");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test-missing");

        manager.getHeadCommit(distributedCatalogId, recordId, branchId);
    }

    /* getInProgressCommit(Resource, Resource, User) */

    @Test
    public void testGetInProgressCommitWithUser() throws Exception {
        // Setup:
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user/taken"));
        Resource versionedRDFRecordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        String revisionIRI = "http://matonto.org/test/revisions#in-revision";

        Optional<InProgressCommit> result = manager.getInProgressCommit(distributedCatalogId, versionedRDFRecordId, user);
        assertTrue(result.isPresent());
        InProgressCommit commit = result.get();
        assertEquals(vf.createIRI("http://matonto.org/test/in-progress-commits#test"), commit.getResource());
        assertTrue(commit.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals("In Progress Commit", commit.getProperty(vf.createIRI(DC_TITLE)).get().stringValue());
        assertTrue(commit.getProperty(vf.createIRI(PROV_AT_TIME)).isPresent());
        assertTrue(commit.getProperty(vf.createIRI(PROV_GENERATED)).isPresent());
        assertEquals(revisionIRI, commit.getProperty(vf.createIRI(PROV_GENERATED)).get().stringValue());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetInProgressCommitWithUserForRecordInMissingCatalog() {
        // Setup:
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user/taken"));
        Resource versionedRDFRecordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");

        manager.getInProgressCommit(differentId, versionedRDFRecordId, user);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetInProgressCommitWithUserForMissingRecord() {
        // Setup:
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user/taken"));

        manager.getInProgressCommit(differentId, notPresentId, user);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetInProgressCommitWithUserForWrongTypeOfRecord() {
        // Setup:
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user/taken"));
        Resource versionedRDFRecordId = vf.createIRI("http://matonto.org/test/records#unversioned");

        manager.getInProgressCommit(distributedCatalogId, versionedRDFRecordId, user);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetInProgressCommitWithUserForRecordInWrongCatalog() {
        // Setup:
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user/taken"));
        Resource versionedRDFRecordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");

        manager.getInProgressCommit(localCatalogId, versionedRDFRecordId, user);
    }

    @Test
    public void testGetInProgressCommitWithUserForWrongRecord() {
        // Setup:
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user"));
        Resource versionedRDFRecordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");

        Optional<InProgressCommit> result = manager.getInProgressCommit(distributedCatalogId, versionedRDFRecordId, user);
        assertFalse(result.isPresent());
    }

    /* getInProgressCommit(Resource, Resource, Resource) */

    @Test
    public void testGetInProgressCommitWithResource() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource commitId = vf.createIRI("http://matonto.org/test/in-progress-commits#test");
        String revisionIRI = "http://matonto.org/test/revisions#in-revision";
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(commitId, null, null, commitId).hasNext());
        }

        Optional<InProgressCommit> result = manager.getInProgressCommit(distributedCatalogId, recordId, commitId);
        assertTrue(result.isPresent());
        InProgressCommit commit = result.get();
        assertTrue(commit.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals("In Progress Commit", commit.getProperty(vf.createIRI(DC_TITLE)).get().stringValue());
        assertTrue(commit.getProperty(vf.createIRI(PROV_AT_TIME)).isPresent());
        assertTrue(commit.getProperty(vf.createIRI(PROV_GENERATED)).isPresent());
        assertEquals(revisionIRI, commit.getProperty(vf.createIRI(PROV_GENERATED)).get().stringValue());
        Revision revision = revisionFactory.createNew(vf.createIRI(revisionIRI), commit.getModel());
        assertTrue(revision.getAdditions().isPresent());
        assertTrue(revision.getDeletions().isPresent());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetInProgressCommitWithResourceOfRecordInMissingCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource commitId = vf.createIRI("http://matonto.org/test/in-progress-commits#test");

        manager.getInProgressCommit(differentId, recordId, commitId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetInProgressCommitWithResourceOfMissingRecord() {
        // Setup:
        Resource commitId = vf.createIRI("http://matonto.org/test/in-progress-commits#test");

        manager.getInProgressCommit(distributedCatalogId, notPresentId, commitId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetInProgressCommitWithResourceOfWrongTypeOfRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Resource commitId = vf.createIRI("http://matonto.org/test/in-progress-commits#test");

        manager.getInProgressCommit(distributedCatalogId, recordId, commitId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetInProgressCommitWithResourceOfRecordInWrongCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource commitId = vf.createIRI("http://matonto.org/test/in-progress-commits#test");

        manager.getInProgressCommit(localCatalogId, recordId, commitId);
    }

    @Test
    public void testGetMissingInProgressCommitWithResource() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");

        Optional<InProgressCommit> result = manager.getInProgressCommit(distributedCatalogId, recordId, notPresentId);
        assertFalse(result.isPresent());
    }

    @Test(expected = IllegalStateException.class)
    public void testGetInProgressCommitWithResourceAndNoRecordSet() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource commitId = vf.createIRI("http://matonto.org/test/in-progress-commits#test2");

        manager.getInProgressCommit(distributedCatalogId, recordId, commitId);
    }

    @Test
    public void testGetInProgressCommitWithResourceForWrongRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#update");
        Resource commitId = vf.createIRI("http://matonto.org/test/in-progress-commits#test");

        Optional<InProgressCommit> result = manager.getInProgressCommit(distributedCatalogId, recordId, commitId);
        assertFalse(result.isPresent());
    }

    /* getCommitDifference */

    @Test
    public void testGetCommitDifference() throws Exception {
        // Setup:
        Resource commit = vf.createIRI("http://matonto.org/test/commits#test");
        IRI dcTitleIRI = vf.createIRI(DC_TITLE);
        Resource addIRI = vf.createIRI("http://matonto.org/test/add");
        Resource deleteIRI = vf.createIRI("http://matonto.org/test/delete");

        Difference result = manager.getCommitDifference(commit);
        assertTrue(result.getAdditions().contains(addIRI, dcTitleIRI, vf.createLiteral("Add")));
        assertTrue(result.getDeletions().contains(deleteIRI, dcTitleIRI, vf.createLiteral("Delete")));
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetMissingCommitDifference() {
        manager.getCommitDifference(notPresentId);
    }

    /* removeInProgressCommit(Resource, Resource, Resource) */

    @Test
    public void testRemoveInProgressCommit() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource inProgressCommitId = vf.createIRI("http://matonto.org/test/in-progress-commits#test");
        Resource additionsResource = vf.createIRI("http://matonto.org/test/in-additions#test");
        Resource deletionsResource = vf.createIRI("http://matonto.org/test/in-deletions#test");
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(inProgressCommitId, null, null, inProgressCommitId).hasNext());
            assertTrue(conn.size(additionsResource) > 0);
            assertTrue(conn.size(deletionsResource) > 0);

            manager.removeInProgressCommit(distributedCatalogId, recordId, inProgressCommitId);
            assertFalse(conn.getStatements(inProgressCommitId, null, null, inProgressCommitId).hasNext());
            assertTrue(conn.size(additionsResource) == 0);
            assertTrue(conn.size(deletionsResource) == 0);
        }
    }

    @Test
    public void testRemoveInProgressCommitWithReferencedChanges() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#update");
        Resource inProgressCommitId = vf.createIRI("http://matonto.org/test/in-progress-commits#test3");
        Resource additionsResource = vf.createIRI("http://matonto.org/test/additions#test");
        Resource deletionsResource = vf.createIRI("http://matonto.org/test/deletions#test");
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(inProgressCommitId, null, null, inProgressCommitId).hasNext());
            assertTrue(conn.size(additionsResource) > 0);
            assertTrue(conn.size(deletionsResource) > 0);

            manager.removeInProgressCommit(distributedCatalogId, recordId, inProgressCommitId);
            assertFalse(conn.getStatements(inProgressCommitId, null, null, inProgressCommitId).hasNext());
            assertTrue(conn.size(additionsResource) > 0);
            assertTrue(conn.size(deletionsResource) > 0);
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRemoveInProgressCommitOfRecordInMissingCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource inProgressCommitId = vf.createIRI("http://matonto.org/test/in-progress-commits#test");

        manager.removeInProgressCommit(differentId, recordId, inProgressCommitId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRemoveInProgressCommitOfMissingRecord() {
        // Setup:
        Resource inProgressCommitId = vf.createIRI("http://matonto.org/test/in-progress-commits#test");

        manager.removeInProgressCommit(distributedCatalogId, notPresentId, inProgressCommitId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRemoveInProgressCommitOfWrongTypeOfRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Resource inProgressCommitId = vf.createIRI("http://matonto.org/test/in-progress-commits#test");

        manager.removeInProgressCommit(distributedCatalogId, recordId, inProgressCommitId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRemoveInProgressCommitOfRecordInWrongCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource inProgressCommitId = vf.createIRI("http://matonto.org/test/in-progress-commits#test");

        manager.removeInProgressCommit(localCatalogId, recordId, inProgressCommitId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRemoveMissingInProgressCommit() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");

        manager.removeInProgressCommit(differentId, recordId, notPresentId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRemoveInProgressCommitForWrongRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#update");
        Resource inProgressCommitId = vf.createIRI("http://matonto.org/test/in-progress-commits#test");

        manager.removeInProgressCommit(differentId, recordId, inProgressCommitId);
    }

    /* removeInProgressCommit(Resource, Resource, User) */

    @Test
    public void testRemoveInProgressCommitWithUser() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user/taken"));
        Resource inProgressCommitId = vf.createIRI("http://matonto.org/test/in-progress-commits#test");
        Resource additionsResource = vf.createIRI("http://matonto.org/test/in-additions#test");
        Resource deletionsResource = vf.createIRI("http://matonto.org/test/in-deletions#test");
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(inProgressCommitId, null, null, inProgressCommitId).hasNext());
            assertTrue(conn.size(additionsResource) > 0);
            assertTrue(conn.size(deletionsResource) > 0);

            manager.removeInProgressCommit(distributedCatalogId, recordId, user);
            assertFalse(conn.getStatements(inProgressCommitId, null, null, inProgressCommitId).hasNext());
            assertTrue(conn.size(additionsResource) == 0);
            assertTrue(conn.size(deletionsResource) == 0);
        }
    }

    @Test
    public void testRemoveInProgressCommitWithUserAndReferencedChanges() throws Exception {
        Resource recordId = vf.createIRI("http://matonto.org/test/records#update");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user/taken"));
        Resource inProgressCommitId = vf.createIRI("http://matonto.org/test/in-progress-commits#test3");
        Resource additionsResource = vf.createIRI("http://matonto.org/test/additions#test");
        Resource deletionsResource = vf.createIRI("http://matonto.org/test/deletions#test");
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(inProgressCommitId, null, null, inProgressCommitId).hasNext());
            assertTrue(conn.size(additionsResource) > 0);
            assertTrue(conn.size(deletionsResource) > 0);

            manager.removeInProgressCommit(distributedCatalogId, recordId, user);
            assertFalse(conn.getStatements(inProgressCommitId, null, null, inProgressCommitId).hasNext());
            assertTrue(conn.size(additionsResource) > 0);
            assertTrue(conn.size(deletionsResource) > 0);
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRemoveInProgressCommitWithUserOfRecordInMissingCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user/taken"));

        manager.removeInProgressCommit(differentId, recordId, user);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRemoveInProgressCommitWithUserOfMissingRecord() {
        // Setup:
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user/taken"));

        manager.removeInProgressCommit(distributedCatalogId, notPresentId, user);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRemoveInProgressCommitWithUserOfWrongTypeOfRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user/taken"));

        manager.removeInProgressCommit(distributedCatalogId, recordId, user);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRemoveInProgressCommitWithUserOfRecordInWrongCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user/taken"));

        manager.removeInProgressCommit(localCatalogId, recordId, user);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRemoveMissingInProgressCommitWithUser() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user"));

        manager.removeInProgressCommit(distributedCatalogId, recordId, user);
    }

    /* applyInProgressCommit */

    @Test
    public void testApplyInProgressCommit() throws Exception {
        // Setup:
        Resource inProgressCommitId = vf.createIRI("http://matonto.org/test/in-progress-commits#test");
        IRI dcTitleIRI = vf.createIRI(DC_TITLE);
        Resource deleteIRI = vf.createIRI("http://matonto.org/test/delete");
        Resource entityIRI = vf.createIRI("http://matonto.org/entity");
        Resource addIRI = vf.createIRI("http://matonto.org/test/add");
        Model entity = mf.createModel();
        entity.add(entityIRI, dcTitleIRI, vf.createLiteral("Entity"));
        entity.add(deleteIRI, dcTitleIRI, vf.createLiteral("Delete"));

        Model result = manager.applyInProgressCommit(inProgressCommitId, entity);
        assertTrue(result.contains(addIRI, dcTitleIRI, vf.createLiteral("Add")));
        assertFalse(result.contains(deleteIRI, dcTitleIRI, vf.createLiteral("Delete")));
        assertTrue(result.contains(entityIRI, dcTitleIRI, vf.createLiteral("Entity")));
    }

    @Test(expected = IllegalArgumentException.class)
    public void testApplyMissingInProgressCommit() {
        manager.applyInProgressCommit(notPresentId, mf.createModel());
    }

    /* getCommitChain(Resource) */

    @Test
    public void testGetCommitChainWithoutPath() throws Exception {
        List<Resource> expect = Stream.of(vf.createIRI("http://matonto.org/test/commits#test3"),
                vf.createIRI("http://matonto.org/test/commits#test4b"),
                vf.createIRI("http://matonto.org/test/commits#test4a"),
                vf.createIRI("http://matonto.org/test/commits#test2"),
                vf.createIRI("http://matonto.org/test/commits#test1"),
                vf.createIRI("http://matonto.org/test/commits#test0")).collect(Collectors.toList());
        Resource commitId = vf.createIRI("http://matonto.org/test/commits#test3");
        List<Commit> result = manager.getCommitChain(commitId);
        assertEquals(expect.size(), result.size());
        for (int i = 0; i < result.size(); i++) {
            assertEquals(expect.get(i), result.get(i).getResource());
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetCommitChainWithoutPathOfMissingCommit() {
        List<Commit> result = manager.getCommitChain(notPresentId);
        assertEquals(0, result.size());
    }

    /* getCommitChain(Resource, Resource, Resource) */

    @Test
    public void testGetCommitChainWithPath() throws Exception {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#master");

        List<Resource> expect = Stream.of(vf.createIRI("http://matonto.org/test/commits#test4a"),
                vf.createIRI("http://matonto.org/test/commits#test2"),
                vf.createIRI("http://matonto.org/test/commits#test1"),
                vf.createIRI("http://matonto.org/test/commits#test0")).collect(Collectors.toList());
        List<Commit> result = manager.getCommitChain(distributedCatalogId, recordId, branchId);
        assertEquals(expect.size(), result.size());
        assertEquals(expect, result.stream().map(Thing::getResource).collect(Collectors.toList()));
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetCommitChainWithPathOfBranchOfRecordInMissingCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#master");

        manager.getCommitChain(differentId, recordId, branchId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetCommitChainWithPathOfBranchOfMissingRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#master");

        manager.getCommitChain(distributedCatalogId, notPresentId, branchId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetCommitChainWithPathOfBranchOfWrongTypeOfRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#master");

        manager.getCommitChain(distributedCatalogId, recordId, branchId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetCommitChainWithPathOfBranchOfRecordInWrongCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#master");

        manager.getCommitChain(localCatalogId, recordId, branchId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetCommitChainWithPathOfMissingBranch() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");

        manager.getCommitChain(distributedCatalogId, recordId, notPresentId);
    }

    @Test(expected = IllegalStateException.class)
    public void testGetCommitChainWithPathOfBranchWithNoHeadSet() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test2");

        manager.getCommitChain(distributedCatalogId, recordId, branchId);
    }

    /* getCompiledResource */

    @Test
    public void testGetCompiledResourceWithUnmergedPast() throws Exception {
        // Setup:
        Resource commit0Id = vf.createIRI("http://matonto.org/test/commits#test0");
        Resource ontologyId = vf.createIRI("http://matonto.org/test/ontology");
        Model expected = mf.createModel();
        expected.add(ontologyId, vf.createIRI(RDF_TYPE), vf.createIRI("http://www.w3.org/2002/07/owl#Ontology"));
        expected.add(ontologyId, vf.createIRI(DC_TITLE), vf.createLiteral("Test 0 Title"));
        expected.add(vf.createIRI("http://matonto.org/test/class0"), vf.createIRI(RDF_TYPE),
                vf.createIRI("http://www.w3.org/2002/07/owl#Class"));

        Model result = manager.getCompiledResource(commit0Id);
        result.forEach(statement -> assertTrue(expected.contains(statement.getSubject(),
                statement.getPredicate(), statement.getObject())));
    }

    @Test
    public void testGetCompiledResourceWithMergedPast() throws Exception {
        // Setup:
        Resource commit3Id = vf.createIRI("http://matonto.org/test/commits#test3");
        Resource ontologyId = vf.createIRI("http://matonto.org/test/ontology");
        Model expected = mf.createModel();
        expected.add(ontologyId, vf.createIRI(RDF_TYPE), vf.createIRI("http://www.w3.org/2002/07/owl#Ontology"));
        expected.add(ontologyId, vf.createIRI(DC_TITLE), vf.createLiteral("Test 3 Title"));
        expected.add(vf.createIRI("http://matonto.org/test/class0"), vf.createIRI(RDF_TYPE),
                vf.createIRI("http://www.w3.org/2002/07/owl#Class"));
        Model result = manager.getCompiledResource(commit3Id);
        result.forEach(statement -> assertTrue(expected.contains(statement.getSubject(),
                statement.getPredicate(), statement.getObject())));
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetCompiledResourceForMissingCommit() throws Exception {
        manager.getCompiledResource(notPresentId);
    }

    /* getConflicts */

    @Test
    public void testGetConflictsClassDeletion() throws Exception {
        // Setup:
        // Class deletion
        Resource leftId = vf.createIRI("http://matonto.org/test/commits#conflict1");
        Resource rightId = vf.createIRI("http://matonto.org/test/commits#conflict2");

        Set<Conflict> result = manager.getConflicts(leftId, rightId);
        assertEquals(1, result.size());
        result.forEach(conflict -> {
            assertEquals(1, conflict.getOriginal().size());
            Difference left = conflict.getLeftDifference();
            Difference right = conflict.getRightDifference();
            assertEquals(0, left.getAdditions().size());
            assertEquals(0, right.getAdditions().size());
            assertEquals(0, right.getDeletions().size());
            assertEquals(1, left.getDeletions().size());
            Stream.of(left.getDeletions(), conflict.getOriginal()).forEach(model -> model.forEach(statement -> {
                assertEquals("http://matonto.org/test/class0", statement.getSubject().stringValue());
                assertEquals(RDF_TYPE, statement.getPredicate().stringValue());
            }));
        });
    }

    @Test
    public void testGetConflictsSamePropertyAltered() throws Exception {
        // Setup:
        // Both altered same title
        Resource leftId = vf.createIRI("http://matonto.org/test/commits#conflict1-2");
        Resource rightId = vf.createIRI("http://matonto.org/test/commits#conflict2-2");

        Set<Conflict> result = manager.getConflicts(leftId, rightId);
        assertEquals(1, result.size());
        String subject = "http://matonto.org/test/ontology";
        result.forEach(conflict -> {
            assertEquals(1, conflict.getOriginal().size());
            Difference left = conflict.getLeftDifference();
            Difference right = conflict.getRightDifference();
            assertEquals(1, left.getAdditions().size());
            assertEquals(1, right.getAdditions().size());
            assertEquals(0, right.getDeletions().size());
            assertEquals(0, left.getDeletions().size());
            Stream.of(conflict.getOriginal(), left.getAdditions(), right.getAdditions())
                    .forEach(model -> model.forEach(statement -> {
                assertEquals(subject, statement.getSubject().stringValue());
                assertEquals(DC_TITLE, statement.getPredicate().stringValue());
            }));
        });
    }

    @Test
    public void testGetConflictsChainAddsAndRemovesStatement() throws Exception {
        // Setup:
        // Second chain has two commits which adds then removes something
        Resource leftId = vf.createIRI("http://matonto.org/test/commits#conflict1-3");
        Resource rightId = vf.createIRI("http://matonto.org/test/commits#conflict3-3");

        Set<Conflict> result = manager.getConflicts(leftId, rightId);
        assertEquals(0, result.size());
    }

    @Test
    public void testGetConflictsPropertyChangeOnSingleBranch() throws Exception {
        // Setup:
        // Change a property on one branch
        Resource leftId = vf.createIRI("http://matonto.org/test/commits#conflict1-4");
        Resource rightId = vf.createIRI("http://matonto.org/test/commits#conflict2-4");

        Set<Conflict> result = manager.getConflicts(leftId, rightId);
        assertEquals(0, result.size());
    }

    @Test
    public void testGetConflictsOneRemovesOtherAddsToProperty() throws Exception {
        // Setup:
        // One branch removes property while other adds another to it
        Resource leftId = vf.createIRI("http://matonto.org/test/commits#conflict1-5");
        Resource rightId = vf.createIRI("http://matonto.org/test/commits#conflict2-5");

        Set<Conflict> result = manager.getConflicts(leftId, rightId);
        assertEquals(1, result.size());
        String subject = "http://matonto.org/test/ontology";
        result.forEach(conflict -> {
            assertEquals(1, conflict.getOriginal().size());
            Difference left = conflict.getLeftDifference();
            Difference right = conflict.getRightDifference();
            assertEquals(1, left.getAdditions().size());
            assertEquals(0, right.getAdditions().size());
            assertEquals(1, right.getDeletions().size());
            assertEquals(0, left.getDeletions().size());
            Stream.of(conflict.getOriginal(), left.getAdditions(), right.getDeletions())
                    .forEach(model -> model.forEach(statement -> {
                        assertEquals(subject, statement.getSubject().stringValue());
                        assertEquals(DC_TITLE, statement.getPredicate().stringValue());
                    }));
        });
    }

    @Test
    public void testGetConflictsWithOnlyOneCommit() throws Exception {
        // Setup:
        Resource leftId = vf.createIRI("http://matonto.org/test/commits#conflict1-4");
        Resource rightId = vf.createIRI("http://matonto.org/test/commits#conflict0-4");

        Set<Conflict> result = manager.getConflicts(leftId, rightId);
        assertEquals(0, result.size());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetConflictsWithMissingLeftCommit() {
        // Setup:
        Resource rightId = vf.createIRI("http://matonto.org/test/commits#conflict0-4");

        manager.getConflicts(notPresentId, rightId);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetConflictsWithMissingRightCommit() {
        // Setup:
        Resource leftId = vf.createIRI("http://matonto.org/test/commits#conflict1-4");

        manager.getConflicts(leftId, notPresentId);
    }

    /* mergeBranches */

    @Test
    public void testMergeBranches() throws Exception {
        // Setup:
        IRI headIRI = vf.createIRI(Branch.head_IRI);
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource sourceBranchId = vf.createIRI("http://matonto.org/test/branches#test");
        Resource targetBranchId = vf.createIRI("http://matonto.org/test/branches#master");
        Resource originalSourceHead = vf.createIRI("http://matonto.org/test/commits#conflict2");
        Resource originalTargetHead = vf.createIRI("http://matonto.org/test/commits#test4a");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user/taken"));
        Statement statement = vf.createStatement(vf.createIRI("https://matonto.org/test"), vf.createIRI(DC_TITLE),
                vf.createLiteral("Title"));
        Statement statement2 = vf.createStatement(vf.createIRI("https://matonto.org/test"), vf.createIRI(DC_DESCRIPTION),
                vf.createLiteral("Description"));
        Statement statement3 = vf.createStatement(vf.createIRI("https://matonto.org/test"), vf.createIRI(DC_IDENTIFIER),
                vf.createLiteral("Identifier"));
        Model additions = mf.createModel(Stream.of(statement, statement2).collect(Collectors.toSet()));
        Model deletions = mf.createModel(Stream.of(statement2, statement3).collect(Collectors.toSet()));
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(targetBranchId, headIRI, originalTargetHead).hasNext());
            assertTrue(conn.getStatements(sourceBranchId, headIRI, originalSourceHead).hasNext());

            manager.mergeBranches(distributedCatalogId, recordId, sourceBranchId, targetBranchId, user, additions, deletions);
            assertFalse(conn.getStatements(targetBranchId, headIRI, originalTargetHead).hasNext());
            assertTrue(conn.getStatements(sourceBranchId, headIRI, originalSourceHead).hasNext());
            assertTrue(conn.getStatements(statement.getSubject(), statement.getPredicate(), statement.getObject()).hasNext());
            assertFalse(conn.getStatements(statement2.getSubject(), statement2.getPredicate(), statement2.getObject()).hasNext());
            assertTrue(conn.getStatements(statement3.getSubject(), statement3.getPredicate(), statement3.getObject()).hasNext());
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void testMergeBranchesOfRecordInMissingCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource sourceBranchId = vf.createIRI("http://matonto.org/test/branches#test");
        Resource targetBranchId = vf.createIRI("http://matonto.org/test/branches#master");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user/taken"));

        manager.mergeBranches(differentId, recordId, sourceBranchId, targetBranchId, user, null, null);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testMergeBranchesOfMissingRecord() {
        // Setup:
        Resource sourceBranchId = vf.createIRI("http://matonto.org/test/branches#test");
        Resource targetBranchId = vf.createIRI("http://matonto.org/test/branches#master");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user/taken"));

        manager.mergeBranches(distributedCatalogId, notPresentId, sourceBranchId, targetBranchId, user, null, null);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testMergeBranchesOfWrongTypeOfRecord() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Resource sourceBranchId = vf.createIRI("http://matonto.org/test/branches#test");
        Resource targetBranchId = vf.createIRI("http://matonto.org/test/branches#master");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user/taken"));

        manager.mergeBranches(distributedCatalogId, recordId, sourceBranchId, targetBranchId, user, null, null);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testMergeBranchesOfRecordInWrongCatalog() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource sourceBranchId = vf.createIRI("http://matonto.org/test/branches#test");
        Resource targetBranchId = vf.createIRI("http://matonto.org/test/branches#master");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user/taken"));

        manager.mergeBranches(localCatalogId, recordId, sourceBranchId, targetBranchId, user, null, null);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testMergeBranchesWithMissingSource() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource targetBranchId = vf.createIRI("http://matonto.org/test/branches#master");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user/taken"));

        manager.mergeBranches(distributedCatalogId, recordId, notPresentId, targetBranchId, user, null, null);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testMergeBranchesWithMissingTarget() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource sourceBranchId = vf.createIRI("http://matonto.org/test/branches#test");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user/taken"));

        manager.mergeBranches(distributedCatalogId, recordId, sourceBranchId, notPresentId, user, null, null);
    }

    @Test(expected = IllegalStateException.class)
    public void testMergeBranchesWithSourceWithNoHeadSet() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource sourceBranchId = vf.createIRI("http://matonto.org/test/branches#test2");
        Resource targetBranchId = vf.createIRI("http://matonto.org/test/branches#master");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user/taken"));

        manager.mergeBranches(distributedCatalogId, recordId, sourceBranchId, targetBranchId, user, null, null);
    }

    @Test(expected = IllegalStateException.class)
    public void testMergeBranchesWithTargetWithNoHeadSet() {
        // Setup:
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource sourceBranchId = vf.createIRI("http://matonto.org/test/branches#master");
        Resource targetBranchId = vf.createIRI("http://matonto.org/test/branches#test2");
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user/taken"));

        manager.mergeBranches(distributedCatalogId, recordId, sourceBranchId, targetBranchId, user, null, null);
    }

    /* getDiff */

    @Test
    public void testGetDiff() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Model original = mf.createModel();
            conn.getStatements(null, null, null, vf.createIRI("http://matonto.org/test/diff1")).forEach(original::add);
            Model changed = mf.createModel();
            conn.getStatements(null, null, null, vf.createIRI("http://matonto.org/test/diff2")).forEach(changed::add);
            Model additions = mf.createModel();
            conn.getStatements(null, null, null, vf.createIRI("http://matonto.org/test/diff/additions"))
                    .forEach(additions::add);
            Model deletions = mf.createModel();
            conn.getStatements(null, null, null, vf.createIRI("http://matonto.org/test/diff/deletions"))
                    .forEach(deletions::add);

            Difference diff = manager.getDiff(original, changed);
            assertEquals(additions.size(), diff.getAdditions().size());
            diff.getAdditions().forEach(s -> assertTrue(additions.contains(s.getSubject(), s.getPredicate(),
                    s.getObject())));
            assertEquals(deletions.size(), diff.getDeletions().size());
            diff.getDeletions().forEach(s -> assertTrue(deletions.contains(s.getSubject(), s.getPredicate(),
                    s.getObject())));
        }
    }

    @Test
    public void testGetDiffOppositeOfPrevious() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Model changed = mf.createModel();
            conn.getStatements(null, null, null, vf.createIRI("http://matonto.org/test/diff1")).forEach(changed::add);
            Model original = mf.createModel();
            conn.getStatements(null, null, null, vf.createIRI("http://matonto.org/test/diff2")).forEach(original::add);
            Model deletions = mf.createModel();
            conn.getStatements(null, null, null, vf.createIRI("http://matonto.org/test/diff/additions"))
                    .forEach(deletions::add);
            Model additions = mf.createModel();
            conn.getStatements(null, null, null, vf.createIRI("http://matonto.org/test/diff/deletions"))
                    .forEach(additions::add);

            Difference diff = manager.getDiff(original, changed);
            assertEquals(deletions.size(), diff.getDeletions().size());
            diff.getDeletions().forEach(s -> assertTrue(deletions.contains(s.getSubject(), s.getPredicate(),
                    s.getObject())));
            assertEquals(additions.size(), diff.getAdditions().size());
            diff.getAdditions().forEach(s -> assertTrue(additions.contains(s.getSubject(), s.getPredicate(),
                    s.getObject())));
        }
    }

    @Test
    public void testGetDiffOfSameModel() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Model original = mf.createModel();
            conn.getStatements(null, null, null, vf.createIRI("http://matonto.org/test/diff2")).forEach(original::add);

            Difference diff = manager.getDiff(original, original);
            assertEquals(0, diff.getAdditions().size());
            assertEquals(0, diff.getDeletions().size());
        }
    }
}
