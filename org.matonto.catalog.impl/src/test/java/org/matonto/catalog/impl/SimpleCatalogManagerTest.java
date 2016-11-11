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
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.matonto.catalog.api.Conflict;
import org.matonto.catalog.api.Difference;
import org.matonto.catalog.api.PaginatedSearchParams;
import org.matonto.catalog.api.PaginatedSearchResults;
import org.matonto.catalog.api.ontologies.mcat.*;
import org.matonto.jaas.ontologies.usermanagement.User;
import org.matonto.jaas.ontologies.usermanagement.UserFactory;
import org.matonto.rdf.api.*;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.matonto.rdf.core.utils.Values;
import org.matonto.rdf.orm.conversion.ValueConverterRegistry;
import org.matonto.rdf.orm.conversion.impl.*;
import org.matonto.rdf.orm.impl.ThingFactory;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.base.RepositoryResult;
import org.matonto.repository.impl.sesame.SesameRepositoryWrapper;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.openrdf.sail.memory.MemoryStore;

import java.io.InputStream;
import java.security.InvalidParameterException;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static junit.framework.TestCase.assertEquals;
import static junit.framework.TestCase.assertFalse;
import static junit.framework.TestCase.assertTrue;
import static org.hamcrest.Matchers.equalTo;

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
    private DatasetRecordFactory datasetRecordFactory = new DatasetRecordFactory();
    private DistributionFactory distributionFactory = new DistributionFactory();
    private BranchFactory branchFactory = new BranchFactory();
    private InProgressCommitFactory inProgressCommitFactory = new InProgressCommitFactory();
    private CommitFactory commitFactory = new CommitFactory();
    private RevisionFactory revisionFactory = new RevisionFactory();
    private ThingFactory thingFactory = new ThingFactory();
    private VersionFactory versionFactory = new VersionFactory();
    private TagFactory tagFactory = new TagFactory();
    private UserFactory userFactory = new UserFactory();

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
    private static final int TOTAL_SIZE = 5;

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

        datasetRecordFactory.setModelFactory(mf);
        datasetRecordFactory.setValueFactory(vf);
        datasetRecordFactory.setValueConverterRegistry(vcr);

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

        thingFactory.setValueFactory(vf);
        thingFactory.setValueConverterRegistry(vcr);

        vcr.registerValueConverter(catalogFactory);
        vcr.registerValueConverter(recordFactory);
        vcr.registerValueConverter(unversionedRecordFactory);
        vcr.registerValueConverter(versionedRecordFactory);
        vcr.registerValueConverter(versionedRDFRecordFactory);
        vcr.registerValueConverter(ontologyRecordFactory);
        vcr.registerValueConverter(mappingRecordFactory);
        vcr.registerValueConverter(datasetRecordFactory);
        vcr.registerValueConverter(distributionFactory);
        vcr.registerValueConverter(branchFactory);
        vcr.registerValueConverter(inProgressCommitFactory);
        vcr.registerValueConverter(commitFactory);
        vcr.registerValueConverter(revisionFactory);
        vcr.registerValueConverter(versionFactory);
        vcr.registerValueConverter(tagFactory);
        vcr.registerValueConverter(thingFactory);
        vcr.registerValueConverter(userFactory);
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

        InputStream testData = getClass().getResourceAsStream("/testCatalogData.trig");

        RepositoryConnection conn = repo.getConnection();
        conn.add(Values.matontoModel(Rio.parse(testData, "", RDFFormat.TRIG)));
        conn.close();

        Map<String, Object> props = new HashMap<>();
        props.put("title", "MatOnto Test Catalog");
        props.put("description", "This is a test catalog");
        props.put("iri", "http://matonto.org/test/catalog");

        manager.start(props);
    }

    @After
    public void tearDown() throws Exception {
        repo.shutDown();
    }

    @Test
    public void testGetPublishedCatalog() throws Exception {
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
    public void testGetUnpublishedCatalog() throws Exception {
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
        Resource distributed = vf.createIRI("http://matonto.org/test/catalog-distributed");
        Resource catalogId2 = vf.createIRI("http://matonto.org/test/catalog-not-there");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        Set<Resource> results = manager.getRecordIds(distributed);
        assertEquals(results.size(), 5);
        assertTrue(results.contains(vf.createIRI("http://matonto.org/test/records#update")));
        assertTrue(results.contains(vf.createIRI("http://matonto.org/test/records#remove")));
        assertTrue(results.contains(vf.createIRI("http://matonto.org/test/records#get")));

        results = manager.getRecordIds(catalogId2);
        assertEquals(results.size(), 0);

        results = manager.getRecordIds(different);
        assertEquals(results.size(), 0);
    }

    @Test
    public void testAddRecord() throws Exception {
        Resource catalogId = vf.createIRI("http://matonto.org/test/catalog-distributed");
        Resource recordId = vf.createIRI("https://matonto.org/records#test");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        Record record = recordFactory.createNew(recordId);
        record.setCatalog(catalogFactory.createNew(catalogId));

        RepositoryConnection conn = repo.getConnection();

        assertFalse(conn.getStatements(record.getResource(), null, null, record.getResource()).hasNext());

        boolean result = manager.addRecord(different, record);
        assertFalse(result);

        result = manager.addRecord(catalogId, record);
        assertTrue(result);
        assertTrue(conn.getStatements(record.getResource(), null, null, record.getResource()).hasNext());
        assertTrue(conn.getStatements(record.getResource(), null, catalogId, record.getResource()).hasNext());

        result = manager.addRecord(catalogId, record);
        assertFalse(result);

        conn.close();
    }

    @Test
    public void testAddUnversionedRecord() throws Exception {
        Resource catalogId = vf.createIRI("http://matonto.org/test/catalog-distributed");
        Resource recordId = vf.createIRI("https://matonto.org/records#test");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        UnversionedRecord record = unversionedRecordFactory.createNew(recordId);
        record.setCatalog(catalogFactory.createNew(catalogId));

        RepositoryConnection conn = repo.getConnection();

        assertFalse(conn.getStatements(record.getResource(), null, null, record.getResource()).hasNext());

        boolean result = manager.addRecord(different, record);
        assertFalse(result);

        result = manager.addRecord(catalogId, record);
        assertTrue(result);
        assertTrue(conn.getStatements(record.getResource(), null, null, record.getResource()).hasNext());
        assertTrue(conn.getStatements(record.getResource(), null, catalogId, record.getResource()).hasNext());

        result = manager.addRecord(catalogId, record);
        assertFalse(result);

        conn.close();
    }

    @Test
    public void testAddVersionedRecord() throws Exception {
        Resource catalogId = vf.createIRI("http://matonto.org/test/catalog-distributed");
        Resource recordId = vf.createIRI("https://matonto.org/records#test");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        VersionedRecord record = versionedRecordFactory.createNew(recordId);
        record.setCatalog(catalogFactory.createNew(catalogId));

        RepositoryConnection conn = repo.getConnection();

        assertFalse(conn.getStatements(record.getResource(), null, null, record.getResource()).hasNext());

        boolean result = manager.addRecord(different, record);
        assertFalse(result);

        result = manager.addRecord(catalogId, record);
        assertTrue(result);
        assertTrue(conn.getStatements(record.getResource(), null, null, record.getResource()).hasNext());
        assertTrue(conn.getStatements(record.getResource(), null, catalogId, record.getResource()).hasNext());

        result = manager.addRecord(catalogId, record);
        assertFalse(result);

        conn.close();
    }

    @Test
    public void testAddVersionedRDFRecord() throws Exception {
        Resource catalogId = vf.createIRI("http://matonto.org/test/catalog-distributed");
        Resource recordId = vf.createIRI("https://matonto.org/records#test");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        VersionedRDFRecord record = versionedRDFRecordFactory.createNew(recordId);
        record.setCatalog(catalogFactory.createNew(catalogId));

        RepositoryConnection conn = repo.getConnection();

        assertFalse(conn.getStatements(record.getResource(), null, null, record.getResource()).hasNext());

        boolean result = manager.addRecord(different, record);
        assertFalse(result);

        result = manager.addRecord(catalogId, record);
        assertTrue(result);
        assertTrue(conn.getStatements(record.getResource(), null, null, record.getResource()).hasNext());
        assertTrue(conn.getStatements(record.getResource(), null, catalogId, record.getResource()).hasNext());

        result = manager.addRecord(catalogId, record);
        assertFalse(result);

        conn.close();
    }

    @Test
    public void testAddOntologyRecord() throws Exception {
        Resource catalogId = vf.createIRI("http://matonto.org/test/catalog-distributed");
        Resource recordId = vf.createIRI("https://matonto.org/records#test");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        OntologyRecord record = ontologyRecordFactory.createNew(recordId);
        record.setCatalog(catalogFactory.createNew(catalogId));

        RepositoryConnection conn = repo.getConnection();

        assertFalse(conn.getStatements(record.getResource(), null, null, record.getResource()).hasNext());

        boolean result = manager.addRecord(different, record);
        assertFalse(result);

        result = manager.addRecord(catalogId, record);
        assertTrue(result);
        assertTrue(conn.getStatements(record.getResource(), null, null, record.getResource()).hasNext());
        assertTrue(conn.getStatements(record.getResource(), null, catalogId, record.getResource()).hasNext());

        result = manager.addRecord(catalogId, record);
        assertFalse(result);

        conn.close();
    }

    @Test
    public void testAddMappingRecord() throws Exception {
        Resource catalogId = vf.createIRI("http://matonto.org/test/catalog-distributed");
        Resource recordId = vf.createIRI("https://matonto.org/records#test");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        MappingRecord record = mappingRecordFactory.createNew(recordId);
        record.setCatalog(catalogFactory.createNew(catalogId));

        RepositoryConnection conn = repo.getConnection();

        assertFalse(conn.getStatements(record.getResource(), null, null, record.getResource()).hasNext());

        boolean result = manager.addRecord(different, record);
        assertFalse(result);

        result = manager.addRecord(catalogId, record);
        assertTrue(result);
        assertTrue(conn.getStatements(record.getResource(), null, null, record.getResource()).hasNext());
        assertTrue(conn.getStatements(record.getResource(), null, catalogId, record.getResource()).hasNext());

        result = manager.addRecord(catalogId, record);
        assertFalse(result);

        conn.close();
    }

    @Test
    public void testAddDatasetRecord() throws Exception {
        Resource catalogId = vf.createIRI("http://matonto.org/test/catalog-distributed");
        Resource recordId = vf.createIRI("https://matonto.org/records#test");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        DatasetRecord record = datasetRecordFactory.createNew(recordId);
        record.setCatalog(catalogFactory.createNew(catalogId));

        RepositoryConnection conn = repo.getConnection();

        assertFalse(conn.getStatements(record.getResource(), null, null, record.getResource()).hasNext());

        boolean result = manager.addRecord(different, record);
        assertFalse(result);

        result = manager.addRecord(catalogId, record);
        assertTrue(result);
        assertTrue(conn.getStatements(record.getResource(), null, null, record.getResource()).hasNext());
        assertTrue(conn.getStatements(record.getResource(), null, catalogId, record.getResource()).hasNext());

        result = manager.addRecord(catalogId, record);
        assertFalse(result);

        conn.close();
    }

    @Test
    public void testUpdateRecord() throws Exception {
        Resource catalogId = vf.createIRI("http://matonto.org/test/catalog-distributed");
        Resource recordId = vf.createIRI("http://matonto.org/test/records#update");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        Record record = recordFactory.createNew(recordId);
        record.setCatalog(catalogFactory.createNew(catalogId));
        record.setKeyword(Stream.of(vf.createLiteral("keyword1")).collect(Collectors.toSet()));

        RepositoryConnection conn = repo.getConnection();

        assertTrue(conn.getStatements(recordId, vf.createIRI(Record.catalog_IRI), catalogId, recordId).hasNext());
        assertFalse(conn.getStatements(recordId, vf.createIRI(Record.keyword_IRI), vf.createLiteral("keyword1"),
                recordId).hasNext());

        boolean result = manager.updateRecord(different, record);
        assertFalse(result);

        result = manager.updateRecord(catalogId, record);
        assertTrue(result);
        assertTrue(conn.getStatements(record.getResource(), vf.createIRI(Record.catalog_IRI), catalogId,
                record.getResource()).hasNext());
        assertTrue(conn.getStatements(record.getResource(), vf.createIRI(Record.keyword_IRI),
                vf.createLiteral("keyword1"), record.getResource()).hasNext());

        Record record2 = recordFactory.createNew(vf.createIRI("http://matonto.org/test/records#not-present"));
        record2.setCatalog(catalogFactory.createNew(catalogId));
        record2.setKeyword(Stream.of(vf.createLiteral("keyword1")).collect(Collectors.toSet()));

        result = manager.updateRecord(catalogId, record2);
        assertFalse(result);

        result = manager.updateRecord(different, record2);
        assertFalse(result);

        conn.close();
    }

    @Test
    public void testUpdateUnversionedRecord() throws Exception {
        Resource catalogId = vf.createIRI("http://matonto.org/test/catalog-distributed");
        Resource recordId = vf.createIRI("http://matonto.org/test/records#update");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        UnversionedRecord record = unversionedRecordFactory.createNew(recordId);
        record.setCatalog(catalogFactory.createNew(catalogId));
        record.setKeyword(Stream.of(vf.createLiteral("keyword1")).collect(Collectors.toSet()));

        RepositoryConnection conn = repo.getConnection();

        assertTrue(conn.getStatements(recordId, vf.createIRI(Record.catalog_IRI), catalogId, recordId).hasNext());
        assertFalse(conn.getStatements(recordId, vf.createIRI(Record.keyword_IRI), vf.createLiteral("keyword1"),
                recordId).hasNext());

        boolean result = manager.updateRecord(different, record);
        assertFalse(result);

        result = manager.updateRecord(catalogId, record);
        assertTrue(result);
        assertTrue(conn.getStatements(record.getResource(), vf.createIRI(Record.catalog_IRI), catalogId,
                record.getResource()).hasNext());
        assertTrue(conn.getStatements(record.getResource(), vf.createIRI(Record.keyword_IRI),
                vf.createLiteral("keyword1"), record.getResource()).hasNext());

        UnversionedRecord record2 = unversionedRecordFactory.createNew(vf
                .createIRI("http://matonto.org/test/records#not-present"));
        record2.setCatalog(catalogFactory.createNew(catalogId));
        record2.setKeyword(Stream.of(vf.createLiteral("keyword1")).collect(Collectors.toSet()));

        result = manager.updateRecord(catalogId, record2);
        assertFalse(result);

        result = manager.updateRecord(different, record2);
        assertFalse(result);

        conn.close();
    }

    @Test
    public void testUpdateVersionedRecord() throws Exception {
        Resource catalogId = vf.createIRI("http://matonto.org/test/catalog-distributed");
        Resource recordId = vf.createIRI("http://matonto.org/test/records#update");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        VersionedRecord record = versionedRecordFactory.createNew(recordId);
        record.setCatalog(catalogFactory.createNew(catalogId));
        record.setKeyword(Stream.of(vf.createLiteral("keyword1")).collect(Collectors.toSet()));

        RepositoryConnection conn = repo.getConnection();

        assertTrue(conn.getStatements(recordId, vf.createIRI(Record.catalog_IRI), catalogId, recordId).hasNext());
        assertFalse(conn.getStatements(recordId, vf.createIRI(Record.keyword_IRI), vf.createLiteral("keyword1"),
                recordId).hasNext());

        boolean result = manager.updateRecord(different, record);
        assertFalse(result);

        result = manager.updateRecord(catalogId, record);
        assertTrue(result);
        assertTrue(conn.getStatements(record.getResource(), vf.createIRI(Record.catalog_IRI), catalogId,
                record.getResource()).hasNext());
        assertTrue(conn.getStatements(record.getResource(), vf.createIRI(Record.keyword_IRI),
                vf.createLiteral("keyword1"), record.getResource()).hasNext());

        Record record2 = versionedRecordFactory.createNew(vf.createIRI("http://matonto.org/test/records#not-present"));
        record.setCatalog(catalogFactory.createNew(catalogId));
        record.setKeyword(Stream.of(vf.createLiteral("keyword1")).collect(Collectors.toSet()));

        result = manager.updateRecord(catalogId, record2);
        assertFalse(result);

        result = manager.updateRecord(different, record2);
        assertFalse(result);

        conn.close();
    }

    @Test
    public void testUpdateVersionedRDFRecord() throws Exception {
        Resource catalogId = vf.createIRI("http://matonto.org/test/catalog-distributed");
        Resource recordId = vf.createIRI("http://matonto.org/test/records#update");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        VersionedRDFRecord record = versionedRDFRecordFactory.createNew(recordId);
        record.setCatalog(catalogFactory.createNew(catalogId));
        record.setKeyword(Stream.of(vf.createLiteral("keyword1")).collect(Collectors.toSet()));

        RepositoryConnection conn = repo.getConnection();

        assertTrue(conn.getStatements(recordId, vf.createIRI(Record.catalog_IRI), catalogId, recordId).hasNext());
        assertFalse(conn.getStatements(recordId, vf.createIRI(Record.keyword_IRI), vf.createLiteral("keyword1"),
                recordId).hasNext());

        boolean result = manager.updateRecord(different, record);
        assertFalse(result);

        result = manager.updateRecord(catalogId, record);
        assertTrue(result);
        assertTrue(conn.getStatements(record.getResource(), vf.createIRI(Record.catalog_IRI), catalogId,
                record.getResource()).hasNext());
        assertTrue(conn.getStatements(record.getResource(), vf.createIRI(Record.keyword_IRI),
                vf.createLiteral("keyword1"), record.getResource()).hasNext());

        Record record2 = versionedRDFRecordFactory.createNew(vf
                .createIRI("http://matonto.org/test/records#not-present"));
        record2.setCatalog(catalogFactory.createNew(catalogId));
        record2.setKeyword(Stream.of(vf.createLiteral("keyword1")).collect(Collectors.toSet()));

        result = manager.updateRecord(catalogId, record2);
        assertFalse(result);

        result = manager.updateRecord(different, record2);
        assertFalse(result);

        conn.close();
    }

    @Test
    public void testUpdateOntologyRecord() throws Exception {
        Resource catalogId = vf.createIRI("http://matonto.org/test/catalog-distributed");
        Resource recordId = vf.createIRI("http://matonto.org/test/records#update");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        OntologyRecord record = ontologyRecordFactory.createNew(recordId);
        record.setCatalog(catalogFactory.createNew(catalogId));
        record.setKeyword(Stream.of(vf.createLiteral("keyword1")).collect(Collectors.toSet()));

        RepositoryConnection conn = repo.getConnection();

        assertTrue(conn.getStatements(recordId, vf.createIRI(Record.catalog_IRI), catalogId, recordId).hasNext());
        assertFalse(conn.getStatements(recordId, vf.createIRI(Record.keyword_IRI), vf.createLiteral("keyword1"),
                recordId).hasNext());

        boolean result = manager.updateRecord(different, record);
        assertFalse(result);

        result = manager.updateRecord(catalogId, record);
        assertTrue(result);
        assertTrue(conn.getStatements(record.getResource(), vf.createIRI(Record.catalog_IRI), catalogId,
                record.getResource()).hasNext());
        assertTrue(conn.getStatements(record.getResource(), vf.createIRI(Record.keyword_IRI),
                vf.createLiteral("keyword1"), record.getResource()).hasNext());

        Record record2 = recordFactory.createNew(vf.createIRI("http://matonto.org/test/records#not-present"));
        record.setCatalog(catalogFactory.createNew(catalogId));
        record.setKeyword(Stream.of(vf.createLiteral("keyword1")).collect(Collectors.toSet()));

        result = manager.updateRecord(catalogId, record2);
        assertFalse(result);

        result = manager.updateRecord(different, record2);
        assertFalse(result);

        conn.close();
    }

    @Test
    public void testUpdateMappingRecord() throws Exception {
        Resource catalogId = vf.createIRI("http://matonto.org/test/catalog-distributed");
        Resource recordId = vf.createIRI("http://matonto.org/test/records#update");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        MappingRecord record = mappingRecordFactory.createNew(recordId);
        record.setCatalog(catalogFactory.createNew(catalogId));
        record.setKeyword(Stream.of(vf.createLiteral("keyword1")).collect(Collectors.toSet()));

        RepositoryConnection conn = repo.getConnection();

        assertTrue(conn.getStatements(recordId, vf.createIRI(Record.catalog_IRI), catalogId, recordId).hasNext());
        assertFalse(conn.getStatements(recordId, vf.createIRI(Record.keyword_IRI), vf.createLiteral("keyword1"),
                recordId).hasNext());

        boolean result = manager.updateRecord(different, record);
        assertFalse(result);

        result = manager.updateRecord(catalogId, record);
        assertTrue(result);
        assertTrue(conn.getStatements(record.getResource(), vf.createIRI(Record.catalog_IRI), catalogId,
                record.getResource()).hasNext());
        assertTrue(conn.getStatements(record.getResource(), vf.createIRI(Record.keyword_IRI),
                vf.createLiteral("keyword1"), record.getResource()).hasNext());

        Record record2 = recordFactory.createNew(vf.createIRI("http://matonto.org/test/records#not-present"));
        record.setCatalog(catalogFactory.createNew(catalogId));
        record.setKeyword(Stream.of(vf.createLiteral("keyword1")).collect(Collectors.toSet()));

        result = manager.updateRecord(catalogId, record2);
        assertFalse(result);

        result = manager.updateRecord(different, record2);
        assertFalse(result);

        conn.close();
    }

    @Test
    public void testUpdateDatasetRecord() throws Exception {
        Resource catalogId = vf.createIRI("http://matonto.org/test/catalog-distributed");
        Resource recordId = vf.createIRI("http://matonto.org/test/records#update");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        DatasetRecord record = datasetRecordFactory.createNew(recordId);
        record.setCatalog(catalogFactory.createNew(catalogId));
        record.setKeyword(Stream.of(vf.createLiteral("keyword1")).collect(Collectors.toSet()));

        RepositoryConnection conn = repo.getConnection();

        assertTrue(conn.getStatements(recordId, vf.createIRI(Record.catalog_IRI), catalogId, recordId).hasNext());
        assertFalse(conn.getStatements(recordId, vf.createIRI(Record.keyword_IRI), vf.createLiteral("keyword1"),
                recordId).hasNext());

        boolean result = manager.updateRecord(different, record);
        assertFalse(result);

        result = manager.updateRecord(catalogId, record);
        assertTrue(result);
        assertTrue(conn.getStatements(record.getResource(), vf.createIRI(Record.catalog_IRI), catalogId,
                record.getResource()).hasNext());
        assertTrue(conn.getStatements(record.getResource(), vf.createIRI(Record.keyword_IRI),
                vf.createLiteral("keyword1"), record.getResource()).hasNext());

        Record record2 = recordFactory.createNew(vf.createIRI("http://matonto.org/test/records#not-present"));
        record.setCatalog(catalogFactory.createNew(catalogId));
        record.setKeyword(Stream.of(vf.createLiteral("keyword1")).collect(Collectors.toSet()));

        result = manager.updateRecord(catalogId, record2);
        assertFalse(result);

        result = manager.updateRecord(different, record2);
        assertFalse(result);

        conn.close();
    }

    @Test
    public void testRemoveRecord() throws Exception {
        Resource catalogId = vf.createIRI("http://matonto.org/test/catalog-distributed");
        Resource recordId = vf.createIRI("http://matonto.org/test/records#remove");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        RepositoryConnection conn = repo.getConnection();

        assertTrue(conn.getStatements(recordId, null, null, recordId).hasNext());

        boolean result = manager.removeRecord(different, recordId);
        assertFalse(result);

        result = manager.removeRecord(catalogId, recordId);
        assertTrue(result);
        assertFalse(conn.getStatements(recordId, null, null, recordId).hasNext());

        Resource recordId2 = vf.createIRI("http://matonto.org/test/records#not-present");

        result = manager.removeRecord(catalogId, recordId2);
        assertFalse(result);

        conn.close();
    }

    @Test
    public void testGetRecord() throws Exception {
        Resource catalogId = vf.createIRI("http://matonto.org/test/catalog-distributed");
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");

        RepositoryConnection conn = repo.getConnection();
        assertTrue(conn.getStatements(recordId, null, null, recordId).hasNext());
        conn.close();

        Optional<Record> result = manager.getRecord(catalogId, recordId, recordFactory);

        assertTrue(result.isPresent());
        Record record = result.get();
        assertTrue(record.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals(record.getProperty(vf.createIRI(DC_TITLE)).get().stringValue(), "Get");
        assertTrue(record.getProperty(vf.createIRI(DC_DESCRIPTION)).isPresent());
        assertEquals(record.getProperty(vf.createIRI(DC_DESCRIPTION)).get().stringValue(), "Description");
        assertTrue(record.getProperty(vf.createIRI(DC_IDENTIFIER)).isPresent());
        assertEquals(record.getProperty(vf.createIRI(DC_IDENTIFIER)).get().stringValue(), "Identifier");
        assertTrue(record.getProperty(vf.createIRI(DC_MODIFIED)).isPresent());
        assertTrue(record.getProperty(vf.createIRI(DC_ISSUED)).isPresent());

        Resource recordId2 = vf.createIRI("http://matonto.org/test/records#not-present");

        result = manager.getRecord(catalogId, recordId2, recordFactory);

        assertFalse(result.isPresent());
    }

    @Test
    public void testGetUnversionedRecord() throws Exception {
        Resource catalogId = vf.createIRI("http://matonto.org/test/catalog-distributed");
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");

        RepositoryConnection conn = repo.getConnection();
        assertTrue(conn.getStatements(recordId, null, null, recordId).hasNext());
        conn.close();

        Optional<UnversionedRecord> result = manager.getRecord(catalogId, recordId, unversionedRecordFactory);

        assertTrue(result.isPresent());
        UnversionedRecord record = result.get();
        assertTrue(record.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals(record.getProperty(vf.createIRI(DC_TITLE)).get().stringValue(), "Get");
        assertTrue(record.getProperty(vf.createIRI(DC_DESCRIPTION)).isPresent());
        assertEquals(record.getProperty(vf.createIRI(DC_DESCRIPTION)).get().stringValue(), "Description");
        assertTrue(record.getProperty(vf.createIRI(DC_IDENTIFIER)).isPresent());
        assertEquals(record.getProperty(vf.createIRI(DC_IDENTIFIER)).get().stringValue(), "Identifier");
        assertTrue(record.getProperty(vf.createIRI(DC_MODIFIED)).isPresent());
        assertTrue(record.getProperty(vf.createIRI(DC_ISSUED)).isPresent());

        Resource recordId2 = vf.createIRI("http://matonto.org/test/records#not-present");

        result = manager.getRecord(catalogId, recordId2, unversionedRecordFactory);

        assertFalse(result.isPresent());
    }

    @Test
    public void testGetVersionedRecord() throws Exception {
        Resource catalogId = vf.createIRI("http://matonto.org/test/catalog-distributed");
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");

        RepositoryConnection conn = repo.getConnection();
        assertTrue(conn.getStatements(recordId, null, null, recordId).hasNext());
        conn.close();

        Optional<VersionedRecord> result = manager.getRecord(catalogId, recordId, versionedRecordFactory);

        assertTrue(result.isPresent());
        VersionedRecord record = result.get();
        assertTrue(record.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals(record.getProperty(vf.createIRI(DC_TITLE)).get().stringValue(), "Get");
        assertTrue(record.getProperty(vf.createIRI(DC_DESCRIPTION)).isPresent());
        assertEquals(record.getProperty(vf.createIRI(DC_DESCRIPTION)).get().stringValue(), "Description");
        assertTrue(record.getProperty(vf.createIRI(DC_IDENTIFIER)).isPresent());
        assertEquals(record.getProperty(vf.createIRI(DC_IDENTIFIER)).get().stringValue(), "Identifier");
        assertTrue(record.getProperty(vf.createIRI(DC_MODIFIED)).isPresent());
        assertTrue(record.getProperty(vf.createIRI(DC_ISSUED)).isPresent());

        Resource recordId2 = vf.createIRI("http://matonto.org/test/records#not-present");

        result = manager.getRecord(catalogId, recordId2, versionedRecordFactory);

        assertFalse(result.isPresent());
    }

    @Test
    public void testGetVersionedRDFRecord() throws Exception {
        Resource catalogId = vf.createIRI("http://matonto.org/test/catalog-distributed");
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");

        RepositoryConnection conn = repo.getConnection();
        assertTrue(conn.getStatements(recordId, null, null, recordId).hasNext());
        conn.close();

        Optional<VersionedRDFRecord> result = manager.getRecord(catalogId, recordId, versionedRDFRecordFactory);

        assertTrue(result.isPresent());
        VersionedRDFRecord record = result.get();
        assertTrue(record.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals(record.getProperty(vf.createIRI(DC_TITLE)).get().stringValue(), "Get");
        assertTrue(record.getProperty(vf.createIRI(DC_DESCRIPTION)).isPresent());
        assertEquals(record.getProperty(vf.createIRI(DC_DESCRIPTION)).get().stringValue(), "Description");
        assertTrue(record.getProperty(vf.createIRI(DC_IDENTIFIER)).isPresent());
        assertEquals(record.getProperty(vf.createIRI(DC_IDENTIFIER)).get().stringValue(), "Identifier");
        assertTrue(record.getProperty(vf.createIRI(DC_MODIFIED)).isPresent());
        assertTrue(record.getProperty(vf.createIRI(DC_ISSUED)).isPresent());

        Resource recordId2 = vf.createIRI("http://matonto.org/test/records#not-present");

        result = manager.getRecord(catalogId, recordId2, versionedRDFRecordFactory);

        assertFalse(result.isPresent());
    }

    @Test
    public void testGetOntologyRecord() throws Exception {
        Resource catalogId = vf.createIRI("http://matonto.org/test/catalog-distributed");
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");

        RepositoryConnection conn = repo.getConnection();
        assertTrue(conn.getStatements(recordId, null, null, recordId).hasNext());
        conn.close();

        Optional<OntologyRecord> result = manager.getRecord(catalogId, recordId, ontologyRecordFactory);

        assertTrue(result.isPresent());
        OntologyRecord record = result.get();
        assertTrue(record.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals(record.getProperty(vf.createIRI(DC_TITLE)).get().stringValue(), "Get");
        assertTrue(record.getProperty(vf.createIRI(DC_DESCRIPTION)).isPresent());
        assertEquals(record.getProperty(vf.createIRI(DC_DESCRIPTION)).get().stringValue(), "Description");
        assertTrue(record.getProperty(vf.createIRI(DC_IDENTIFIER)).isPresent());
        assertEquals(record.getProperty(vf.createIRI(DC_IDENTIFIER)).get().stringValue(), "Identifier");
        assertTrue(record.getProperty(vf.createIRI(DC_MODIFIED)).isPresent());
        assertTrue(record.getProperty(vf.createIRI(DC_ISSUED)).isPresent());

        Resource recordId2 = vf.createIRI("http://matonto.org/test/records#not-present");

        result = manager.getRecord(catalogId, recordId2, ontologyRecordFactory);

        assertFalse(result.isPresent());
    }

    @Test
    public void testGetMappingRecord() throws Exception {
        Resource catalogId = vf.createIRI("http://matonto.org/test/catalog-distributed");
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");

        RepositoryConnection conn = repo.getConnection();
        assertTrue(conn.getStatements(recordId, null, null, recordId).hasNext());
        conn.close();

        Optional<MappingRecord> result = manager.getRecord(catalogId, recordId, mappingRecordFactory);

        assertTrue(result.isPresent());
        MappingRecord record = result.get();
        assertTrue(record.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals(record.getProperty(vf.createIRI(DC_TITLE)).get().stringValue(), "Get");
        assertTrue(record.getProperty(vf.createIRI(DC_DESCRIPTION)).isPresent());
        assertEquals(record.getProperty(vf.createIRI(DC_DESCRIPTION)).get().stringValue(), "Description");
        assertTrue(record.getProperty(vf.createIRI(DC_IDENTIFIER)).isPresent());
        assertEquals(record.getProperty(vf.createIRI(DC_IDENTIFIER)).get().stringValue(), "Identifier");
        assertTrue(record.getProperty(vf.createIRI(DC_MODIFIED)).isPresent());
        assertTrue(record.getProperty(vf.createIRI(DC_ISSUED)).isPresent());

        Resource recordId2 = vf.createIRI("http://matonto.org/test/records#not-present");

        result = manager.getRecord(catalogId, recordId2, mappingRecordFactory);

        assertFalse(result.isPresent());
    }

    @Test
    public void testGetDatasetRecord() throws Exception {
        Resource catalogId = vf.createIRI("http://matonto.org/test/catalog-distributed");
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");

        RepositoryConnection conn = repo.getConnection();
        assertTrue(conn.getStatements(recordId, null, null, recordId).hasNext());
        conn.close();

        Optional<DatasetRecord> result = manager.getRecord(catalogId, recordId, datasetRecordFactory);

        assertTrue(result.isPresent());
        DatasetRecord record = result.get();
        assertTrue(record.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals(record.getProperty(vf.createIRI(DC_TITLE)).get().stringValue(), "Get");
        assertTrue(record.getProperty(vf.createIRI(DC_DESCRIPTION)).isPresent());
        assertEquals(record.getProperty(vf.createIRI(DC_DESCRIPTION)).get().stringValue(), "Description");
        assertTrue(record.getProperty(vf.createIRI(DC_IDENTIFIER)).isPresent());
        assertEquals(record.getProperty(vf.createIRI(DC_IDENTIFIER)).get().stringValue(), "Identifier");
        assertTrue(record.getProperty(vf.createIRI(DC_MODIFIED)).isPresent());
        assertTrue(record.getProperty(vf.createIRI(DC_ISSUED)).isPresent());

        Resource recordId2 = vf.createIRI("http://matonto.org/test/records#not-present");

        result = manager.getRecord(catalogId, recordId2, datasetRecordFactory);

        assertFalse(result.isPresent());
    }

    @Test
    public void testFindRecordsReturnsCorrectDataFirstPage() throws Exception {
        // given
        int limit = 1;
        int offset = 0;
        IRI modified = vf.createIRI(DC_MODIFIED);
        PaginatedSearchParams searchParams = new SimpleSearchParams.Builder(limit, offset, modified).build();
        // when
        PaginatedSearchResults<Record> records = manager.findRecord(vf.createIRI("http://matonto.org/test/catalog-distributed"), searchParams);
        // then
        Assert.assertThat(records.getPage().size(), equalTo(1));
        Assert.assertThat(records.getTotalSize(), equalTo(TOTAL_SIZE));
        Assert.assertThat(records.getPageSize(), equalTo(1));
        Assert.assertThat(records.getPageNumber(), equalTo(1));
    }

    @Test
    public void testFindRecordsReturnsCorrectDataLastPage() throws Exception {
        // given
        int limit = 1;
        int offset = 1;
        IRI modified = vf.createIRI(DC_MODIFIED);
        PaginatedSearchParams searchParams = new SimpleSearchParams.Builder(limit, offset, modified).build();
        // when
        PaginatedSearchResults<Record> records = manager.findRecord(vf.createIRI("http://matonto.org/test/catalog-distributed"), searchParams);
        // then
        Assert.assertThat(records.getPage().size(), equalTo(1));
        Assert.assertThat(records.getTotalSize(), equalTo(TOTAL_SIZE));
        Assert.assertThat(records.getPageSize(), equalTo(1));
        Assert.assertThat(records.getPageNumber(), equalTo(2));
    }

    @Test
    public void testFindRecordsReturnsCorrectDataOnePage() throws Exception {
        // given
        int limit = 1000;
        int offset = 0;
        IRI modified = vf.createIRI(DC_MODIFIED);
        PaginatedSearchParams searchParams = new SimpleSearchParams.Builder(limit, offset, modified).build();
        // when
        PaginatedSearchResults<Record> records = manager.findRecord(vf.createIRI("http://matonto.org/test/catalog-distributed"), searchParams);
        // then
        Assert.assertThat(records.getPage().size(), equalTo(TOTAL_SIZE));
        Assert.assertThat(records.getTotalSize(), equalTo(TOTAL_SIZE));
        Assert.assertThat(records.getPageSize(), equalTo(1000));
        Assert.assertThat(records.getPageNumber(), equalTo(1));
    }

    @Test
    public void testFindRecordsOrdering() throws Exception {
        // given
        IRI modified = vf.createIRI(DC_MODIFIED);
        IRI issued = vf.createIRI(DC_ISSUED);
        IRI title = vf.createIRI(DC_TITLE);
        int limit = 1;
        int offset = 0;
        PaginatedSearchParams searchParams1 = new SimpleSearchParams.Builder(limit, offset, modified).ascending(true).build();
        PaginatedSearchParams searchParams2 = new SimpleSearchParams.Builder(limit, offset, modified).ascending(false).build();
        PaginatedSearchParams searchParams3 = new SimpleSearchParams.Builder(limit, offset, issued).ascending(true).build();
        PaginatedSearchParams searchParams4 = new SimpleSearchParams.Builder(limit, offset, issued).ascending(false).build();
        PaginatedSearchParams searchParams5 = new SimpleSearchParams.Builder(limit, offset, title).ascending(true).build();
        PaginatedSearchParams searchParams6 = new SimpleSearchParams.Builder(limit, offset, title).ascending(false).build();
        // when
        PaginatedSearchResults<Record> resources1 = manager.findRecord(vf.createIRI("http://matonto.org/test/catalog-distributed"), searchParams1);
        PaginatedSearchResults<Record> resources2 = manager.findRecord(vf.createIRI("http://matonto.org/test/catalog-distributed"), searchParams2);
        PaginatedSearchResults<Record> resources3 = manager.findRecord(vf.createIRI("http://matonto.org/test/catalog-distributed"), searchParams3);
        PaginatedSearchResults<Record> resources4 = manager.findRecord(vf.createIRI("http://matonto.org/test/catalog-distributed"), searchParams4);
        PaginatedSearchResults<Record> resources5 = manager.findRecord(vf.createIRI("http://matonto.org/test/catalog-distributed"), searchParams5);
        PaginatedSearchResults<Record> resources6 = manager.findRecord(vf.createIRI("http://matonto.org/test/catalog-distributed"), searchParams6);
        // then
        Assert.assertThat(resources1.getPage().iterator().next().getResource().stringValue(), equalTo("http://matonto.org/test/records#get"));
        Assert.assertThat(resources2.getPage().iterator().next().getResource().stringValue(), equalTo("http://matonto.org/test/records#update"));
        Assert.assertThat(resources3.getPage().iterator().next().getResource().stringValue(), equalTo("http://matonto.org/test/records#update"));
        Assert.assertThat(resources4.getPage().iterator().next().getResource().stringValue(), equalTo("http://matonto.org/test/records#get"));
        Assert.assertThat(resources5.getPage().iterator().next().getResource().stringValue(), equalTo("http://matonto.org/test/records#get"));
        Assert.assertThat(resources6.getPage().iterator().next().getResource().stringValue(), equalTo("http://matonto.org/test/records#versionedRDF"));
    }

    @Test
    public void testFindRecordWithNoEntries() throws Exception {
        // given
        Repository repo2 = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo2.initialize();
        manager.setRepository(repo2);
        int limit = 1;
        int offset = 0;
        IRI modified = vf.createIRI(DC_MODIFIED);
        PaginatedSearchParams searchParams = new SimpleSearchParams.Builder(limit, offset, modified).build();
        // when
        PaginatedSearchResults<Record> records = manager.findRecord(vf.createIRI("http://matonto.org/test/catalog-distributed"), searchParams);
        // then
        Assert.assertThat(records.getPage().size(), equalTo(0));
        Assert.assertThat(records.getTotalSize(), equalTo(0));
    }

    @Test
    public void testFindRecordsWithTypeFilter() throws Exception {
        // given
        int limit = 1000;
        int offset = 0;
        IRI modified = vf.createIRI(DC_MODIFIED);
        PaginatedSearchParams ontSearchParams = new SimpleSearchParams.Builder(limit, offset, modified).typeFilter(ONT_TYPE).build();
        PaginatedSearchParams mappingSearchParams = new SimpleSearchParams.Builder(limit, offset, modified).typeFilter(MAPPING_TYPE).build();
        PaginatedSearchParams fullSearchParams = new SimpleSearchParams.Builder(limit, offset, modified).build();
        // when
        PaginatedSearchResults<Record> ontRecords = manager.findRecord(vf.createIRI("http://matonto.org/test/catalog-distributed"), ontSearchParams);
        PaginatedSearchResults<Record> mappingRecords = manager.findRecord(vf.createIRI("http://matonto.org/test/catalog-distributed"), mappingSearchParams);
        PaginatedSearchResults<Record> fullRecords = manager.findRecord(vf.createIRI("http://matonto.org/test/catalog-distributed"), fullSearchParams);
        // then
        Assert.assertThat(ontRecords.getPage().size(), equalTo(1));
        Assert.assertThat(ontRecords.getTotalSize(), equalTo(1));
        Assert.assertThat(mappingRecords.getPage().size(), equalTo(1));
        Assert.assertThat(mappingRecords.getTotalSize(), equalTo(1));
        Assert.assertThat(fullRecords.getPage().size(), equalTo(5));
        Assert.assertThat(fullRecords.getTotalSize(), equalTo(5));
    }

    @Test
    public void testAddDistributionToUnversionedRecord() throws Exception {
        IRI distributionIRI = vf.createIRI(UnversionedRecord.unversionedDistribution_IRI);
        Resource distributionId = vf.createIRI("https://matonto.org/distributions#test");
        Resource unversionedId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        Distribution distribution = distributionFactory.createNew(distributionId);

        RepositoryConnection conn = repo.getConnection();

        assertFalse(conn.getStatements(distributionId, null, null, distributionId).hasNext());

        boolean result = manager.addDistributionToUnversionedRecord(distribution, different);
        assertFalse(result);

        result = manager.addDistributionToUnversionedRecord(distribution, unversionedId);
        assertTrue(result);
        assertTrue(conn.getStatements(distributionId, null, null, distributionId).hasNext());
        assertTrue(conn.getStatements(unversionedId, distributionIRI, distributionId, unversionedId).hasNext());

        result = manager.addDistributionToUnversionedRecord(distribution, unversionedId);
        assertFalse(result);

        Distribution distribution2 = distributionFactory.createNew(vf.createIRI("https://matonto.org/test/not/there"));
        result = manager.addDistributionToUnversionedRecord(distribution2,
                vf.createIRI("https://matonto.org/test/not/there"));
        assertFalse(result);

        conn.close();
    }

    @Test
    public void testAddDistributionToVersion() throws Exception {
        IRI distributionIRI = vf.createIRI(Version.versionedDistribution_IRI);
        Resource distributionId = vf.createIRI("https://matonto.org/distributions#test");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        Distribution distribution = distributionFactory.createNew(distributionId);

        RepositoryConnection conn = repo.getConnection();
        assertFalse(conn.getStatements(distributionId, null, null, distributionId).hasNext());

        boolean result = manager.addDistributionToVersion(distribution, different);
        assertFalse(result);

        result = manager.addDistributionToVersion(distribution, versionId);
        assertTrue(result);
        assertTrue(conn.getStatements(distributionId, null, null, distributionId).hasNext());
        assertTrue(conn.getStatements(versionId, distributionIRI, distributionId, versionId).hasNext());

        result = manager.addDistributionToVersion(distribution, versionId);
        assertFalse(result);

        Distribution distribution2 = distributionFactory.createNew(vf.createIRI("https://matonto.org/test/not/there"));
        result = manager.addDistributionToVersion(distribution2, vf.createIRI("https://matonto.org/test/not/there"));
        assertFalse(result);

        conn.close();
    }

    @Test
    public void testUpdateDistribution() throws Exception {
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test");

        Distribution distribution = distributionFactory.createNew(distributionId);
        distribution.getModel().add(distributionId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"));

        RepositoryConnection conn = repo.getConnection();
        assertFalse(conn.getStatements(distributionId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"))
                .hasNext());

        boolean result = manager.updateDistribution(distribution);
        assertTrue(result);
        assertTrue(conn.getStatements(distributionId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"),
                distributionId).hasNext());

        Distribution distribution2 = distributionFactory.createNew(vf.createIRI("https://matonto.org/test/not/there"));

        result = manager.updateDistribution(distribution2);
        assertFalse(result);

        conn.close();
    }

    @Test
    public void testRemoveDistributionFromUnversionedRecord() throws Exception {
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test");
        Resource unversionedId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Resource different = vf.createIRI("http://matonto.org/test/different");
        IRI distributionIRI = vf.createIRI(UnversionedRecord.unversionedDistribution_IRI);

        RepositoryConnection conn = repo.getConnection();

        Resource distributionId2 = vf.createIRI("http://matonto.org/test/distributions#not-present");

        boolean result = manager.removeDistributionFromUnversionedRecord(distributionId2, different);
        assertFalse(result);

        result = manager.removeDistributionFromUnversionedRecord(distributionId2, unversionedId);
        assertFalse(result);

        result = manager.removeDistributionFromUnversionedRecord(distributionId, distributionId2);
        assertFalse(result);

        assertTrue(conn.getStatements(distributionId, null, null, distributionId).hasNext());
        assertTrue(conn.getStatements(unversionedId, distributionIRI, distributionId, unversionedId).hasNext());

        result = manager.removeDistributionFromUnversionedRecord(distributionId, unversionedId);

        assertTrue(result);
        assertFalse(conn.getStatements(distributionId, null, null, distributionId).hasNext());
        assertFalse(conn.getStatements(unversionedId, distributionIRI, distributionId, unversionedId).hasNext());

        conn.close();
    }

    @Test
    public void testRemoveDistributionFromVersion() throws Exception {
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test2");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");
        Resource different = vf.createIRI("http://matonto.org/test/different");
        IRI distributionIRI = vf.createIRI(Version.versionedDistribution_IRI);

        RepositoryConnection conn = repo.getConnection();

        Resource distributionId2 = vf.createIRI("http://matonto.org/test/distributions#not-present");

        boolean result = manager.removeDistributionFromVersion(distributionId2, different);
        assertFalse(result);

        result = manager.removeDistributionFromVersion(distributionId2, versionId);
        assertFalse(result);

        result = manager.removeDistributionFromVersion(distributionId, distributionId2);
        assertFalse(result);

        assertTrue(conn.getStatements(distributionId, null, null, distributionId).hasNext());
        assertTrue(conn.getStatements(versionId, distributionIRI, distributionId, versionId).hasNext());

        result = manager.removeDistributionFromVersion(distributionId, versionId);

        assertTrue(result);
        assertFalse(conn.getStatements(distributionId, null, null, distributionId).hasNext());
        assertFalse(conn.getStatements(versionId, distributionIRI, distributionId, versionId).hasNext());

        conn.close();
    }

    @Test
    public void testGetDistribution() throws Exception {
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        RepositoryConnection conn = repo.getConnection();
        assertTrue(conn.getStatements(distributionId, null, null, distributionId).hasNext());
        conn.close();

        Optional<Distribution> result = manager.getDistribution(different);
        assertFalse(result.isPresent());

        result = manager.getDistribution(distributionId);
        assertTrue(result.isPresent());
        Distribution distribution = result.get();
        assertTrue(distribution.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals(distribution.getProperty(vf.createIRI(DC_TITLE)).get().stringValue(), "Distribution");
        assertTrue(distribution.getProperty(vf.createIRI(DC_ISSUED)).isPresent());
        assertTrue(distribution.getProperty(vf.createIRI(DC_MODIFIED)).isPresent());

        Resource notThere = vf.createIRI("http://matonto.org/test/records#not-present");

        result = manager.getDistribution(notThere);
        assertFalse(result.isPresent());
    }

    @Test
    public void testAddVersion() throws Exception {
        IRI latestVersionIRI = vf.createIRI(VersionedRecord.latestVersion_IRI);
        Resource versionId = vf.createIRI("https://matonto.org/versions#test");
        Resource versionedResourceId = vf.createIRI("http://matonto.org/test/records#get");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        Version version = versionFactory.createNew(versionId);

        RepositoryConnection conn = repo.getConnection();

        assertFalse(conn.getStatements(versionId, null, null, versionId).hasNext());
        assertEquals(conn.getStatements(versionedResourceId, latestVersionIRI, null, versionedResourceId).hasNext(),
                true);
        assertFalse(conn.getStatements(versionedResourceId, latestVersionIRI, versionId, versionedResourceId)
                .hasNext());

        boolean result = manager.addVersion(version, different);
        assertFalse(result);

        result = manager.addVersion(version, versionedResourceId);
        assertTrue(result);
        assertTrue(conn.getStatements(versionId, null, null, versionId).hasNext());
        assertTrue(conn.getStatements(versionedResourceId, latestVersionIRI, versionId, versionedResourceId).hasNext());

        result = manager.addVersion(version, versionedResourceId);
        assertFalse(result);

        Resource versionId2 = vf.createIRI("https://matonto.org/versions#test2");

        Version version2 = versionFactory.createNew(vf.createIRI("http://matonto.org/test#not-present"));

        result = manager.addVersion(version2, vf.createIRI("https://matonto.org/test/not/there"));
        assertFalse(result);

        conn.close();
    }

    @Test
    public void testAddTag() throws Exception {
        IRI latestVersionIRI = vf.createIRI(VersionedRecord.latestVersion_IRI);
        Resource versionId = vf.createIRI("https://matonto.org/versions#test");
        Resource versionedResourceId = vf.createIRI("http://matonto.org/test/records#get");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        Tag version = tagFactory.createNew(versionId);

        RepositoryConnection conn = repo.getConnection();
        assertFalse(conn.getStatements(versionId, null, null, versionId).hasNext());
        assertEquals(conn.getStatements(versionedResourceId, latestVersionIRI, null, versionedResourceId).hasNext(),
                true);
        assertFalse(conn.getStatements(versionedResourceId, latestVersionIRI, versionId, versionedResourceId)
                .hasNext());

        boolean result = manager.addVersion(version, different);
        assertFalse(result);

        result = manager.addVersion(version, versionedResourceId);
        assertTrue(result);
        assertTrue(conn.getStatements(versionId, null, null, versionId).hasNext());
        assertTrue(conn.getStatements(versionedResourceId, latestVersionIRI, versionId, versionedResourceId).hasNext());

        result = manager.addVersion(version, versionedResourceId);
        assertFalse(result);

        Version version2 = versionFactory.createNew(vf.createIRI("http://matonto.org/test#not-present"));
        result = manager.addVersion(version2, vf.createIRI("https://matonto.org/test/not/there"));
        assertFalse(result);

        conn.close();
    }

    @Test
    public void testUpdateVersion() throws Exception {
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");

        Version version = versionFactory.createNew(versionId);
        version.getModel().add(versionId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"));

        RepositoryConnection conn = repo.getConnection();

        assertFalse(conn.getStatements(versionId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title")).hasNext());

        boolean result = manager.updateVersion(version);
        assertTrue(result);
        assertTrue(conn.getStatements(versionId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"), versionId)
                .hasNext());

        Version version2 = versionFactory.createNew(vf.createIRI("http://matonto.org/test#not-present"));

        result = manager.updateVersion(version2);
        assertFalse(result);

        conn.close();
    }

    @Test
    public void testUpdateTag() throws Exception {
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");

        Tag version = tagFactory.createNew(versionId);
        version.getModel().add(versionId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"));

        RepositoryConnection conn = repo.getConnection();

        assertFalse(conn.getStatements(versionId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title")).hasNext());

        boolean result = manager.updateVersion(version);
        assertTrue(result);
        assertTrue(conn.getStatements(versionId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"), versionId)
                .hasNext());

        Version version2 = versionFactory.createNew(vf.createIRI("http://matonto.org/test#not-present"));

        result = manager.updateVersion(version2);
        assertFalse(result);

        conn.close();
    }

    @Test
    public void testRemoveVersion() throws Exception {
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");
        Resource versionId2 = vf.createIRI("http://matonto.org/test/versions#remove");
        Resource different = vf.createIRI("http://matonto.org/test/different");
        IRI versionIRI = vf.createIRI(VersionedRecord.version_IRI);
        IRI latestIRI = vf.createIRI(VersionedRecord.latestVersion_IRI);

        RepositoryConnection conn = repo.getConnection();

        Resource notPresent = vf.createIRI("http://matonto.org/test/versions#not-present");
        Resource recordId2 = vf.createIRI("http://matonto.org/test/records#unversioned");

        boolean result = manager.removeVersion(notPresent, different);
        assertFalse(result);

        result = manager.removeVersion(notPresent, recordId);
        assertFalse(result);

        result = manager.removeVersion(versionId, notPresent);
        assertFalse(result);

        result = manager.removeVersion(versionId, recordId2);
        assertFalse(result);

        assertTrue(conn.getStatements(versionId2, null, null, versionId2).hasNext());
        assertTrue(conn.getStatements(recordId, versionIRI, versionId2, recordId).hasNext());
        assertTrue(conn.getStatements(recordId, latestIRI, null, recordId).hasNext());
        assertFalse(conn.getStatements(recordId, latestIRI, versionId2, recordId).hasNext());

        result = manager.removeVersion(versionId2, recordId);
        assertTrue(result);
        assertFalse(conn.getStatements(versionId2, null, null, versionId2).hasNext());
        assertTrue(conn.getStatements(recordId, latestIRI, null, recordId).hasNext());

        assertTrue(conn.getStatements(versionId, null, null, versionId).hasNext());
        assertTrue(conn.getStatements(recordId, versionIRI, versionId, recordId).hasNext());
        assertTrue(conn.getStatements(recordId, latestIRI, versionId, recordId).hasNext());

        result = manager.removeVersion(versionId, recordId);
        assertTrue(result);
        assertFalse(conn.getStatements(versionId, null, null, versionId).hasNext());
        assertTrue(conn.getStatements(recordId, latestIRI, vf.createIRI("http://matonto.org/test/versions#test2"),
                recordId).hasNext());
        assertFalse(conn.getStatements(recordId, latestIRI, versionId, recordId).hasNext());

        conn.close();
    }

    @Test
    public void testGetVersion() throws Exception {
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        RepositoryConnection conn = repo.getConnection();
        assertTrue(conn.getStatements(versionId, null, null, versionId).hasNext());
        conn.close();

        Optional<Version> result = manager.getVersion(different, versionFactory);
        assertFalse(result.isPresent());

        result = manager.getVersion(versionId, versionFactory);
        assertTrue(result.isPresent());
        Version version = result.get();
        assertTrue(version.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals(version.getProperty(vf.createIRI(DC_TITLE)).get().stringValue(), "Version");
        assertTrue(version.getProperty(vf.createIRI(DC_ISSUED)).isPresent());
        assertTrue(version.getProperty(vf.createIRI(DC_MODIFIED)).isPresent());

        Resource notThere = vf.createIRI("http://matonto.org/test/records#not-present");

        result = manager.getVersion(notThere, versionFactory);
        assertFalse(result.isPresent());
    }

    @Test
    public void testGetTag() throws Exception {
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        RepositoryConnection conn = repo.getConnection();
        assertTrue(conn.getStatements(versionId, null, null, versionId).hasNext());
        conn.close();

        Optional<Tag> result = manager.getVersion(different, tagFactory);
        assertFalse(result.isPresent());

        result = manager.getVersion(versionId, tagFactory);
        assertTrue(result.isPresent());
        Version version = result.get();
        assertTrue(version.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals(version.getProperty(vf.createIRI(DC_TITLE)).get().stringValue(), "Version");
        assertTrue(version.getProperty(vf.createIRI(DC_ISSUED)).isPresent());
        assertTrue(version.getProperty(vf.createIRI(DC_MODIFIED)).isPresent());

        Resource notThere = vf.createIRI("http://matonto.org/test/records#not-present");

        result = manager.getVersion(notThere, tagFactory);
        assertFalse(result.isPresent());
    }

    @Test
    public void testAddBranch() throws Exception {
        IRI branchIRI = vf.createIRI(VersionedRDFRecord.branch_IRI);
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#new");
        Resource notPresent = vf.createIRI("http://matonto.org/test/versions#not-present");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        Branch branch = branchFactory.createNew(branchId);

        RepositoryConnection conn = repo.getConnection();
        assertFalse(conn.getStatements(branchId, null, null, branchId).hasNext());

        boolean result = manager.addBranch(branch, different);
        assertFalse(result);

        result = manager.addBranch(branch, notPresent);
        assertFalse(result);

        result = manager.addBranch(branch, recordId);
        assertTrue(result);
        assertTrue(conn.getStatements(branchId, null, null, branchId).hasNext());
        assertTrue(conn.getStatements(recordId, branchIRI, branchId, recordId).hasNext());

        result = manager.addBranch(branch, recordId);
        assertFalse(result);

        conn.close();
    }

    @Test
    public void testUpdateBranch() throws Exception {
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");

        Branch branch = branchFactory.createNew(branchId);
        branch.getModel().add(branchId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"));

        RepositoryConnection conn = repo.getConnection();

        assertFalse(conn.getStatements(branchId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"), branchId)
                .hasNext());

        boolean result = manager.updateBranch(branch);
        assertTrue(result);
        assertTrue(conn.getStatements(branchId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"), branchId)
                .hasNext());

        Branch branch2 = branchFactory.createNew(vf.createIRI("http://matonto.org/test/distributions#not-present"));
        result = manager.updateBranch(branch2);
        assertFalse(result);

        conn.close();
    }

    @Test
    public void testRemoveBranch() throws Exception {
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource different = vf.createIRI("http://matonto.org/test/different");
        IRI branchIRI = vf.createIRI(VersionedRDFRecord.branch_IRI);

        RepositoryConnection conn = repo.getConnection();

        Resource notPresent = vf.createIRI("http://matonto.org/test/distributions#not-present");

        boolean result = manager.removeBranch(branchId, different);
        assertFalse(result);

        result = manager.removeBranch(notPresent, recordId);
        assertFalse(result);

        result = manager.removeBranch(branchId, notPresent);
        assertFalse(result);

        assertTrue(conn.getStatements(branchId, null, null, branchId).hasNext());
        assertTrue(conn.getStatements(recordId, branchIRI, branchId, recordId).hasNext());

        result = manager.removeBranch(branchId, recordId);
        assertTrue(result);
        assertFalse(conn.getStatements(branchId, null, null, branchId).hasNext());
        assertFalse(conn.getStatements(recordId, branchIRI, branchId, recordId).hasNext());

        conn.close();
    }

    @Test
    public void testGetBranch() throws Exception {
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        RepositoryConnection conn = repo.getConnection();
        assertTrue(conn.getStatements(branchId, null, null, branchId).hasNext());
        conn.close();

        Optional<Branch> result = manager.getBranch(different);
        assertFalse(result.isPresent());

        result = manager.getBranch(branchId);
        assertTrue(result.isPresent());
        Branch branch = result.get();
        assertTrue(branch.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals(branch.getProperty(vf.createIRI(DC_TITLE)).get().stringValue(), "Branch");
        assertTrue(branch.getProperty(vf.createIRI(DC_ISSUED)).isPresent());
        assertTrue(branch.getProperty(vf.createIRI(DC_MODIFIED)).isPresent());

        Resource notThere = vf.createIRI("http://matonto.org/test/records#not-present");

        result = manager.getBranch(notThere);
        assertFalse(result.isPresent());
    }

    @Test
    public void testCreateCommit() throws Exception {
        IRI dummyId = vf.createIRI("https://matonto.org/dummy");
        IRI generated = vf.createIRI("https://matonto.org/generated");
        IRI revisionId = vf.createIRI("http://matonto.org/revisions#test");
        Set<Value> parents = Stream.of(vf.createIRI("https://matonto.org/parent"),
                vf.createIRI("https://matonto.org/parent2")).collect(Collectors.toSet());

        InProgressCommit inProgressCommit = inProgressCommitFactory.createNew(dummyId);
        inProgressCommit.setProperty(vf.createIRI("http://matonto.org/user"), vf.createIRI(PROV_WAS_ASSOCIATED_WITH));
        inProgressCommit.setProperty(generated, vf.createIRI(PROV_GENERATED));
        Revision revision = revisionFactory.createNew(revisionId);
        inProgressCommit.getModel().addAll(revision.getModel());

        Commit result = manager.createCommit(inProgressCommit, "message");
        assertTrue(result.getProperty(vf.createIRI(PROV_AT_TIME)).isPresent());
        assertEquals(result.getProperty(vf.createIRI(DC_TITLE)).get().stringValue(), "message");
        assertEquals(result.getProperties(vf.createIRI(PROV_WAS_INFORMED_BY)).size(), 0);
        result.getProperties(vf.createIRI(PROV_WAS_INFORMED_BY)).forEach(parents::contains);
        assertFalse(result.getModel().contains(dummyId, null, null));
        assertTrue(result.getModel().contains(revisionId, null, null));

        inProgressCommit.setProperties(parents, vf.createIRI(PROV_WAS_INFORMED_BY));

        result = manager.createCommit(inProgressCommit, "message");
        assertTrue(result.getProperty(vf.createIRI(PROV_AT_TIME)).isPresent());
        assertEquals(result.getProperty(vf.createIRI(DC_TITLE)).get().stringValue(), "message");
        assertEquals(result.getProperties(vf.createIRI(PROV_WAS_INFORMED_BY)).size(), 2);
        assertFalse(result.getModel().contains(dummyId, null, null));
        assertTrue(result.getModel().contains(revisionId, null, null));
    }

    @Test(expected = InvalidParameterException.class)
    public void testCreateInProgressCommitWithNoBranch() {
        Resource generation = vf.createIRI("http://matonto.org/test");
        Resource generation2 = vf.createIRI("http://matonto.org/test2");
        Commit parent = commitFactory.createNew(vf.createIRI("http://matonto.org/test/parent"));
        parent.setProperty(generation, vf.createIRI(PROV_GENERATED));
        Commit parent2 = commitFactory.createNew(vf.createIRI("http://matonto.org/test/parent2"));
        parent2.setProperty(generation2, vf.createIRI(PROV_GENERATED));
        Set<Commit> parents = Stream.of(parent, parent2).collect(Collectors.toSet());

        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user"));
        Resource notPresent = vf.createIRI("http://matonto.org/test/distributions#not-present");
        manager.createInProgressCommit(parents, user, notPresent);
    }

    @Test
    public void testCreateInProgressCommit() throws Exception {
        Resource generation = vf.createIRI("http://matonto.org/test");
        Resource generation2 = vf.createIRI("http://matonto.org/test2");
        Commit parent = commitFactory.createNew(vf.createIRI("http://matonto.org/test/parent"));
        parent.setProperty(generation, vf.createIRI(PROV_GENERATED));
        Commit parent2 = commitFactory.createNew(vf.createIRI("http://matonto.org/test/parent2"));
        parent2.setProperty(generation2, vf.createIRI(PROV_GENERATED));
        Set<Commit> parents = Stream.of(parent, parent2).collect(Collectors.toSet());

        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user"));
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");

        InProgressCommit result = manager.createInProgressCommit(parents, user, branchId);
        assertEquals(result.getProperty(vf.createIRI(PROV_WAS_ASSOCIATED_WITH)).get().stringValue(),
                user.getResource().stringValue());
        assertTrue(result.getProperty(vf.createIRI(PROV_GENERATED)).isPresent());
        result.getProperties(vf.createIRI(PROV_WAS_INFORMED_BY)).forEach(property -> parents.stream()
                .anyMatch(commit -> commit.getResource().equals((Resource) property)));
        assertEquals(result.getOnBranch().get().getResource().stringValue(), branchId.stringValue());

        Revision revision = revisionFactory.createNew((Resource)result.getProperty(vf.createIRI(PROV_GENERATED)).get(),
                result.getModel());
        assertTrue(revision.getAdditions().isPresent());
        assertTrue(revision.getDeletions().isPresent());
        Set<Resource> generations = Stream.of(generation, generation2).collect(Collectors.toSet());
        revision.getProperties(vf.createIRI(PROV_WAS_DERIVED_FROM)).forEach(property ->
                assertTrue(generations.contains(property)));

        result = manager.createInProgressCommit(null, user, branchId);
        assertEquals(result.getProperty(vf.createIRI(PROV_WAS_ASSOCIATED_WITH)).get().stringValue(),
                user.getResource().stringValue());
        assertTrue(result.getProperty(vf.createIRI(PROV_GENERATED)).isPresent());
        assertFalse(result.getProperty(vf.createIRI(PROV_WAS_INFORMED_BY)).isPresent());
        assertEquals(result.getOnBranch().get().getResource().stringValue(), branchId.stringValue());

        revision = revisionFactory.createNew((Resource)result.getProperty(vf.createIRI(PROV_GENERATED)).get(),
                result.getModel());
        assertTrue(revision.getAdditions().isPresent());
        assertTrue(revision.getDeletions().isPresent());
        assertFalse(revision.getProperty(vf.createIRI(PROV_WAS_DERIVED_FROM)).isPresent());
    }

    @Test
    public void testAddAdditions() throws Exception {
        Resource commitId = vf.createIRI("http://matonto.org/test/in-progress-commits#test");
        Resource additionId = vf.createIRI("http://matonto.org/test/in-additions#test");
        Resource deletionId = vf.createIRI("http://matonto.org/test/in-deletions#test");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        Model model = mf.createModel();
        Statement statement = vf.createStatement(vf.createIRI("https://matonto.org/test"), vf.createIRI(DC_TITLE),
                vf.createLiteral("Title"));
        Statement statement2 = vf.createStatement(vf.createIRI("https://matonto.org/test"), vf.createIRI(DC_DESCRIPTION),
                vf.createLiteral("Description"));
        model.add(statement);
        model.add(statement2);
        model.add(vf.createIRI("http://matonto.org/test/delete"), vf.createIRI(DC_TITLE), vf.createLiteral("Delete"));

        Model expected = mf.createModel();
        expected.add(statement);
        expected.add(statement2);
        expected.add(vf.createIRI("http://matonto.org/test/add"), vf.createIRI(DC_TITLE), vf.createLiteral("Add"));

        RepositoryConnection conn = repo.getConnection();

        boolean result = manager.addAdditions(model, different);
        assertFalse(result);

        result = manager.addAdditions(model, commitId);
        assertTrue(result);
        RepositoryResult<Statement> statements = conn.getStatements(null, null, null, additionId);

        while (statements.hasNext()) {
            statement = statements.next();
            assertTrue(expected.contains(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        }

        statements = conn.getStatements(null, null, null, deletionId);
        assertFalse(statements.hasNext());

        result = manager.addAdditions(model, vf.createIRI("https://matonto.org/test/not/there"));
        assertFalse(result);

        conn.close();
    }

    @Test
    public void testAddDeletions() throws Exception {
        Resource commitId = vf.createIRI("http://matonto.org/test/in-progress-commits#test");
        Resource additionId = vf.createIRI("http://matonto.org/test/in-additions#test");
        Resource deletionId = vf.createIRI("http://matonto.org/test/in-deletions#test");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        Model model = mf.createModel();
        Statement statement = vf.createStatement(vf.createIRI("https://matonto.org/test"), vf.createIRI(DC_TITLE),
                vf.createLiteral("Title"));
        Statement statement2 = vf.createStatement(vf.createIRI("https://matonto.org/test"), vf.createIRI(DC_DESCRIPTION),
                vf.createLiteral("Description"));
        model.add(statement);
        model.add(statement2);
        model.add(vf.createIRI("http://matonto.org/test/add"), vf.createIRI(DC_TITLE), vf.createLiteral("Add"));

        Model expected = mf.createModel();
        expected.add(statement);
        expected.add(statement2);
        expected.add(vf.createIRI("http://matonto.org/test/delete"), vf.createIRI(DC_TITLE),
                vf.createLiteral("Delete"));

        RepositoryConnection conn = repo.getConnection();

        boolean result = manager.addDeletions(model, different);
        assertFalse(result);

        result = manager.addDeletions(model, commitId);
        assertTrue(result);
        RepositoryResult<Statement> statements = conn.getStatements(null, null, null, deletionId);

        while (statements.hasNext()) {
            statement = statements.next();
            assertTrue(expected.contains(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        }

        statements = conn.getStatements(null, null, null, additionId);
        assertFalse(statements.hasNext());

        result = manager.addDeletions(model, vf.createIRI("https://matonto.org/test/not/there"));
        assertFalse(result);

        conn.close();
    }

    @Test
    public void testAddCommitToBranch() throws Exception {
        IRI headIRI = vf.createIRI(Branch.head_IRI);
        Resource commitId = vf.createIRI("https://matonto.org/commits#test");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        Commit commit = commitFactory.createNew(commitId);
        RepositoryConnection conn = repo.getConnection();
        assertFalse(conn.getStatements(commitId, null, null, commitId).hasNext());

        boolean result = manager.addCommitToBranch(commit, vf.createIRI("https://matonto.org/test/not/there"));
        assertFalse(result);

        result = manager.addCommitToBranch(commit, different);
        assertFalse(result);

        result = manager.addCommitToBranch(commit, branchId);
        assertTrue(result);
        assertTrue(conn.getStatements(commitId, null, null, commitId).hasNext());
        assertTrue(conn.getStatements(branchId, headIRI, commitId, branchId).hasNext());

        result = manager.addCommitToBranch(commit, branchId);
        assertFalse(result);

        conn.close();
    }

    @Test
    public void testAddInProgressCommit() throws Exception {
        Resource inProgressCommitId = vf.createIRI("https://matonto.org/in-progress-commits#test");

        InProgressCommit inProgressCommit = inProgressCommitFactory.createNew(inProgressCommitId);
        RepositoryConnection conn = repo.getConnection();
        assertFalse(conn.getStatements(inProgressCommitId, null, null, inProgressCommitId).hasNext());

        boolean result = manager.addInProgressCommit(inProgressCommit);
        assertTrue(result);
        assertTrue(conn.getStatements(inProgressCommitId, null, null, inProgressCommitId).hasNext());

        result = manager.addInProgressCommit(inProgressCommit);
        assertFalse(result);

        conn.close();
    }

    @Test
    public void testGetCommit() throws Exception {
        Resource commitId = vf.createIRI("http://matonto.org/test/commits#test");
        String revisionIRI = "http://matonto.org/test/revisions#revision";
        Resource different = vf.createIRI("http://matonto.org/test/different");

        RepositoryConnection conn = repo.getConnection();
        assertTrue(conn.getStatements(commitId, null, null, commitId).hasNext());
        conn.close();

        Optional<Commit> result = manager.getCommit(different, commitFactory);
        assertFalse(result.isPresent());

        result = manager.getCommit(commitId, commitFactory);
        assertTrue(result.isPresent());
        Commit commit = result.get();
        assertTrue(commit.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals(commit.getProperty(vf.createIRI(DC_TITLE)).get().stringValue(), "Commit");
        assertTrue(commit.getProperty(vf.createIRI(PROV_AT_TIME)).isPresent());
        assertTrue(commit.getProperty(vf.createIRI(PROV_GENERATED)).isPresent());
        assertEquals(commit.getProperty(vf.createIRI(PROV_GENERATED)).get().stringValue(), revisionIRI);

        Revision revision = revisionFactory.createNew(vf.createIRI(revisionIRI), commit.getModel());
        assertTrue(revision.getAdditions().isPresent());
        assertTrue(revision.getDeletions().isPresent());

        Resource notThere = vf.createIRI("http://matonto.org/test/records#not-present");

        result = manager.getCommit(notThere, commitFactory);
        assertFalse(result.isPresent());
    }

    @Test
    public void testGetInProgressCommit() throws Exception {
        Resource commitId = vf.createIRI("http://matonto.org/test/commits#test");
        String revisionIRI = "http://matonto.org/test/revisions#revision";
        Resource different = vf.createIRI("http://matonto.org/test/different");

        RepositoryConnection conn = repo.getConnection();
        assertTrue(conn.getStatements(commitId, null, null, commitId).hasNext());
        conn.close();

        Optional<InProgressCommit> result = manager.getCommit(different, inProgressCommitFactory);
        assertFalse(result.isPresent());

        result = manager.getCommit(commitId, inProgressCommitFactory);
        assertTrue(result.isPresent());
        Commit commit = result.get();
        assertTrue(commit.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals(commit.getProperty(vf.createIRI(DC_TITLE)).get().stringValue(), "Commit");
        assertTrue(commit.getProperty(vf.createIRI(PROV_AT_TIME)).isPresent());
        assertTrue(commit.getProperty(vf.createIRI(PROV_GENERATED)).isPresent());
        assertEquals(commit.getProperty(vf.createIRI(PROV_GENERATED)).get().stringValue(), revisionIRI);

        Revision revision = revisionFactory.createNew(vf.createIRI(revisionIRI), commit.getModel());
        assertTrue(revision.getAdditions().isPresent());
        assertTrue(revision.getDeletions().isPresent());

        Resource notThere = vf.createIRI("http://matonto.org/test/records#not-present");

        result = manager.getCommit(notThere, inProgressCommitFactory);
        assertFalse(result.isPresent());
    }

    @Test
    public void testRemoveInProgressCommit() throws Exception {
        Resource inProgressCommitId = vf.createIRI("http://matonto.org/test/in-progress-commits#test");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        RepositoryConnection conn = repo.getConnection();

        assertTrue(conn.getStatements(inProgressCommitId, null, null, inProgressCommitId).hasNext());

        boolean result = manager.removeInProgressCommit(different);
        assertFalse(result);

        result = manager.removeInProgressCommit(inProgressCommitId);
        assertTrue(result);
        assertFalse(conn.getStatements(inProgressCommitId, null, null, inProgressCommitId).hasNext());

        Resource notPresent = vf.createIRI("http://matonto.org/test/records#not-present");

        result = manager.removeInProgressCommit(notPresent);
        assertFalse(result);

        conn.close();
    }

    @Test
    public void testGetCommitChain() throws Exception {
        Resource notThere = vf.createIRI("http://matonto.org/test/records#not-present");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        Set<Resource> result = manager.getCommitChain(different);
        assertEquals(result.size(), 0);

        result = manager.getCommitChain(notThere);
        assertEquals(result.size(), 0);

        Set<Resource> expect = Stream.of(vf.createIRI("http://matonto.org/test/commits#test0"),
                vf.createIRI("http://matonto.org/test/commits#test1"),
                vf.createIRI("http://matonto.org/test/commits#test2"),
                vf.createIRI("http://matonto.org/test/commits#test4a")).collect(Collectors.toSet());
        Resource commitId = vf.createIRI("http://matonto.org/test/commits#test4a");
        result = manager.getCommitChain(commitId);
        assertEquals(result.size(), expect.size());
        result.forEach(item -> assertTrue(expect.contains(item)));
    }

    @Test
    public void testGetCompiledResource() throws Exception {
        Resource commit0Id = vf.createIRI("http://matonto.org/test/commits#test0");
        Resource commit3Id = vf.createIRI("http://matonto.org/test/commits#test3");
        Resource notThere = vf.createIRI("http://matonto.org/test/records#not-present");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        Optional<Model> result = manager.getCompiledResource(different);
        assertFalse(result.isPresent());

        result = manager.getCompiledResource(notThere);
        assertFalse(result.isPresent());

        Resource ontologyId = vf.createIRI("http://matonto.org/test/ontology");
        Model expected = mf.createModel();
        expected.add(ontologyId, vf.createIRI(RDF_TYPE), vf.createIRI("http://www.w3.org/2002/07/owl#Ontology"));
        expected.add(ontologyId, vf.createIRI(DC_TITLE), vf.createLiteral("Test 0 Title"));
        expected.add(vf.createIRI("http://matonto.org/test/class0"), vf.createIRI(RDF_TYPE),
                vf.createIRI("http://www.w3.org/2002/07/owl#Class"));

        result = manager.getCompiledResource(commit0Id);
        assertTrue(result.isPresent());
        result.get().forEach(statement -> assertTrue(expected.contains(statement.getSubject(),
                statement.getPredicate(), statement.getObject())));

        Model expected2 = mf.createModel();
        expected2.add(ontologyId, vf.createIRI(RDF_TYPE), vf.createIRI("http://www.w3.org/2002/07/owl#Ontology"));
        expected2.add(ontologyId, vf.createIRI(DC_TITLE), vf.createLiteral("Test 3 Title"));
        expected2.add(vf.createIRI("http://matonto.org/test/class0"), vf.createIRI(RDF_TYPE),
                vf.createIRI("http://www.w3.org/2002/07/owl#Class"));
        result = manager.getCompiledResource(commit3Id);
        result.get().forEach(statement -> assertTrue(expected2.contains(statement.getSubject(),
                statement.getPredicate(), statement.getObject())));
    }

    @Test
    public void testGetConflictsClassDeletion() throws Exception {
        // Class deletion
        Resource leftId = vf.createIRI("http://matonto.org/test/commits#conflict1");
        Resource rightId = vf.createIRI("http://matonto.org/test/commits#conflict2");

        Set<Conflict> result = manager.getConflicts(leftId, rightId);
        assertEquals(result.size(), 1);
        result.forEach(conflict -> {
            assertEquals(conflict.getOriginal().size(), 1);
            assertEquals(conflict.getLeftAdditions().size(), 0);
            assertEquals(conflict.getRightAdditions().size(), 0);
            assertEquals(conflict.getRightDeletions().size(), 0);
            assertEquals(conflict.getLeftDeletions().size(), 1);
            Stream.of(conflict.getLeftDeletions(), conflict.getOriginal()).forEach(model -> model.forEach(statement -> {
                assertEquals(statement.getSubject().stringValue(), "http://matonto.org/test/class0");
                assertEquals(statement.getPredicate().stringValue(), RDF_TYPE);
            }));
        });
    }

    @Test
    public void testGetConflictsSamePropertyAltered() throws Exception {
        // Both altered same title
        Resource leftId = vf.createIRI("http://matonto.org/test/commits#conflict1-2");
        Resource rightId = vf.createIRI("http://matonto.org/test/commits#conflict2-2");

        Set<Conflict> result = manager.getConflicts(leftId, rightId);
        assertEquals(result.size(), 1);

        String subject = "http://matonto.org/test/ontology";
        String predicate = DC_TITLE;
        result.forEach(conflict -> {
            assertEquals(conflict.getOriginal().size(), 1);
            assertEquals(conflict.getLeftAdditions().size(), 1);
            assertEquals(conflict.getRightAdditions().size(), 1);
            assertEquals(conflict.getRightDeletions().size(), 0);
            assertEquals(conflict.getLeftDeletions().size(), 0);
            Stream.of(conflict.getOriginal(), conflict.getLeftAdditions(), conflict.getRightAdditions())
                    .forEach(model -> model.forEach(statement -> {
                assertEquals(statement.getSubject().stringValue(), subject);
                assertEquals(statement.getPredicate().stringValue(), predicate);
            }));
        });
    }

    @Test
    public void testGetConflictsChainAddsAndRemovesStatement() throws Exception {
        // Second chain has two commits which adds then removes something
        Resource leftId = vf.createIRI("http://matonto.org/test/commits#conflict1-3");
        Resource rightId = vf.createIRI("http://matonto.org/test/commits#conflict3-3");

        Set<Conflict> result = manager.getConflicts(leftId, rightId);
        assertEquals(result.size(), 0);
    }

    @Test
    public void testGetConflictsPropertyChangeOnSingleBranch() throws Exception {
        // Change a property on one branch
        Resource leftId = vf.createIRI("http://matonto.org/test/commits#conflict1-4");
        Resource rightId = vf.createIRI("http://matonto.org/test/commits#conflict2-4");

        Set<Conflict> result = manager.getConflicts(leftId, rightId);
        assertEquals(result.size(), 0);
    }

    @Test
    public void testGetConflictsOneRemovesOtherAddsToProperty() throws Exception {
        // One branch removes property while other adds another to it
        Resource leftId = vf.createIRI("http://matonto.org/test/commits#conflict1-5");
        Resource rightId = vf.createIRI("http://matonto.org/test/commits#conflict2-5");

        Set<Conflict> result = manager.getConflicts(leftId, rightId);
        assertEquals(result.size(), 1);

        String subject = "http://matonto.org/test/ontology";
        String predicate = DC_TITLE;
        result.forEach(conflict -> {
            assertEquals(conflict.getOriginal().size(), 1);
            assertEquals(conflict.getLeftAdditions().size(), 1);
            assertEquals(conflict.getRightAdditions().size(), 0);
            assertEquals(conflict.getRightDeletions().size(), 1);
            assertEquals(conflict.getLeftDeletions().size(), 0);
            Stream.of(conflict.getOriginal(), conflict.getLeftAdditions(), conflict.getRightDeletions())
                    .forEach(model -> model.forEach(statement -> {
                        assertEquals(statement.getSubject().stringValue(), subject);
                        assertEquals(statement.getPredicate().stringValue(), predicate);
                    }));
        });
    }

    @Test
    public void testGetDiff() throws Exception {
        RepositoryConnection conn = repo.getConnection();

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

        conn.close();

        Difference diff = manager.getDiff(original, changed);
        assertEquals(diff.getAdditions().size(), additions.size());
        diff.getAdditions().forEach(s -> assertTrue(additions.contains(s.getSubject(), s.getPredicate(),
                s.getObject())));
        assertEquals(diff.getDeletions().size(), deletions.size());
        diff.getDeletions().forEach(s -> assertTrue(deletions.contains(s.getSubject(), s.getPredicate(),
                s.getObject())));

        diff = manager.getDiff(original, original);
        assertEquals(diff.getAdditions().size(), 0);
        assertEquals(diff.getDeletions().size(), 0);

        diff = manager.getDiff(changed, original);
        assertEquals(diff.getDeletions().size(), additions.size());
        diff.getDeletions().forEach(s -> assertTrue(additions.contains(s.getSubject(), s.getPredicate(),
                s.getObject())));
        assertEquals(diff.getAdditions().size(), deletions.size());
        diff.getAdditions().forEach(s -> assertTrue(deletions.contains(s.getSubject(), s.getPredicate(),
                s.getObject())));
    }
}
