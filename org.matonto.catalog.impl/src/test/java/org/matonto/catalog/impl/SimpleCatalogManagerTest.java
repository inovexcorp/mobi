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
import org.matonto.exception.MatOntoException;
import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.matonto.jaas.api.ontologies.usermanagement.UserFactory;
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
import org.matonto.repository.base.RepositoryResult;
import org.matonto.repository.impl.sesame.SesameRepositoryWrapper;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.openrdf.sail.memory.MemoryStore;

import java.io.InputStream;
import java.security.InvalidParameterException;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
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
    private IRI distributedCatalogId;
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

        versionedRDFRecordFactory.setModelFactory(mf);
        versionedRDFRecordFactory.setValueFactory(vf);
        versionedRDFRecordFactory.setValueConverterRegistry(vcr);

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
        vcr.registerValueConverter(versionedRDFRecordFactory);
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
        manager.setThingFactory(thingFactory);

        InputStream testData = getClass().getResourceAsStream("/testCatalogData.trig");

        RepositoryConnection conn = repo.getConnection();
        conn.add(Values.matontoModel(Rio.parse(testData, "", RDFFormat.TRIG)));
        conn.close();

        Map<String, Object> props = new HashMap<>();
        props.put("title", "MatOnto Test Catalog");
        props.put("description", "This is a test catalog");
        props.put("iri", "http://matonto.org/test/catalog");

        manager.start(props);

        distributedCatalogId = vf.createIRI("http://matonto.org/test/catalog-distributed");
        notPresentId = vf.createIRI("http://matonto.org/test/records#not-present");
        differentId = vf.createIRI("http://matonto.org/test/different");
        dcIdentifier = vf.createIRI(DC_IDENTIFIER);
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
        Set<Resource> results = manager.getRecordIds(distributedCatalogId);
        assertEquals(5, results.size());
        assertTrue(results.contains(vf.createIRI("http://matonto.org/test/records#update")));
        assertTrue(results.contains(vf.createIRI("http://matonto.org/test/records#remove")));
        assertTrue(results.contains(vf.createIRI("http://matonto.org/test/records#get")));
    }

    @Test
    public void testGetRecordIdsFromMissingCatalog() throws Exception {
        Resource notPresentId = vf.createIRI("http://matonto.org/test/catalog-not-there");
        Set<Resource> results = manager.getRecordIds(notPresentId);
        assertEquals(0, results.size());
    }

    @Test
    public void testAddRecord() throws Exception {
        Resource recordId = vf.createIRI("https://matonto.org/records#test");
        Record record = recordFactory.createNew(recordId);
        record.addProperty(vf.createLiteral("record"), dcIdentifier);

        RepositoryConnection conn = repo.getConnection();
        assertFalse(conn.getStatements(recordId, null, null, recordId).hasNext());

        manager.addRecord(distributedCatalogId, record);
        assertTrue(conn.getStatements(recordId, null, vf.createIRI(Record.TYPE), recordId).hasNext());
        assertTrue(conn.getStatements(recordId, null, null, recordId).hasNext());
        assertTrue(conn.getStatements(recordId, null, distributedCatalogId, recordId).hasNext());
        conn.close();
    }

    @Test(expected = MatOntoException.class)
    public void testAddRecordToMissingCatalog() {
        Resource recordId = vf.createIRI("https://matonto.org/records#test");
        Record record = recordFactory.createNew(recordId);
        record.addProperty(vf.createLiteral("record"), dcIdentifier);
        manager.addRecord(differentId, record);
    }

    @Test(expected = MatOntoException.class)
    public void testAddExistingRecordToCatalog() {
        Resource existingId = vf.createIRI("http://matonto.org/test/records#update");
        Record record = recordFactory.createNew(existingId);
        record.addProperty(vf.createLiteral("record"), dcIdentifier);
        manager.addRecord(distributedCatalogId, record);
    }

    @Test(expected = MatOntoException.class)
    public void testAddRecordWithExistingIdentifier() {
        Resource newId = vf.createIRI("http://matonto.org/test/records#brand-new");
        Record record = recordFactory.createNew(newId);
        record.addProperty(vf.createLiteral("Unique"), dcIdentifier);
        manager.addRecord(distributedCatalogId, record);
    }

    @Test
    public void testAddUnversionedRecord() throws Exception {
        Resource recordId = vf.createIRI("https://matonto.org/records#test");
        UnversionedRecord record = unversionedRecordFactory.createNew(recordId);
        record.addProperty(vf.createLiteral("record"), dcIdentifier);

        RepositoryConnection conn = repo.getConnection();
        assertFalse(conn.getStatements(recordId, null, null, recordId).hasNext());

        manager.addRecord(distributedCatalogId, record);
        assertTrue(conn.getStatements(recordId, null, vf.createIRI(UnversionedRecord.TYPE), recordId).hasNext());
        assertTrue(conn.getStatements(recordId, null, null, recordId).hasNext());
        assertTrue(conn.getStatements(recordId, null, distributedCatalogId, recordId).hasNext());
        conn.close();
    }

    @Test
    public void testAddVersionedRecord() throws Exception {
        Resource recordId = vf.createIRI("https://matonto.org/records#test");
        VersionedRecord record = versionedRecordFactory.createNew(recordId);
        record.addProperty(vf.createLiteral("record"), dcIdentifier);

        RepositoryConnection conn = repo.getConnection();
        assertFalse(conn.getStatements(recordId, null, null, recordId).hasNext());

        manager.addRecord(distributedCatalogId, record);
        assertTrue(conn.getStatements(recordId, null, vf.createIRI(VersionedRecord.TYPE), recordId).hasNext());
        assertTrue(conn.getStatements(recordId, null, null, recordId).hasNext());
        assertTrue(conn.getStatements(recordId, null, distributedCatalogId, recordId).hasNext());
        conn.close();
    }

    @Test
    public void testAddVersionedRDFRecord() throws Exception {
        Resource recordId = vf.createIRI("https://matonto.org/records#test");
        VersionedRDFRecord record = versionedRDFRecordFactory.createNew(recordId);
        record.addProperty(vf.createLiteral("record"), dcIdentifier);

        RepositoryConnection conn = repo.getConnection();
        assertFalse(conn.getStatements(recordId, null, null, recordId).hasNext());

        manager.addRecord(distributedCatalogId, record);
        assertTrue(conn.getStatements(recordId, null, vf.createIRI(VersionedRDFRecord.TYPE), recordId).hasNext());
        assertTrue(conn.getStatements(recordId, null, null, recordId).hasNext());
        assertTrue(conn.getStatements(recordId, null, distributedCatalogId, recordId).hasNext());
        conn.close();
    }

    @Test
    public void testAddOntologyRecord() throws Exception {
        Resource recordId = vf.createIRI("https://matonto.org/records#test");
        OntologyRecord record = ontologyRecordFactory.createNew(recordId);
        record.addProperty(vf.createLiteral("record"), dcIdentifier);

        RepositoryConnection conn = repo.getConnection();
        assertFalse(conn.getStatements(recordId, null, null, recordId).hasNext());

        manager.addRecord(distributedCatalogId, record);
        assertTrue(conn.getStatements(recordId, null, vf.createIRI(OntologyRecord.TYPE), recordId).hasNext());
        assertTrue(conn.getStatements(recordId, null, null, recordId).hasNext());
        assertTrue(conn.getStatements(recordId, null, distributedCatalogId, recordId).hasNext());
        conn.close();
    }

    @Test
    public void testAddMappingRecord() throws Exception {
        Resource recordId = vf.createIRI("https://matonto.org/records#test");
        MappingRecord record = mappingRecordFactory.createNew(recordId);
        record.addProperty(vf.createLiteral("record"), dcIdentifier);

        RepositoryConnection conn = repo.getConnection();
        assertFalse(conn.getStatements(recordId, null, null, recordId).hasNext());

        manager.addRecord(distributedCatalogId, record);
        assertTrue(conn.getStatements(recordId, null, vf.createIRI(MappingRecord.TYPE), recordId).hasNext());
        assertTrue(conn.getStatements(recordId, null, null, recordId).hasNext());
        assertTrue(conn.getStatements(recordId, null, distributedCatalogId, recordId).hasNext());
        conn.close();
    }

    @Test
    public void testAddDatasetRecord() throws Exception {
        Resource recordId = vf.createIRI("https://matonto.org/records#test");
        DatasetRecord record = datasetRecordFactory.createNew(recordId);
        record.addProperty(vf.createLiteral("record"), dcIdentifier);

        RepositoryConnection conn = repo.getConnection();
        assertFalse(conn.getStatements(recordId, null, null, recordId).hasNext());

        manager.addRecord(distributedCatalogId, record);
        assertTrue(conn.getStatements(recordId, null, vf.createIRI(DatasetRecord.TYPE), recordId).hasNext());
        assertTrue(conn.getStatements(recordId, null, null, recordId).hasNext());
        assertTrue(conn.getStatements(recordId, null, distributedCatalogId, recordId).hasNext());
        conn.close();
    }

    @Test
    public void testUpdateRecord() throws Exception {
        Resource recordId = vf.createIRI("http://matonto.org/test/records#update");

        RepositoryConnection conn = repo.getConnection();
        Model recordModel = mf.createModel();
        conn.getStatements(recordId, null, null, recordId).forEachRemaining(recordModel::add);

        Record record = recordFactory.getExisting(recordId, recordModel);
        record.setKeyword(Stream.of(vf.createLiteral("keyword1")).collect(Collectors.toSet()));

        assertFalse(conn.getStatements(recordId, vf.createIRI(Record.keyword_IRI), vf.createLiteral("keyword1"),
                recordId).hasNext());

        manager.updateRecord(distributedCatalogId, record);
        assertTrue(conn.getStatements(recordId, vf.createIRI(Record.catalog_IRI), distributedCatalogId, recordId).hasNext());
        assertTrue(conn.getStatements(recordId, vf.createIRI(Record.keyword_IRI), vf.createLiteral("keyword1"),
                recordId).hasNext());
        conn.close();
    }

    @Test(expected = MatOntoException.class)
    public void testUpdateRecordInMissingCatalog() {
        Resource recordId = vf.createIRI("https://matonto.org/records#test");
        Record record = recordFactory.createNew(recordId);
        manager.updateRecord(differentId, record);
    }

    @Test(expected = MatOntoException.class)
    public void testUpdateMissingRecord() {
        Record record = recordFactory.createNew(notPresentId);
        manager.updateRecord(distributedCatalogId, record);
    }

    @Test
    public void testUpdateUnversionedRecord() throws Exception {
        Resource recordId = vf.createIRI("http://matonto.org/test/records#update");

        RepositoryConnection conn = repo.getConnection();
        Model recordModel = mf.createModel();
        conn.getStatements(recordId, null, null, recordId).forEachRemaining(recordModel::add);

        UnversionedRecord record = unversionedRecordFactory.getExisting(recordId, recordModel);
        record.setKeyword(Stream.of(vf.createLiteral("keyword1")).collect(Collectors.toSet()));

        assertFalse(conn.getStatements(recordId, vf.createIRI(Record.keyword_IRI), vf.createLiteral("keyword1"),
                recordId).hasNext());

        manager.updateRecord(distributedCatalogId, record);
        assertTrue(conn.getStatements(recordId, vf.createIRI(Record.catalog_IRI), distributedCatalogId, recordId).hasNext());
        assertTrue(conn.getStatements(recordId, vf.createIRI(Record.keyword_IRI), vf.createLiteral("keyword1"),
                recordId).hasNext());
        conn.close();
    }

    @Test
    public void testUpdateVersionedRecord() throws Exception {
        Resource recordId = vf.createIRI("http://matonto.org/test/records#update");

        RepositoryConnection conn = repo.getConnection();
        Model recordModel = mf.createModel();
        conn.getStatements(recordId, null, null, recordId).forEachRemaining(recordModel::add);

        VersionedRecord record = versionedRecordFactory.getExisting(recordId, recordModel);
        record.setKeyword(Stream.of(vf.createLiteral("keyword1")).collect(Collectors.toSet()));

        assertFalse(conn.getStatements(recordId, vf.createIRI(Record.keyword_IRI), vf.createLiteral("keyword1"),
                recordId).hasNext());

        manager.updateRecord(distributedCatalogId, record);
        assertTrue(conn.getStatements(recordId, vf.createIRI(Record.catalog_IRI), distributedCatalogId, recordId).hasNext());
        assertTrue(conn.getStatements(recordId, vf.createIRI(Record.keyword_IRI), vf.createLiteral("keyword1"),
                recordId).hasNext());
        conn.close();
    }

    @Test
    public void testUpdateVersionedRDFRecord() throws Exception {
        Resource recordId = vf.createIRI("http://matonto.org/test/records#update");

        RepositoryConnection conn = repo.getConnection();
        Model recordModel = mf.createModel();
        conn.getStatements(recordId, null, null, recordId).forEachRemaining(recordModel::add);

        VersionedRDFRecord record = versionedRDFRecordFactory.getExisting(recordId, recordModel);
        record.setKeyword(Stream.of(vf.createLiteral("keyword1")).collect(Collectors.toSet()));

        assertTrue(conn.getStatements(recordId, vf.createIRI(Record.catalog_IRI), distributedCatalogId, recordId).hasNext());
        assertFalse(conn.getStatements(recordId, vf.createIRI(Record.keyword_IRI), vf.createLiteral("keyword1"),
                recordId).hasNext());

        manager.updateRecord(distributedCatalogId, record);
        assertTrue(conn.getStatements(recordId, vf.createIRI(Record.catalog_IRI), distributedCatalogId, recordId).hasNext());
        assertTrue(conn.getStatements(recordId, vf.createIRI(Record.keyword_IRI), vf.createLiteral("keyword1"),
                recordId).hasNext());
        conn.close();
    }

    @Test
    public void testUpdateOntologyRecord() throws Exception {
        Resource recordId = vf.createIRI("http://matonto.org/test/records#update");

        RepositoryConnection conn = repo.getConnection();
        Model recordModel = mf.createModel();
        conn.getStatements(recordId, null, null, recordId).forEachRemaining(recordModel::add);

        OntologyRecord record = ontologyRecordFactory.getExisting(recordId, recordModel);
        record.setKeyword(Stream.of(vf.createLiteral("keyword1")).collect(Collectors.toSet()));

        assertFalse(conn.getStatements(recordId, vf.createIRI(Record.keyword_IRI), vf.createLiteral("keyword1"),
                recordId).hasNext());

        manager.updateRecord(distributedCatalogId, record);
        assertTrue(conn.getStatements(recordId, vf.createIRI(Record.catalog_IRI), distributedCatalogId, recordId).hasNext());
        assertTrue(conn.getStatements(recordId, vf.createIRI(Record.keyword_IRI), vf.createLiteral("keyword1"),
                recordId).hasNext());
        conn.close();
    }

    @Test
    public void testUpdateMappingRecord() throws Exception {
        Resource recordId = vf.createIRI("http://matonto.org/test/records#update");

        RepositoryConnection conn = repo.getConnection();
        Model recordModel = mf.createModel();
        conn.getStatements(recordId, null, null, recordId).forEachRemaining(recordModel::add);

        MappingRecord record = mappingRecordFactory.getExisting(recordId, recordModel);
        record.setKeyword(Stream.of(vf.createLiteral("keyword1")).collect(Collectors.toSet()));

        assertTrue(conn.getStatements(recordId, vf.createIRI(Record.catalog_IRI), distributedCatalogId, recordId).hasNext());
        assertFalse(conn.getStatements(recordId, vf.createIRI(Record.keyword_IRI), vf.createLiteral("keyword1"),
                recordId).hasNext());

        manager.updateRecord(distributedCatalogId, record);
        assertTrue(conn.getStatements(recordId, vf.createIRI(Record.catalog_IRI), distributedCatalogId, recordId).hasNext());
        assertTrue(conn.getStatements(recordId, vf.createIRI(Record.keyword_IRI), vf.createLiteral("keyword1"),
                recordId).hasNext());
        conn.close();
    }

    @Test
    public void testUpdateDatasetRecord() throws Exception {
        Resource recordId = vf.createIRI("http://matonto.org/test/records#update");

        RepositoryConnection conn = repo.getConnection();
        Model recordModel = mf.createModel();
        conn.getStatements(recordId, null, null, recordId).forEachRemaining(recordModel::add);

        DatasetRecord record = datasetRecordFactory.getExisting(recordId, recordModel);
        record.setKeyword(Stream.of(vf.createLiteral("keyword1")).collect(Collectors.toSet()));

        assertTrue(conn.getStatements(recordId, vf.createIRI(Record.catalog_IRI), distributedCatalogId, recordId).hasNext());
        assertFalse(conn.getStatements(recordId, vf.createIRI(Record.keyword_IRI), vf.createLiteral("keyword1"),
                recordId).hasNext());

        manager.updateRecord(distributedCatalogId, record);
        assertTrue(conn.getStatements(recordId, vf.createIRI(Record.catalog_IRI), distributedCatalogId, recordId).hasNext());
        assertTrue(conn.getStatements(recordId, vf.createIRI(Record.keyword_IRI), vf.createLiteral("keyword1"),
                recordId).hasNext());
        conn.close();
    }

    @Test
    public void testRemoveRecord() throws Exception {
        Resource recordId = vf.createIRI("http://matonto.org/test/records#remove");

        RepositoryConnection conn = repo.getConnection();
        assertTrue(conn.getStatements(recordId, null, null, recordId).hasNext());

        manager.removeRecord(distributedCatalogId, recordId);
        assertFalse(conn.getStatements(recordId, null, null, recordId).hasNext());
        conn.close();
    }

    @Test(expected = MatOntoException.class)
    public void testRemoveRecordFromMissingCatalog() {
        Resource recordId = vf.createIRI("https://matonto.org/records#test");
        manager.removeRecord(differentId, recordId);
    }

    @Test(expected = MatOntoException.class)
    public void testRemoveMissingRecord() {
        manager.removeRecord(distributedCatalogId, notPresentId);
    }

    @Test(expected = MatOntoException.class)
    public void testRemoveRecordFromWrongCatalog() {
        Resource recordId = vf.createIRI("https://matonto.org/records#test");
        Resource distributedCatalogId = vf.createIRI("http://matonto.org/test/catalog-local");
        manager.removeRecord(distributedCatalogId, recordId);
    }

    @Test
    public void testGetRecord() throws Exception {
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");

        RepositoryConnection conn = repo.getConnection();
        assertTrue(conn.getStatements(recordId, null, null, recordId).hasNext());
        conn.close();

        Optional<Record> result = manager.getRecord(distributedCatalogId, recordId, recordFactory);
        assertTrue(result.isPresent());
        Record record = result.get();
        assertTrue(record.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals("Get", record.getProperty(vf.createIRI(DC_TITLE)).get().stringValue());
        assertTrue(record.getProperty(vf.createIRI(DC_DESCRIPTION)).isPresent());
        assertEquals("Description", record.getProperty(vf.createIRI(DC_DESCRIPTION)).get().stringValue());
        assertTrue(record.getProperty(vf.createIRI(DC_IDENTIFIER)).isPresent());
        assertEquals("Identifier", record.getProperty(vf.createIRI(DC_IDENTIFIER)).get().stringValue());
        assertTrue(record.getProperty(vf.createIRI(DC_MODIFIED)).isPresent());
        assertTrue(record.getProperty(vf.createIRI(DC_ISSUED)).isPresent());
    }

    @Test
    public void testGetRecordFromMissingCatalog() {
        Resource recordId = vf.createIRI("https://matonto.org/records#test");
        Optional<Record> optionalRecord = manager.getRecord(differentId, recordId, recordFactory);
        assertFalse(optionalRecord.isPresent());
    }

    @Test
    public void testGetMissingRecordForCatalog() {
        Optional<Record> optionalRecord = manager.getRecord(distributedCatalogId, notPresentId, recordFactory);
        assertFalse(optionalRecord.isPresent());
    }

    @Test
    public void testGetRecordForWrongCatalog() {
        Resource recordId = vf.createIRI("https://matonto.org/records#test");
        Resource distributedCatalogId = vf.createIRI("http://matonto.org/test/catalog-local");
        Optional<Record> optionalRecord = manager.getRecord(distributedCatalogId, recordId, recordFactory);
        assertFalse(optionalRecord.isPresent());
    }

    @Test
    public void testGetRecordByIdentifier() throws Exception {
        Optional<Record> result = manager.getRecord("Unique", recordFactory);
        assertTrue(result.isPresent());
        Record record = result.get();
        assertTrue(record.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals("Unique", record.getProperty(vf.createIRI(DC_TITLE)).get().stringValue());
        assertTrue(record.getProperty(vf.createIRI(DC_IDENTIFIER)).isPresent());
        assertEquals("Unique", record.getProperty(vf.createIRI(DC_IDENTIFIER)).get().stringValue());
        assertTrue(record.getProperty(vf.createIRI(DC_MODIFIED)).isPresent());
        assertTrue(record.getProperty(vf.createIRI(DC_ISSUED)).isPresent());
    }

    @Test
    public void testGetRecordByMissingIdentifier() throws Exception {
        Optional<Record> result = manager.getRecord("Missing", recordFactory);
        assertFalse(result.isPresent());
    }

    @Test
    public void testGetUnversionedRecord() throws Exception {
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");

        RepositoryConnection conn = repo.getConnection();
        assertTrue(conn.getStatements(recordId, null, null, recordId).hasNext());
        conn.close();

        Optional<UnversionedRecord> result = manager.getRecord(distributedCatalogId, recordId, unversionedRecordFactory);
        assertTrue(result.isPresent());
        UnversionedRecord record = result.get();
        assertTrue(record.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals("Get", record.getProperty(vf.createIRI(DC_TITLE)).get().stringValue());
        assertTrue(record.getProperty(vf.createIRI(DC_DESCRIPTION)).isPresent());
        assertEquals("Description", record.getProperty(vf.createIRI(DC_DESCRIPTION)).get().stringValue());
        assertTrue(record.getProperty(vf.createIRI(DC_IDENTIFIER)).isPresent());
        assertEquals("Identifier", record.getProperty(vf.createIRI(DC_IDENTIFIER)).get().stringValue());
        assertTrue(record.getProperty(vf.createIRI(DC_MODIFIED)).isPresent());
        assertTrue(record.getProperty(vf.createIRI(DC_ISSUED)).isPresent());
    }

    @Test
    public void testGetVersionedRecord() throws Exception {
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");

        RepositoryConnection conn = repo.getConnection();
        assertTrue(conn.getStatements(recordId, null, null, recordId).hasNext());
        conn.close();

        Optional<VersionedRecord> result = manager.getRecord(distributedCatalogId, recordId, versionedRecordFactory);
        assertTrue(result.isPresent());
        VersionedRecord record = result.get();
        assertTrue(record.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals("Get", record.getProperty(vf.createIRI(DC_TITLE)).get().stringValue());
        assertTrue(record.getProperty(vf.createIRI(DC_DESCRIPTION)).isPresent());
        assertEquals("Description", record.getProperty(vf.createIRI(DC_DESCRIPTION)).get().stringValue());
        assertTrue(record.getProperty(vf.createIRI(DC_IDENTIFIER)).isPresent());
        assertEquals("Identifier", record.getProperty(vf.createIRI(DC_IDENTIFIER)).get().stringValue());
        assertTrue(record.getProperty(vf.createIRI(DC_MODIFIED)).isPresent());
        assertTrue(record.getProperty(vf.createIRI(DC_ISSUED)).isPresent());
    }

    @Test
    public void testGetVersionedRDFRecord() throws Exception {
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");

        RepositoryConnection conn = repo.getConnection();
        assertTrue(conn.getStatements(recordId, null, null, recordId).hasNext());
        conn.close();

        Optional<VersionedRDFRecord> result = manager.getRecord(distributedCatalogId, recordId, versionedRDFRecordFactory);
        assertTrue(result.isPresent());
        VersionedRDFRecord record = result.get();
        assertTrue(record.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals("Get", record.getProperty(vf.createIRI(DC_TITLE)).get().stringValue());
        assertTrue(record.getProperty(vf.createIRI(DC_DESCRIPTION)).isPresent());
        assertEquals("Description", record.getProperty(vf.createIRI(DC_DESCRIPTION)).get().stringValue());
        assertTrue(record.getProperty(vf.createIRI(DC_IDENTIFIER)).isPresent());
        assertEquals("Identifier", record.getProperty(vf.createIRI(DC_IDENTIFIER)).get().stringValue());
        assertTrue(record.getProperty(vf.createIRI(DC_MODIFIED)).isPresent());
        assertTrue(record.getProperty(vf.createIRI(DC_ISSUED)).isPresent());
    }

    @Test
    public void testGetOntologyRecord() throws Exception {
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");

        RepositoryConnection conn = repo.getConnection();
        assertTrue(conn.getStatements(recordId, null, null, recordId).hasNext());
        conn.close();

        Optional<OntologyRecord> result = manager.getRecord(distributedCatalogId, recordId, ontologyRecordFactory);
        assertTrue(result.isPresent());
        OntologyRecord record = result.get();
        assertTrue(record.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals("Get", record.getProperty(vf.createIRI(DC_TITLE)).get().stringValue());
        assertTrue(record.getProperty(vf.createIRI(DC_DESCRIPTION)).isPresent());
        assertEquals("Description", record.getProperty(vf.createIRI(DC_DESCRIPTION)).get().stringValue());
        assertTrue(record.getProperty(vf.createIRI(DC_IDENTIFIER)).isPresent());
        assertEquals("Identifier", record.getProperty(vf.createIRI(DC_IDENTIFIER)).get().stringValue());
        assertTrue(record.getProperty(vf.createIRI(DC_MODIFIED)).isPresent());
        assertTrue(record.getProperty(vf.createIRI(DC_ISSUED)).isPresent());
    }

    @Test
    public void testGetMappingRecord() throws Exception {
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");

        RepositoryConnection conn = repo.getConnection();
        assertTrue(conn.getStatements(recordId, null, null, recordId).hasNext());
        conn.close();

        Optional<MappingRecord> result = manager.getRecord(distributedCatalogId, recordId, mappingRecordFactory);
        assertTrue(result.isPresent());
        MappingRecord record = result.get();
        assertTrue(record.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals("Get", record.getProperty(vf.createIRI(DC_TITLE)).get().stringValue());
        assertTrue(record.getProperty(vf.createIRI(DC_DESCRIPTION)).isPresent());
        assertEquals("Description", record.getProperty(vf.createIRI(DC_DESCRIPTION)).get().stringValue());
        assertTrue(record.getProperty(vf.createIRI(DC_IDENTIFIER)).isPresent());
        assertEquals("Identifier", record.getProperty(vf.createIRI(DC_IDENTIFIER)).get().stringValue());
        assertTrue(record.getProperty(vf.createIRI(DC_MODIFIED)).isPresent());
        assertTrue(record.getProperty(vf.createIRI(DC_ISSUED)).isPresent());
    }

    @Test
    public void testGetDatasetRecord() throws Exception {
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");

        RepositoryConnection conn = repo.getConnection();
        assertTrue(conn.getStatements(recordId, null, null, recordId).hasNext());
        conn.close();

        Optional<DatasetRecord> result = manager.getRecord(distributedCatalogId, recordId, datasetRecordFactory);
        assertTrue(result.isPresent());
        DatasetRecord record = result.get();
        assertTrue(record.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals("Get", record.getProperty(vf.createIRI(DC_TITLE)).get().stringValue());
        assertTrue(record.getProperty(vf.createIRI(DC_DESCRIPTION)).isPresent());
        assertEquals("Description", record.getProperty(vf.createIRI(DC_DESCRIPTION)).get().stringValue());
        assertTrue(record.getProperty(vf.createIRI(DC_IDENTIFIER)).isPresent());
        assertEquals("Identifier", record.getProperty(vf.createIRI(DC_IDENTIFIER)).get().stringValue());
        assertTrue(record.getProperty(vf.createIRI(DC_MODIFIED)).isPresent());
        assertTrue(record.getProperty(vf.createIRI(DC_ISSUED)).isPresent());
    }

    @Test
    public void testFindRecordsReturnsCorrectDataFirstPage() throws Exception {
        // given
        int limit = 1;
        int offset = 0;
        IRI modified = vf.createIRI(DC_MODIFIED);
        PaginatedSearchParams searchParams = new SimpleSearchParams.Builder(limit, offset, modified).build();
        // when
        PaginatedSearchResults<Record> records = manager.findRecord(distributedCatalogId, searchParams);
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
        PaginatedSearchResults<Record> records = manager.findRecord(distributedCatalogId, searchParams);
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
        PaginatedSearchResults<Record> records = manager.findRecord(distributedCatalogId, searchParams);
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
        PaginatedSearchResults<Record> resources1 = manager.findRecord(distributedCatalogId, searchParams1);
        PaginatedSearchResults<Record> resources2 = manager.findRecord(distributedCatalogId, searchParams2);
        PaginatedSearchResults<Record> resources3 = manager.findRecord(distributedCatalogId, searchParams3);
        PaginatedSearchResults<Record> resources4 = manager.findRecord(distributedCatalogId, searchParams4);
        PaginatedSearchResults<Record> resources5 = manager.findRecord(distributedCatalogId, searchParams5);
        PaginatedSearchResults<Record> resources6 = manager.findRecord(distributedCatalogId, searchParams6);
        // then
        Assert.assertThat(resources1.getPage().iterator().next().getResource().stringValue(), equalTo("http://matonto.org/test/records#get"));
        Assert.assertThat(resources2.getPage().iterator().next().getResource().stringValue(), equalTo("http://matonto.org/test/records#update"));
        Assert.assertThat(resources3.getPage().iterator().next().getResource().stringValue(), equalTo("http://matonto.org/test/records#update"));
        Assert.assertThat(resources4.getPage().iterator().next().getResource().stringValue(), equalTo("http://matonto.org/test/records#get"));
        Assert.assertThat(resources5.getPage().iterator().next().getResource().stringValue(), equalTo("http://matonto.org/test/records#get"));
        Assert.assertThat(resources6.getPage().iterator().next().getResource().stringValue(), equalTo("http://matonto.org/test/records#versionedRDF"));
    }

    @Test
    public void testFindRecordWithEmptyRepository() throws Exception {
        // given
        Repository repo2 = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo2.initialize();
        manager.setRepository(repo2);
        int limit = 1;
        int offset = 0;
        IRI modified = vf.createIRI(DC_MODIFIED);
        PaginatedSearchParams searchParams = new SimpleSearchParams.Builder(limit, offset, modified).build();
        // when
        PaginatedSearchResults<Record> records = manager.findRecord(distributedCatalogId, searchParams);
        // then
        Assert.assertThat(records.getPage().size(), equalTo(0));
        Assert.assertThat(records.getTotalSize(), equalTo(0));
    }

    @Test
    public void testFindRecordWithNoEntries() throws Exception {
        // given
        int limit = 1;
        int offset = 0;
        IRI modified = vf.createIRI(DC_MODIFIED);
        IRI localCatalogId = vf.createIRI("http://matonto.org/test/catalog-local");
        PaginatedSearchParams searchParams = new SimpleSearchParams.Builder(limit, offset, modified).build();
        // when
        PaginatedSearchResults<Record> records = manager.findRecord(localCatalogId, searchParams);
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
        PaginatedSearchResults<Record> ontRecords = manager.findRecord(distributedCatalogId, ontSearchParams);
        PaginatedSearchResults<Record> mappingRecords = manager.findRecord(distributedCatalogId, mappingSearchParams);
        PaginatedSearchResults<Record> fullRecords = manager.findRecord(distributedCatalogId, fullSearchParams);
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

        Distribution distribution = distributionFactory.createNew(distributionId);
        RepositoryConnection conn = repo.getConnection();
        assertFalse(conn.getStatements(distributionId, null, null, distributionId).hasNext());

        manager.addDistributionToUnversionedRecord(distribution, unversionedId);
        assertTrue(conn.getStatements(distributionId, null, null, distributionId).hasNext());
        assertTrue(conn.getStatements(unversionedId, distributionIRI, distributionId, unversionedId).hasNext());
        conn.close();
    }

    @Test(expected = MatOntoException.class)
    public void testAddDistributionToMissingUnversionedRecord() {
        Resource distributionId = vf.createIRI("https://matonto.org/distributions#test");
        Distribution distribution = distributionFactory.createNew(distributionId);
        manager.addDistributionToUnversionedRecord(distribution, notPresentId);
    }

    @Test(expected = MatOntoException.class)
    public void testAddDistributionWithTakenResourceToUnversionedRecord() {
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test");
        Resource recordId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Distribution distribution = distributionFactory.createNew(distributionId);
        manager.addDistributionToUnversionedRecord(distribution, recordId);
    }

    @Test
    public void testAddDistributionToVersion() throws Exception {
        IRI distributionIRI = vf.createIRI(Version.versionedDistribution_IRI);
        Resource distributionId = vf.createIRI("https://matonto.org/distributions#test");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");

        Distribution distribution = distributionFactory.createNew(distributionId);
        RepositoryConnection conn = repo.getConnection();
        assertFalse(conn.getStatements(distributionId, null, null, distributionId).hasNext());

        manager.addDistributionToVersion(distribution, versionId);
        assertTrue(conn.getStatements(distributionId, null, null, distributionId).hasNext());
        assertTrue(conn.getStatements(versionId, distributionIRI, distributionId, versionId).hasNext());
        conn.close();
    }

    @Test(expected = MatOntoException.class)
    public void testAddDistributionToMissingVersion() {
        Resource distributionId = vf.createIRI("https://matonto.org/distributions#test");
        Distribution distribution = distributionFactory.createNew(distributionId);
        manager.addDistributionToVersion(distribution, notPresentId);
    }

    @Test(expected = MatOntoException.class)
    public void testAddDistributionWithTakenResourceToVersion() {
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");
        Distribution distribution = distributionFactory.createNew(distributionId);
        manager.addDistributionToVersion(distribution, versionId);
    }

    @Test
    public void testUpdateDistribution() throws Exception {
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test");
        Model distributionModel = mf.createModel();
        RepositoryConnection conn = repo.getConnection();
        conn.getStatements(distributionId, null, null, distributionId).forEach(distributionModel::add);

        Distribution distribution = distributionFactory.getExisting(distributionId, distributionModel);
        distribution.getModel().add(distributionId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"));

        assertFalse(conn.getStatements(distributionId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"))
                .hasNext());

        manager.updateDistribution(distribution);
        assertTrue(conn.getStatements(distributionId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"),
                distributionId).hasNext());
        conn.close();
    }

    @Test(expected = MatOntoException.class)
    public void testUpdateMissingDistribution() {
        Distribution distribution = distributionFactory.createNew(notPresentId);
        manager.updateDistribution(distribution);
    }

    @Test
    public void testRemoveDistributionFromUnversionedRecord() throws Exception {
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test");
        Resource unversionedId = vf.createIRI("http://matonto.org/test/records#unversioned");
        IRI distributionIRI = vf.createIRI(UnversionedRecord.unversionedDistribution_IRI);

        RepositoryConnection conn = repo.getConnection();
        assertTrue(conn.getStatements(distributionId, null, null, distributionId).hasNext());
        assertTrue(conn.getStatements(unversionedId, distributionIRI, distributionId, unversionedId).hasNext());

        manager.removeDistributionFromUnversionedRecord(distributionId, unversionedId);
        assertFalse(conn.getStatements(distributionId, null, null, distributionId).hasNext());
        assertFalse(conn.getStatements(unversionedId, distributionIRI, distributionId, unversionedId).hasNext());
        conn.close();
    }

    @Test(expected = MatOntoException.class)
    public void testRemoveDistributionFromMissingUnversionedRecord() {
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test");
        manager.removeDistributionFromUnversionedRecord(distributionId, notPresentId);
    }

    @Test(expected = MatOntoException.class)
    public void testRemoveMissingDistributionFromUnversionedRecord() {
        Resource unversionedId = vf.createIRI("http://matonto.org/test/records#unversioned");
        manager.removeDistributionFromUnversionedRecord(notPresentId, unversionedId);
    }

    @Test(expected = MatOntoException.class)
    public void testRemoveWrongDistributionFromUnversionedRecord() {
        Resource unversionedId = vf.createIRI("http://matonto.org/test/records#unversioned");
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test2");
        manager.removeDistributionFromUnversionedRecord(distributionId, unversionedId);
    }

    @Test
    public void testRemoveDistributionFromVersion() throws Exception {
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test2");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");
        IRI distributionIRI = vf.createIRI(Version.versionedDistribution_IRI);

        RepositoryConnection conn = repo.getConnection();
        assertTrue(conn.getStatements(distributionId, null, null, distributionId).hasNext());
        assertTrue(conn.getStatements(versionId, distributionIRI, distributionId, versionId).hasNext());

        manager.removeDistributionFromVersion(distributionId, versionId);
        assertFalse(conn.getStatements(distributionId, null, null, distributionId).hasNext());
        assertFalse(conn.getStatements(versionId, distributionIRI, distributionId, versionId).hasNext());
        conn.close();
    }

    @Test(expected = MatOntoException.class)
    public void testRemoveDistributionFromMissingVersion() {
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test2");
        manager.removeDistributionFromVersion(distributionId, notPresentId);
    }

    @Test(expected = MatOntoException.class)
    public void testRemoveMissingDistributionFromVersion() {
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");
        manager.removeDistributionFromVersion(notPresentId, versionId);
    }

    @Test(expected = MatOntoException.class)
    public void testRemoveWrongDistributionFromVersion() {
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test");
        manager.removeDistributionFromVersion(distributionId, versionId);
    }

    @Test
    public void testGetDistribution() throws Exception {
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test");

        RepositoryConnection conn = repo.getConnection();
        assertTrue(conn.getStatements(distributionId, null, null, distributionId).hasNext());
        conn.close();

        Optional<Distribution> result = manager.getDistribution(distributionId);
        assertTrue(result.isPresent());
        Distribution distribution = result.get();
        assertTrue(distribution.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals("Distribution", distribution.getProperty(vf.createIRI(DC_TITLE)).get().stringValue());
        assertTrue(distribution.getProperty(vf.createIRI(DC_ISSUED)).isPresent());
        assertTrue(distribution.getProperty(vf.createIRI(DC_MODIFIED)).isPresent());
    }

    @Test
    public void testGetMissingDistribution() {
        Optional<Distribution> optionalDistribution = manager.getDistribution(notPresentId);
        assertFalse(optionalDistribution.isPresent());
    }

    @Test
    public void testAddVersion() throws Exception {
        IRI latestVersionIRI = vf.createIRI(VersionedRecord.latestVersion_IRI);
        Resource versionId = vf.createIRI("https://matonto.org/versions#test");
        Resource versionedRecordId = vf.createIRI("http://matonto.org/test/records#get");

        Version version = versionFactory.createNew(versionId);
        RepositoryConnection conn = repo.getConnection();
        assertFalse(conn.getStatements(versionId, null, null, versionId).hasNext());
        assertTrue(conn.getStatements(versionedRecordId, latestVersionIRI, null, versionedRecordId).hasNext());
        assertFalse(conn.getStatements(versionedRecordId, latestVersionIRI, versionId, versionedRecordId).hasNext());

        manager.addVersion(version, versionedRecordId);
        assertTrue(conn.getStatements(versionId, null, null, versionId).hasNext());
        assertTrue(conn.getStatements(versionedRecordId, latestVersionIRI, versionId, versionedRecordId).hasNext());
        conn.close();
    }

    @Test(expected = MatOntoException.class)
    public void testAddVersionToMissingVersionedRecord() {
        Resource versionId = vf.createIRI("https://matonto.org/versions#test");
        Version version = versionFactory.createNew(versionId);
        manager.addVersion(version, notPresentId);
    }

    @Test(expected = MatOntoException.class)
    public void testAddVersionWithTakenResourceToVersionedRecord() {
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");
        Resource versionedRecordId = vf.createIRI("http://matonto.org/test/records#get");
        Version version = versionFactory.createNew(versionId);
        manager.addVersion(version, versionedRecordId);
    }

    @Test
    public void testAddTag() throws Exception {
        IRI latestVersionIRI = vf.createIRI(VersionedRecord.latestVersion_IRI);
        Resource versionId = vf.createIRI("https://matonto.org/versions#test");
        Resource versionedRecordId = vf.createIRI("http://matonto.org/test/records#get");

        Tag version = tagFactory.createNew(versionId);
        RepositoryConnection conn = repo.getConnection();
        assertFalse(conn.getStatements(versionId, null, null, versionId).hasNext());
        assertTrue(conn.getStatements(versionedRecordId, latestVersionIRI, null, versionedRecordId).hasNext());
        assertFalse(conn.getStatements(versionedRecordId, latestVersionIRI, versionId, versionedRecordId).hasNext());

        manager.addVersion(version, versionedRecordId);
        assertTrue(conn.getStatements(versionId, null, null, versionId).hasNext());
        assertTrue(conn.getStatements(versionedRecordId, latestVersionIRI, versionId, versionedRecordId).hasNext());
        conn.close();
    }

    @Test
    public void testUpdateVersion() throws Exception {
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");
        RepositoryConnection conn = repo.getConnection();
        Model versionModel = mf.createModel();
        conn.getStatements(versionId, null, null, versionId).forEach(versionModel::add);

        Version version = versionFactory.getExisting(versionId, versionModel);
        version.getModel().add(versionId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"));

        assertFalse(conn.getStatements(versionId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title")).hasNext());

        manager.updateVersion(version);
        assertTrue(conn.getStatements(versionId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"), versionId)
                .hasNext());
        conn.close();
    }

    @Test(expected = MatOntoException.class)
    public void testUpdateMissingVersion() {
        Version version = versionFactory.createNew(notPresentId);
        manager.updateVersion(version);
    }

    @Test
    public void testUpdateTag() throws Exception {
        Resource tagId = vf.createIRI("http://matonto.org/test/tags#test");
        RepositoryConnection conn = repo.getConnection();
        Model tagModel = mf.createModel();
        conn.getStatements(tagId, null, null, tagId).forEach(tagModel::add);

        Tag tag = tagFactory.getExisting(tagId, tagModel);
        tag.getModel().add(tagId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"));

        assertFalse(conn.getStatements(tagId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title")).hasNext());

        manager.updateVersion(tag);
        assertTrue(conn.getStatements(tagId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"), tagId).hasNext());
        conn.close();
    }

    @Test
    public void testRemoveVersion() throws Exception {
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#remove");
        Resource latestVersionId = vf.createIRI("http://matonto.org/test/versions#test");
        IRI versionIRI = vf.createIRI(VersionedRecord.version_IRI);
        IRI latestIRI = vf.createIRI(VersionedRecord.latestVersion_IRI);

        RepositoryConnection conn = repo.getConnection();
        assertTrue(conn.getStatements(recordId, versionIRI, latestVersionId, recordId).hasNext());

        manager.removeVersion(versionId, recordId);
        assertFalse(conn.getStatements(versionId, null, null, versionId).hasNext());
        assertTrue(conn.getStatements(recordId, latestIRI, latestVersionId, recordId).hasNext());
        assertFalse(conn.getStatements(recordId, versionIRI, versionId, recordId).hasNext());
        conn.close();
    }

    @Test
    public void testRemoveLatestVersion() throws Exception {
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");
        Resource newLatestVersionId = vf.createIRI("http://matonto.org/test/versions#test2");
        Resource latestVersionId = vf.createIRI("http://matonto.org/test/versions#test");
        IRI versionIRI = vf.createIRI(VersionedRecord.version_IRI);
        IRI latestIRI = vf.createIRI(VersionedRecord.latestVersion_IRI);

        RepositoryConnection conn = repo.getConnection();
        assertTrue(conn.getStatements(recordId, versionIRI, latestVersionId, recordId).hasNext());

        manager.removeVersion(latestVersionId, recordId);
        assertFalse(conn.getStatements(latestVersionId, null, null, latestVersionId).hasNext());
        assertTrue(conn.getStatements(recordId, versionIRI, newLatestVersionId, recordId).hasNext());
        assertTrue(conn.getStatements(recordId, latestIRI, newLatestVersionId, recordId).hasNext());
        conn.close();
    }

    @Test(expected = MatOntoException.class)
    public void testRemoveMissingVersion() {
        Resource versionedRecordId = vf.createIRI("http://matonto.org/test/records#get");
        manager.removeVersion(notPresentId, versionedRecordId);
    }

    @Test(expected = MatOntoException.class)
    public void testRemoveVersionFromMissingVersionedRecord() {
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");
        manager.removeVersion(versionId, notPresentId);
    }

    @Test(expected = MatOntoException.class)
    public void testRemoveWrongVersion() {
        Resource versionId = vf.createIRI("http://matonto.org/test/tags#test");
        Resource versionedRecordId = vf.createIRI("http://matonto.org/test/records#get");
        manager.removeDistributionFromVersion(versionId, versionedRecordId);
    }

    @Test
    public void testGetVersion() throws Exception {
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");

        RepositoryConnection conn = repo.getConnection();
        assertTrue(conn.getStatements(versionId, null, null, versionId).hasNext());
        conn.close();

        Optional<Version> result = manager.getVersion(versionId, versionFactory);
        assertTrue(result.isPresent());
        Version version = result.get();
        assertTrue(version.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals("Version", version.getProperty(vf.createIRI(DC_TITLE)).get().stringValue());
        assertTrue(version.getProperty(vf.createIRI(DC_ISSUED)).isPresent());
        assertTrue(version.getProperty(vf.createIRI(DC_MODIFIED)).isPresent());
    }

    @Test
    public void testGetMissingVersion() throws Exception {
        Optional<Version> optionalVersion = manager.getVersion(notPresentId, versionFactory);
        assertFalse(optionalVersion.isPresent());
    }

    @Test
    public void testGetTag() throws Exception {
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");

        RepositoryConnection conn = repo.getConnection();
        assertTrue(conn.getStatements(versionId, null, null, versionId).hasNext());
        conn.close();

        Optional<Tag> result = manager.getVersion(versionId, tagFactory);
        assertTrue(result.isPresent());
        Version version = result.get();
        assertTrue(version.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals("Version", version.getProperty(vf.createIRI(DC_TITLE)).get().stringValue());
        assertTrue(version.getProperty(vf.createIRI(DC_ISSUED)).isPresent());
        assertTrue(version.getProperty(vf.createIRI(DC_MODIFIED)).isPresent());
    }

    @Test
    public void testAddBranch() throws Exception {
        IRI branchIRI = vf.createIRI(VersionedRDFRecord.branch_IRI);
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#new");

        Branch branch = branchFactory.createNew(branchId);
        RepositoryConnection conn = repo.getConnection();
        assertFalse(conn.getStatements(branchId, null, null, branchId).hasNext());

        manager.addBranch(branch, recordId);
        assertTrue(conn.getStatements(branchId, null, null, branchId).hasNext());
        assertTrue(conn.getStatements(recordId, branchIRI, branchId, recordId).hasNext());
        conn.close();
    }

    @Test(expected = MatOntoException.class)
    public void testAddBranchToMissingVersionedRDFRecord() {
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#new");
        Branch branch = branchFactory.createNew(branchId);
        manager.addBranch(branch, notPresentId);
    }

    @Test(expected = MatOntoException.class)
    public void testAddBranchWithTakenResourceToVersionedRDFRecord() {
        Resource branchId = vf.createIRI("http://matonto.org/test/different");
        Resource versionedRDFRecordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Branch branch = branchFactory.createNew(branchId);
        manager.addBranch(branch, versionedRDFRecordId);
    }

    @Test
    public void testUpdateBranch() throws Exception {
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");
        RepositoryConnection conn = repo.getConnection();
        Model branchModel = mf.createModel();
        conn.getStatements(branchId, null, null, branchId).forEach(branchModel::add);

        Branch branch = branchFactory.getExisting(branchId, branchModel);
        branch.getModel().add(branchId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"));

        assertFalse(conn.getStatements(branchId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"), branchId)
                .hasNext());

        manager.updateBranch(branch);
        assertTrue(conn.getStatements(branchId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"), branchId)
                .hasNext());
        conn.close();
    }

    @Test(expected = MatOntoException.class)
    public void testUpdateMissingBranch() {
        Branch branch = branchFactory.createNew(notPresentId);
        manager.updateBranch(branch);
    }

    @Test
    public void testRemoveBranch() throws Exception {
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        IRI branchIRI = vf.createIRI(VersionedRDFRecord.branch_IRI);

        RepositoryConnection conn = repo.getConnection();
        assertTrue(conn.getStatements(branchId, null, null, branchId).hasNext());
        assertTrue(conn.getStatements(recordId, branchIRI, branchId, recordId).hasNext());

        manager.removeBranch(branchId, recordId);
        assertFalse(conn.getStatements(branchId, null, null, branchId).hasNext());
        assertFalse(conn.getStatements(recordId, branchIRI, branchId, recordId).hasNext());
        conn.close();
    }

    @Test(expected = MatOntoException.class)
    public void testRemoveMissingBranch() {
        Resource versionedRDFRecordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        manager.removeBranch(notPresentId, versionedRDFRecordId);
    }

    @Test(expected = MatOntoException.class)
    public void testRemoveBranchFromMissingVersionedRDFRecord() {
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");
        manager.removeBranch(branchId, notPresentId);
    }

    @Test(expected = MatOntoException.class)
    public void testRemoveWrongBranch() {
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test2");
        Resource versionedRDFRecordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        manager.removeBranch(branchId, versionedRDFRecordId);
    }

    @Test
    public void testGetBranch() throws Exception {
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");

        RepositoryConnection conn = repo.getConnection();
        assertTrue(conn.getStatements(branchId, null, null, branchId).hasNext());
        conn.close();

        Optional<Branch> result = manager.getBranch(branchId);
        assertTrue(result.isPresent());
        Branch branch = result.get();
        assertTrue(branch.getProperty(vf.createIRI(DC_TITLE)).isPresent());
        assertEquals("Branch", branch.getProperty(vf.createIRI(DC_TITLE)).get().stringValue());
        assertTrue(branch.getProperty(vf.createIRI(DC_ISSUED)).isPresent());
        assertTrue(branch.getProperty(vf.createIRI(DC_MODIFIED)).isPresent());
    }

    @Test
    public void testGetMissingBranch() throws Exception {
        Optional<Branch> optionalBranch = manager.getBranch(notPresentId);
        assertFalse(optionalBranch.isPresent());
    }

    @Test
    public void testCreateCommit() throws Exception {
        IRI dummyId = vf.createIRI("https://matonto.org/dummy");
        IRI generated = vf.createIRI("https://matonto.org/generated");
        IRI revisionId = vf.createIRI("http://matonto.org/revisions#test");

        Resource generation = vf.createIRI("http://matonto.org/test");
        Resource generation2 = vf.createIRI("http://matonto.org/test2");
        Commit parent = commitFactory.createNew(vf.createIRI("http://matonto.org/test/parent"));
        parent.setProperty(generation, vf.createIRI(PROV_GENERATED));
        Commit parent2 = commitFactory.createNew(vf.createIRI("http://matonto.org/test/parent2"));
        parent2.setProperty(generation2, vf.createIRI(PROV_GENERATED));
        Set<Commit> parents = Stream.of(parent, parent2).collect(Collectors.toSet());

        InProgressCommit inProgressCommit = inProgressCommitFactory.createNew(dummyId);
        inProgressCommit.setProperty(vf.createIRI("http://matonto.org/user"), vf.createIRI(PROV_WAS_ASSOCIATED_WITH));
        inProgressCommit.setProperty(generated, vf.createIRI(PROV_GENERATED));
        Revision revision = revisionFactory.createNew(revisionId);
        inProgressCommit.getModel().addAll(revision.getModel());

        Commit result = manager.createCommit(inProgressCommit, null, "message");
        assertTrue(result.getProperty(vf.createIRI(PROV_AT_TIME)).isPresent());
        assertEquals("message", result.getProperty(vf.createIRI(DC_TITLE)).get().stringValue());
        assertEquals(0, result.getProperties(vf.createIRI(PROV_WAS_INFORMED_BY)).size());
        assertFalse(result.getModel().contains(dummyId, null, null));
        assertTrue(result.getModel().contains(revisionId, null, null));

        result = manager.createCommit(inProgressCommit, parents, "message");
        assertTrue(result.getProperty(vf.createIRI(PROV_AT_TIME)).isPresent());
        assertEquals("message", result.getProperty(vf.createIRI(DC_TITLE)).get().stringValue());
        assertEquals(2, result.getProperties(vf.createIRI(PROV_WAS_INFORMED_BY)).size());
        result.getProperties(vf.createIRI(PROV_WAS_INFORMED_BY)).forEach(value ->
                assertTrue(parents.stream().anyMatch(commit -> commit.getResource().equals(value))));
        assertFalse(result.getModel().contains(dummyId, null, null));
        assertTrue(result.getModel().contains(revisionId, null, null));
    }

    @Test
    public void testCreateInProgressCommit() throws Exception {
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user"));
        Resource versionedRDFRecordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");

        InProgressCommit result = manager.createInProgressCommit(user, versionedRDFRecordId);
        assertTrue(result.getProperty(vf.createIRI(PROV_WAS_ASSOCIATED_WITH)).isPresent());
        assertEquals(user.getResource().stringValue(), result.getProperty(vf.createIRI(PROV_WAS_ASSOCIATED_WITH)).get()
                .stringValue());
        assertTrue(result.getProperty(vf.createIRI(PROV_GENERATED)).isPresent());
        assertTrue(result.getOnVersionedRDFRecord().isPresent());
        assertEquals(versionedRDFRecordId.stringValue(), result.getOnVersionedRDFRecord().get().getResource()
                .stringValue());

        Revision revision = revisionFactory.createNew((Resource)result.getProperty(vf.createIRI(PROV_GENERATED)).get(),
                result.getModel());
        assertTrue(revision.getAdditions().isPresent());
        assertTrue(revision.getDeletions().isPresent());

        result = manager.createInProgressCommit(user, versionedRDFRecordId);
        assertEquals(user.getResource().stringValue(), result.getProperty(vf.createIRI(PROV_WAS_ASSOCIATED_WITH)).get()
                .stringValue());
        assertTrue(result.getProperty(vf.createIRI(PROV_GENERATED)).isPresent());
        assertFalse(result.getProperty(vf.createIRI(PROV_WAS_INFORMED_BY)).isPresent());
        assertEquals(versionedRDFRecordId.stringValue(), result.getOnVersionedRDFRecord().get().getResource()
                .stringValue());

        revision = revisionFactory.createNew((Resource)result.getProperty(vf.createIRI(PROV_GENERATED)).get(),
                result.getModel());
        assertTrue(revision.getAdditions().isPresent());
        assertTrue(revision.getDeletions().isPresent());
        assertFalse(revision.getProperty(vf.createIRI(PROV_WAS_DERIVED_FROM)).isPresent());
    }

    @Test(expected = InvalidParameterException.class)
    public void testCreateInProgressCommitWithNoRecord() {
        User user = userFactory.createNew(vf.createIRI("http://matonto.org/test/user"));
        Resource notPresent = vf.createIRI("http://matonto.org/test/distributions#not-present");
        manager.createInProgressCommit(user, notPresent);
    }

    @Test
    public void testAddAdditions() throws Exception {
        Resource commitId = vf.createIRI("http://matonto.org/test/in-progress-commits#test");
        Resource additionId = vf.createIRI("http://matonto.org/test/in-additions#test");
        Resource deletionId = vf.createIRI("http://matonto.org/test/in-deletions#test");

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

        manager.addAdditions(model, commitId);
        RepositoryResult<Statement> statements = conn.getStatements(null, null, null, additionId);

        while (statements.hasNext()) {
            statement = statements.next();
            assertTrue(expected.contains(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        }

        statements = conn.getStatements(null, null, null, deletionId);
        assertFalse(statements.hasNext());
        conn.close();
    }

    @Test(expected = MatOntoException.class)
    public void testAddAdditionsToMissingInProgressCommit() {
        manager.addAdditions(mf.createModel(), notPresentId);
    }

    @Test
    public void testAddDeletions() throws Exception {
        Resource commitId = vf.createIRI("http://matonto.org/test/in-progress-commits#test");
        Resource additionId = vf.createIRI("http://matonto.org/test/in-additions#test");
        Resource deletionId = vf.createIRI("http://matonto.org/test/in-deletions#test");

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
        manager.addDeletions(model, commitId);
        RepositoryResult<Statement> statements = conn.getStatements(null, null, null, deletionId);

        while (statements.hasNext()) {
            statement = statements.next();
            assertTrue(expected.contains(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        }

        statements = conn.getStatements(null, null, null, additionId);
        assertFalse(statements.hasNext());
        conn.close();
    }

    @Test(expected = MatOntoException.class)
    public void testAddDeletionsToMissingInProgressCommit() {
        manager.addDeletions(mf.createModel(), notPresentId);
    }

    @Test
    public void testAddCommitToBranch() throws Exception {
        IRI headIRI = vf.createIRI(Branch.head_IRI);
        Resource commitId = vf.createIRI("https://matonto.org/commits#test");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");

        Commit commit = commitFactory.createNew(commitId);
        RepositoryConnection conn = repo.getConnection();
        assertFalse(conn.getStatements(commitId, null, null, commitId).hasNext());

        manager.addCommitToBranch(commit, branchId);
        assertTrue(conn.getStatements(commitId, null, null, commitId).hasNext());
        assertTrue(conn.getStatements(branchId, headIRI, commitId, branchId).hasNext());
        conn.close();
    }

    @Test(expected = MatOntoException.class)
    public void testAddCommitToMissingBranch() {
        Resource commitId = vf.createIRI("https://matonto.org/commits#test");
        Commit commit = commitFactory.createNew(commitId);
        manager.addCommitToBranch(commit, notPresentId);
    }

    @Test(expected = MatOntoException.class)
    public void testAddCommitWithTakenResourceToBranch() {
        Resource commitId = vf.createIRI("http://matonto.org/test/commits#test");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");
        Commit commit = commitFactory.createNew(commitId);
        manager.addCommitToBranch(commit, branchId);
    }

    @Test
    public void testAddInProgressCommit() throws Exception {
        Resource inProgressCommitId = vf.createIRI("https://matonto.org/in-progress-commits#test");

        InProgressCommit inProgressCommit = inProgressCommitFactory.createNew(inProgressCommitId);
        RepositoryConnection conn = repo.getConnection();
        assertFalse(conn.getStatements(inProgressCommitId, null, null, inProgressCommitId).hasNext());

        manager.addInProgressCommit(inProgressCommit);
        assertTrue(conn.getStatements(inProgressCommitId, null, null, inProgressCommitId).hasNext());
        conn.close();
    }

    @Test(expected = MatOntoException.class)
    public void testAddInProgressCommitWithTakenResource() {
        Resource inProgressCommitId = vf.createIRI("http://matonto.org/test/in-progress-commits#test");
        InProgressCommit inProgressCommit = inProgressCommitFactory.createNew(inProgressCommitId);
        manager.addInProgressCommit(inProgressCommit);
    }

    @Test
    public void testGetCommit() throws Exception {
        Resource commitId = vf.createIRI("http://matonto.org/test/commits#test");
        String revisionIRI = "http://matonto.org/test/revisions#revision";

        RepositoryConnection conn = repo.getConnection();
        assertTrue(conn.getStatements(commitId, null, null, commitId).hasNext());
        conn.close();

        Optional<Commit> result = manager.getCommit(commitId, commitFactory);
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
    public void testGetMissingCommit() throws Exception {
        Optional<Commit> optionalCommit = manager.getCommit(notPresentId, commitFactory);
        assertFalse(optionalCommit.isPresent());
    }

    @Test
    public void testGetInProgressCommit() throws Exception {
        Resource commitId = vf.createIRI("http://matonto.org/test/commits#test");
        String revisionIRI = "http://matonto.org/test/revisions#revision";

        RepositoryConnection conn = repo.getConnection();
        assertTrue(conn.getStatements(commitId, null, null, commitId).hasNext());
        conn.close();

        Optional<InProgressCommit> result = manager.getCommit(commitId, inProgressCommitFactory);
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
    public void testRemoveInProgressCommit() throws Exception {
        Resource inProgressCommitId = vf.createIRI("http://matonto.org/test/in-progress-commits#test");
        RepositoryConnection conn = repo.getConnection();
        assertTrue(conn.getStatements(inProgressCommitId, null, null, inProgressCommitId).hasNext());

        manager.removeInProgressCommit(inProgressCommitId);
        assertFalse(conn.getStatements(inProgressCommitId, null, null, inProgressCommitId).hasNext());
        conn.close();
    }

    @Test
    public void testApplyInProgressCommit() throws Exception {
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

    @Test(expected = MatOntoException.class)
    public void testApplyMissingInProgressCommit() {
        manager.applyInProgressCommit(notPresentId, mf.createModel());
    }

    @Test(expected = MatOntoException.class)
    public void testRemoveMissingInProgressCommit() {
        manager.removeInProgressCommit(notPresentId);
    }

    @Test
    public void testGetCommitChain() throws Exception {
        Resource notThere = vf.createIRI("http://matonto.org/test/records#not-present");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        Set<Resource> result = manager.getCommitChain(different);
        assertEquals(0, result.size());

        result = manager.getCommitChain(notThere);
        assertEquals(0, result.size());

        Set<Resource> expect = Stream.of(vf.createIRI("http://matonto.org/test/commits#test0"),
                vf.createIRI("http://matonto.org/test/commits#test1"),
                vf.createIRI("http://matonto.org/test/commits#test2"),
                vf.createIRI("http://matonto.org/test/commits#test4a")).collect(Collectors.toSet());
        Resource commitId = vf.createIRI("http://matonto.org/test/commits#test4a");
        result = manager.getCommitChain(commitId);
        assertEquals(expect.size(), result.size());
        result.forEach(item -> assertTrue(expect.contains(item)));
    }

    @Test
    public void testGetCompiledResourceWithUnmergedPast() throws Exception {
        Resource commit0Id = vf.createIRI("http://matonto.org/test/commits#test0");
        Resource ontologyId = vf.createIRI("http://matonto.org/test/ontology");

        Model expected = mf.createModel();
        expected.add(ontologyId, vf.createIRI(RDF_TYPE), vf.createIRI("http://www.w3.org/2002/07/owl#Ontology"));
        expected.add(ontologyId, vf.createIRI(DC_TITLE), vf.createLiteral("Test 0 Title"));
        expected.add(vf.createIRI("http://matonto.org/test/class0"), vf.createIRI(RDF_TYPE),
                vf.createIRI("http://www.w3.org/2002/07/owl#Class"));

        Optional<Model> result = manager.getCompiledResource(commit0Id);
        assertTrue(result.isPresent());
        result.get().forEach(statement -> assertTrue(expected.contains(statement.getSubject(),
                statement.getPredicate(), statement.getObject())));
    }

    @Test
    public void testGetCompiledResourceWithMergedPast() throws Exception {
        Resource commit3Id = vf.createIRI("http://matonto.org/test/commits#test3");
        Resource ontologyId = vf.createIRI("http://matonto.org/test/ontology");

        Model expected = mf.createModel();
        expected.add(ontologyId, vf.createIRI(RDF_TYPE), vf.createIRI("http://www.w3.org/2002/07/owl#Ontology"));
        expected.add(ontologyId, vf.createIRI(DC_TITLE), vf.createLiteral("Test 3 Title"));
        expected.add(vf.createIRI("http://matonto.org/test/class0"), vf.createIRI(RDF_TYPE),
                vf.createIRI("http://www.w3.org/2002/07/owl#Class"));
        Optional<Model> result = manager.getCompiledResource(commit3Id);
        result.get().forEach(statement -> assertTrue(expected.contains(statement.getSubject(),
                statement.getPredicate(), statement.getObject())));
    }

    @Test
    public void testGetCompiledResourceForNotPresentCommit() throws Exception {
        Optional<Model> result = manager.getCompiledResource(notPresentId);
        assertFalse(result.isPresent());
    }

    @Test
    public void testGetConflictsClassDeletion() throws Exception {
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
        // Both altered same title
        Resource leftId = vf.createIRI("http://matonto.org/test/commits#conflict1-2");
        Resource rightId = vf.createIRI("http://matonto.org/test/commits#conflict2-2");

        Set<Conflict> result = manager.getConflicts(leftId, rightId);
        assertEquals(result.size(), 1);

        String subject = "http://matonto.org/test/ontology";
        String predicate = DC_TITLE;
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
                assertEquals(predicate, statement.getPredicate().stringValue());
            }));
        });
    }

    @Test
    public void testGetConflictsChainAddsAndRemovesStatement() throws Exception {
        // Second chain has two commits which adds then removes something
        Resource leftId = vf.createIRI("http://matonto.org/test/commits#conflict1-3");
        Resource rightId = vf.createIRI("http://matonto.org/test/commits#conflict3-3");

        Set<Conflict> result = manager.getConflicts(leftId, rightId);
        assertEquals(0, result.size());
    }

    @Test
    public void testGetConflictsPropertyChangeOnSingleBranch() throws Exception {
        // Change a property on one branch
        Resource leftId = vf.createIRI("http://matonto.org/test/commits#conflict1-4");
        Resource rightId = vf.createIRI("http://matonto.org/test/commits#conflict2-4");

        Set<Conflict> result = manager.getConflicts(leftId, rightId);
        assertEquals(0, result.size());
    }

    @Test
    public void testGetConflictsOneRemovesOtherAddsToProperty() throws Exception {
        // One branch removes property while other adds another to it
        Resource leftId = vf.createIRI("http://matonto.org/test/commits#conflict1-5");
        Resource rightId = vf.createIRI("http://matonto.org/test/commits#conflict2-5");

        Set<Conflict> result = manager.getConflicts(leftId, rightId);
        assertEquals(1, result.size());

        String subject = "http://matonto.org/test/ontology";
        String predicate = DC_TITLE;
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
                        assertEquals(predicate, statement.getPredicate().stringValue());
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
        assertEquals(additions.size(), diff.getAdditions().size());
        diff.getAdditions().forEach(s -> assertTrue(additions.contains(s.getSubject(), s.getPredicate(),
                s.getObject())));
        assertEquals(deletions.size(), diff.getDeletions().size());
        diff.getDeletions().forEach(s -> assertTrue(deletions.contains(s.getSubject(), s.getPredicate(),
                s.getObject())));
    }

    @Test
    public void testGetDiffOppositeOfPrevious() throws Exception {
        RepositoryConnection conn = repo.getConnection();

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

        conn.close();

        Difference diff = manager.getDiff(original, changed);
        assertEquals(deletions.size(), diff.getDeletions().size());
        diff.getDeletions().forEach(s -> assertTrue(deletions.contains(s.getSubject(), s.getPredicate(),
                s.getObject())));
        assertEquals(additions.size(), diff.getAdditions().size());
        diff.getAdditions().forEach(s -> assertTrue(additions.contains(s.getSubject(), s.getPredicate(),
                s.getObject())));
    }

    @Test
    public void testGetDiffOfSameModel() throws Exception {
        RepositoryConnection conn = repo.getConnection();
        Model original = mf.createModel();
        conn.getStatements(null, null, null, vf.createIRI("http://matonto.org/test/diff2")).forEach(original::add);
        conn.close();

        Difference diff = manager.getDiff(original, original);
        assertEquals(0, diff.getAdditions().size());
        assertEquals(0, diff.getDeletions().size());
    }
}
