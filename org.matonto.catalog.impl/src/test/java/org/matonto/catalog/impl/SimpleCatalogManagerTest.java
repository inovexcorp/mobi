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
import org.apache.commons.lang3.StringUtils;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.matonto.catalog.api.Conflict;
import org.matonto.catalog.api.PaginatedSearchParams;
import org.matonto.catalog.api.PaginatedSearchResults;
import org.matonto.catalog.api.ontologies.mcat.*;
import org.matonto.jaas.ontologies.usermanagement.User;
import org.matonto.ontologies.rdfs.PropertyFactory;
import org.matonto.rdf.api.*;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory;
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
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static junit.framework.TestCase.assertEquals;
import static org.hamcrest.Matchers.equalTo;
import static org.mockito.Matchers.notNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class SimpleCatalogManagerTest {

    private Repository repo;
    private SimpleCatalogManager manager;
    private org.matonto.rdf.api.ValueFactory vf = org.matonto.rdf.core.impl.sesame.SimpleValueFactory.getInstance();
    private ModelFactory mf = LinkedHashModelFactory.getInstance();
    private ValueConverterRegistry vcr = new DefaultValueConverterRegistry();
    private CatalogFactory catalogFactory = new CatalogFactory();
    private RecordFactory recordFactory = new RecordFactory();
    private DistributionFactory distributionFactory = new DistributionFactory();
    private BranchFactory branchFactory = new BranchFactory();
    private InProgressCommitFactory inProgressCommitFactory = new InProgressCommitFactory();
    private CommitFactory commitFactory = new CommitFactory();
    private RevisionFactory revisionFactory = new RevisionFactory();
    private ThingFactory thingFactory = new ThingFactory();
    private PropertyFactory propertyFactory = new PropertyFactory();
    private VersionFactory versionFactory = new VersionFactory();

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

    private static final String IN_PROGRESS_COMMIT_NAMESPACE = "https://matonto.org/in-progress-commits#";
    private static final String REVISION_NAMESPACE = "https://matonto.org/revisions#";

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

        thingFactory.setValueFactory(vf);
        thingFactory.setValueConverterRegistry(vcr);

        propertyFactory.setValueFactory(vf);
        propertyFactory.setValueConverterRegistry(vcr);

        vcr.registerValueConverter(propertyFactory);
        vcr.registerValueConverter(thingFactory);
        vcr.registerValueConverter(revisionFactory);
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
        manager.setInProgressCommitFactory(inProgressCommitFactory);
        manager.setRevisionFactory(revisionFactory);
        manager.setVersionFactory(versionFactory);

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
        Catalog catalog = manager.getPublishedCatalog();
        Optional<Value> title = catalog.getProperty(vf.createIRI(DC_TITLE));
        Optional<Value> description = catalog.getProperty(vf.createIRI(DC_DESCRIPTION));
        Optional<Value> issued = catalog.getProperty(vf.createIRI(DC_ISSUED));
        Optional<Value> modified = catalog.getProperty(vf.createIRI(DC_MODIFIED));

        assertEquals(title.isPresent(), true);
        assertEquals("MatOnto Test Catalog (Distributed)", title.get().stringValue());
        assertEquals(description.isPresent(), true);
        assertEquals("This is a test catalog", description.get().stringValue());
        assertEquals(issued.isPresent(), true);
        assertEquals(modified.isPresent(), true);
    }

    @Test
    public void testGetUnpublishedCatalog() throws Exception {
        Catalog catalog = manager.getUnpublishedCatalog();
        Optional<Value> title = catalog.getProperty(vf.createIRI(DC_TITLE));
        Optional<Value> description = catalog.getProperty(vf.createIRI(DC_DESCRIPTION));
        Optional<Value> issued = catalog.getProperty(vf.createIRI(DC_ISSUED));
        Optional<Value> modified = catalog.getProperty(vf.createIRI(DC_MODIFIED));

        assertEquals(title.isPresent(), true);
        assertEquals("MatOnto Test Catalog (Local)", title.get().stringValue());
        assertEquals(description.isPresent(), true);
        assertEquals("This is a test catalog", description.get().stringValue());
        assertEquals(issued.isPresent(), true);
        assertEquals(modified.isPresent(), true);
    }

    @Test
    public void testGetRecordIds() throws Exception {
        Resource distributed = vf.createIRI("http://matonto.org/test/catalog-distributed");
        Resource catalogId2 = vf.createIRI("http://matonto.org/test/catalog-not-there");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        Set<Resource> results = manager.getRecordIds(distributed);
        assertEquals(results.size(), 5);
        assertEquals(results.contains(vf.createIRI("http://matonto.org/test/records#update")), true);
        assertEquals(results.contains(vf.createIRI("http://matonto.org/test/records#remove")), true);
        assertEquals(results.contains(vf.createIRI("http://matonto.org/test/records#get")), true);

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

        Model model = mf.createModel();
        model.add(recordId, vf.createIRI(Record.catalog_IRI), catalogId, recordId);

        Record record = mock(Record.class);
        when(record.getResource()).thenReturn(recordId);
        when(record.getModel()).thenReturn(model);

        RepositoryConnection conn = repo.getConnection();

        assertEquals(conn.getStatements(record.getResource(), null, null, record.getResource())
                .hasNext(), false);

        boolean result = manager.addRecord(different, record);
        assertEquals(result, false);

        result = manager.addRecord(catalogId, record);
        assertEquals(result, true);
        assertEquals(conn.getStatements(record.getResource(), null, null, record.getResource())
                .hasNext(), true);
        assertEquals(conn.getStatements(record.getResource(), null, catalogId, record.getResource())
                .hasNext(), true);

        result = manager.addRecord(catalogId, record);
        assertEquals(result, false);

        conn.close();
    }

    @Test
    public void testUpdateRecord() throws Exception {
        Resource catalogId = vf.createIRI("http://matonto.org/test/catalog-distributed");
        Resource recordId = vf.createIRI("http://matonto.org/test/records#update");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        Model model = mf.createModel();
        model.add(recordId, vf.createIRI(Record.catalog_IRI), catalogId, recordId);
        model.add(recordId, vf.createIRI(Record.keyword_IRI), vf.createLiteral("keyword1"), recordId);

        Record record = mock(Record.class);
        when(record.getResource()).thenReturn(recordId);
        when(record.getModel()).thenReturn(model);

        RepositoryConnection conn = repo.getConnection();

        assertEquals(conn.getStatements(recordId, vf.createIRI(Record.catalog_IRI), catalogId, recordId).hasNext(),
                true);
        assertEquals(conn.getStatements(recordId, vf.createIRI(Record.keyword_IRI), vf.createLiteral("keyword1"),
                recordId).hasNext(), false);

        boolean result = manager.updateRecord(different, record);
        assertEquals(result, false);

        result = manager.updateRecord(catalogId, record);
        assertEquals(result, true);
        assertEquals(conn.getStatements(record.getResource(), vf.createIRI(Record.catalog_IRI), catalogId,
                record.getResource()).hasNext(), true);
        assertEquals(conn.getStatements(record.getResource(), vf.createIRI(Record.keyword_IRI),
                vf.createLiteral("keyword1"), record.getResource()).hasNext(), true);

        Record record2 = mock(Record.class);
        when(record2.getResource()).thenReturn(vf.createIRI("http://matonto.org/test/records#not-present"));
        when(record2.getModel()).thenReturn(model);

        result = manager.updateRecord(catalogId, record2);
        assertEquals(result, false);

        result = manager.updateRecord(different, record2);
        assertEquals(result, false);

        conn.close();
    }

    @Test
    public void testRemoveRecord() throws Exception {
        Resource catalogId = vf.createIRI("http://matonto.org/test/catalog-distributed");
        Resource recordId = vf.createIRI("http://matonto.org/test/records#remove");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        RepositoryConnection conn = repo.getConnection();

        assertEquals(conn.getStatements(recordId, null, null, recordId).hasNext(), true);

        boolean result = manager.removeRecord(different, recordId);
        assertEquals(result, false);

        result = manager.removeRecord(catalogId, recordId);
        assertEquals(result, true);
        assertEquals(conn.getStatements(recordId, null, null, recordId).hasNext(), false);

        Resource recordId2 = vf.createIRI("http://matonto.org/test/records#not-present");

        result = manager.removeRecord(catalogId, recordId2);
        assertEquals(result, false);

        conn.close();
    }

    @Test
    public void testGetRecord() throws Exception {
        Resource catalogId = vf.createIRI("http://matonto.org/test/catalog-distributed");
        Resource recordId = vf.createIRI("http://matonto.org/test/records#get");

        RepositoryConnection conn = repo.getConnection();
        assertEquals(conn.getStatements(recordId, null, null, recordId).hasNext(), true);
        conn.close();

        Optional<Record> result = manager.getRecord(catalogId, recordId);

        assertEquals(result.isPresent(), true);
        Record record = result.get();
        assertEquals(record.getProperty(vf.createIRI(DC_TITLE)).isPresent(), true);
        assertEquals(record.getProperty(vf.createIRI(DC_TITLE)).get().stringValue(), "Get");
        assertEquals(record.getProperty(vf.createIRI(DC_DESCRIPTION)).isPresent(), true);
        assertEquals(record.getProperty(vf.createIRI(DC_DESCRIPTION)).get().stringValue(), "Description");
        assertEquals(record.getProperty(vf.createIRI(DC_IDENTIFIER)).isPresent(), true);
        assertEquals(record.getProperty(vf.createIRI(DC_IDENTIFIER)).get().stringValue(), "Identifier");
        assertEquals(record.getProperty(vf.createIRI(DC_MODIFIED)).isPresent(), true);
        assertEquals(record.getProperty(vf.createIRI(DC_ISSUED)).isPresent(), true);

        Resource recordId2 = vf.createIRI("http://matonto.org/test/records#not-present");

        result = manager.getRecord(catalogId, recordId2);

        assertEquals(result.isPresent(), false);
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

        Model model = mf.createModel();
        model.add(distributionId, vf.createIRI(RDF_TYPE), vf.createIRI(Distribution.TYPE));
        model.add(distributionId, vf.createIRI(DC_TITLE), vf.createLiteral("title"), distributionId);

        Distribution distribution = mock(Distribution.class);
        when(distribution.getResource()).thenReturn(distributionId);
        when(distribution.getModel()).thenReturn(model);

        RepositoryConnection conn = repo.getConnection();

        assertEquals(conn.getStatements(distributionId, null, null, distributionId).hasNext(), false);

        boolean result = manager.addDistributionToUnversionedRecord(distribution, different);
        assertEquals(result, false);

        result = manager.addDistributionToUnversionedRecord(distribution, unversionedId);
        assertEquals(result, true);
        assertEquals(conn.getStatements(distributionId, null, null, distributionId).hasNext(), true);
        assertEquals(conn.getStatements(unversionedId, distributionIRI, distributionId, unversionedId).hasNext(), true);

        result = manager.addDistributionToUnversionedRecord(distribution, unversionedId);
        assertEquals(result, false);

        Resource distributionId2 = vf.createIRI("https://matonto.org/distributions#test2");

        Model model2 = mf.createModel();
        model.add(distributionId2, vf.createIRI(DC_TITLE), vf.createLiteral("title"), distributionId2);

        Distribution distribution2 = mock(Distribution.class);
        when(distribution2.getResource()).thenReturn(distributionId2);
        when(distribution2.getModel()).thenReturn(model2);

        result = manager.addDistributionToUnversionedRecord(distribution2,
                vf.createIRI("https://matonto.org/test/not/there"));
        assertEquals(result, false);

        conn.close();
    }

    @Test
    public void testAddDistributionToVersion() throws Exception {
        IRI distributionIRI = vf.createIRI(Version.versionedDistribution_IRI);
        Resource distributionId = vf.createIRI("https://matonto.org/distributions#test");
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        Model model = mf.createModel();
        model.add(distributionId, vf.createIRI(RDF_TYPE), vf.createIRI(Distribution.TYPE));
        model.add(distributionId, vf.createIRI(DC_TITLE), vf.createLiteral("title"), distributionId);

        Distribution distribution = mock(Distribution.class);
        when(distribution.getResource()).thenReturn(distributionId);
        when(distribution.getModel()).thenReturn(model);

        RepositoryConnection conn = repo.getConnection();

        assertEquals(conn.getStatements(distributionId, null, null, distributionId).hasNext(), false);

        boolean result = manager.addDistributionToVersion(distribution, different);
        assertEquals(result, false);

        result = manager.addDistributionToVersion(distribution, versionId);
        assertEquals(result, true);
        assertEquals(conn.getStatements(distributionId, null, null, distributionId).hasNext(), true);
        assertEquals(conn.getStatements(versionId, distributionIRI, distributionId, versionId).hasNext(), true);

        result = manager.addDistributionToVersion(distribution, versionId);
        assertEquals(result, false);

        Resource distributionId2 = vf.createIRI("https://matonto.org/distributions#test2");

        Model model2 = mf.createModel();
        model.add(distributionId2, vf.createIRI(DC_TITLE), vf.createLiteral("title"), distributionId2);

        Distribution distribution2 = mock(Distribution.class);
        when(distribution2.getResource()).thenReturn(distributionId2);
        when(distribution2.getModel()).thenReturn(model2);

        result = manager.addDistributionToVersion(distribution2, vf.createIRI("https://matonto.org/test/not/there"));
        assertEquals(result, false);

        conn.close();
    }

    @Test
    public void testUpdateDistribution() throws Exception {
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test");

        Model model = mf.createModel();
        model.add(distributionId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"));

        Distribution distribution = mock(Distribution.class);
        when(distribution.getResource()).thenReturn(distributionId);
        when(distribution.getModel()).thenReturn(model);

        RepositoryConnection conn = repo.getConnection();

        assertEquals(conn.getStatements(distributionId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"))
                .hasNext(), false);

        boolean result = manager.updateDistribution(distribution);
        assertEquals(result, true);
        assertEquals(conn.getStatements(distributionId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"),
                distributionId).hasNext(), true);

        Distribution distribution2 = mock(Distribution.class);
        when(distribution2.getResource()).thenReturn(vf.createIRI("http://matonto.org/test/distributions#not-present"));
        when(distribution2.getModel()).thenReturn(model);

        result = manager.updateDistribution(distribution2);
        assertEquals(result, false);

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
        assertEquals(result, false);

        result = manager.removeDistributionFromUnversionedRecord(distributionId2, unversionedId);
        assertEquals(result, false);

        result = manager.removeDistributionFromUnversionedRecord(distributionId, distributionId2);
        assertEquals(result, false);

        assertEquals(conn.getStatements(distributionId, null, null, distributionId).hasNext(), true);
        assertEquals(conn.getStatements(unversionedId, distributionIRI, distributionId, unversionedId).hasNext(), true);

        result = manager.removeDistributionFromUnversionedRecord(distributionId, unversionedId);

        assertEquals(result, true);
        assertEquals(conn.getStatements(distributionId, null, null, distributionId).hasNext(), false);
        assertEquals(conn.getStatements(unversionedId, distributionIRI, distributionId, unversionedId).hasNext(),
                false);

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
        assertEquals(result, false);

        result = manager.removeDistributionFromVersion(distributionId2, versionId);
        assertEquals(result, false);

        result = manager.removeDistributionFromVersion(distributionId, distributionId2);
        assertEquals(result, false);

        assertEquals(conn.getStatements(distributionId, null, null, distributionId).hasNext(), true);
        assertEquals(conn.getStatements(versionId, distributionIRI, distributionId, versionId).hasNext(), true);

        result = manager.removeDistributionFromVersion(distributionId, versionId);

        assertEquals(result, true);
        assertEquals(conn.getStatements(distributionId, null, null, distributionId).hasNext(), false);
        assertEquals(conn.getStatements(versionId, distributionIRI, distributionId, versionId).hasNext(), false);

        conn.close();
    }

    @Test
    public void testGetDistribution() throws Exception {
        Resource distributionId = vf.createIRI("http://matonto.org/test/distributions#test");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        RepositoryConnection conn = repo.getConnection();
        assertEquals(conn.getStatements(distributionId, null, null, distributionId).hasNext(), true);
        conn.close();

        Optional<Distribution> result = manager.getDistribution(different);
        assertEquals(result.isPresent(), false);

        result = manager.getDistribution(distributionId);
        assertEquals(result.isPresent(), true);
        Distribution distribution = result.get();
        assertEquals(distribution.getProperty(vf.createIRI(DC_TITLE)).isPresent(), true);
        assertEquals(distribution.getProperty(vf.createIRI(DC_TITLE)).get().stringValue(), "Distribution");
        assertEquals(distribution.getProperty(vf.createIRI(DC_ISSUED)).isPresent(), true);
        assertEquals(distribution.getProperty(vf.createIRI(DC_MODIFIED)).isPresent(), true);

        Resource notThere = vf.createIRI("http://matonto.org/test/records#not-present");

        result = manager.getDistribution(notThere);
        assertEquals(result.isPresent(), false);
    }

    @Test
    public void testAddVersion() throws Exception {
        IRI latestVersionIRI = vf.createIRI(VersionedRecord.latestVersion_IRI);
        Resource versionId = vf.createIRI("https://matonto.org/versions#test");
        Resource versionedResourceId = vf.createIRI("http://matonto.org/test/records#get");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        Model model = mf.createModel();
        model.add(versionId, vf.createIRI(DC_TITLE), vf.createLiteral("title"), versionId);

        Version version = mock(Version.class);
        when(version.getResource()).thenReturn(versionId);
        when(version.getModel()).thenReturn(model);

        RepositoryConnection conn = repo.getConnection();

        assertEquals(conn.getStatements(versionId, null, null, versionId).hasNext(), false);
        assertEquals(conn.getStatements(versionedResourceId, latestVersionIRI, null, versionedResourceId).hasNext(),
                true);
        assertEquals(conn.getStatements(versionedResourceId, latestVersionIRI, versionId, versionedResourceId)
                .hasNext(), false);

        boolean result = manager.addVersion(version, different);
        assertEquals(result, false);

        result = manager.addVersion(version, versionedResourceId);
        assertEquals(result, true);
        assertEquals(conn.getStatements(versionId, null, null, versionId).hasNext(), true);
        assertEquals(conn.getStatements(versionedResourceId, latestVersionIRI, versionId, versionedResourceId)
                .hasNext(), true);

        result = manager.addVersion(version, versionedResourceId);
        assertEquals(result, false);

        Resource versionId2 = vf.createIRI("https://matonto.org/versions#test2");

        Model model2 = mf.createModel();
        model.add(versionId2, vf.createIRI(DC_TITLE), vf.createLiteral("title"), versionId2);

        Version version2 = mock(Version.class);
        when(version2.getResource()).thenReturn(versionId2);
        when(version2.getModel()).thenReturn(model2);

        result = manager.addVersion(version2, vf.createIRI("https://matonto.org/test/not/there"));
        assertEquals(result, false);

        conn.close();
    }

    @Test
    public void testUpdateVersion() throws Exception {
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");

        Model model = mf.createModel();
        model.add(versionId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"));

        Version version = mock(Version.class);
        when(version.getResource()).thenReturn(versionId);
        when(version.getModel()).thenReturn(model);

        RepositoryConnection conn = repo.getConnection();

        assertEquals(conn.getStatements(versionId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"))
                .hasNext(), false);

        boolean result = manager.updateVersion(version);
        assertEquals(result, true);
        assertEquals(conn.getStatements(versionId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"), versionId)
                .hasNext(), true);

        Version version2 = mock(Version.class);
        when(version2.getResource()).thenReturn(vf.createIRI("http://matonto.org/test/distributions#not-present"));
        when(version2.getModel()).thenReturn(model);

        result = manager.updateVersion(version2);
        assertEquals(result, false);

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
        assertEquals(result, false);

        result = manager.removeVersion(notPresent, recordId);
        assertEquals(result, false);

        result = manager.removeVersion(versionId, notPresent);
        assertEquals(result, false);

        result = manager.removeVersion(versionId, recordId2);
        assertEquals(result, false);

        assertEquals(conn.getStatements(versionId2, null, null, versionId2).hasNext(), true);
        assertEquals(conn.getStatements(recordId, versionIRI, versionId2, recordId).hasNext(), true);
        assertEquals(conn.getStatements(recordId, latestIRI, null, recordId).hasNext(), true);
        assertEquals(conn.getStatements(recordId, latestIRI, versionId2, recordId).hasNext(), false);

        result = manager.removeVersion(versionId2, recordId);
        assertEquals(result, true);
        assertEquals(conn.getStatements(versionId2, null, null, versionId2).hasNext(), false);
        assertEquals(conn.getStatements(recordId, latestIRI, null, recordId).hasNext(), true);

        assertEquals(conn.getStatements(versionId, null, null, versionId).hasNext(), true);
        assertEquals(conn.getStatements(recordId, versionIRI, versionId, recordId).hasNext(), true);
        assertEquals(conn.getStatements(recordId, latestIRI, versionId, recordId).hasNext(), true);

        result = manager.removeVersion(versionId, recordId);
        assertEquals(result, true);
        assertEquals(conn.getStatements(versionId, null, null, versionId).hasNext(), false);
        assertEquals(conn.getStatements(recordId, latestIRI, vf.createIRI("http://matonto.org/test/versions#test2"),
                recordId).hasNext(), true);
        assertEquals(conn.getStatements(recordId, latestIRI, versionId, recordId).hasNext(), false);

        conn.close();
    }

    @Test
    public void testGetVersion() throws Exception {
        Resource versionId = vf.createIRI("http://matonto.org/test/versions#test");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        RepositoryConnection conn = repo.getConnection();
        assertEquals(conn.getStatements(versionId, null, null, versionId).hasNext(), true);
        conn.close();

        Optional<Version> result = manager.getVersion(different);
        assertEquals(result.isPresent(), false);

        result = manager.getVersion(versionId);
        assertEquals(result.isPresent(), true);
        Version version = result.get();
        assertEquals(version.getProperty(vf.createIRI(DC_TITLE)).isPresent(), true);
        assertEquals(version.getProperty(vf.createIRI(DC_TITLE)).get().stringValue(), "Version");
        assertEquals(version.getProperty(vf.createIRI(DC_ISSUED)).isPresent(), true);
        assertEquals(version.getProperty(vf.createIRI(DC_MODIFIED)).isPresent(), true);

        Resource notThere = vf.createIRI("http://matonto.org/test/records#not-present");

        result = manager.getVersion(notThere);
        assertEquals(result.isPresent(), false);
    }

    @Test
    public void testAddBranch() throws Exception {
        IRI branchIRI = vf.createIRI(VersionedRDFRecord.branch_IRI);
        Resource recordId = vf.createIRI("http://matonto.org/test/records#versionedRDF");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#new");
        Resource notPresent = vf.createIRI("http://matonto.org/test/versions#not-present");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        Model model = mf.createModel();
        model.add(branchId, vf.createIRI(DC_TITLE), vf.createLiteral("title"), branchId);

        Branch branch = mock(Branch.class);
        when(branch.getResource()).thenReturn(branchId);
        when(branch.getModel()).thenReturn(model);

        RepositoryConnection conn = repo.getConnection();

        assertEquals(conn.getStatements(branchId, null, null, branchId).hasNext(), false);

        boolean result = manager.addBranch(branch, different);
        assertEquals(result, false);

        result = manager.addBranch(branch, notPresent);
        assertEquals(result, false);

        result = manager.addBranch(branch, recordId);
        assertEquals(result, true);
        assertEquals(conn.getStatements(branchId, null, null, branchId).hasNext(), true);
        assertEquals(conn.getStatements(recordId, branchIRI, branchId, recordId).hasNext(), true);

        result = manager.addBranch(branch, recordId);
        assertEquals(result, false);

        conn.close();
    }

    @Test
    public void testUpdateBranch() throws Exception {
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");

        Model model = mf.createModel();
        model.add(branchId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"));

        Branch branch = mock(Branch.class);
        when(branch.getResource()).thenReturn(branchId);
        when(branch.getModel()).thenReturn(model);

        RepositoryConnection conn = repo.getConnection();

        assertEquals(conn.getStatements(branchId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"), branchId)
                .hasNext(), false);

        boolean result = manager.updateBranch(branch);
        assertEquals(result, true);
        assertEquals(conn.getStatements(branchId, vf.createIRI(DC_TITLE), vf.createLiteral("New Title"), branchId)
                .hasNext(), true);

        Branch branch2 = mock(Branch.class);
        when(branch2.getResource()).thenReturn(vf.createIRI("http://matonto.org/test/distributions#not-present"));
        when(branch2.getModel()).thenReturn(model);

        result = manager.updateBranch(branch2);
        assertEquals(result, false);

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
        assertEquals(result, false);

        result = manager.removeBranch(notPresent, recordId);
        assertEquals(result, false);

        result = manager.removeBranch(branchId, notPresent);
        assertEquals(result, false);

        assertEquals(conn.getStatements(branchId, null, null, branchId).hasNext(), true);
        assertEquals(conn.getStatements(recordId, branchIRI, branchId, recordId).hasNext(), true);

        result = manager.removeBranch(branchId, recordId);
        assertEquals(result, true);
        assertEquals(conn.getStatements(branchId, null, null, branchId).hasNext(), false);
        assertEquals(conn.getStatements(recordId, branchIRI, branchId, recordId).hasNext(), false);

        conn.close();
    }

    @Test
    public void testGetBranch() throws Exception {
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        RepositoryConnection conn = repo.getConnection();
        assertEquals(conn.getStatements(branchId, null, null, branchId).hasNext(), true);
        conn.close();

        Optional<Branch> result = manager.getBranch(different);
        assertEquals(result.isPresent(), false);

        result = manager.getBranch(branchId);
        assertEquals(result.isPresent(), true);
        Branch branch = result.get();
        assertEquals(branch.getProperty(vf.createIRI(DC_TITLE)).isPresent(), true);
        assertEquals(branch.getProperty(vf.createIRI(DC_TITLE)).get().stringValue(), "Branch");
        assertEquals(branch.getProperty(vf.createIRI(DC_ISSUED)).isPresent(), true);
        assertEquals(branch.getProperty(vf.createIRI(DC_MODIFIED)).isPresent(), true);

        Resource notThere = vf.createIRI("http://matonto.org/test/records#not-present");

        result = manager.getBranch(notThere);
        assertEquals(result.isPresent(), false);
    }

    @Test
    public void testCreateCommit() throws Exception {
        IRI dummyId = vf.createIRI("https://matonto.org/dummy");
        IRI revisionId = vf.createIRI("https://matonto.org/revision");
        IRI predicate = vf.createIRI("https://matonto.org/predicate");
        IRI generated = vf.createIRI("https://matonto.org/generated");
        Set<Value> parents = Stream.of(vf.createIRI("https://matonto.org/parent"),
                vf.createIRI("https://matonto.org/parent2")).collect(Collectors.toSet());
        Model model = mf.createModel();
        model.add(dummyId, predicate, vf.createBNode());
        model.add(revisionId, predicate, vf.createBNode());

        InProgressCommit inProgressCommit = mock(InProgressCommit.class);
        when(inProgressCommit.getResource()).thenReturn(dummyId);
        when(inProgressCommit.getProperty((IRI)notNull())).thenReturn(Optional.of(generated));
        when(inProgressCommit.getProperties((IRI)notNull())).thenReturn(parents);
        when(inProgressCommit.getModel()).thenReturn(model);

        Commit result = manager.createCommit(inProgressCommit, "message");
        assertEquals(result.getProperty(vf.createIRI(PROV_AT_TIME)).isPresent(), true);
        assertEquals(result.getProperty(vf.createIRI(DC_TITLE)).get().stringValue(), "message");
        assertEquals(result.getProperties(vf.createIRI(PROV_WAS_INFORMED_BY)).size(), 2);
        result.getProperties(vf.createIRI(PROV_WAS_INFORMED_BY)).forEach(parents::contains);
        assertEquals(result.getModel().contains(revisionId, null, null), true);
        assertEquals(result.getModel().contains(dummyId, null, null), false);

        when(inProgressCommit.getProperties((IRI)notNull())).thenReturn(Collections.emptySet());

        result = manager.createCommit(inProgressCommit, "message");
        assertEquals(result.getProperty(vf.createIRI(PROV_AT_TIME)).isPresent(), true);
        assertEquals(result.getProperty(vf.createIRI(DC_TITLE)).get().stringValue(), "message");
        assertEquals(result.getProperties(vf.createIRI(PROV_WAS_INFORMED_BY)).size(), 0);
        assertEquals(result.getModel().contains(revisionId, null, null), true);
        assertEquals(result.getModel().contains(dummyId, null, null), false);
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

        User user = mock(User.class);
        when(user.getResource()).thenReturn(vf.createIRI("http://matonto.org/test/user"));

        Resource notPresent = vf.createIRI("http://matonto.org/test/distributions#not-present");

        Optional<InProgressCommit> result = manager.createInProgressCommit(parents, user, notPresent);
        assertEquals(result.isPresent(), false);

        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");

        result = manager.createInProgressCommit(parents, user, branchId);
        assertEquals(result.isPresent(), true);
        InProgressCommit inProgressCommit = result.get();
        assertEquals(inProgressCommit.getProperty(vf.createIRI(PROV_WAS_ASSOCIATED_WITH)).get().stringValue(),
                user.getResource().stringValue());
        assertEquals(inProgressCommit.getProperty(vf.createIRI(PROV_GENERATED)).isPresent(), true);
        inProgressCommit.getProperties(vf.createIRI(PROV_WAS_INFORMED_BY)).forEach(property ->
                assertEquals(parents.stream().map(Commit::getResource).collect(Collectors.toSet())
                        .contains((Resource)property), true));
        assertEquals(inProgressCommit.getOnBranch().get().getResource().stringValue(), branchId.stringValue());

        String uuid = StringUtils.remove(inProgressCommit.getResource().stringValue(), IN_PROGRESS_COMMIT_NAMESPACE);
        Revision revision = revisionFactory.createNew(vf.createIRI(REVISION_NAMESPACE + uuid),
                inProgressCommit.getModel());
        assertEquals(revision.getAdditions().isPresent(), true);
        assertEquals(revision.getDeletions().isPresent(), true);
        Set<Resource> generations = Stream.of(generation, generation2).collect(Collectors.toSet());
        revision.getProperties(vf.createIRI(PROV_WAS_DERIVED_FROM)).forEach(property ->
            assertEquals(generations.contains(property), true));

        result = manager.createInProgressCommit(null, user, branchId);
        assertEquals(result.isPresent(), true);
        inProgressCommit = result.get();
        assertEquals(inProgressCommit.getProperty(vf.createIRI(PROV_WAS_ASSOCIATED_WITH)).get().stringValue(),
                user.getResource().stringValue());
        assertEquals(inProgressCommit.getProperty(vf.createIRI(PROV_GENERATED)).isPresent(), true);
        assertEquals(inProgressCommit.getProperty(vf.createIRI(PROV_WAS_INFORMED_BY)).isPresent(), false);
        assertEquals(inProgressCommit.getOnBranch().get().getResource().stringValue(), branchId.stringValue());

        uuid = StringUtils.remove(inProgressCommit.getResource().stringValue(), IN_PROGRESS_COMMIT_NAMESPACE);
        revision = revisionFactory.createNew(vf.createIRI(REVISION_NAMESPACE + uuid),
                inProgressCommit.getModel());
        assertEquals(revision.getAdditions().isPresent(), true);
        assertEquals(revision.getDeletions().isPresent(), true);
        assertEquals(revision.getProperty(vf.createIRI(PROV_WAS_DERIVED_FROM)).isPresent(), false);
    }

    @Test
    public void testAddAdditions() throws Exception {
        Resource commitId = vf.createIRI("http://matonto.org/test/commits#test");
        Resource additionId = vf.createIRI("http://matonto.org/test/additions#test");
        Resource deletionId = vf.createIRI("http://matonto.org/test/deletions#test");
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
        assertEquals(result, false);

        result = manager.addAdditions(model, commitId);
        assertEquals(result, true);
        RepositoryResult<Statement> statements = conn.getStatements(null, null, null, additionId);

        while (statements.hasNext()) {
            statement = statements.next();
            assertEquals(expected.contains(statement.getSubject(), statement.getPredicate(), statement.getObject()),
                    true);
        }

        statements = conn.getStatements(null, null, null, deletionId);
        assertEquals(statements.hasNext(), false);

        result = manager.addAdditions(model, vf.createIRI("https://matonto.org/test/not/there"));
        assertEquals(result, false);

        conn.close();
    }

    @Test
    public void testAddDeletions() throws Exception {
        Resource commitId = vf.createIRI("http://matonto.org/test/commits#test");
        Resource additionId = vf.createIRI("http://matonto.org/test/additions#test");
        Resource deletionId = vf.createIRI("http://matonto.org/test/deletions#test");
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
        assertEquals(result, false);

        result = manager.addDeletions(model, commitId);
        assertEquals(result, true);
        RepositoryResult<Statement> statements = conn.getStatements(null, null, null, deletionId);

        while (statements.hasNext()) {
            statement = statements.next();
            assertEquals(expected.contains(statement.getSubject(), statement.getPredicate(), statement.getObject()),
                    true);
        }

        statements = conn.getStatements(null, null, null, additionId);
        assertEquals(statements.hasNext(), false);

        result = manager.addDeletions(model, vf.createIRI("https://matonto.org/test/not/there"));
        assertEquals(result, false);

        conn.close();
    }

    @Test
    public void testAddCommitToBranch() throws Exception {
        IRI headIRI = vf.createIRI(Branch.head_IRI);
        Resource commitId = vf.createIRI("https://matonto.org/commits#test");
        Resource branchId = vf.createIRI("http://matonto.org/test/branches#test");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        Model model = mf.createModel();
        model.add(commitId, vf.createIRI(DC_TITLE), vf.createLiteral("title"), commitId);

        Commit commit = mock(Commit.class);
        when(commit.getResource()).thenReturn(commitId);
        when(commit.getModel()).thenReturn(model);

        RepositoryConnection conn = repo.getConnection();

        assertEquals(conn.getStatements(commitId, null, null, commitId).hasNext(), false);

        boolean result = manager.addCommitToBranch(commit, vf.createIRI("https://matonto.org/test/not/there"));
        assertEquals(result, false);

        result = manager.addCommitToBranch(commit, different);
        assertEquals(result, false);

        result = manager.addCommitToBranch(commit, branchId);
        assertEquals(result, true);
        assertEquals(conn.getStatements(commitId, null, null, commitId).hasNext(), true);
        assertEquals(conn.getStatements(branchId, headIRI, commitId, branchId).hasNext(), true);

        result = manager.addCommitToBranch(commit, branchId);
        assertEquals(result, false);

        conn.close();
    }

    @Test
    public void testAddCommitToTag() throws Exception {
        IRI commitIRI = vf.createIRI(Tag.commit_IRI);
        Resource commitId = vf.createIRI("https://matonto.org/commits#test");
        Resource tagId = vf.createIRI("http://matonto.org/test/tags#test");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        Model model = mf.createModel();
        model.add(commitId, vf.createIRI(DC_TITLE), vf.createLiteral("title"), commitId);

        Commit commit = mock(Commit.class);
        when(commit.getResource()).thenReturn(commitId);
        when(commit.getModel()).thenReturn(model);

        RepositoryConnection conn = repo.getConnection();

        assertEquals(conn.getStatements(commitId, null, null, commitId).hasNext(), false);

        boolean result = manager.addCommitToTag(commit, vf.createIRI("https://matonto.org/test/not/there"));
        assertEquals(result, false);

        result = manager.addCommitToTag(commit, different);
        assertEquals(result, false);

        result = manager.addCommitToTag(commit, tagId);
        assertEquals(result, true);
        assertEquals(conn.getStatements(commitId, null, null, commitId).hasNext(), true);
        assertEquals(conn.getStatements(tagId, commitIRI, commitId, tagId).hasNext(), true);

        result = manager.addCommitToTag(commit, tagId);
        assertEquals(result, false);

        conn.close();
    }

    @Test
    public void testAddInProgressCommit() throws Exception {
        Resource inProgressCommitId = vf.createIRI("https://matonto.org/in-progress-commits#test");

        Model model = mf.createModel();
        model.add(inProgressCommitId, vf.createIRI(DC_TITLE), vf.createLiteral("title"), inProgressCommitId);

        InProgressCommit inProgressCommit = mock(InProgressCommit.class);
        when(inProgressCommit.getResource()).thenReturn(inProgressCommitId);
        when(inProgressCommit.getModel()).thenReturn(model);

        RepositoryConnection conn = repo.getConnection();

        assertEquals(conn.getStatements(inProgressCommitId, null, null, inProgressCommitId)
                .hasNext(), false);

        boolean result = manager.addInProgressCommit(inProgressCommit);
        assertEquals(result, true);
        assertEquals(conn.getStatements(inProgressCommitId, null, null, inProgressCommitId)
                .hasNext(), true);

        result = manager.addInProgressCommit(inProgressCommit);
        assertEquals(result, false);

        conn.close();
    }

    @Test
    public void testGetCommit() throws Exception {
        Resource commitId = vf.createIRI("http://matonto.org/test/commits#test");
        String revisionIRI = "http://matonto.org/test/revisions#revision";
        Resource different = vf.createIRI("http://matonto.org/test/different");

        RepositoryConnection conn = repo.getConnection();
        assertEquals(conn.getStatements(commitId, null, null, commitId).hasNext(), true);
        conn.close();

        Optional<Commit> result = manager.getCommit(different);
        assertEquals(result.isPresent(), false);

        result = manager.getCommit(commitId);
        assertEquals(result.isPresent(), true);
        Commit commit = result.get();
        assertEquals(commit.getProperty(vf.createIRI(DC_TITLE)).isPresent(), true);
        assertEquals(commit.getProperty(vf.createIRI(DC_TITLE)).get().stringValue(), "Commit");
        assertEquals(commit.getProperty(vf.createIRI(PROV_AT_TIME)).isPresent(), true);
        assertEquals(commit.getProperty(vf.createIRI(PROV_GENERATED)).isPresent(), true);
        assertEquals(commit.getProperty(vf.createIRI(PROV_GENERATED)).get().stringValue(), revisionIRI);

        Revision revision = revisionFactory.createNew(vf.createIRI(revisionIRI), commit.getModel());
        assertEquals(revision.getAdditions().isPresent(), true);
        assertEquals(revision.getDeletions().isPresent(), true);

        Resource notThere = vf.createIRI("http://matonto.org/test/records#not-present");

        result = manager.getCommit(notThere);
        assertEquals(result.isPresent(), false);
    }

    @Test
    public void testRemoveInProgressCommit() throws Exception {
        Resource inProgressCommitId = vf.createIRI("http://matonto.org/test/in-progress-commits#test");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        RepositoryConnection conn = repo.getConnection();

        assertEquals(conn.getStatements(inProgressCommitId, null, null, inProgressCommitId).hasNext(), true);

        boolean result = manager.removeInProgressCommit(different);
        assertEquals(result, false);

        result = manager.removeInProgressCommit(inProgressCommitId);
        assertEquals(result, true);
        assertEquals(conn.getStatements(inProgressCommitId, null, null, inProgressCommitId).hasNext(), false);

        Resource notPresent = vf.createIRI("http://matonto.org/test/records#not-present");

        result = manager.removeInProgressCommit(notPresent);
        assertEquals(result, false);

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
        result.forEach(item -> assertEquals(expect.contains(item), true));
    }

    @Test
    public void testGetCompiledResource() throws Exception {
        Resource commit0Id = vf.createIRI("http://matonto.org/test/commits#test0");
        Resource commit3Id = vf.createIRI("http://matonto.org/test/commits#test3");
        Resource notThere = vf.createIRI("http://matonto.org/test/records#not-present");
        Resource different = vf.createIRI("http://matonto.org/test/different");

        Optional<Model> result = manager.getCompiledResource(different);
        assertEquals(result.isPresent(), false);

        result = manager.getCompiledResource(notThere);
        assertEquals(result.isPresent(), false);

        Resource ontologyId = vf.createIRI("http://matonto.org/test/ontology");
        Model expected = mf.createModel();
        expected.add(ontologyId, vf.createIRI(RDF_TYPE), vf.createIRI("http://www.w3.org/2002/07/owl#Ontology"));
        expected.add(ontologyId, vf.createIRI(DC_TITLE), vf.createLiteral("Test 0 Title"));
        expected.add(vf.createIRI("http://matonto.org/test/class0"), vf.createIRI(RDF_TYPE),
                vf.createIRI("http://www.w3.org/2002/07/owl#Class"));

        result = manager.getCompiledResource(commit0Id);
        assertEquals(result.isPresent(), true);
        result.get().forEach(statement -> assertEquals(expected.contains(statement.getSubject(),
                statement.getPredicate(), statement.getObject()), true));

        Model expected2 = mf.createModel();
        expected2.add(ontologyId, vf.createIRI(RDF_TYPE), vf.createIRI("http://www.w3.org/2002/07/owl#Ontology"));
        expected2.add(ontologyId, vf.createIRI(DC_TITLE), vf.createLiteral("Test 3 Title"));
        expected2.add(vf.createIRI("http://matonto.org/test/class0"), vf.createIRI(RDF_TYPE),
                vf.createIRI("http://www.w3.org/2002/07/owl#Class"));
        result = manager.getCompiledResource(commit3Id);
        result.get().forEach(statement -> assertEquals(expected2.contains(statement.getSubject(),
                statement.getPredicate(), statement.getObject()), true));
    }

    @Test
    public void testGetConflictsScenario1() throws Exception {
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
    public void testGetConflictsScenario2() throws Exception {
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
    public void testGetConflictsScenario3() throws Exception {
        // Second chain has two commits which adds then removes something
        Resource leftId = vf.createIRI("http://matonto.org/test/commits#conflict1-3");
        Resource rightId = vf.createIRI("http://matonto.org/test/commits#conflict3-3");

        Set<Conflict> result = manager.getConflicts(leftId, rightId);
        assertEquals(result.size(), 0);
    }

    @Test
    public void testGetConflictsScenario4() throws Exception {
        // Change a property on one branch
        Resource leftId = vf.createIRI("http://matonto.org/test/commits#conflict1-4");
        Resource rightId = vf.createIRI("http://matonto.org/test/commits#conflict2-4");

        Set<Conflict> result = manager.getConflicts(leftId, rightId);
        assertEquals(result.size(), 0);
    }

    @Test
    public void testGetConflictsScenario5() throws Exception {
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
}
