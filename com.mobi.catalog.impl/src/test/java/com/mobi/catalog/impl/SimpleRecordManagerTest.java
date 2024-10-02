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
import static junit.framework.TestCase.assertNotSame;
import static junit.framework.TestCase.assertTrue;
import static junit.framework.TestCase.fail;
import static org.junit.Assert.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.PaginatedSearchParams;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.catalog.api.ThingManager;
import com.mobi.catalog.api.builder.KeywordCount;
import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.ontologies.mcat.UnversionedRecord;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.ontologies.mcat.VersionedRecord;
import com.mobi.catalog.api.record.EntityMetadata;
import com.mobi.catalog.api.record.RecordService;
import com.mobi.catalog.api.record.config.OperationConfig;
import com.mobi.catalog.api.record.config.RecordCreateSettings;
import com.mobi.catalog.api.record.config.RecordExportSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.persistence.utils.BatchExporter;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.security.policy.api.PDP;
import com.mobi.security.policy.api.Request;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.query.MalformedQueryException;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class SimpleRecordManagerTest extends OrmEnabledTestCase {
    private AutoCloseable closeable;
    private MemoryRepositoryWrapper repo;
    private SimpleRecordManager manager;
    private final OrmFactory<Record> recordFactory = getRequiredOrmFactory(Record.class);
    private final OrmFactory<UnversionedRecord> unversionedRecordFactory = getRequiredOrmFactory(UnversionedRecord.class);
    private final OrmFactory<VersionedRecord> versionedRecordFactory = getRequiredOrmFactory(VersionedRecord.class);
    private final OrmFactory<VersionedRDFRecord> versionedRDFRecordFactory = getRequiredOrmFactory(VersionedRDFRecord.class);
    private final OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
    private final OrmFactory<Catalog> catalogFactory = getRequiredOrmFactory(Catalog.class);
    private static final IRI RECORD_NO_CATALOG_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/records#record-no-catalog");
    private static final int TOTAL_SIZE = 11;

    @Rule
    public ExpectedException thrown = ExpectedException.none();

    @Mock
    CatalogConfigProvider configProvider;

    @Mock
    private PDP pdp;

    @Mock
    private RecordService<Record> recordService;

    @Mock
    private RecordService<VersionedRDFRecord> versionedRDFRecordService;

    @Mock
    private RecordService<VersionedRecord> versionedRecordService;

    @Mock
    private RecordService<UnversionedRecord> unversionedRecordService;

    @Mock
    private User user;

    @Mock
    private Request request;

    @Mock
    private BatchExporter exporter;

    private ThingManager thingManager;

    @Before
    public void setup() throws Exception {
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));
        closeable = MockitoAnnotations.openMocks(this);
        
        when(configProvider.getRepository()).thenReturn(repo);
        when(configProvider.getLocalCatalogIRI()).thenReturn(ManagerTestConstants.CATALOG_IRI);
        when(configProvider.getDistributedCatalogIRI()).thenReturn(ManagerTestConstants.CATALOG_DISTRIBUTED_IRI);

        when(recordService.getTypeIRI()).thenReturn(Record.TYPE);
        when(versionedRDFRecordService.getTypeIRI()).thenReturn(VersionedRDFRecord.TYPE);
        when(versionedRecordService.getTypeIRI()).thenReturn(VersionedRecord.TYPE);
        when(unversionedRecordService.getTypeIRI()).thenReturn(UnversionedRecord.TYPE);
        when(recordService.getType()).thenReturn(Record.class);
        when(versionedRDFRecordService.getType()).thenReturn(VersionedRDFRecord.class);
        when(versionedRecordService.getType()).thenReturn(VersionedRecord.class);
        when(unversionedRecordService.getType()).thenReturn(UnversionedRecord.class);
        when(exporter.isActive()).thenReturn(false);

        thingManager = spy(new SimpleThingManager());
        manager = spy(new SimpleRecordManager());
        injectOrmFactoryReferencesIntoService(manager);
        manager.thingManager = thingManager;
        manager.pdp = pdp;
        manager.addRecordService(versionedRDFRecordService);
        manager.addRecordService(recordService);
        manager.addRecordService(versionedRecordService);
        manager.addRecordService(unversionedRecordService);

        manager.start();
        manager.factoryRegistry = ORM_FACTORY_REGISTRY;
    }

    @After
    public void tearDown() throws Exception {
        repo.shutDown();
        closeable.close();
    }

    /* findRecords */

    @Test
    public void testFindRecordsReturnsCorrectDataFirstPage() throws Exception {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        // Setup:
        int limit = 1;
        int offset = 0;
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().limit(limit).offset(offset).build();

        try (RepositoryConnection conn = repo.getConnection()) {
            // when
            PaginatedSearchResults<Record> records = manager.findRecord(ManagerTestConstants.CATALOG_IRI, searchParams, conn);

            // then
            assertEquals(1, records.getPage().size());
            assertEquals(TOTAL_SIZE, records.getTotalSize());
            assertEquals(1, records.getPageSize());
            assertEquals(1, records.getPageNumber());
        }
    }

    @Test
    public void testFindRecordsReturnsCorrectDataKeywordFirstPage() throws Exception {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        // Setup:
        int limit = 1;
        int offset = 0;
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder()
                .limit(limit)
                .offset(offset).keywords(Collections.singletonList("111")).build();

        try (RepositoryConnection conn = repo.getConnection()) {
            // when
            PaginatedSearchResults<Record> records = manager.findRecord(ManagerTestConstants.CATALOG_IRI, searchParams, conn);

            // then
            assertEquals(1, records.getPage().size());
            assertEquals(2, records.getTotalSize());
            assertEquals(1, records.getPageSize());
            assertEquals(1, records.getPageNumber());
        }
    }

    @Test
    public void testFindRecordsReturnsCorrectDataCreatorFirstPage() throws Exception {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        // Setup:
        int limit = 1;
        int offset = 0;
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder()
                .limit(limit)
                .offset(offset).creators(Collections.singletonList(ManagerTestConstants.USER_IRI)).build();

        try (RepositoryConnection conn = repo.getConnection()) {
            // when
            PaginatedSearchResults<Record> records = manager.findRecord(ManagerTestConstants.CATALOG_IRI, searchParams, conn);

            // then
            assertEquals(1, records.getPage().size());
            assertEquals(2, records.getTotalSize());
            assertEquals(1, records.getPageSize());
            assertEquals(1, records.getPageNumber());
        }
    }

    @Test
    public void testFindRecordsReturnsCorrectDataSecondPage() throws Exception {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        // Setup:
        int limit = 1;
        int offset = 1;
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().limit(limit).offset(offset).build();

        try (RepositoryConnection conn = repo.getConnection()) {
            // when
            PaginatedSearchResults<Record> records = manager.findRecord(ManagerTestConstants.CATALOG_IRI, searchParams, conn);

            // then
            assertEquals(1, records.getPage().size());
            assertEquals(TOTAL_SIZE, records.getTotalSize());
            assertEquals(1, records.getPageSize());
            assertEquals(2, records.getPageNumber());
        }
    }

    @Test
    public void testFindRecordsReturnsCorrectDataKeywordSecondPage() throws Exception {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        // Setup:
        int limit = 1;
        int offset = 1;
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder()
                .limit(limit)
                .offset(offset).keywords(Collections.singletonList("111")).build();

        try (RepositoryConnection conn = repo.getConnection()) {
            // when
            PaginatedSearchResults<Record> records = manager.findRecord(ManagerTestConstants.CATALOG_IRI, searchParams, conn);

            // then
            assertEquals(1, records.getPage().size());
            assertEquals(2, records.getTotalSize());
            assertEquals(1, records.getPageSize());
            assertEquals(2, records.getPageNumber());
        }
    }

    @Test
    public void testFindRecordsReturnsCorrectDataCreatorSecondPage() throws Exception {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        // Setup:
        int limit = 1;
        int offset = 1;
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder()
                .limit(limit)
                .offset(offset).creators(Collections.singletonList(ManagerTestConstants.USER_IRI)).build();

        try (RepositoryConnection conn = repo.getConnection()) {
            // when
            PaginatedSearchResults<Record> records = manager.findRecord(ManagerTestConstants.CATALOG_IRI, searchParams, conn);

            // then
            assertEquals(1, records.getPage().size());
            assertEquals(2, records.getTotalSize());
            assertEquals(1, records.getPageSize());
            assertEquals(2, records.getPageNumber());
        }
    }

    @Test
    public void testFindRecordsReturnsCorrectDataOnePage() throws Exception {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        // Setup:
        int limit = 1000;
        int offset = 0;
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().limit(limit).offset(offset).build();

        try (RepositoryConnection conn = repo.getConnection()) {
            // when
            PaginatedSearchResults<Record> records = manager.findRecord(ManagerTestConstants.CATALOG_IRI, searchParams, conn);

            // then
            assertEquals(TOTAL_SIZE, records.getPage().size());
            assertEquals(TOTAL_SIZE, records.getTotalSize());
            assertEquals(1000, records.getPageSize());
            assertEquals(1, records.getPageNumber());
        }
    }

    @Test
    public void testFindRecordsWithPolicyCheck() throws Exception {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        // Setup:
        int limit = 1000;
        int offset = 0;

        String complexRecordIRIString = "http://mobi.com/test/records#complex-record";
        String complexVersionedRdfRecordIRIString = "http://mobi.com/test/records#quad-versioned-rdf-record";

        when(user.getResource()).thenReturn(VALUE_FACTORY.createIRI("http://mobi.com/theUser"));
        when(pdp.createRequest(any(), any(), any(), any(), any(), any())).thenReturn(request);
        when(pdp.filter(any(), any(IRI.class))).thenReturn(new HashSet<>(Arrays.asList(complexRecordIRIString,
                complexVersionedRdfRecordIRIString)));

        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().limit(limit).offset(offset).build();

        try (RepositoryConnection conn = repo.getConnection()) {
            // when
            PaginatedSearchResults<Record> records = manager.findRecord(ManagerTestConstants.CATALOG_IRI, searchParams, user, conn);

            // then
            assertEquals(2, records.getPage().size());
            assertEquals(2, records.getTotalSize());
            assertEquals(1000, records.getPageSize());
            assertEquals(1, records.getPageNumber());
        }
    }

    @Test
    public void testFindRecordsWithPolicyCheckMultiplePages() throws Exception {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        // Setup:
        int limit = 1;
        int offset = 0;

        String complexRecordIRIString = "http://mobi.com/test/records#complex-record";
        String complexVersionedRdfRecordIRIString = "http://mobi.com/test/records#quad-versioned-rdf-record";

        when(user.getResource()).thenReturn(VALUE_FACTORY.createIRI("http://mobi.com/theUser"));
        when(pdp.createRequest(any(), any(), any(), any(), any(), any())).thenReturn(request);
        when(pdp.filter(any(), any(IRI.class))).thenReturn(new HashSet<>(Arrays.asList(complexRecordIRIString,
                complexVersionedRdfRecordIRIString)));

        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().limit(limit).offset(offset).build();

        try (RepositoryConnection conn = repo.getConnection()) {
            // when
            PaginatedSearchResults<Record> records = manager.findRecord(ManagerTestConstants.CATALOG_IRI, searchParams, user, conn);

            // then
            assertEquals(1, records.getPage().size());
            assertEquals(2, records.getTotalSize());
            assertEquals(1, records.getPageSize());
            assertEquals(1, records.getPageNumber());
        }

        PaginatedSearchParams pageTwoSearchParams = new PaginatedSearchParams.Builder().limit(limit).offset(1)
                .build();

        try (RepositoryConnection conn = repo.getConnection()) {
            // when
            PaginatedSearchResults<Record> pageTwoRecords = manager.findRecord(ManagerTestConstants.CATALOG_IRI, pageTwoSearchParams,
                    user, conn);

            // then
            assertEquals(1, pageTwoRecords.getPage().size());
            assertEquals(2, pageTwoRecords.getTotalSize());
            assertEquals(1, pageTwoRecords.getPageSize());
            assertEquals(2, pageTwoRecords.getPageNumber());
        }
    }

    @Test
    public void testFindRecordsWithPolicyCheckNoAllowedRecords() throws Exception {
        // Setup:
        int limit = 1000;
        int offset = 0;

        when(user.getResource()).thenReturn(VALUE_FACTORY.createIRI("http://mobi.com/theUser"));
        when(pdp.createRequest(any(), any(), any(), any(), any(), any())).thenReturn(request);
        when(pdp.filter(any(), any(IRI.class))).thenReturn(new HashSet<>());

        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().limit(limit).offset(offset).build();

        try (RepositoryConnection conn = repo.getConnection()) {
            // when
            PaginatedSearchResults<Record> records = manager.findRecord(ManagerTestConstants.CATALOG_IRI, searchParams, user, conn);

            // then
            assertEquals(0, records.getPage().size());
            assertEquals(0, records.getTotalSize());
            assertEquals(0, records.getPageSize());
            assertEquals(0, records.getPageNumber());
        }
    }

    @Test
    public void testFindRecordsOrdering() throws Exception {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        // Setup:
        int limit = 1;
        int offset = 0;
        PaginatedSearchParams searchParams1 = new PaginatedSearchParams.Builder().limit(limit).offset(offset).sortBy(DCTERMS.MODIFIED).ascending(true).build();
        PaginatedSearchParams searchParams2 = new PaginatedSearchParams.Builder().limit(limit).offset(offset).sortBy(DCTERMS.MODIFIED).ascending(false).build();
        PaginatedSearchParams searchParams3 = new PaginatedSearchParams.Builder().limit(limit).offset(offset).sortBy(DCTERMS.ISSUED).ascending(true).build();
        PaginatedSearchParams searchParams4 = new PaginatedSearchParams.Builder().limit(limit).offset(offset).sortBy(DCTERMS.ISSUED).ascending(false).build();
        PaginatedSearchParams searchParams5 = new PaginatedSearchParams.Builder().limit(limit).offset(offset).sortBy(DCTERMS.TITLE).ascending(true).build();
        PaginatedSearchParams searchParams6 = new PaginatedSearchParams.Builder().limit(limit).offset(offset).sortBy(DCTERMS.TITLE).ascending(false).build();

        try (RepositoryConnection conn = repo.getConnection()) {
            // when
            PaginatedSearchResults<Record> resources1 = manager.findRecord(ManagerTestConstants.CATALOG_IRI, searchParams1, conn);
            PaginatedSearchResults<Record> resources2 = manager.findRecord(ManagerTestConstants.CATALOG_IRI, searchParams2, conn);
            PaginatedSearchResults<Record> resources3 = manager.findRecord(ManagerTestConstants.CATALOG_IRI, searchParams3, conn);
            PaginatedSearchResults<Record> resources4 = manager.findRecord(ManagerTestConstants.CATALOG_IRI, searchParams4, conn);
            PaginatedSearchResults<Record> resources5 = manager.findRecord(ManagerTestConstants.CATALOG_IRI, searchParams5, conn);
            PaginatedSearchResults<Record> resources6 = manager.findRecord(ManagerTestConstants.CATALOG_IRI, searchParams6, conn);

            // then
            verify(manager, atLeastOnce()).getRecord(eq(ManagerTestConstants.CATALOG_IRI), any(Resource.class), eq(recordFactory), any(RepositoryConnection.class));
            assertEquals(ManagerTestConstants.RECORD_IRI, resources1.getPage().iterator().next().getResource());
            assertEquals(VALUE_FACTORY.createIRI(ManagerTestConstants.RECORDS + "complex-record"), resources2.getPage().iterator().next().getResource());
            assertEquals(ManagerTestConstants.UNVERSIONED_RECORD_IRI, resources3.getPage().iterator().next().getResource());
            assertEquals(VALUE_FACTORY.createIRI(ManagerTestConstants.RECORDS + "complex-record"), resources4.getPage().iterator().next().getResource());
            assertEquals(VALUE_FACTORY.createIRI(ManagerTestConstants.RECORDS + "complex-record"), resources5.getPage().iterator().next().getResource());
            assertEquals(resources6.getPage().iterator().next().getResource().stringValue(), "http://mobi.com/test/records#versioned-record-missing-version");
        }
    }

    @Test
    public void testFindRecordsWithSearchText() throws Exception {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        // given
        int limit = 10;
        int offset = 0;
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().limit(limit).offset(offset).searchText("Unversioned").build();

        try (RepositoryConnection conn = repo.getConnection()) {
            // when
            PaginatedSearchResults<Record> records = manager.findRecord(ManagerTestConstants.CATALOG_IRI, searchParams, conn);
            // then
            assertEquals(2, records.getPage().size());
            assertEquals(2, records.getTotalSize());
            assertEquals(10, records.getPageSize());
            assertEquals(1, records.getPageNumber());
        }
    }

    @Test
    public void testFindRecordsWithSearchTextKeyword() throws Exception {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        // given
        int limit = 10;
        int offset = 0;
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().limit(limit).offset(offset)
                .searchText("Unversioned").keywords(Collections.singletonList("111")).build();

        try (RepositoryConnection conn = repo.getConnection()) {
            // when
            PaginatedSearchResults<Record> records = manager.findRecord(ManagerTestConstants.CATALOG_IRI, searchParams, conn);
            // then
            assertEquals(1, records.getPage().size());
            assertEquals(1, records.getTotalSize());
            assertEquals(10, records.getPageSize());
            assertEquals(1, records.getPageNumber());
        }
    }

    @Test
    public void testFindRecordsWithSearchTextCreator() throws Exception {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        // given
        int limit = 10;
        int offset = 0;
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().limit(limit).offset(offset)
                .searchText("Versioned").creators(Collections.singletonList(ManagerTestConstants.USER_IRI)).build();

        try (RepositoryConnection conn = repo.getConnection()) {
            // when
            PaginatedSearchResults<Record> records = manager.findRecord(ManagerTestConstants.CATALOG_IRI, searchParams, conn);
            // then
            assertEquals(1, records.getPage().size());
            assertEquals(1, records.getTotalSize());
            assertEquals(10, records.getPageSize());
            assertEquals(1, records.getPageNumber());
        }
    }

    @Test
    public void testFindRecordWithEmptyRepository() throws Exception {
        // Setup:
        MemoryRepositoryWrapper repo2 = new MemoryRepositoryWrapper();
        repo2.setDelegate(new SailRepository(new MemoryStore()));
        when(configProvider.getRepository()).thenReturn(repo2);
        int limit = 1;
        int offset = 0;
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().limit(limit).offset(offset).build();

        try (RepositoryConnection conn = repo2.getConnection()) {
            // when
            PaginatedSearchResults<Record> records = manager.findRecord(ManagerTestConstants.CATALOG_IRI, searchParams, conn);

            // then
            assertEquals(0, records.getPage().size());
            assertEquals(0, records.getTotalSize());
        }
    }

    @Test
    public void testFindRecordWithNoEntries() throws Exception {
        // Setup:
        int limit = 1;
        int offset = 0;
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().limit(limit).offset(offset).build();

        try (RepositoryConnection conn = repo.getConnection()) {
            // when
            PaginatedSearchResults<Record> records = manager.findRecord(ManagerTestConstants.CATALOG_DISTRIBUTED_IRI, searchParams, conn);

            // then
            assertEquals(0, records.getPage().size());
            assertEquals(0, records.getTotalSize());
        }
    }

    @Test
    public void testFindRecordsWithTypeFilter() throws Exception {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        // Setup:
        int limit = 1000;
        int offset = 0;
        PaginatedSearchParams versionedSearchParams = new PaginatedSearchParams.Builder().limit(limit).offset(offset).typeFilter(versionedRecordFactory.getTypeIRI()).build();
        PaginatedSearchParams unversionedSearchParams = new PaginatedSearchParams.Builder().limit(limit).offset(offset).typeFilter(unversionedRecordFactory.getTypeIRI()).build();
        PaginatedSearchParams fullSearchParams = new PaginatedSearchParams.Builder().limit(limit).offset(offset).build();

        try (RepositoryConnection conn = repo.getConnection()) {
            // when
            PaginatedSearchResults<Record> versionedRecords = manager.findRecord(ManagerTestConstants.CATALOG_IRI, versionedSearchParams, conn);
            PaginatedSearchResults<Record> unversionedRecords = manager.findRecord(ManagerTestConstants.CATALOG_IRI, unversionedSearchParams, conn);
            PaginatedSearchResults<Record> fullRecords = manager.findRecord(ManagerTestConstants.CATALOG_IRI, fullSearchParams, conn);

            // then
            assertTrue(true);
            assertEquals(8, versionedRecords.getPage().size());
            assertEquals(8, versionedRecords.getTotalSize());
            assertEquals(2, unversionedRecords.getPage().size());
            assertEquals(2, unversionedRecords.getTotalSize());
            assertEquals(TOTAL_SIZE, fullRecords.getPage().size());
            assertEquals(TOTAL_SIZE, fullRecords.getTotalSize());
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void testFindRecordWithOffsetThatIsTooLarge() {
        // given
        int limit = 10;
        int offset = 100;
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().limit(limit).offset(offset).build();
        try (RepositoryConnection conn = repo.getConnection()) {
            // when
            manager.findRecord(ManagerTestConstants.CATALOG_IRI, searchParams, conn);
        }
    }

    /* findRecord - replaceKeywordFilter */
    @Test
    public void testReplaceKeywordFilter() throws Exception {
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder()
                .searchText("searchText").limit(1).offset(2)
                .keywords(Arrays.asList("111", "222")).build();

        String keywordFilterExpect = "?record mcat:keyword ?keyword .\nFILTER(?keyword IN ('111','222'))";
        String keywordFilterActual = manager.replaceKeywordFilter(searchParams, "%KEYWORDS_FILTER%");
        assertEquals(keywordFilterExpect, keywordFilterActual);

        String queryTest = "PREFIX mcat: <http://mobi.com/ontologies/catalog#>\n" +
                "SELECT * WHERE { %KEYWORDS_FILTER% }".replace("%KEYWORDS_FILTER%", keywordFilterActual);

        try (RepositoryConnection conn = repo.getConnection()) {
            conn.prepareTupleQuery(queryTest);
        } catch (MalformedQueryException e){
            fail("Query is Malformed: " + queryTest);
        }
    }

    @Test
    public void testReplaceKeywordFilterComma() throws Exception {
        String[] characters = new String[]{ "'", "~", "`", "!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "-", "_",
                "=", "+", "[", "{", "]", "}", "\\", "|", ";", ":", ",", "<", ".", ">", "?"};

        for (String character: characters){
            PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder()
                    .searchText("searchText").limit(1).offset(2)
                    .keywords(Arrays.asList("111", "22,2", character)).build();

            String keywordFilterExpect = String.format("?record mcat:keyword ?keyword .\nFILTER(?keyword IN ('111','22,2','%s'))", manager.escapeKeyword(character));
            String keywordFilterActual = manager.replaceKeywordFilter(searchParams, "%KEYWORDS_FILTER%");
            assertEquals(keywordFilterExpect, keywordFilterActual);

            String queryTest = "PREFIX mcat: <http://mobi.com/ontologies/catalog#>\n" +
                    "SELECT * WHERE { %KEYWORDS_FILTER% }".replace("%KEYWORDS_FILTER%", keywordFilterActual);

            try (RepositoryConnection conn = repo.getConnection()) {
                conn.prepareTupleQuery(queryTest);
            } catch (MalformedQueryException e){
                fail("Query is Malformed: " + queryTest);
            }
        }
    }

    @Test
    public void testEscapeKeywordComma() throws Exception {
        assertEquals("\\'", manager.escapeKeyword("'"));
        assertEquals("\\\\", manager.escapeKeyword("\\"));
    }

    /* findRecord - replaceCreatorFilter */
    @Test
    public void testReplaceCreatorFilter() throws Exception {
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder()
                .searchText("searchText").limit(1).offset(2)
                .creators(Arrays.asList(ManagerTestConstants.USER_IRI, VALUE_FACTORY.createIRI("http://mobi.com/ontologies/user/management#tester"))).build();

        String keywordFilterExpect = "?record dc:publisher ?creator .\nFILTER(?creator IN (<" + ManagerTestConstants.USER_IRI + ">,<http://mobi.com/ontologies/user/management#tester>))";
        String keywordFilterActual = manager.replaceCreatorFilter(searchParams, "%CREATORS_FILTER%");
        assertEquals(keywordFilterExpect, keywordFilterActual);

        String queryTest = "PREFIX dc: <http://purl.org/dc/terms/>\n" +
                "SELECT * WHERE { %CREATORS_FILTER% }".replace("%CREATORS_FILTER%", keywordFilterActual);

        try (RepositoryConnection conn = repo.getConnection()) {
            conn.prepareTupleQuery(queryTest);
        } catch (MalformedQueryException e){
            fail("Query is Malformed: " + queryTest);
        }
    }

    /* getKeywords */
    @Test
    public void testGetKeywords() throws Exception {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        // given
        int limit = 10;
        int offset = 0;
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder()
                .limit(limit).offset(offset).build();

        try (RepositoryConnection conn = repo.getConnection()) {
            // when
            PaginatedSearchResults<KeywordCount> keywordCounts = manager.getKeywords(ManagerTestConstants.CATALOG_IRI, searchParams, conn);
            // then
            assertEquals(2, keywordCounts.getPage().size());
            assertEquals(2, keywordCounts.getTotalSize());
            assertEquals("[KC(111, 2), KC(222, 2)]", keywordCounts.getPage().toString());
            assertEquals(10, keywordCounts.getPageSize());
            assertEquals(1, keywordCounts.getPageNumber());
        }
    }

    @Test
    public void testGetKeywordsSearch() throws Exception {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        // given
        int limit = 10;
        int offset = 0;
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder()
                .searchText("111")
                .limit(limit).offset(offset).build();
        try (RepositoryConnection conn = repo.getConnection()) {
            // when
            PaginatedSearchResults<KeywordCount> keywordCounts = manager.getKeywords(ManagerTestConstants.CATALOG_IRI, searchParams, conn);
            // then
            assertEquals(1, keywordCounts.getPage().size());
            assertEquals(1, keywordCounts.getTotalSize());
            assertEquals("[KC(111, 2)]", keywordCounts.getPage().toString());
            assertEquals(10, keywordCounts.getPageSize());
            assertEquals(1, keywordCounts.getPageNumber());
        }
    }

    @Test
    public void testGetKeywordsSearchNotExist() throws Exception {
        // given
        int limit = 10;
        int offset = 0;
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder()
                .searchText("notExist")
                .limit(limit).offset(offset).build();

        try (RepositoryConnection conn = repo.getConnection()) {
            // when
            PaginatedSearchResults<KeywordCount> keywordCounts = manager.getKeywords(ManagerTestConstants.CATALOG_IRI, searchParams, conn);
            // then
            assertEquals(0, keywordCounts.getPage().size());
            assertEquals(0, keywordCounts.getTotalSize());
            assertEquals("[]", keywordCounts.getPage().toString());
            assertEquals(0, keywordCounts.getPageSize());
            assertEquals(0, keywordCounts.getPageNumber());
        }
    }

    @Test
    public void testGetKeywordsPage1() throws Exception {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        // given
        int limit = 1;
        int offset = 0;
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder()
                .limit(limit).offset(offset).build();

        try (RepositoryConnection conn = repo.getConnection()) {
            // when
            PaginatedSearchResults<KeywordCount> keywordCounts = manager.getKeywords(ManagerTestConstants.CATALOG_IRI, searchParams, conn);
            // then
            assertEquals(1, keywordCounts.getPage().size());
            assertEquals("[KC(111, 2)]", keywordCounts.getPage().toString());
            assertEquals(2, keywordCounts.getTotalSize());
            assertEquals(1, keywordCounts.getPageSize());
            assertEquals(1, keywordCounts.getPageNumber());
        }
    }

    @Test
    public void testGetKeywordsPage2() throws Exception {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        // given
        int limit = 1;
        int offset = 1;
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder()
                .limit(limit).offset(offset).build();

        try (RepositoryConnection conn = repo.getConnection()) {
            // when
            PaginatedSearchResults<KeywordCount> keywordCounts = manager.getKeywords(ManagerTestConstants.CATALOG_IRI, searchParams, conn);
            // then
            assertEquals(1, keywordCounts.getPage().size());
            assertEquals("[KC(222, 2)]", keywordCounts.getPage().toString());
            assertEquals(2, keywordCounts.getTotalSize());
            assertEquals(1, keywordCounts.getPageSize());
            assertEquals(2, keywordCounts.getPageNumber());
        }
    }

    /* getRecordIds */

    @Test
    public void testGetRecordIds() throws Exception {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        try (RepositoryConnection conn = repo.getConnection()) {
            Set<Resource> results = manager.getRecordIds(ManagerTestConstants.CATALOG_IRI, conn);
            verify(thingManager).validateResource(eq(ManagerTestConstants.CATALOG_IRI), eq(VALUE_FACTORY.createIRI(Catalog.TYPE)), any(RepositoryConnection.class));
            assertEquals(TOTAL_SIZE, results.size());
            assertTrue(results.contains(ManagerTestConstants.RECORD_IRI));
            assertTrue(results.contains(ManagerTestConstants.UNVERSIONED_RECORD_IRI));
            assertTrue(results.contains(ManagerTestConstants.VERSIONED_RECORD_IRI));
            assertTrue(results.contains(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI));
        }
    }

    /* createRecord */

    @Test
    public void testCreateRecord() throws Exception {
        RecordOperationConfig config = new OperationConfig();
        User user = userFactory.createNew(ManagerTestConstants.USER_IRI);
        Set<String> keywords = new LinkedHashSet<>();
        keywords.add("keyword1");
        keywords.add("keyword2");
        Set<User> users = new LinkedHashSet<>();
        users.add(user);
        config.set(RecordCreateSettings.CATALOG_ID, ManagerTestConstants.CATALOG_IRI.stringValue());
        config.set(RecordCreateSettings.RECORD_TITLE, "TestTitle");
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "TestTitle");
        config.set(RecordCreateSettings.RECORD_MARKDOWN, "#Title");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, keywords);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.createRecord(user, config, Record.class, conn);
        }

        verify(recordService).create(any(User.class), eq(config), any(RepositoryConnection.class));
    }

    @Test
    public void testCreateVersionedRDFRecord() throws Exception {
        RecordOperationConfig config = new OperationConfig();
        User user = userFactory.createNew(ManagerTestConstants.USER_IRI);
        Set<String> keywords = new LinkedHashSet<>();
        keywords.add("keyword1");
        keywords.add("keyword2");
        Set<User> users = new LinkedHashSet<>();
        users.add(user);
        config.set(RecordCreateSettings.CATALOG_ID, ManagerTestConstants.CATALOG_IRI.stringValue());
        config.set(RecordCreateSettings.RECORD_TITLE, "TestTitle");
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "TestTitle");
        config.set(RecordCreateSettings.RECORD_MARKDOWN, "#Title");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, keywords);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.createRecord(user, config, VersionedRDFRecord.class, conn);
        }

        verify(versionedRDFRecordService).create(any(User.class), eq(config), any(RepositoryConnection.class));
    }

    @Test (expected = IllegalArgumentException.class)
    public void testCreateNoRecordService() throws Exception {
        RecordOperationConfig config = new OperationConfig();
        User user = userFactory.createNew(ManagerTestConstants.USER_IRI);
        Set<String> keywords = new LinkedHashSet<>();
        keywords.add("keyword1");
        keywords.add("keyword2");
        Set<User> users = new LinkedHashSet<>();
        users.add(user);
        config.set(RecordCreateSettings.CATALOG_ID, ManagerTestConstants.CATALOG_IRI.stringValue());
        config.set(RecordCreateSettings.RECORD_TITLE, "TestTitle");
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "TestTitle");
        config.set(RecordCreateSettings.RECORD_MARKDOWN, "#Title");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, keywords);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);
        manager.removeRecordService(versionedRecordService);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.createRecord(user, config, VersionedRecord.class, conn);
        }
    }

    @Test (expected = NullPointerException.class)
    public void testCreateRecordNullFactory() throws Exception {
        RecordOperationConfig config = new OperationConfig();
        User user = userFactory.createNew(ManagerTestConstants.USER_IRI);
        Set<String> keywords = new LinkedHashSet<>();
        keywords.add("keyword1");
        keywords.add("keyword2");
        Set<User> users = new LinkedHashSet<>();
        users.add(user);
        config.set(RecordCreateSettings.CATALOG_ID, ManagerTestConstants.CATALOG_IRI.stringValue());
        config.set(RecordCreateSettings.RECORD_TITLE, "TestTitle");
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "TestTitle");
        config.set(RecordCreateSettings.RECORD_MARKDOWN, "#Title");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, keywords);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.createRecord(user, config, null, conn);
        }
    }

    /* updateRecord */

    @Test
    public void testUpdateRecord() throws Exception {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        // Setup:
        Record record = recordFactory.createNew(ManagerTestConstants.RECORD_IRI);
        record.setKeyword(Stream.of(VALUE_FACTORY.createLiteral("keyword1")).collect(Collectors.toSet()));
        record.setProperty(VALUE_FACTORY.createLiteral(OffsetDateTime.now().minusDays(1)), VALUE_FACTORY.createIRI(_Thing.modified_IRI));
        String previousModifiedValue = ManagerTestConstants.getModifiedIriValue(record);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.updateRecord(ManagerTestConstants.CATALOG_IRI, record, conn);
            verify(manager).validateRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.RECORD_IRI), eq(VALUE_FACTORY.createIRI(Record.TYPE)), any(RepositoryConnection.class));
            verify(thingManager).updateObject(eq(record), any(RepositoryConnection.class));
            assertNotSame(ManagerTestConstants.getModifiedIriValue(record), previousModifiedValue);
        }
    }

    @Test
    public void testUpdateUnversionedRecord() throws Exception {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        // Setup:
        UnversionedRecord record = unversionedRecordFactory.createNew(ManagerTestConstants.UNVERSIONED_RECORD_IRI);
        record.setKeyword(Stream.of(VALUE_FACTORY.createLiteral("keyword1")).collect(Collectors.toSet()));
        record.setProperty(VALUE_FACTORY.createLiteral(OffsetDateTime.now().minusDays(1)), VALUE_FACTORY.createIRI(_Thing.modified_IRI));
        String previousModifiedValue = ManagerTestConstants.getModifiedIriValue(record);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.updateRecord(ManagerTestConstants.CATALOG_IRI, record, conn);
            verify(manager).validateRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.UNVERSIONED_RECORD_IRI), eq(VALUE_FACTORY.createIRI(Record.TYPE)), any(RepositoryConnection.class));
            verify(thingManager).updateObject(eq(record), any(RepositoryConnection.class));
            assertNotSame(ManagerTestConstants.getModifiedIriValue(record), previousModifiedValue);
        }
    }

    @Test
    public void testUpdateVersionedRecord() throws Exception {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        // Setup:
        VersionedRecord record = versionedRecordFactory.createNew(ManagerTestConstants.VERSIONED_RECORD_IRI);
        record.setKeyword(Stream.of(VALUE_FACTORY.createLiteral("keyword1")).collect(Collectors.toSet()));
        record.setProperty(VALUE_FACTORY.createLiteral(OffsetDateTime.now().minusDays(1)), VALUE_FACTORY.createIRI(_Thing.modified_IRI));
        String previousModifiedValue = ManagerTestConstants.getModifiedIriValue(record);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.updateRecord(ManagerTestConstants.CATALOG_IRI, record, conn);
            verify(manager).validateRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RECORD_IRI), eq(VALUE_FACTORY.createIRI(Record.TYPE)), any(RepositoryConnection.class));
            verify(thingManager).updateObject(eq(record), any(RepositoryConnection.class));
            assertNotSame(ManagerTestConstants.getModifiedIriValue(record), previousModifiedValue);
        }
    }

    @Test
    public void testUpdateVersionedRDFRecord() throws Exception {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        // Setup:
        VersionedRDFRecord record = versionedRDFRecordFactory.createNew(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI);
        record.setKeyword(Stream.of(VALUE_FACTORY.createLiteral("keyword1")).collect(Collectors.toSet()));
        record.setProperty(VALUE_FACTORY.createLiteral(OffsetDateTime.now().minusDays(1)), VALUE_FACTORY.createIRI(_Thing.modified_IRI));
        String previousModifiedValue = ManagerTestConstants.getModifiedIriValue(record);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.updateRecord(ManagerTestConstants.CATALOG_IRI, record, conn);
            verify(manager).validateRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(VALUE_FACTORY.createIRI(Record.TYPE)), any(RepositoryConnection.class));
            verify(thingManager).updateObject(eq(record), any(RepositoryConnection.class));
            assertNotSame(ManagerTestConstants.getModifiedIriValue(record), previousModifiedValue);
        }
    }

    /* removeRecord */

    @Test
    public void testRemoveRecord() {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        User user = userFactory.createNew(ManagerTestConstants.USER_IRI);
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.removeRecord(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.RECORD_IRI, user, Record.class, conn);
        }

        verify(manager).validateRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.RECORD_IRI), eq(recordFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(recordService).delete(eq(ManagerTestConstants.RECORD_IRI), eq(user), any(RepositoryConnection.class));
    }

    @Test
    public void testRemoveVersionedRecord() {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        User user = userFactory.createNew(ManagerTestConstants.USER_IRI);
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.removeRecord(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI, user, VersionedRecord.class, conn);
        }

        verify(manager).validateRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RECORD_IRI), eq(recordFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(versionedRecordService).delete(eq(ManagerTestConstants.VERSIONED_RECORD_IRI), eq(user), any(RepositoryConnection.class));
    }

    @Test
    public void testRemoveUnversionedRecord() {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        User user = userFactory.createNew(ManagerTestConstants.USER_IRI);
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.removeRecord(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.UNVERSIONED_RECORD_IRI, user, UnversionedRecord.class, conn);
        }

        verify(manager).validateRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.UNVERSIONED_RECORD_IRI), eq(recordFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(unversionedRecordService).delete(eq(ManagerTestConstants.UNVERSIONED_RECORD_IRI), eq(user), any(RepositoryConnection.class));
    }

    @Test
    public void testRemoveVersionedRDFRecord() {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        User user = userFactory.createNew(ManagerTestConstants.USER_IRI);
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.removeRecord(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, user, VersionedRDFRecord.class, conn);
        }

        verify(manager).validateRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(recordFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(versionedRDFRecordService).delete(eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(user), any(RepositoryConnection.class));
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRemoveVersionedRDFRecordMissingService() {
        manager.removeRecordService(versionedRDFRecordService);
        User user = userFactory.createNew(ManagerTestConstants.USER_IRI);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.removeRecord(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, user, VersionedRDFRecord.class, conn);
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRemoveRecordClassServiceMismatch() {
        User user = userFactory.createNew(ManagerTestConstants.USER_IRI);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.removeRecord(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, user, VersionedRecord.class, conn);
        }
    }

    @Test
    public void testRemoveRecordUsingMostSpecific() {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        User user = userFactory.createNew(ManagerTestConstants.USER_IRI);
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.removeRecord(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, user, Record.class, conn);
        }

        verify(manager).validateRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(recordFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(versionedRDFRecordService).delete(eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(user), any(RepositoryConnection.class));
    }

    /* getRecord */

    @Test
    public void testGetRecord() throws Exception {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Optional<Record> result = manager.getRecordOpt(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.RECORD_IRI, recordFactory, conn);
            verify(thingManager).validateResource(eq(ManagerTestConstants.CATALOG_IRI), eq(catalogFactory.getTypeIRI()), any(RepositoryConnection.class));
            verify(thingManager).optObject(eq(ManagerTestConstants.RECORD_IRI), eq(recordFactory), any(RepositoryConnection.class));
            assertTrue(result.isPresent());
        }
    }

    @Test
    public void testGetUnversionedRecord() throws Exception {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Optional<UnversionedRecord> result = manager.getRecordOpt(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.UNVERSIONED_RECORD_IRI, unversionedRecordFactory, conn);
            verify(thingManager).validateResource(eq(ManagerTestConstants.CATALOG_IRI), eq(catalogFactory.getTypeIRI()), any(RepositoryConnection.class));
            verify(thingManager).optObject(eq(ManagerTestConstants.UNVERSIONED_RECORD_IRI), eq(unversionedRecordFactory), any(RepositoryConnection.class));
            assertTrue(result.isPresent());
        }
    }

    @Test
    public void testGetVersionedRecord() throws Exception {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Optional<VersionedRecord> result = manager.getRecordOpt(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RECORD_IRI, versionedRecordFactory, conn);
            verify(thingManager).validateResource(eq(ManagerTestConstants.CATALOG_IRI), eq(catalogFactory.getTypeIRI()), any(RepositoryConnection.class));
            verify(thingManager).optObject(eq(ManagerTestConstants.VERSIONED_RECORD_IRI), eq(versionedRecordFactory), any(RepositoryConnection.class));
            assertTrue(result.isPresent());
        }
    }

    @Test
    public void testGetVersionedRDFRecord() throws Exception {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Optional<VersionedRDFRecord> result = manager.getRecordOpt(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, versionedRDFRecordFactory, conn);
            verify(thingManager).validateResource(eq(ManagerTestConstants.CATALOG_IRI), eq(catalogFactory.getTypeIRI()), any(RepositoryConnection.class));
            verify(thingManager).optObject(eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
            assertTrue(result.isPresent());
        }
    }

    @Test
    public void testGetRecordWithNoCatalog() {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            thrown.expect(IllegalStateException.class);
            thrown.expectMessage("Record " + RECORD_NO_CATALOG_IRI + " does not have a Catalog set");

            manager.getRecordOpt(ManagerTestConstants.CATALOG_IRI, RECORD_NO_CATALOG_IRI, recordFactory, conn);
        }
    }

    @Test
    public void testGetRecordFromWrongCatalog() {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        try (RepositoryConnection conn = repo.getConnection()) {
            Optional<Record> result = manager.getRecordOpt(ManagerTestConstants.CATALOG_DISTRIBUTED_IRI, ManagerTestConstants.RECORD_IRI, recordFactory, conn);
            verify(thingManager).validateResource(eq(ManagerTestConstants.CATALOG_DISTRIBUTED_IRI), eq(catalogFactory.getTypeIRI()), any(RepositoryConnection.class));
            verify(thingManager).optObject(eq(ManagerTestConstants.RECORD_IRI), eq(recordFactory), any(RepositoryConnection.class));
            assertFalse(result.isPresent());
        }
    }

    /* validateRecord */

    @Test
    public void testRecordPathWithMissingCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Catalog " + ManagerTestConstants.MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.validateRecord(ManagerTestConstants.MISSING_IRI, ManagerTestConstants.RECORD_IRI, recordFactory.getTypeIRI(), conn);
        }
    }

    @Test
    public void testRecordPathWithMissingRecord() {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Record " + ManagerTestConstants.MISSING_IRI + " could not be found");
        thrown.expectMessage("Record " + ManagerTestConstants.MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.validateRecord(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.MISSING_IRI, recordFactory.getTypeIRI(), conn);
        }
    }

    @Test
    public void testRecordPathWithWrongCatalog() {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", RECORD_NO_CATALOG_IRI, ManagerTestConstants.CATALOG_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.validateRecord(ManagerTestConstants.CATALOG_IRI, RECORD_NO_CATALOG_IRI, recordFactory.getTypeIRI(), conn);
        }
    }

    /* getRecord */

    @Test
    public void getRecordTest() throws Exception {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        try (RepositoryConnection conn = repo.getConnection()) {
            Record record = manager.getRecord(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.RECORD_IRI, recordFactory, conn);
            assertFalse(record.getModel().isEmpty());
            assertEquals(ManagerTestConstants.RECORD_IRI, record.getResource());
        }
    }

    @Test
    public void getRecordWithMissingCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Catalog " + ManagerTestConstants.MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.getRecord(ManagerTestConstants.MISSING_IRI, ManagerTestConstants.RECORD_IRI, recordFactory, conn);
        }
    }

    @Test
    public void getRecordWithMissingRecord() {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Record " + ManagerTestConstants.MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.getRecord(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.MISSING_IRI, recordFactory, conn);
        }
    }

    @Test
    public void getRecordWithWrongCatalog() {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", RECORD_NO_CATALOG_IRI, ManagerTestConstants.CATALOG_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.getRecord(ManagerTestConstants.CATALOG_IRI, RECORD_NO_CATALOG_IRI, recordFactory, conn);
        }
    }

    /* export() */

    @Test
    public void testExportNonExistingRecord() {
        RecordOperationConfig config = new OperationConfig();
        String expected = "No known record services for this record type.";
        IRI nonRecord = VALUE_FACTORY.createIRI("http://mobi.com/test/records#random");
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.export(nonRecord, config, conn);
        } catch (Exception e){
            assertEquals(e.getMessage(), expected);
        }
    }

    @Test
    public void testExportRecordWithoutList() throws Exception {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        RecordOperationConfig config = new OperationConfig();
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.export(ManagerTestConstants.RECORD_IRI, config, conn);
        }
        verify(recordService).export(eq(ManagerTestConstants.RECORD_IRI), any(OperationConfig.class), any(RepositoryConnection.class));
    }

    @Test
    public void testExportVersionedRecordWithoutList() throws Exception {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        RecordOperationConfig config = new OperationConfig();
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.export(ManagerTestConstants.VERSIONED_RECORD_IRI, config, conn);
        }
        verify(versionedRecordService).export(eq(ManagerTestConstants.VERSIONED_RECORD_IRI), any(OperationConfig.class),
                any(RepositoryConnection.class));
    }

    @Test
    public void testExportUnversionedRecordWithoutList() throws Exception {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        RecordOperationConfig config = new OperationConfig();
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.export(ManagerTestConstants.UNVERSIONED_RECORD_IRI, config, conn);
        }
        verify(unversionedRecordService).export(eq(ManagerTestConstants.UNVERSIONED_RECORD_IRI), any(OperationConfig.class),
                any(RepositoryConnection.class));
    }

    @Test
    public void testExportVersionedRDFRecordWithoutList() throws Exception {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        RecordOperationConfig config = new OperationConfig();
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.export(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, config, conn);
        }
        verify(versionedRDFRecordService).export(eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), any(OperationConfig.class),
                any(RepositoryConnection.class));
    }

    @Test
    public void testExportWithList() throws Exception {
        trigRequired(repo, "/systemRepo/simpleDistribution.trig");
        RecordOperationConfig config = new OperationConfig();
        config.set(RecordExportSettings.BATCH_EXPORTER, exporter);
        List<Resource> exportList = new ArrayList<>();
        exportList.add(ManagerTestConstants.RECORD_IRI);
        exportList.add(ManagerTestConstants.VERSIONED_RECORD_IRI);
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.export(exportList, config, conn);
        }
        verify(recordService).export(eq(ManagerTestConstants.RECORD_IRI),  any(OperationConfig.class), any(RepositoryConnection.class));
        verify(versionedRecordService).export(eq(ManagerTestConstants.VERSIONED_RECORD_IRI),  any(OperationConfig.class),
                any(RepositoryConnection.class));
    }

    private void mockFindEntities(String ...records) {
        trigRequired(repo, "/systemRepo/entities001.trig");
        when(user.getResource()).thenReturn(VALUE_FACTORY.createIRI("http://mobi.com/theUser"));
        when(pdp.createRequest(any(), any(), any(), any(), any(), any())).thenReturn(request);
        when(pdp.filter(any(), any(IRI.class))).thenReturn(new HashSet<>(Arrays.asList(records)));
    }

    @Test
    public void testFindEntities() throws Exception {
        String record1 = "http://example.org/record1";
        String record2 = "http://example.org/record2";
        mockFindEntities(record1, record2);

        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder()
                .searchText("Entity 2")
                .limit(10)
                .offset(0)
                .build();
        try (RepositoryConnection conn = repo.getConnection()) {
            PaginatedSearchResults<EntityMetadata> results = manager.findEntities(ManagerTestConstants.CATALOG_IRI,
                    searchParams, user, conn);
            assertEquals(10, results.getPageSize());
            assertEquals(1, results.getTotalSize());
            assertEquals(1, results.getPageNumber());
            assertEquals(1, results.getPage().size());
            // Get the first EntityMetadata from the results
            EntityMetadata entityMetadata = results.getPage().get(0);
            assertEquals("http://example.org/entity2", entityMetadata.iri());
            assertEquals("Entity 2 Label", entityMetadata.entityName());
            assertEquals(1, entityMetadata.types().size());
            assertEquals("http://example.org/EntityType2", entityMetadata.types().get(0));
            assertEquals("This is a description for entity 2.", entityMetadata.description());

            assertNotNull(entityMetadata.sourceRecord());
            assertEquals("http://example.org/record2", entityMetadata.sourceRecord().get("iri"));
            assertEquals("Record 2 Title", entityMetadata.sourceRecord().get("title"));
            assertEquals("http://mobi.com/ontologies/catalog#OntologyRecord", entityMetadata.sourceRecord().get("type"));

            assertEquals(1, entityMetadata.recordKeywords().size());
            assertEquals("keyword3", entityMetadata.recordKeywords().get(0));

            assertEquals(3, entityMetadata.matchingAnnotations().size());
            assertEquals("This is a description for entity 2.", entityMetadata.matchingAnnotations().get(0).get("value"));
            assertEquals("Entity 2 Label", entityMetadata.matchingAnnotations().get(1).get("value"));
            assertEquals("Entity 2 Preferred Label", entityMetadata.matchingAnnotations().get(2).get("value"));
        }
    }

    @Test
    public void testFindEntitiesPaging() throws Exception {
        String record1 = "http://example.org/record1";
        String record2 = "http://example.org/record2";
        mockFindEntities(record1, record2);

        try (RepositoryConnection conn = repo.getConnection()) {
            // Test Page 1 with limit of 10
            PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder()
                    .searchText("Object")
                    .limit(10)
                    .offset(0)
                    .build();
            PaginatedSearchResults<EntityMetadata> results = manager.findEntities(ManagerTestConstants.CATALOG_IRI,
                    searchParams, user, conn);
            assertEquals(10, results.getPageSize());
            assertEquals(2, results.getTotalSize());
            assertEquals(2, results.getPage().size());
            assertEquals(1, results.getPageNumber());
            Assert.assertEquals(List.of("http://example.org/entity1", "http://example.org/entity2"),
                    results.getPage().stream().map(EntityMetadata::iri).toList());
            Assert.assertEquals(List.of("http://example.org/record1",  "http://example.org/record2"),
                    results.getPage().stream().map((e) -> e.sourceRecord().get("iri")).toList());
            // Test Page 1
            searchParams = new PaginatedSearchParams.Builder()
                    .searchText("Object")
                    .limit(1)
                    .offset(0)
                    .build();
            results = manager.findEntities(ManagerTestConstants.CATALOG_IRI,
                    searchParams, user, conn);
            assertEquals(1, results.getPageSize());
            assertEquals(2, results.getTotalSize());
            assertEquals(1, results.getPage().size());
            assertEquals(1, results.getPageNumber());
            Assert.assertEquals(List.of("http://example.org/entity1"),
                    results.getPage().stream().map(EntityMetadata::iri).toList());
            Assert.assertEquals(List.of("http://example.org/record1"),
                    results.getPage().stream().map((e) -> e.sourceRecord().get("iri")).toList());
            // Test Page 2
            searchParams = new PaginatedSearchParams.Builder().searchText("Object")
                    .limit(1).offset(1).build();
            results = manager.findEntities(ManagerTestConstants.CATALOG_IRI,
                    searchParams, user, conn);
            Assert.assertEquals(List.of("http://example.org/entity2"),
                    results.getPage().stream().map(EntityMetadata::iri).toList());
            Assert.assertEquals(List.of("http://example.org/record2"),
                    results.getPage().stream().map((e) -> e.sourceRecord().get("iri")).toList());
            assertEquals(1, results.getPageSize());
            assertEquals(2, results.getTotalSize());
            assertEquals(2, results.getPageNumber());
            // Test Page 3
            searchParams = new PaginatedSearchParams.Builder().searchText("Object")
                    .limit(1).offset(2).build();
            results = manager.findEntities(ManagerTestConstants.CATALOG_IRI,
                    searchParams, user, conn);
            Assert.assertEquals(List.of(),
                    results.getPage().stream().map(EntityMetadata::iri).toList());
            assertEquals(1, results.getPageSize());
            assertEquals(2, results.getTotalSize());
            assertEquals(3, results.getPageNumber());
        }
    }

    @Test
    public void testFindEntitiesExistsNoPermissions() throws Exception {
        String record1 = "http://example.org/record1";
        String record2 = "http://example.org/record2";
        mockFindEntities(record1, record2);
        when(pdp.filter(any(), any(IRI.class))).thenReturn(new HashSet<>());

        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().searchText("Entity 2")
                .limit(10).offset(0).build();
        try (RepositoryConnection conn = repo.getConnection()) {
            PaginatedSearchResults<EntityMetadata> results = manager.findEntities(ManagerTestConstants.CATALOG_IRI,
                    searchParams, user, conn);
            assertTrue(results.getPage().isEmpty());
            assertEquals(0, results.getPageSize());
            assertEquals(0, results.getTotalSize());
            assertEquals(0, results.getPageNumber());
        }
    }

    @Test
    public void testFindEntitiesNotExist() throws Exception {
        String record1 = "http://example.org/record1";
        String record2 = "http://example.org/record2";
        mockFindEntities(record1, record2);

        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().searchText("NOT_EXIST")
                .limit(10).offset(0).build();
        try (RepositoryConnection conn = repo.getConnection()) {
            PaginatedSearchResults<EntityMetadata> results = manager.findEntities(ManagerTestConstants.CATALOG_IRI,
                    searchParams, user, conn);
            assertTrue(results.getPage().isEmpty());
            assertEquals(0, results.getPageSize());
            assertEquals(0, results.getTotalSize());
            assertEquals(0, results.getPageNumber());
        }
    }
}