package com.mobi.catalog.impl;
/*-
 * #%L
 * com.mobi.catalog.impl
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
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyBoolean;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.PaginatedSearchParams;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.catalog.api.builder.Conflict;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.mergerequest.MergeRequestManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.Distribution;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.ontologies.mcat.Revision;
import com.mobi.catalog.api.ontologies.mcat.Tag;
import com.mobi.catalog.api.ontologies.mcat.UnversionedRecord;
import com.mobi.catalog.api.ontologies.mcat.UserBranch;
import com.mobi.catalog.api.ontologies.mcat.Version;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.ontologies.mcat.VersionedRecord;
import com.mobi.catalog.api.record.RecordService;
import com.mobi.catalog.api.record.config.OperationConfig;
import com.mobi.catalog.api.record.config.RecordCreateSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.ontologies.provo.Activity;
import com.mobi.ontologies.provo.Entity;
import com.mobi.ontologies.provo.InstantaneousEvent;
import com.mobi.persistence.utils.RepositoryResults;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.utils.Values;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class SimpleCatalogManagerTest extends OrmEnabledTestCase {

    private Repository repo;
    private SimpleCatalogManager manager;
    private OrmFactory<Catalog> catalogFactory = getRequiredOrmFactory(Catalog.class);
    private OrmFactory<Record> recordFactory = getRequiredOrmFactory(Record.class);
    private OrmFactory<UnversionedRecord> unversionedRecordFactory = getRequiredOrmFactory(UnversionedRecord.class);
    private OrmFactory<VersionedRecord> versionedRecordFactory = getRequiredOrmFactory(VersionedRecord.class);
    private OrmFactory<VersionedRDFRecord> versionedRDFRecordFactory = getRequiredOrmFactory(VersionedRDFRecord.class);
    private OrmFactory<Distribution> distributionFactory = getRequiredOrmFactory(Distribution.class);
    private OrmFactory<Branch> branchFactory = getRequiredOrmFactory(Branch.class);
    private OrmFactory<InProgressCommit> inProgressCommitFactory = getRequiredOrmFactory(InProgressCommit.class);
    private OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);
    private OrmFactory<Revision> revisionFactory = getRequiredOrmFactory(Revision.class);
    private OrmFactory<Version> versionFactory = getRequiredOrmFactory(Version.class);
    private OrmFactory<Tag> tagFactory = getRequiredOrmFactory(Tag.class);
    private OrmFactory<UserBranch> userBranchFactory = getRequiredOrmFactory(UserBranch.class);
    private OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
    private ValueFactory vf;

    private IRI distributedCatalogId;
    private IRI localCatalogId;
    private List<Commit> testCommits;
    private final IRI typeIRI = VALUE_FACTORY.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI);
    private final IRI titleIRI = VALUE_FACTORY.createIRI(_Thing.title_IRI);
    private final IRI descriptionIRI = VALUE_FACTORY.createIRI(_Thing.description_IRI);
    private final IRI modifiedIRI = VALUE_FACTORY.createIRI(_Thing.modified_IRI);
    private final IRI issuedIRI = VALUE_FACTORY.createIRI(_Thing.issued_IRI);
    private final IRI EMPTY_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test#empty");
    private final IRI NEW_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test#new");
    private final IRI USER_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test#user");
    private final IRI RECORD_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/records#record");
    private final IRI UNVERSIONED_RECORD_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/records#unversioned-record");
    private final IRI VERSIONED_RECORD_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/records#versioned-record");
    private final IRI VERSIONED_RDF_RECORD_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/records#versioned-rdf-record");
    private final IRI DISTRIBUTION_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/distributions#distribution");
    private final IRI LATEST_VERSION_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/versions#latest-version");
    private final IRI VERSION_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/versions#version");
    private final IRI TAG_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/versions#tag");
    private final IRI MASTER_BRANCH_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#master");
    private final IRI BRANCH_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#branch");
    private final IRI USER_BRANCH_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#user-branch");
    private final IRI COMMIT_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#commit");
    private final IRI IN_PROGRESS_COMMIT_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#in-progress-commit");

    private static final String COMMITS = "http://mobi.com/test/commits#";
    private static final String RECORDS = "http://mobi.com/test/records#";
    private static final String[] COMMIT_IRIS = new String[] {
            "http://mobi.com/commits/0",
            "http://mobi.com/commits/1",
            "http://mobi.com/commits/2"
    };

    private static final int TOTAL_SIZE = 9;

    @Rule
    public ExpectedException thrown = ExpectedException.none();

    @Mock
    private CatalogConfigProvider configProvider;

    @Mock
    private CatalogUtilsService utilsService;

    @Mock
    private RecordService<Record> recordService;

    @Mock
    private RecordService<VersionedRDFRecord> versionedRDFRecordService;

    @Mock
    private RecordService<VersionedRecord> versionedRecordService;

    @Mock
    private RecordService<UnversionedRecord> unversionedRecordService;

    @Mock
    private MergeRequestManager mergeRequestManager;

    @Mock
    private Conflict conflict;

    @Before
    public void setUp() throws Exception {
        vf = getValueFactory();

        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();

        MockitoAnnotations.initMocks(this);

        testCommits = Arrays.stream(COMMIT_IRIS)
                .map(s -> commitFactory.createNew(vf.createIRI(s)))
                .collect(Collectors.toList());

        when(recordService.getTypeIRI()).thenReturn(Record.TYPE);
        when(versionedRDFRecordService.getTypeIRI()).thenReturn(VersionedRDFRecord.TYPE);
        when(versionedRecordService.getTypeIRI()).thenReturn(VersionedRecord.TYPE);
        when(unversionedRecordService.getTypeIRI()).thenReturn(UnversionedRecord.TYPE);
        when(recordService.getType()).thenReturn(Record.class);
        when(versionedRDFRecordService.getType()).thenReturn(VersionedRDFRecord.class);
        when(versionedRecordService.getType()).thenReturn(VersionedRecord.class);
        when(unversionedRecordService.getType()).thenReturn(UnversionedRecord.class);

        InputStream testData = getClass().getResourceAsStream("/testCatalogData.trig");

        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(Values.mobiModel(Rio.parse(testData, "", RDFFormat.TRIG)));
        }

        distributedCatalogId = VALUE_FACTORY.createIRI("http://mobi.com/test/catalogs#catalog-distributed");
        localCatalogId = VALUE_FACTORY.createIRI("http://mobi.com/test/catalogs#catalog-local");

        Record testRecord = recordFactory.createNew(RECORD_IRI);
        testRecord.setProperty(VALUE_FACTORY.createLiteral("Test Record"), VALUE_FACTORY.createIRI(_Thing.title_IRI));
        testRecord.setCatalog(catalogFactory.createNew(localCatalogId));

        VersionedRDFRecord testVersionedRDFRecord = versionedRDFRecordFactory.createNew(RECORD_IRI);
        testRecord.setProperty(VALUE_FACTORY.createLiteral("Test Record"), VALUE_FACTORY.createIRI(_Thing.title_IRI));
        testRecord.setCatalog(catalogFactory.createNew(localCatalogId));

        testRecord.setProperty(VALUE_FACTORY.createLiteral("Test Record"), VALUE_FACTORY.createIRI(_Thing.title_IRI));
        testRecord.setCatalog(catalogFactory.createNew(localCatalogId));

        when(configProvider.getRepository()).thenReturn(repo);
        when(configProvider.getLocalCatalogIRI()).thenReturn(localCatalogId);
        when(configProvider.getDistributedCatalogIRI()).thenReturn(distributedCatalogId);

        when(recordService.create(any(User.class), any(RecordOperationConfig.class), any(RepositoryConnection.class))).thenReturn(testRecord);

        when(versionedRDFRecordService.create(any(User.class), any(RecordOperationConfig.class), any(RepositoryConnection.class))).thenReturn(testVersionedRDFRecord);

        when(utilsService.getExpectedObject(any(Resource.class), any(OrmFactory.class), any(RepositoryConnection.class))).thenAnswer(i ->
                i.getArgumentAt(1, OrmFactory.class).createNew(i.getArgumentAt(0, Resource.class)));
        when(utilsService.getRecord(any(Resource.class), any(Resource.class), any(OrmFactory.class), any(RepositoryConnection.class))).thenAnswer(i ->
                i.getArgumentAt(2, OrmFactory.class).createNew(i.getArgumentAt(1, Resource.class)));
        when(utilsService.getObject(any(Resource.class), any(OrmFactory.class), any(RepositoryConnection.class))).thenAnswer(i ->
                i.getArgumentAt(1, OrmFactory.class).createNew(i.getArgumentAt(0, Resource.class)));
        when(utilsService.getUnversionedDistribution(any(Resource.class), any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenAnswer(i ->
                distributionFactory.createNew(i.getArgumentAt(2, Resource.class)));
        when(utilsService.getVersion(any(Resource.class), any(Resource.class), any(Resource.class), any(OrmFactory.class), any(RepositoryConnection.class))).thenAnswer(i ->
                i.getArgumentAt(3, OrmFactory.class).createNew(i.getArgumentAt(2, Resource.class)));
        when(utilsService.getVersionedDistribution(any(Resource.class), any(Resource.class), any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenAnswer(i ->
                distributionFactory.createNew(i.getArgumentAt(3, Resource.class)));
        when(utilsService.getInProgressCommit(any(Resource.class), any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenAnswer(i ->
                inProgressCommitFactory.createNew(i.getArgumentAt(2, Resource.class)));
        when(utilsService.getInProgressCommitIRI(any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(Optional.of(IN_PROGRESS_COMMIT_IRI));
        when(utilsService.throwAlreadyExists(any(Resource.class), any(OrmFactory.class))).thenReturn(new IllegalArgumentException());
        when(utilsService.throwThingNotFound(any(Resource.class), any(OrmFactory.class))).thenReturn(new IllegalStateException());

        manager = new SimpleCatalogManager();
        injectOrmFactoryReferencesIntoService(manager);
        manager.setConfigProvider(configProvider);
        manager.setValueFactory(VALUE_FACTORY);
        manager.setModelFactory(MODEL_FACTORY);
        manager.setUtils(utilsService);
        manager.addRecordService(versionedRDFRecordService);
        manager.addRecordService(recordService);
        manager.addRecordService(versionedRecordService);
        manager.addRecordService(unversionedRecordService);
        manager.setMergeRequestManager(mergeRequestManager);

        manager.start();
        manager.setFactoryRegistry(ORM_FACTORY_REGISTRY);
    }

    @After
    public void tearDown() throws Exception {
        repo.shutDown();
    }

    /* getDistributedCatalog */

    @Test
    public void testGetDistributedCatalog() throws Exception {
        Catalog result = manager.getDistributedCatalog();
        verify(utilsService).getExpectedObject(eq(distributedCatalogId), eq(catalogFactory), any(RepositoryConnection.class));
        assertEquals(distributedCatalogId, result.getResource());
    }

    /* getLocalCatalog */

    @Test
    public void testGetLocalCatalog() throws Exception {
        Catalog result = manager.getLocalCatalog();
        verify(utilsService).getExpectedObject(eq(localCatalogId), eq(catalogFactory), any(RepositoryConnection.class));
        assertEquals(localCatalogId, result.getResource());
    }

    /* findRecords */

    @Test
    public void testFindRecordsReturnsCorrectDataFirstPage() throws Exception {
        // Setup:
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
    public void testFindRecordsReturnsCorrectDataSecondPage() throws Exception {
        // Setup:
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
        // Setup:
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
        // Setup:
        int limit = 1;
        int offset = 0;
        PaginatedSearchParams searchParams1 = new PaginatedSearchParams.Builder().limit(limit).offset(offset).sortBy(modifiedIRI).ascending(true).build();
        PaginatedSearchParams searchParams2 = new PaginatedSearchParams.Builder().limit(limit).offset(offset).sortBy(modifiedIRI).ascending(false).build();
        PaginatedSearchParams searchParams3 = new PaginatedSearchParams.Builder().limit(limit).offset(offset).sortBy(issuedIRI).ascending(true).build();
        PaginatedSearchParams searchParams4 = new PaginatedSearchParams.Builder().limit(limit).offset(offset).sortBy(issuedIRI).ascending(false).build();
        PaginatedSearchParams searchParams5 = new PaginatedSearchParams.Builder().limit(limit).offset(offset).sortBy(titleIRI).ascending(true).build();
        PaginatedSearchParams searchParams6 = new PaginatedSearchParams.Builder().limit(limit).offset(offset).sortBy(titleIRI).ascending(false).build();

        // when
        PaginatedSearchResults<Record> resources1 = manager.findRecord(distributedCatalogId, searchParams1);
        PaginatedSearchResults<Record> resources2 = manager.findRecord(distributedCatalogId, searchParams2);
        PaginatedSearchResults<Record> resources3 = manager.findRecord(distributedCatalogId, searchParams3);
        PaginatedSearchResults<Record> resources4 = manager.findRecord(distributedCatalogId, searchParams4);
        PaginatedSearchResults<Record> resources5 = manager.findRecord(distributedCatalogId, searchParams5);
        PaginatedSearchResults<Record> resources6 = manager.findRecord(distributedCatalogId, searchParams6);

        // then
        verify(utilsService, atLeastOnce()).getRecord(eq(distributedCatalogId), any(Resource.class), eq(recordFactory), any(RepositoryConnection.class));
        assertEquals(RECORD_IRI, resources1.getPage().iterator().next().getResource());
        assertEquals(VALUE_FACTORY.createIRI(RECORDS + "complex-record"), resources2.getPage().iterator().next().getResource());
        assertEquals(UNVERSIONED_RECORD_IRI, resources3.getPage().iterator().next().getResource());
        assertEquals(VALUE_FACTORY.createIRI(RECORDS + "complex-record"), resources4.getPage().iterator().next().getResource());
        assertEquals(VALUE_FACTORY.createIRI(RECORDS + "complex-record"), resources5.getPage().iterator().next().getResource());
        assertEquals(resources6.getPage().iterator().next().getResource().stringValue(), "http://mobi.com/test/records#versioned-record-missing-version");
    }

    @Test
    public void testFindRecordsWithSearchText() throws Exception {
        // given
        int limit = 10;
        int offset = 0;
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().limit(limit).offset(offset).searchText("Unversioned").build();
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
        // Setup:
        Repository repo2 = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo2.initialize();
        when(configProvider.getRepository()).thenReturn(repo2);
        int limit = 1;
        int offset = 0;
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().limit(limit).offset(offset).build();

        // when
        PaginatedSearchResults<Record> records = manager.findRecord(distributedCatalogId, searchParams);

        // then
        assertEquals(0, records.getPage().size());
        assertEquals(0, records.getTotalSize());
    }

    @Test
    public void testFindRecordWithNoEntries() throws Exception {
        // Setup:
        int limit = 1;
        int offset = 0;
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().limit(limit).offset(offset).build();

        // when
        PaginatedSearchResults<Record> records = manager.findRecord(localCatalogId, searchParams);

        // then
        assertEquals(0, records.getPage().size());
        assertEquals(0, records.getTotalSize());
    }

    @Test
    public void testFindRecordsWithTypeFilter() throws Exception {
        // Setup:
        int limit = 1000;
        int offset = 0;
        PaginatedSearchParams versionedSearchParams = new PaginatedSearchParams.Builder().limit(limit).offset(offset).typeFilter(versionedRecordFactory.getTypeIRI()).build();
        PaginatedSearchParams unversionedSearchParams = new PaginatedSearchParams.Builder().limit(limit).offset(offset).typeFilter(unversionedRecordFactory.getTypeIRI()).build();
        PaginatedSearchParams fullSearchParams = new PaginatedSearchParams.Builder().limit(limit).offset(offset).build();

        // when
        PaginatedSearchResults<Record> versionedRecords = manager.findRecord(distributedCatalogId, versionedSearchParams);
        PaginatedSearchResults<Record> unversionedRecords = manager.findRecord(distributedCatalogId, unversionedSearchParams);
        PaginatedSearchResults<Record> fullRecords = manager.findRecord(distributedCatalogId, fullSearchParams);

        // then
        assertTrue(true);
        assertEquals(6, versionedRecords.getPage().size());
        assertEquals(6, versionedRecords.getTotalSize());
        assertEquals(2, unversionedRecords.getPage().size());
        assertEquals(2, unversionedRecords.getTotalSize());
        assertEquals(TOTAL_SIZE, fullRecords.getPage().size());
        assertEquals(TOTAL_SIZE, fullRecords.getTotalSize());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testFindRecordWithOffsetThatIsTooLarge() {
        // given
        int limit = 10;
        int offset = 100;
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().limit(limit).offset(offset).build();
        // when
        manager.findRecord(distributedCatalogId, searchParams);
    }

    /* getRecordIds */

    @Test
    public void testGetRecordIds() throws Exception {
        Set<Resource> results = manager.getRecordIds(distributedCatalogId);
        verify(utilsService).validateResource(eq(distributedCatalogId), eq(VALUE_FACTORY.createIRI(Catalog.TYPE)), any(RepositoryConnection.class));
        assertEquals(TOTAL_SIZE, results.size());
        assertTrue(results.contains(RECORD_IRI));
        assertTrue(results.contains(UNVERSIONED_RECORD_IRI));
        assertTrue(results.contains(VERSIONED_RECORD_IRI));
        assertTrue(results.contains(VERSIONED_RDF_RECORD_IRI));
    }

    /* createRecord */

    @Test
    public void testCreateRecord() throws Exception {
        RecordOperationConfig config = new OperationConfig();
        User user = userFactory.createNew(USER_IRI);
        Set<String> names = new LinkedHashSet<>();
        names.add("Rick");
        names.add("Morty");
        Set<User> users = new LinkedHashSet<>();
        users.add(user);
        config.set(RecordCreateSettings.CATALOG_ID, localCatalogId.stringValue());
        config.set(RecordCreateSettings.RECORD_TITLE, "TestTitle");
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "TestTitle");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, names);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);

        manager.createRecord(user, config, Record.class);

        verify(recordService).create(any(User.class), any(RecordOperationConfig.class),
                any(RepositoryConnection.class));
    }

    @Test
    public void testCreateVersionedRDFRecord() throws Exception {
        RecordOperationConfig config = new OperationConfig();
        User user = userFactory.createNew(USER_IRI);
        Set<String> names = new LinkedHashSet<>();
        names.add("Rick");
        names.add("Morty");
        Set<User> users = new LinkedHashSet<>();
        users.add(user);
        config.set(RecordCreateSettings.CATALOG_ID, localCatalogId.stringValue());
        config.set(RecordCreateSettings.RECORD_TITLE, "TestTitle");
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "TestTitle");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, names);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);

        manager.createRecord(user, config, VersionedRDFRecord.class);

        verify(versionedRDFRecordService).create(any(User.class), any(RecordOperationConfig.class),
                any(RepositoryConnection.class));
    }

    @Test (expected = IllegalArgumentException.class)
    public void testCreateNoRecordService() throws Exception {
        RecordOperationConfig config = new OperationConfig();
        User user = userFactory.createNew(USER_IRI);
        Set<String> names = new LinkedHashSet<>();
        names.add("Rick");
        names.add("Morty");
        Set<User> users = new LinkedHashSet<>();
        users.add(user);
        config.set(RecordCreateSettings.CATALOG_ID, localCatalogId.stringValue());
        config.set(RecordCreateSettings.RECORD_TITLE, "TestTitle");
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "TestTitle");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, names);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);
        manager.removeRecordService(versionedRecordService);

        manager.createRecord(user, config, VersionedRecord.class);
    }

    @Test (expected = NullPointerException.class)
    public void testCreateRecordNullFactory() throws Exception {
        RecordOperationConfig config = new OperationConfig();
        User user = userFactory.createNew(USER_IRI);
        Set<String> names = new LinkedHashSet<>();
        names.add("Rick");
        names.add("Morty");
        Set<User> users = new LinkedHashSet<>();
        users.add(user);
        config.set(RecordCreateSettings.CATALOG_ID, localCatalogId.stringValue());
        config.set(RecordCreateSettings.RECORD_TITLE, "TestTitle");
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "TestTitle");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, names);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);

        manager.createRecord(user, config, null);
    }

    /* addRecord */

    @Test
    public void testAddRecord() throws Exception {
        // Setup:
        Record record = recordFactory.createNew(NEW_IRI);
        record.setProperty(USER_IRI, VALUE_FACTORY.createIRI(_Thing.publisher_IRI));

        manager.addRecord(distributedCatalogId, record);
        verify(utilsService).getObject(eq(distributedCatalogId), eq(catalogFactory), any(RepositoryConnection.class));
        verify(utilsService).addObject(eq(record), any(RepositoryConnection.class));
        assertTrue(record.getCatalog_resource().isPresent());
        assertEquals(distributedCatalogId, record.getCatalog_resource().get());
    }

    @Test
    public void testAddUnversionedRecord() throws Exception {
        // Setup:
        UnversionedRecord record = unversionedRecordFactory.createNew(NEW_IRI);
        record.setProperty(USER_IRI, VALUE_FACTORY.createIRI(_Thing.publisher_IRI));

        manager.addRecord(distributedCatalogId, record);
        verify(utilsService).getObject(eq(distributedCatalogId), eq(catalogFactory), any(RepositoryConnection.class));
        verify(utilsService).addObject(eq(record), any(RepositoryConnection.class));
        assertTrue(record.getCatalog_resource().isPresent());
        assertEquals(distributedCatalogId, record.getCatalog_resource().get());
    }

    @Test
    public void testAddVersionedRecord() throws Exception {
        // Setup:
        VersionedRecord record = versionedRecordFactory.createNew(NEW_IRI);
        record.setProperty(USER_IRI, VALUE_FACTORY.createIRI(_Thing.publisher_IRI));

        manager.addRecord(distributedCatalogId, record);
        verify(utilsService).getObject(eq(distributedCatalogId), eq(catalogFactory), any(RepositoryConnection.class));
        verify(utilsService).addObject(eq(record), any(RepositoryConnection.class));
        assertTrue(record.getCatalog_resource().isPresent());
        assertEquals(distributedCatalogId, record.getCatalog_resource().get());
    }

    @Test
    public void testAddVersionedRDFRecord() throws Exception {
        // Setup:
        VersionedRDFRecord record = versionedRDFRecordFactory.createNew(NEW_IRI);
        record.setProperty(USER_IRI, VALUE_FACTORY.createIRI(_Thing.publisher_IRI));

        manager.addRecord(distributedCatalogId, record);
        verify(utilsService).getObject(eq(distributedCatalogId), eq(catalogFactory), any(RepositoryConnection.class));
        verify(utilsService).updateObject(eq(record), any(RepositoryConnection.class));
        verify(utilsService, times(0)).addObject(eq(record), any(RepositoryConnection.class));
        verify(utilsService).addObject(any(Branch.class), any(RepositoryConnection.class));
        assertTrue(record.getCatalog_resource().isPresent());
        assertEquals(distributedCatalogId, record.getCatalog_resource().get());
        assertTrue(record.getMasterBranch_resource().isPresent());
        assertEquals(1, record.getBranch_resource().size());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddRecordWithTakenResource() {
        // Setup:
        Record record = recordFactory.createNew(RECORD_IRI);

        manager.addRecord(distributedCatalogId, record);
        verify(utilsService, times(0)).addObject(eq(record), any(RepositoryConnection.class));
        verify(utilsService).throwAlreadyExists(RECORD_IRI, recordFactory);
    }

    /* updateRecord */

    @Test
    public void testUpdateRecord() throws Exception {
        // Setup:
        Record record = recordFactory.createNew(RECORD_IRI);
        record.setKeyword(Stream.of(VALUE_FACTORY.createLiteral("keyword1")).collect(Collectors.toSet()));

        manager.updateRecord(distributedCatalogId, record);
        verify(utilsService).validateRecord(eq(distributedCatalogId), eq(RECORD_IRI), eq(VALUE_FACTORY.createIRI(Record.TYPE)), any(RepositoryConnection.class));
        verify(utilsService).updateObject(eq(record), any(RepositoryConnection.class));
    }

    @Test
    public void testUpdateUnversionedRecord() throws Exception {
        // Setup:
        UnversionedRecord record = unversionedRecordFactory.createNew(UNVERSIONED_RECORD_IRI);
        record.setKeyword(Stream.of(VALUE_FACTORY.createLiteral("keyword1")).collect(Collectors.toSet()));

        manager.updateRecord(distributedCatalogId, record);
        verify(utilsService).validateRecord(eq(distributedCatalogId), eq(UNVERSIONED_RECORD_IRI), eq(VALUE_FACTORY.createIRI(Record.TYPE)), any(RepositoryConnection.class));
        verify(utilsService).updateObject(eq(record), any(RepositoryConnection.class));
    }

    @Test
    public void testUpdateVersionedRecord() throws Exception {
        // Setup:
        VersionedRecord record = versionedRecordFactory.createNew(VERSIONED_RECORD_IRI);
        record.setKeyword(Stream.of(VALUE_FACTORY.createLiteral("keyword1")).collect(Collectors.toSet()));

        manager.updateRecord(distributedCatalogId, record);
        verify(utilsService).validateRecord(eq(distributedCatalogId), eq(VERSIONED_RECORD_IRI), eq(VALUE_FACTORY.createIRI(Record.TYPE)), any(RepositoryConnection.class));
        verify(utilsService).updateObject(eq(record), any(RepositoryConnection.class));
    }

    @Test
    public void testUpdateVersionedRDFRecord() throws Exception {
        // Setup:
        VersionedRDFRecord record = versionedRDFRecordFactory.createNew(VERSIONED_RDF_RECORD_IRI);
        record.setKeyword(Stream.of(VALUE_FACTORY.createLiteral("keyword1")).collect(Collectors.toSet()));

        manager.updateRecord(distributedCatalogId, record);
        verify(utilsService).validateRecord(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(VALUE_FACTORY.createIRI(Record.TYPE)), any(RepositoryConnection.class));
        verify(utilsService).updateObject(eq(record), any(RepositoryConnection.class));
    }

    /* removeRecord */

    @Test
    public void testRemoveRecord() throws Exception {
        // Setup:
        Record record = unversionedRecordFactory.createNew(RECORD_IRI);
        record.setCatalog(catalogFactory.createNew(distributedCatalogId));
        doReturn(Optional.of(record)).when(utilsService).optObject(eq(RECORD_IRI), eq(recordFactory), any(RepositoryConnection.class));

        Record result = manager.removeRecord(distributedCatalogId, RECORD_IRI, recordFactory);
        assertEquals(record, result);
        verify(utilsService).optObject(eq(RECORD_IRI), eq(recordFactory), any(RepositoryConnection.class));
        verify(utilsService).optObject(eq(RECORD_IRI), eq(recordFactory), any(RepositoryConnection.class));
        verify(utilsService).removeObject(any(Record.class), any(RepositoryConnection.class));
    }

    @Test
    public void testRemoveUnversionedRecord() throws Exception {
        // Setup:
        UnversionedRecord record = unversionedRecordFactory.createNew(UNVERSIONED_RECORD_IRI);
        record.setCatalog(catalogFactory.createNew(distributedCatalogId));
        Distribution dist = distributionFactory.createNew(DISTRIBUTION_IRI);
        record.setUnversionedDistribution(Collections.singleton(dist));
        doReturn(Optional.of(record)).when(utilsService).optObject(eq(UNVERSIONED_RECORD_IRI), eq(unversionedRecordFactory), any(RepositoryConnection.class));

        Record result = manager.removeRecord(distributedCatalogId, UNVERSIONED_RECORD_IRI, unversionedRecordFactory);
        assertEquals(record, result);
        record.getUnversionedDistribution_resource().forEach(resource -> verify(utilsService).remove(eq(resource), any(RepositoryConnection.class)));
        verify(utilsService).removeObject(any(UnversionedRecord.class), any(RepositoryConnection.class));
    }

    @Test
    public void testRemoveVersionedRecord() throws Exception {
        // Setup:
        VersionedRecord record = versionedRecordFactory.createNew(VERSIONED_RECORD_IRI);
        record.setCatalog(catalogFactory.createNew(distributedCatalogId));
        Version version = versionFactory.createNew(VERSION_IRI);
        record.setVersion(Collections.singleton(version));
        record.setLatestVersion(version);
        Distribution dist = distributionFactory.createNew(DISTRIBUTION_IRI);
        version.setVersionedDistribution(Collections.singleton(dist));
        doReturn(Optional.of(record)).when(utilsService).optObject(eq(VERSIONED_RECORD_IRI), eq(versionedRecordFactory), any(RepositoryConnection.class));

        Record result = manager.removeRecord(distributedCatalogId, VERSIONED_RECORD_IRI, versionedRecordFactory);
        assertEquals(record, result);
        verify(utilsService).removeVersion(eq(record.getResource()), any(Resource.class), any(RepositoryConnection.class));
        verify(utilsService).removeObject(any(VersionedRDFRecord.class), any(RepositoryConnection.class));
    }

    @Test
    public void testRemoveVersionedRDFRecord() throws Exception {
        // Setup:
        VersionedRDFRecord record = versionedRDFRecordFactory.createNew(VERSIONED_RDF_RECORD_IRI);
        record.setCatalog(catalogFactory.createNew(distributedCatalogId));
        Tag tag = tagFactory.createNew(TAG_IRI);
        Distribution dist = distributionFactory.createNew(DISTRIBUTION_IRI);
        Branch branch = branchFactory.createNew(MASTER_BRANCH_IRI);
        tag.setVersionedDistribution(Collections.singleton(dist));
        record.setVersion(Collections.singleton(tag));
        record.setLatestVersion(tag);
        record.setBranch(Collections.singleton(branch));
        record.setMasterBranch(branch);
        doReturn(Optional.of(record)).when(utilsService).optObject(eq(VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));

        Record result = manager.removeRecord(distributedCatalogId, VERSIONED_RDF_RECORD_IRI, versionedRDFRecordFactory);
        assertEquals(record, result);
        verify(mergeRequestManager).deleteMergeRequestsWithRecordId(eq(VERSIONED_RDF_RECORD_IRI), any(RepositoryConnection.class));
        verify(utilsService).removeVersion(eq(record.getResource()), any(Resource.class), any(RepositoryConnection.class));
        verify(utilsService).removeBranch(eq(record.getResource()), any(Resource.class), any(List.class), any(RepositoryConnection.class));
        verify(utilsService).removeObject(any(VersionedRDFRecord.class), any(RepositoryConnection.class));
    }

    /* deleteRecord() */

    @Test
    public void testDeleteRecord() {
        User user = userFactory.createNew(USER_IRI);
        manager.deleteRecord(user, RECORD_IRI, Record.class);

        verify(recordService).delete(eq(RECORD_IRI), eq(user), any(RepositoryConnection.class));
    }

    @Test
    public void testDeleteVersionedRecord() {
        User user = userFactory.createNew(USER_IRI);
        manager.deleteRecord(user, VERSIONED_RECORD_IRI, VersionedRecord.class);

        verify(versionedRecordService).delete(eq(VERSIONED_RECORD_IRI), eq(user), any(RepositoryConnection.class));
    }

    @Test
    public void testDeleteUnversionedRecord() {
        User user = userFactory.createNew(USER_IRI);
        manager.deleteRecord(user, UNVERSIONED_RECORD_IRI, UnversionedRecord.class);

        verify(unversionedRecordService).delete(eq(UNVERSIONED_RECORD_IRI), eq(user), any(RepositoryConnection.class));
    }

    @Test
    public void testDeleteVersionedRDFRecord() {
        User user = userFactory.createNew(USER_IRI);
        manager.deleteRecord(user, VERSIONED_RDF_RECORD_IRI, VersionedRDFRecord.class);

        verify(versionedRDFRecordService).delete(eq(VERSIONED_RDF_RECORD_IRI), eq(user), any(RepositoryConnection.class));
    }

    @Test(expected = IllegalArgumentException.class)
    public void testDeleteVersionedRDFRecordMissingService() {
        manager.removeRecordService(versionedRDFRecordService);
        User user = userFactory.createNew(USER_IRI);

        manager.deleteRecord(user, VERSIONED_RDF_RECORD_IRI, VersionedRDFRecord.class);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testDeleteClassServiceMismatch() {
        User user = userFactory.createNew(USER_IRI);

        manager.deleteRecord(user, VERSIONED_RDF_RECORD_IRI, VersionedRecord.class);
    }

    /* getRecord */

    @Test
    public void testGetRecord() throws Exception {
        // Setup:
        Record record = recordFactory.createNew(RECORD_IRI);
        record.setCatalog(catalogFactory.createNew(distributedCatalogId));
        doReturn(Optional.of(record)).when(utilsService).optObject(eq(RECORD_IRI), eq(recordFactory), any(RepositoryConnection.class));

        Optional<Record> result = manager.getRecord(distributedCatalogId, RECORD_IRI, recordFactory);
        verify(utilsService).validateResource(eq(distributedCatalogId), eq(catalogFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService).optObject(eq(RECORD_IRI), eq(recordFactory), any(RepositoryConnection.class));
        assertTrue(result.isPresent());
        assertEquals(record, result.get());
    }

    @Test
    public void testGetUnversionedRecord() throws Exception {
        // Setup:
        UnversionedRecord record = unversionedRecordFactory.createNew(UNVERSIONED_RECORD_IRI);
        record.setCatalog(catalogFactory.createNew(distributedCatalogId));
        doReturn(Optional.of(record)).when(utilsService).optObject(eq(UNVERSIONED_RECORD_IRI), eq(unversionedRecordFactory), any(RepositoryConnection.class));

        Optional<UnversionedRecord> result = manager.getRecord(distributedCatalogId, UNVERSIONED_RECORD_IRI, unversionedRecordFactory);
        verify(utilsService).validateResource(eq(distributedCatalogId), eq(catalogFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService).optObject(eq(UNVERSIONED_RECORD_IRI), eq(unversionedRecordFactory), any(RepositoryConnection.class));
        assertTrue(result.isPresent());
        assertEquals(record, result.get());
    }

    @Test
    public void testGetVersionedRecord() throws Exception {
        // Setup:
        VersionedRecord record = versionedRecordFactory.createNew(VERSIONED_RECORD_IRI);
        record.setCatalog(catalogFactory.createNew(distributedCatalogId));
        doReturn(Optional.of(record)).when(utilsService).optObject(eq(VERSIONED_RECORD_IRI), eq(versionedRecordFactory), any(RepositoryConnection.class));

        Optional<VersionedRecord> result = manager.getRecord(distributedCatalogId, VERSIONED_RECORD_IRI, versionedRecordFactory);
        verify(utilsService).validateResource(eq(distributedCatalogId), eq(catalogFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService).optObject(eq(VERSIONED_RECORD_IRI), eq(versionedRecordFactory), any(RepositoryConnection.class));
        assertTrue(result.isPresent());
        assertEquals(record, result.get());
    }

    @Test
    public void testGetVersionedRDFRecord() throws Exception {
        // Setup:
        VersionedRDFRecord record = versionedRDFRecordFactory.createNew(VERSIONED_RDF_RECORD_IRI);
        record.setCatalog(catalogFactory.createNew(distributedCatalogId));
        doReturn(Optional.of(record)).when(utilsService).optObject(eq(VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));

        Optional<VersionedRDFRecord> result = manager.getRecord(distributedCatalogId, VERSIONED_RDF_RECORD_IRI, versionedRDFRecordFactory);
        verify(utilsService).validateResource(eq(distributedCatalogId), eq(catalogFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService).optObject(eq(VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
        assertTrue(result.isPresent());
        assertEquals(record, result.get());
    }

    @Test
    public void testGetRecordWithNoCatalog() {
        // Setup:
        Record record = recordFactory.createNew(EMPTY_IRI);
        doReturn(Optional.of(record)).when(utilsService).optObject(eq(EMPTY_IRI), eq(recordFactory), any(RepositoryConnection.class));
        thrown.expect(IllegalStateException.class);
        thrown.expectMessage("Record " + EMPTY_IRI + " does not have a Catalog set");

        manager.getRecord(distributedCatalogId, EMPTY_IRI, recordFactory);
    }

    @Test
    public void testGetRecordFromWrongCatalog() {
        // Setup:
        Record record = recordFactory.createNew(RECORD_IRI);
        record.setCatalog(catalogFactory.createNew(distributedCatalogId));
        doReturn(Optional.of(record)).when(utilsService).optObject(eq(RECORD_IRI), eq(recordFactory), any(RepositoryConnection.class));

        Optional<Record> result = manager.getRecord(localCatalogId, RECORD_IRI, recordFactory);
        verify(utilsService).validateResource(eq(localCatalogId), eq(catalogFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService).optObject(eq(RECORD_IRI), eq(recordFactory), any(RepositoryConnection.class));
        assertFalse(result.isPresent());
    }

    /* getUnversionedDistributions */

    @Test
    public void testGetUnversionedDistributions() throws Exception {
        // Setup:
        UnversionedRecord record = unversionedRecordFactory.createNew(UNVERSIONED_RECORD_IRI);
        Distribution dist = distributionFactory.createNew(DISTRIBUTION_IRI);
        record.setUnversionedDistribution(Collections.singleton(dist));
        doReturn(record).when(utilsService).getRecord(eq(distributedCatalogId), eq(UNVERSIONED_RECORD_IRI), eq(unversionedRecordFactory), any(RepositoryConnection.class));

        Set<Distribution> distributions = manager.getUnversionedDistributions(distributedCatalogId, record.getResource());
        verify(utilsService).getRecord(eq(distributedCatalogId), eq(UNVERSIONED_RECORD_IRI), eq(unversionedRecordFactory), any(RepositoryConnection.class));
        record.getUnversionedDistribution_resource().forEach(resource -> verify(utilsService).getExpectedObject(eq(resource), eq(distributionFactory), any(RepositoryConnection.class)));
        assertEquals(1, distributions.size());
    }

    /* addUnversionedDistribution */

    @Test
    public void testAddUnversionedDistribution() throws Exception {
        // Setup:
        UnversionedRecord record = unversionedRecordFactory.createNew(NEW_IRI);
        doReturn(record).when(utilsService).getRecord(eq(distributedCatalogId), eq(UNVERSIONED_RECORD_IRI), eq(unversionedRecordFactory), any(RepositoryConnection.class));
        Distribution dist = distributionFactory.createNew(NEW_IRI);

        manager.addUnversionedDistribution(distributedCatalogId, UNVERSIONED_RECORD_IRI, dist);
        verify(utilsService).getRecord(eq(distributedCatalogId), eq(UNVERSIONED_RECORD_IRI), eq(unversionedRecordFactory), any(RepositoryConnection.class));
        verify(utilsService).updateObject(eq(record), any(RepositoryConnection.class));
        verify(utilsService).addObject(eq(dist), any(RepositoryConnection.class));
        assertEquals(1, record.getUnversionedDistribution_resource().size());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddUnversionedDistributionWithTakenResource() {
        // Setup:
        Distribution dist = distributionFactory.createNew(DISTRIBUTION_IRI);

        manager.addUnversionedDistribution(distributedCatalogId, UNVERSIONED_RECORD_IRI, dist);
        verify(utilsService, times(0)).addObject(eq(dist), any(RepositoryConnection.class));
        verify(utilsService).throwAlreadyExists(DISTRIBUTION_IRI, distributionFactory);
    }

    /* updateUnversionedDistribution */

    @Test
    public void testUpdateUnversionedDistribution() throws Exception {
        // Setup:
        Distribution dist = distributionFactory.createNew(DISTRIBUTION_IRI);
        dist.getModel().add(DISTRIBUTION_IRI, titleIRI, VALUE_FACTORY.createLiteral("New Title"));

        manager.updateUnversionedDistribution(distributedCatalogId, UNVERSIONED_RECORD_IRI, dist);
        verify(utilsService).validateUnversionedDistribution(eq(distributedCatalogId), eq(UNVERSIONED_RECORD_IRI), eq(DISTRIBUTION_IRI), any(RepositoryConnection.class));
        verify(utilsService).updateObject(eq(dist), any(RepositoryConnection.class));
    }

    /* removeUnversionedDistribution */

    @Test
    public void testRemoveUnversionedDistribution() throws Exception {
        // Setup:
        IRI distributionIRI = VALUE_FACTORY.createIRI(UnversionedRecord.unversionedDistribution_IRI);
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(UNVERSIONED_RECORD_IRI, distributionIRI, DISTRIBUTION_IRI, UNVERSIONED_RECORD_IRI).hasNext());

            manager.removeUnversionedDistribution(distributedCatalogId, UNVERSIONED_RECORD_IRI, DISTRIBUTION_IRI);
            verify(utilsService).getUnversionedDistribution(eq(distributedCatalogId), eq(UNVERSIONED_RECORD_IRI), eq(DISTRIBUTION_IRI), any(RepositoryConnection.class));
            verify(utilsService).removeObjectWithRelationship(eq(DISTRIBUTION_IRI), eq(UNVERSIONED_RECORD_IRI),
                    eq(UnversionedRecord.unversionedDistribution_IRI), any(RepositoryConnection.class));
        }
    }

    /* getUnversionedDistribution */

    @Test
    public void testGetUnversionedDistribution() throws Exception {
        // Setup:
        UnversionedRecord record = unversionedRecordFactory.createNew(UNVERSIONED_RECORD_IRI);
        Distribution dist = distributionFactory.createNew(DISTRIBUTION_IRI);
        record.setUnversionedDistribution(Collections.singleton(dist));
        doReturn(record).when(utilsService).getRecord(eq(distributedCatalogId), eq(UNVERSIONED_RECORD_IRI), eq(unversionedRecordFactory), any(RepositoryConnection.class));
        doReturn(dist).when(utilsService).getExpectedObject(eq(DISTRIBUTION_IRI), eq(distributionFactory), any(RepositoryConnection.class));

        Optional<Distribution> result = manager.getUnversionedDistribution(distributedCatalogId, UNVERSIONED_RECORD_IRI, DISTRIBUTION_IRI);
        verify(utilsService).getRecord(eq(distributedCatalogId), eq(UNVERSIONED_RECORD_IRI), eq(unversionedRecordFactory), any(RepositoryConnection.class));
        verify(utilsService).getExpectedObject(eq(DISTRIBUTION_IRI), eq(distributionFactory), any(RepositoryConnection.class));
        assertTrue(result.isPresent());
        assertEquals(dist, result.get());
    }

    @Test
    public void testGetUnversionedDistributionOfWrongRecord() throws Exception {
        Optional<Distribution> result = manager.getUnversionedDistribution(distributedCatalogId, UNVERSIONED_RECORD_IRI, EMPTY_IRI);
        assertFalse(result.isPresent());
    }

    /* getVersions */

    @Test
    public void testGetVersions() throws Exception {
        // Setup:
        VersionedRecord record = versionedRecordFactory.createNew(VERSIONED_RECORD_IRI);
        Version version = versionFactory.createNew(VERSION_IRI);
        record.setVersion(Collections.singleton(version));
        doReturn(record).when(utilsService).getRecord(eq(distributedCatalogId), eq(VERSIONED_RECORD_IRI), eq(versionedRecordFactory), any(RepositoryConnection.class));

        Set<Version> versions = manager.getVersions(distributedCatalogId, VERSIONED_RECORD_IRI);
        verify(utilsService).getRecord(eq(distributedCatalogId), eq(VERSIONED_RECORD_IRI), eq(versionedRecordFactory), any(RepositoryConnection.class));
        record.getVersion_resource().forEach(resource -> verify(utilsService).getExpectedObject(eq(resource), eq(versionFactory), any(RepositoryConnection.class)));
        assertEquals(1, versions.size());
    }

    /* addVersion */

    @Test
    public void testAddVersion() throws Exception {
        // Setup:
        VersionedRecord record = versionedRecordFactory.createNew(VERSIONED_RECORD_IRI);
        doReturn(record).when(utilsService).getRecord(eq(distributedCatalogId), eq(VERSIONED_RECORD_IRI), eq(versionedRecordFactory), any(RepositoryConnection.class));
        Version version = versionFactory.createNew(NEW_IRI);

        manager.addVersion(distributedCatalogId, VERSIONED_RECORD_IRI, version);
        verify(utilsService).getRecord(eq(distributedCatalogId), eq(VERSIONED_RECORD_IRI), eq(versionedRecordFactory), any(RepositoryConnection.class));
        verify(utilsService).updateObject(eq(record), any(RepositoryConnection.class));
        verify(utilsService).addObject(eq(version), any(RepositoryConnection.class));
        assertTrue(record.getLatestVersion_resource().isPresent());
        assertEquals(NEW_IRI, record.getLatestVersion_resource().get());
        assertEquals(1, record.getVersion_resource().size());
    }

    @Test
    public void testAddTag() throws Exception {
        // Setup:
        VersionedRDFRecord record = versionedRDFRecordFactory.createNew(VERSIONED_RDF_RECORD_IRI);
        doReturn(record).when(utilsService).getRecord(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(versionedRecordFactory), any(RepositoryConnection.class));
        Tag tag = tagFactory.createNew(NEW_IRI);

        manager.addVersion(distributedCatalogId, VERSIONED_RDF_RECORD_IRI, tag);
        verify(utilsService).getRecord(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(versionedRecordFactory), any(RepositoryConnection.class));
        verify(utilsService).updateObject(eq(record), any(RepositoryConnection.class));
        verify(utilsService).addObject(eq(tag), any(RepositoryConnection.class));
        assertTrue(record.getLatestVersion_resource().isPresent());
        assertEquals(NEW_IRI, record.getLatestVersion_resource().get());
        assertEquals(1, record.getVersion_resource().size());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddVersionWithTakenResource() {
        // Setup:
        Version version = versionFactory.createNew(VERSION_IRI);

        manager.addVersion(distributedCatalogId, VERSIONED_RECORD_IRI, version);
        verify(utilsService, times(0)).addObject(eq(version), any(RepositoryConnection.class));
        verify(utilsService).throwAlreadyExists(VERSION_IRI, distributionFactory);
    }

    /* updateVersion */

    @Test
    public void testUpdateVersion() throws Exception {
        // Setup:
        Version version = versionFactory.createNew(VERSION_IRI);
        version.getModel().add(VERSION_IRI, titleIRI, VALUE_FACTORY.createLiteral("New Title"));

        manager.updateVersion(distributedCatalogId, VERSIONED_RECORD_IRI, version);
        verify(utilsService).validateVersion(eq(distributedCatalogId), eq(VERSIONED_RECORD_IRI), eq(VERSION_IRI), any(RepositoryConnection.class));
        verify(utilsService).updateObject(eq(version), any(RepositoryConnection.class));
    }

    @Test
    public void testUpdateTag() throws Exception {
        // Setup:
        Tag tag = tagFactory.createNew(TAG_IRI);
        tag.getModel().add(TAG_IRI, titleIRI, VALUE_FACTORY.createLiteral("New Title"));

        manager.updateVersion(distributedCatalogId, VERSIONED_RDF_RECORD_IRI, tag);
        verify(utilsService).validateVersion(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(TAG_IRI), any(RepositoryConnection.class));
        verify(utilsService).updateObject(eq(tag), any(RepositoryConnection.class));
    }

    /* removeVersion */

    @Test
    public void testRemoveVersion() throws Exception {
        // Setup:
        IRI versionIRI = VALUE_FACTORY.createIRI(VersionedRecord.version_IRI);
        IRI latestIRI = VALUE_FACTORY.createIRI(VersionedRecord.latestVersion_IRI);
        Version version = versionFactory.createNew(LATEST_VERSION_IRI);
        version.setVersionedDistribution(Collections.singleton(distributionFactory.createNew(DISTRIBUTION_IRI)));
        doReturn(version).when(utilsService).getVersion(eq(distributedCatalogId), eq(VERSIONED_RECORD_IRI), eq(LATEST_VERSION_IRI), eq(versionFactory), any(RepositoryConnection.class));
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(VERSIONED_RECORD_IRI, latestIRI, LATEST_VERSION_IRI, VERSIONED_RECORD_IRI).hasNext());
            assertTrue(conn.getStatements(VERSIONED_RECORD_IRI, versionIRI, LATEST_VERSION_IRI, VERSIONED_RECORD_IRI).hasNext());

            manager.removeVersion(distributedCatalogId, VERSIONED_RECORD_IRI, LATEST_VERSION_IRI);
            verify(utilsService).getVersion(eq(distributedCatalogId), eq(VERSIONED_RECORD_IRI), eq(LATEST_VERSION_IRI), eq(versionFactory), any(RepositoryConnection.class));
            verify(utilsService).removeVersion(eq(VERSIONED_RECORD_IRI), eq(version), any(RepositoryConnection.class));
        }
    }

    /* getVersion */

    @Test
    public void testGetVersion() throws Exception {
        // Setup:
        VersionedRecord record = versionedRecordFactory.createNew(VERSIONED_RECORD_IRI);
        Version version = versionFactory.createNew(VERSION_IRI);
        record.setVersion(Collections.singleton(version));
        doReturn(record).when(utilsService).getRecord(eq(distributedCatalogId), eq(VERSIONED_RECORD_IRI), eq(versionedRecordFactory), any(RepositoryConnection.class));
        doReturn(version).when(utilsService).getExpectedObject(eq(VERSION_IRI), eq(versionFactory), any(RepositoryConnection.class));

        Optional<Version> result = manager.getVersion(distributedCatalogId, VERSIONED_RECORD_IRI, VERSION_IRI, versionFactory);
        verify(utilsService).getRecord(eq(distributedCatalogId), eq(VERSIONED_RECORD_IRI), eq(versionedRecordFactory), any(RepositoryConnection.class));
        verify(utilsService).getExpectedObject(eq(VERSION_IRI), eq(versionFactory), any(RepositoryConnection.class));
        assertTrue(result.isPresent());
        assertEquals(version, result.get());
    }

    @Test
    public void testGetTag() throws Exception {
        // Setup:
        VersionedRDFRecord record = versionedRDFRecordFactory.createNew(VERSIONED_RDF_RECORD_IRI);
        Tag tag = tagFactory.createNew(TAG_IRI);
        record.setVersion(Collections.singleton(tag));
        doReturn(record).when(utilsService).getRecord(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(versionedRecordFactory), any(RepositoryConnection.class));
        doReturn(tag).when(utilsService).getExpectedObject(eq(TAG_IRI), eq(tagFactory), any(RepositoryConnection.class));

        Optional<Tag> result = manager.getVersion(distributedCatalogId, VERSIONED_RDF_RECORD_IRI, TAG_IRI, tagFactory);
        verify(utilsService).getRecord(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(versionedRecordFactory), any(RepositoryConnection.class));
        verify(utilsService).getExpectedObject(eq(TAG_IRI), eq(tagFactory), any(RepositoryConnection.class));
        assertTrue(result.isPresent());
        assertEquals(tag, result.get());
    }

    @Test
    public void testGetVersionOfWrongRecord() throws Exception {
        Optional<Version> result = manager.getVersion(distributedCatalogId, VERSIONED_RECORD_IRI, EMPTY_IRI, versionFactory);
        assertFalse(result.isPresent());
    }

    /* getLatestVersion */

    @Test
    public void getLatestVersion() throws Exception {
        // Setup:
        VersionedRecord record = versionedRecordFactory.createNew(VERSIONED_RECORD_IRI);
        Version version = versionFactory.createNew(LATEST_VERSION_IRI);
        record.setLatestVersion(version);
        doReturn(record).when(utilsService).getRecord(eq(distributedCatalogId), eq(VERSIONED_RECORD_IRI), eq(versionedRecordFactory), any(RepositoryConnection.class));
        doReturn(version).when(utilsService).getExpectedObject(eq(LATEST_VERSION_IRI), eq(versionFactory), any(RepositoryConnection.class));

        Optional<Version> result = manager.getLatestVersion(distributedCatalogId, VERSIONED_RECORD_IRI, versionFactory);
        verify(utilsService).getRecord(eq(distributedCatalogId), eq(VERSIONED_RECORD_IRI), eq(versionedRecordFactory), any(RepositoryConnection.class));
        verify(utilsService).getExpectedObject(eq(LATEST_VERSION_IRI), eq(versionFactory), any(RepositoryConnection.class));
        assertTrue(result.isPresent());
        assertEquals(version, result.get());
    }

    @Test
    public void getLatestTag() throws Exception {
        // Setup:
        VersionedRDFRecord record = versionedRDFRecordFactory.createNew(VERSIONED_RDF_RECORD_IRI);
        Tag tag = tagFactory.createNew(TAG_IRI);
        record.setLatestVersion(tag);
        doReturn(record).when(utilsService).getRecord(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(versionedRecordFactory), any(RepositoryConnection.class));
        doReturn(tag).when(utilsService).getExpectedObject(eq(TAG_IRI), eq(tagFactory), any(RepositoryConnection.class));

        Optional<Tag> result = manager.getLatestVersion(distributedCatalogId, VERSIONED_RDF_RECORD_IRI, tagFactory);
        verify(utilsService).getRecord(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(versionedRecordFactory), any(RepositoryConnection.class));
        verify(utilsService).getExpectedObject(eq(TAG_IRI), eq(tagFactory), any(RepositoryConnection.class));
        assertTrue(result.isPresent());
        assertEquals(tag, result.get());
    }

    @Test
    public void getLatestVersionOnRecordNotSet() {
        Optional<Version> result = manager.getLatestVersion(distributedCatalogId, VERSIONED_RECORD_IRI, versionFactory);
        assertFalse(result.isPresent());
    }

    /* getTaggedCommit */

    @Test
    public void testGetTaggedCommit() throws Exception {
        // Setup:
        Tag tag = tagFactory.createNew(TAG_IRI);
        Commit commit = commitFactory.createNew(COMMIT_IRI);
        tag.setCommit(commit);
        doReturn(tag).when(utilsService).getExpectedObject(eq(TAG_IRI), eq(tagFactory), any(RepositoryConnection.class));
        doReturn(commit).when(utilsService).getExpectedObject(eq(COMMIT_IRI), eq(commitFactory), any(RepositoryConnection.class));

        Commit result = manager.getTaggedCommit(distributedCatalogId, VERSIONED_RDF_RECORD_IRI, TAG_IRI);
        verify(utilsService).validateVersion(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(TAG_IRI), any(RepositoryConnection.class));
        verify(utilsService).getExpectedObject(eq(TAG_IRI), eq(tagFactory), any(RepositoryConnection.class));
        verify(utilsService).getExpectedObject(eq(COMMIT_IRI), eq(commitFactory), any(RepositoryConnection.class));
        assertEquals(commit, result);
    }

    @Test
    public void testGetTaggedCommitWithoutCommitSet() {
        // Setup:
        thrown.expect(IllegalStateException.class);
        thrown.expectMessage("Tag " + TAG_IRI + " does not have a Commit set");

        manager.getTaggedCommit(distributedCatalogId, VERSIONED_RDF_RECORD_IRI, TAG_IRI);
    }

    /* getVersionedDistributions */

    @Test
    public void testGetVersionedDistributions() throws Exception {
        // Setup:
        Version version = versionFactory.createNew(VERSION_IRI);
        Distribution dist = distributionFactory.createNew(DISTRIBUTION_IRI);
        version.setVersionedDistribution(Collections.singleton(dist));
        doReturn(version).when(utilsService).getVersion(eq(distributedCatalogId), eq(VERSIONED_RECORD_IRI), eq(VERSION_IRI), eq(versionFactory), any(RepositoryConnection.class));

        Set<Distribution> distributions = manager.getVersionedDistributions(distributedCatalogId, VERSIONED_RECORD_IRI, VERSION_IRI);
        verify(utilsService).getVersion(eq(distributedCatalogId), eq(VERSIONED_RECORD_IRI), eq(VERSION_IRI), eq(versionFactory), any(RepositoryConnection.class));
        version.getVersionedDistribution_resource().forEach(resource -> verify(utilsService).getExpectedObject(eq(resource), eq(distributionFactory), any(RepositoryConnection.class)));
        assertEquals(1, distributions.size());
    }

    /* addVersionedDistribution */

    @Test
    public void testAddVersionedDistribution() throws Exception {
        // Setup:
        Version version = versionFactory.createNew(VERSION_IRI);
        Distribution dist = distributionFactory.createNew(NEW_IRI);
        doReturn(version).when(utilsService).getVersion(eq(distributedCatalogId), eq(VERSIONED_RECORD_IRI), eq(VERSION_IRI), eq(versionFactory), any(RepositoryConnection.class));

        manager.addVersionedDistribution(distributedCatalogId, VERSIONED_RECORD_IRI, VERSION_IRI, dist);
        verify(utilsService).getVersion(eq(distributedCatalogId), eq(VERSIONED_RECORD_IRI), eq(VERSION_IRI), eq(versionFactory), any(RepositoryConnection.class));
        verify(utilsService).updateObject(eq(version), any(RepositoryConnection.class));
        verify(utilsService).addObject(eq(dist), any(RepositoryConnection.class));
        assertEquals(1, version.getVersionedDistribution_resource().size());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddVersionedDistributionWithTakenResource() {
        // Setup:
        Distribution dist = distributionFactory.createNew(DISTRIBUTION_IRI);

        manager.addVersionedDistribution(distributedCatalogId, VERSIONED_RECORD_IRI, VERSION_IRI, dist);
        verify(utilsService, times(0)).addObject(eq(dist), any(RepositoryConnection.class));
        verify(utilsService).throwAlreadyExists(DISTRIBUTION_IRI, distributionFactory);
    }

    /* updateVersionedDistribution */

    @Test
    public void testUpdateVersionedDistribution() throws Exception {
        // Setup:
        Distribution dist = distributionFactory.createNew(DISTRIBUTION_IRI);
        dist.getModel().add(DISTRIBUTION_IRI, titleIRI, VALUE_FACTORY.createLiteral("New Title"));

        manager.updateVersionedDistribution(distributedCatalogId, VERSIONED_RECORD_IRI, VERSION_IRI, dist);
        verify(utilsService).validateVersionedDistribution(eq(distributedCatalogId), eq(VERSIONED_RECORD_IRI), eq(VERSION_IRI), eq(DISTRIBUTION_IRI), any(RepositoryConnection.class));
        verify(utilsService).updateObject(eq(dist), any(RepositoryConnection.class));
    }

    /* removeVersionedDistribution */

    @Test
    public void testRemoveVersionedDistribution() throws Exception {
        // Setup:
        IRI distributionIRI = VALUE_FACTORY.createIRI(Version.versionedDistribution_IRI);
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.getStatements(VERSION_IRI, distributionIRI, DISTRIBUTION_IRI, VERSION_IRI).hasNext());

            manager.removeVersionedDistribution(distributedCatalogId, VERSIONED_RECORD_IRI, VERSION_IRI, DISTRIBUTION_IRI);
            verify(utilsService).getVersionedDistribution(eq(distributedCatalogId), eq(VERSIONED_RECORD_IRI), eq(VERSION_IRI), eq(DISTRIBUTION_IRI), any(RepositoryConnection.class));
            verify(utilsService).removeObjectWithRelationship(eq(DISTRIBUTION_IRI), eq(VERSION_IRI),
                    eq(Version.versionedDistribution_IRI), any(RepositoryConnection.class));
        }
    }

    /* getVersionedDistribution */

    @Test
    public void testGetVersionedDistribution() throws Exception {
        // Setup:
        Version version = versionFactory.createNew(VERSION_IRI);
        Distribution dist = distributionFactory.createNew(DISTRIBUTION_IRI);
        version.setVersionedDistribution(Collections.singleton(dist));
        doReturn(version).when(utilsService).getVersion(eq(distributedCatalogId), eq(VERSIONED_RECORD_IRI), eq(VERSION_IRI), eq(versionFactory), any(RepositoryConnection.class));
        doReturn(dist).when(utilsService).getExpectedObject(eq(DISTRIBUTION_IRI), eq(distributionFactory), any(RepositoryConnection.class));

        Optional<Distribution> result = manager.getVersionedDistribution(distributedCatalogId, VERSIONED_RECORD_IRI, VERSION_IRI, DISTRIBUTION_IRI);
        verify(utilsService).getVersion(eq(distributedCatalogId), eq(VERSIONED_RECORD_IRI), eq(VERSION_IRI), eq(versionFactory), any(RepositoryConnection.class));
        verify(utilsService).getExpectedObject(eq(DISTRIBUTION_IRI), eq(distributionFactory), any(RepositoryConnection.class));
        assertTrue(result.isPresent());
        assertEquals(dist, result.get());
    }

    @Test
    public void testGetVersionedDistributionOfWrongVersion() {
        Optional<Distribution> result = manager.getVersionedDistribution(distributedCatalogId, VERSIONED_RECORD_IRI, VERSION_IRI, EMPTY_IRI);
        assertFalse(result.isPresent());
    }

    /* getBranches */

    @Test
    public void testGetBranches() throws Exception {
        // Setup:
        VersionedRDFRecord record = versionedRDFRecordFactory.createNew(VERSIONED_RDF_RECORD_IRI);
        record.setBranch(Collections.singleton(branchFactory.createNew(BRANCH_IRI)));
        doReturn(record).when(utilsService).getRecord(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));

        Set<Branch> branches = manager.getBranches(distributedCatalogId, VERSIONED_RDF_RECORD_IRI);
        verify(utilsService).getRecord(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
        record.getBranch_resource().forEach(resource -> verify(utilsService).getExpectedObject(eq(resource), eq(branchFactory), any(RepositoryConnection.class)));
        assertEquals(1, branches.size());
    }

    /* addBranch */

    @Test
    public void testAddBranch() throws Exception {
        // Setup:
        VersionedRDFRecord record = versionedRDFRecordFactory.createNew(VERSIONED_RDF_RECORD_IRI);
        doReturn(record).when(utilsService).getRecord(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
        Branch branch = branchFactory.createNew(NEW_IRI);

        manager.addBranch(distributedCatalogId, VERSIONED_RDF_RECORD_IRI, branch);
        verify(utilsService).getRecord(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
        verify(utilsService).updateObject(eq(record), any(RepositoryConnection.class));
        verify(utilsService).addObject(eq(branch), any(RepositoryConnection.class));
        assertEquals(1, record.getBranch_resource().size());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddBranchWithTakenResource() {
        // Setup:
        Branch branch = branchFactory.createNew(BRANCH_IRI);

        manager.addBranch(distributedCatalogId, VERSIONED_RDF_RECORD_IRI, branch);
        verify(utilsService, times(0)).addObject(eq(branch), any(RepositoryConnection.class));
        verify(utilsService).throwAlreadyExists(BRANCH_IRI, distributionFactory);
    }

    /* addMasterBranch */

    @Test
    public void testAddMasterBranch() throws Exception {
        // Setup:
        VersionedRDFRecord record = versionedRDFRecordFactory.createNew(VERSIONED_RDF_RECORD_IRI);
        doReturn(record).when(utilsService).getRecord(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));

        manager.addMasterBranch(distributedCatalogId, VERSIONED_RDF_RECORD_IRI);
        verify(utilsService).getRecord(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
        verify(utilsService).updateObject(eq(record), any(RepositoryConnection.class));
        verify(utilsService).addObject(any(Branch.class), any(RepositoryConnection.class));
        assertTrue(record.getMasterBranch_resource().isPresent());
        assertEquals(1, record.getBranch_resource().size());
    }

    @Test
    public void testAddMasterBranchToRecordWithMasterBranchAlready() {
        // Setup:
        VersionedRDFRecord record = versionedRDFRecordFactory.createNew(VERSIONED_RDF_RECORD_IRI);
        record.setMasterBranch(branchFactory.createNew(MASTER_BRANCH_IRI));
        doReturn(record).when(utilsService).getRecord(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
        thrown.expect(IllegalStateException.class);
        thrown.expectMessage("Record " + VERSIONED_RDF_RECORD_IRI + " already has a master Branch.");

        manager.addMasterBranch(distributedCatalogId, VERSIONED_RDF_RECORD_IRI);
        verify(utilsService, times(0)).addObject(any(Branch.class), any(RepositoryConnection.class));
    }

    /* updateBranch */

    @Test
    public void testUpdateBranch() throws Exception {
        // Setup:
        Branch branch = branchFactory.createNew(BRANCH_IRI);
        branch.getModel().add(BRANCH_IRI, titleIRI, VALUE_FACTORY.createLiteral("New Title"));

        manager.updateBranch(distributedCatalogId, VERSIONED_RDF_RECORD_IRI, branch);
        verify(utilsService).validateBranch(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(BRANCH_IRI), any(RepositoryConnection.class));
        verify(utilsService).updateObject(eq(branch), any(RepositoryConnection.class));
    }

    @Test
    public void testUpdateUserBranch() throws Exception {
        // Setup:
        UserBranch branch = userBranchFactory.createNew(USER_BRANCH_IRI);
        branch.getModel().add(USER_BRANCH_IRI, titleIRI, VALUE_FACTORY.createLiteral("New Title"));

        manager.updateBranch(distributedCatalogId, VERSIONED_RDF_RECORD_IRI, branch);
        verify(utilsService).validateBranch(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(USER_BRANCH_IRI), any(RepositoryConnection.class));
        verify(utilsService).updateObject(eq(branch), any(RepositoryConnection.class));
    }

    @Test
    public void testUpdateMasterBranch() {
        // Setup:
        Branch branch = branchFactory.createNew(MASTER_BRANCH_IRI);
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Branch " + MASTER_BRANCH_IRI + " is the master Branch and cannot be updated.");

        manager.updateBranch(distributedCatalogId, VERSIONED_RDF_RECORD_IRI, branch);
        verify(utilsService, times(0)).updateObject(eq(branch), any(RepositoryConnection.class));
    }

    /* updateHead */

    @Test
    public void testUpdateHead() throws Exception {
        // Setup:
        Branch branch = branchFactory.createNew(BRANCH_IRI);
        doReturn(branch).when(utilsService).getBranch(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(BRANCH_IRI), eq(branchFactory), any(RepositoryConnection.class));

        manager.updateHead(distributedCatalogId, VERSIONED_RDF_RECORD_IRI, BRANCH_IRI, COMMIT_IRI);
        verify(utilsService).getBranch(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(BRANCH_IRI), eq(branchFactory), any(RepositoryConnection.class));
        verify(utilsService).validateResource(eq(COMMIT_IRI), eq(commitFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService).updateObject(eq(branch), any(RepositoryConnection.class));
        assertTrue(branch.getHead_resource().isPresent());
        assertEquals(COMMIT_IRI, branch.getHead_resource().get());
    }

    /* removeBranch */

    @Test
    public void testRemoveBranch() throws Exception {
        manager.removeBranch(distributedCatalogId, VERSIONED_RDF_RECORD_IRI, BRANCH_IRI);
        verify(utilsService).getBranch(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(BRANCH_IRI), eq(branchFactory), any(RepositoryConnection.class));
        verify(utilsService).removeBranch(eq(VERSIONED_RDF_RECORD_IRI), any(Branch.class), any(RepositoryConnection.class));
        verify(mergeRequestManager).cleanMergeRequests(eq(VERSIONED_RDF_RECORD_IRI), eq(BRANCH_IRI), any(RepositoryConnection.class));
    }

    @Test
    public void testRemoveMasterBranch() {
        // Setup:
        Branch branch = branchFactory.createNew(MASTER_BRANCH_IRI);
        doReturn(branch).when(utilsService).getBranch(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(MASTER_BRANCH_IRI), eq(branchFactory), any(RepositoryConnection.class));
        thrown.expect(IllegalStateException.class);
        thrown.expectMessage("Branch " + MASTER_BRANCH_IRI + " is the master Branch and cannot be removed.");

        manager.removeBranch(distributedCatalogId, VERSIONED_RDF_RECORD_IRI, MASTER_BRANCH_IRI);
        verify(utilsService).getBranch(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(MASTER_BRANCH_IRI), eq(branchFactory), any(RepositoryConnection.class));
        verify(utilsService, times(0)).remove(eq(MASTER_BRANCH_IRI), any(RepositoryConnection.class));
    }

    /* getBranch */

    @Test
    public void testGetBranch() throws Exception {
        // Setup:
        VersionedRDFRecord record = versionedRDFRecordFactory.createNew(VERSIONED_RDF_RECORD_IRI);
        Branch branch = branchFactory.createNew(BRANCH_IRI);
        record.setBranch(Collections.singleton(branch));
        doReturn(record).when(utilsService).getRecord(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
        doReturn(branch).when(utilsService).getExpectedObject(eq(BRANCH_IRI), eq(branchFactory), any(RepositoryConnection.class));

        Optional<Branch> result = manager.getBranch(distributedCatalogId, VERSIONED_RDF_RECORD_IRI, BRANCH_IRI, branchFactory);
        verify(utilsService).getRecord(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
        verify(utilsService).getExpectedObject(eq(BRANCH_IRI), eq(branchFactory), any(RepositoryConnection.class));
        assertTrue(result.isPresent());
        assertEquals(branch, result.get());
    }

    @Test
    public void testGetUserBranch() throws Exception {
        // Setup:
        VersionedRDFRecord record = versionedRDFRecordFactory.createNew(VERSIONED_RDF_RECORD_IRI);
        UserBranch branch = userBranchFactory.createNew(USER_BRANCH_IRI);
        record.setBranch(Collections.singleton(branch));
        doReturn(record).when(utilsService).getRecord(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
        doReturn(branch).when(utilsService).getExpectedObject(eq(USER_BRANCH_IRI), eq(userBranchFactory), any(RepositoryConnection.class));

        Optional<UserBranch> result = manager.getBranch(distributedCatalogId, VERSIONED_RDF_RECORD_IRI, USER_BRANCH_IRI, userBranchFactory);
        verify(utilsService).getRecord(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
        verify(utilsService).getExpectedObject(eq(USER_BRANCH_IRI), eq(userBranchFactory), any(RepositoryConnection.class));
        assertTrue(result.isPresent());
        assertEquals(branch, result.get());
    }

    @Test
    public void testGetBranchOfWrongRecord() throws Exception {
        Optional<Branch> result = manager.getBranch(distributedCatalogId, VERSIONED_RDF_RECORD_IRI, EMPTY_IRI, branchFactory);
        assertFalse(result.isPresent());
    }

    /* getMasterBranch */

    @Test
    public void testGetMasterBranch() throws Exception {
        // Setup:
        VersionedRDFRecord record = versionedRDFRecordFactory.createNew(VERSIONED_RDF_RECORD_IRI);
        Branch branch = branchFactory.createNew(MASTER_BRANCH_IRI);
        record.setMasterBranch(branch);
        doReturn(record).when(utilsService).getRecord(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
        doReturn(branch).when(utilsService).getExpectedObject(eq(MASTER_BRANCH_IRI), eq(branchFactory), any(RepositoryConnection.class));

        Branch result = manager.getMasterBranch(distributedCatalogId, VERSIONED_RDF_RECORD_IRI);
        verify(utilsService).getRecord(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
        verify(utilsService).getExpectedObject(eq(MASTER_BRANCH_IRI), eq(branchFactory), any(RepositoryConnection.class));
        assertEquals(branch, result);
    }

    @Test
    public void testGetMasterBranchOfRecordWithoutMasterSet() {
        // Setup:
        thrown.expect(IllegalStateException.class);
        thrown.expectMessage("Record " + VERSIONED_RDF_RECORD_IRI + " does not have a master Branch set.");

        manager.getMasterBranch(distributedCatalogId, VERSIONED_RDF_RECORD_IRI);
    }

    /* createCommit */

    @Test
    public void testCreateCommit() throws Exception {
        // Setup:
        IRI provGenerated = VALUE_FACTORY.createIRI(Activity.generated_IRI);
        IRI provAtTime = VALUE_FACTORY.createIRI(InstantaneousEvent.atTime_IRI);
        IRI provWasAssociatedWith = VALUE_FACTORY.createIRI(Activity.wasAssociatedWith_IRI);
        IRI revisionId = VALUE_FACTORY.createIRI("http://mobi.com/revisions#test");
        Resource generation = VALUE_FACTORY.createIRI("http://mobi.com/test");
        Resource generation2 = VALUE_FACTORY.createIRI("http://mobi.com/test2");
        Commit base = commitFactory.createNew(COMMIT_IRI);
        base.setProperty(generation, provGenerated);
        Commit auxiliary = commitFactory.createNew(COMMIT_IRI);
        auxiliary.setProperty(generation2, provGenerated);
        InProgressCommit inProgressCommit = inProgressCommitFactory.createNew(IN_PROGRESS_COMMIT_IRI);
        inProgressCommit.setProperty(VALUE_FACTORY.createIRI("http://mobi.com/user"), provWasAssociatedWith);
        inProgressCommit.setProperty(revisionId, provGenerated);
        Revision revision = revisionFactory.createNew(revisionId);
        inProgressCommit.getModel().addAll(revision.getModel());

        Commit result = manager.createCommit(inProgressCommit, "message", null, null);
        assertTrue(result.getProperty(provAtTime).isPresent());
        assertEquals("message", result.getProperty(titleIRI).get().stringValue());
        assertFalse(result.getBaseCommit().isPresent());
        assertFalse(result.getAuxiliaryCommit().isPresent());
        assertFalse(result.getModel().contains(IN_PROGRESS_COMMIT_IRI, null, null));
        assertTrue(result.getModel().contains(revisionId, null, null));

        result = manager.createCommit(inProgressCommit, "message", base, auxiliary);
        assertTrue(result.getProperty(provAtTime).isPresent());
        assertEquals("message", result.getProperty(titleIRI).get().stringValue());
        assertTrue(result.getBaseCommit_resource().isPresent() && result.getBaseCommit_resource().get().equals(COMMIT_IRI));
        assertTrue(result.getAuxiliaryCommit_resource().isPresent() && result.getAuxiliaryCommit_resource().get().equals(COMMIT_IRI));
        assertFalse(result.getModel().contains(IN_PROGRESS_COMMIT_IRI, null, null));
        assertTrue(result.getModel().contains(revisionId, null, null));
    }

    @Test
    public void testCreateCommitWithOnlyAuxiliary() {
        //Setup:
        InProgressCommit inProgressCommit = inProgressCommitFactory.createNew(IN_PROGRESS_COMMIT_IRI);
        Commit auxiliary = commitFactory.createNew(COMMIT_IRI);
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Commit must have a base commit in order to have an auxiliary commit");

        manager.createCommit(inProgressCommit, "message", null, auxiliary);
    }

    /* createInProgressCommit */

    @Test
    public void testCreateInProgressCommit() throws Exception {
        // Setup:
        IRI provWasDerivedFrom = VALUE_FACTORY.createIRI(Entity.wasDerivedFrom_IRI);
        IRI provGenerated = VALUE_FACTORY.createIRI(Activity.generated_IRI);
        IRI provWasAssociatedWith = VALUE_FACTORY.createIRI(Activity.wasAssociatedWith_IRI);
        IRI provWasInformedBy = VALUE_FACTORY.createIRI(Activity.wasInformedBy_IRI);
        User user = userFactory.createNew(USER_IRI);

        InProgressCommit result = manager.createInProgressCommit(user);
        assertTrue(result.getProperty(provWasAssociatedWith).isPresent());
        assertEquals(USER_IRI.stringValue(), result.getProperty(provWasAssociatedWith).get().stringValue());
        assertTrue(result.getProperty(provGenerated).isPresent());
        Revision revision = revisionFactory.createNew((Resource) result.getProperty(provGenerated).get(),
                result.getModel());
        assertTrue(revision.getAdditions().isPresent());
        assertTrue(revision.getDeletions().isPresent());

        result = manager.createInProgressCommit(user);
        assertEquals(USER_IRI.stringValue(), result.getProperty(provWasAssociatedWith).get().stringValue());
        assertTrue(result.getProperty(provGenerated).isPresent());
        assertFalse(result.getProperty(provWasInformedBy).isPresent());
        revision = revisionFactory.createNew((Resource) result.getProperty(provGenerated).get(),
                result.getModel());
        assertTrue(revision.getAdditions().isPresent());
        assertTrue(revision.getDeletions().isPresent());
        assertFalse(revision.getProperty(provWasDerivedFrom).isPresent());
    }

    /* updateInProgressCommit(Resource, Resource, Resource, Model, Model) */

    @Test
    public void testUpdateInProgressCommit() throws Exception {
        // Setup:
        Model additions = MODEL_FACTORY.createModel();
        Model deletions = MODEL_FACTORY.createModel();

        manager.updateInProgressCommit(distributedCatalogId, VERSIONED_RDF_RECORD_IRI, IN_PROGRESS_COMMIT_IRI, additions, deletions);
        verify(utilsService).validateInProgressCommit(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(IN_PROGRESS_COMMIT_IRI), any(RepositoryConnection.class));
        verify(utilsService).updateCommit(eq(IN_PROGRESS_COMMIT_IRI), eq(additions), eq(deletions), any(RepositoryConnection.class));
    }

    /* updateInProgressCommit(Resource, Resource, Resource, Model, Model) */

    @Test
    public void testUpdateInProgressCommitWithUser() throws Exception {
        // Setup:
        User user = userFactory.createNew(USER_IRI);
        Model additions = MODEL_FACTORY.createModel();
        Model deletions = MODEL_FACTORY.createModel();
        InProgressCommit commit = inProgressCommitFactory.createNew(IN_PROGRESS_COMMIT_IRI);
        doReturn(commit).when(utilsService).getExpectedObject(eq(IN_PROGRESS_COMMIT_IRI), eq(inProgressCommitFactory), any(RepositoryConnection.class));

        manager.updateInProgressCommit(distributedCatalogId, VERSIONED_RDF_RECORD_IRI, user, additions, deletions);
        verify(utilsService).validateRecord(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService).getInProgressCommitIRI(eq(VERSIONED_RDF_RECORD_IRI), eq(USER_IRI), any(RepositoryConnection.class));
        verify(utilsService).updateCommit(eq(commit), eq(additions), eq(deletions), any(RepositoryConnection.class));
    }

    /* addInProgressCommit */

    @Test
    public void testAddInProgressCommit() throws Exception {
        // Setup:
        User user = userFactory.createNew(USER_IRI);
        InProgressCommit commit = inProgressCommitFactory.createNew(NEW_IRI);
        commit.setProperty(user.getResource(), VALUE_FACTORY.createIRI(Activity.wasAssociatedWith_IRI));
        doReturn(Optional.empty()).when(utilsService).getInProgressCommitIRI(eq(VERSIONED_RDF_RECORD_IRI), eq(USER_IRI), any(RepositoryConnection.class));

        manager.addInProgressCommit(distributedCatalogId, VERSIONED_RDF_RECORD_IRI, commit);
        verify(utilsService).getInProgressCommitIRI(eq(VERSIONED_RDF_RECORD_IRI), eq(USER_IRI), any(RepositoryConnection.class));
        verify(utilsService).getRecord(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
        verify(utilsService).addObject(eq(commit), any(RepositoryConnection.class));
        assertTrue(commit.getOnVersionedRDFRecord_resource().isPresent());
        assertEquals(VERSIONED_RDF_RECORD_IRI, commit.getOnVersionedRDFRecord_resource().get());
    }

    @Test
    public void testAddInProgressCommitWithNoUser() {
        // Setup:
        InProgressCommit commit = inProgressCommitFactory.createNew(NEW_IRI);
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("User not set on InProgressCommit " + commit.getResource());

        manager.addInProgressCommit(distributedCatalogId, VERSIONED_RDF_RECORD_IRI, commit);
        verify(utilsService, times(0)).addObject(eq(commit), any(RepositoryConnection.class));
    }

    @Test
    public void testAddInProgressCommitWhenYouAlreadyHaveOne() {
        // Setup:
        InProgressCommit commit = inProgressCommitFactory.createNew(NEW_IRI);
        commit.setProperty(USER_IRI, VALUE_FACTORY.createIRI(Activity.wasAssociatedWith_IRI));
        doReturn(Optional.of(NEW_IRI)).when(utilsService).getInProgressCommitIRI(eq(VERSIONED_RDF_RECORD_IRI), eq(USER_IRI), any(RepositoryConnection.class));
        thrown.expect(IllegalStateException.class);
        thrown.expectMessage("User " + USER_IRI + " already has an InProgressCommit for Record " + VERSIONED_RDF_RECORD_IRI);

        manager.addInProgressCommit(distributedCatalogId, VERSIONED_RDF_RECORD_IRI, commit);
        verify(utilsService, times(0)).addObject(eq(commit), any(RepositoryConnection.class));
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddInProgressCommitWithTakenResource() {
        InProgressCommit commit = inProgressCommitFactory.createNew(IN_PROGRESS_COMMIT_IRI);
        commit.setProperty(USER_IRI, VALUE_FACTORY.createIRI(Activity.wasAssociatedWith_IRI));
        doReturn(Optional.empty()).when(utilsService).getInProgressCommitIRI(eq(VERSIONED_RDF_RECORD_IRI), eq(USER_IRI), any(RepositoryConnection.class));

        manager.addInProgressCommit(distributedCatalogId, VERSIONED_RDF_RECORD_IRI, commit);
        verify(utilsService, times(0)).addObject(eq(commit), any(RepositoryConnection.class));
        verify(utilsService).throwAlreadyExists(IN_PROGRESS_COMMIT_IRI, inProgressCommitFactory);
    }

    /* getCommit */

    @Test
    public void testGetCommitThatIsNotTheHead() throws Exception {
        // Setup:
        Resource headId = VALUE_FACTORY.createIRI(COMMITS + "test4a");
        Resource commitId = VALUE_FACTORY.createIRI(COMMITS + "test0");
        Branch branch = branchFactory.createNew(MASTER_BRANCH_IRI);
        Commit commit = commitFactory.createNew(commitId);
        doReturn(headId).when(utilsService).getHeadCommitIRI(branch);
        doReturn(branch).when(utilsService).getExpectedObject(eq(MASTER_BRANCH_IRI), eq(branchFactory), any(RepositoryConnection.class));
        doReturn(commit).when(utilsService).getExpectedObject(eq(commitId), eq(commitFactory), any(RepositoryConnection.class));
        doReturn(true).when(utilsService).commitInBranch(eq(MASTER_BRANCH_IRI), eq(commitId), any(RepositoryConnection.class));
        doReturn(Stream.of(headId, commitId).collect(Collectors.toList())).when(utilsService).getCommitChain(eq(headId), eq(false), any(RepositoryConnection.class));

        Optional<Commit> result = manager.getCommit(distributedCatalogId, VERSIONED_RDF_RECORD_IRI, MASTER_BRANCH_IRI, commitId);
        verify(utilsService).validateBranch(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(MASTER_BRANCH_IRI), any(RepositoryConnection.class));
        verify(utilsService).commitInBranch(eq(MASTER_BRANCH_IRI), eq(commitId), any(RepositoryConnection.class));
        verify(utilsService).getExpectedObject(eq(commitId), eq(commitFactory), any(RepositoryConnection.class));
        assertTrue(result.isPresent());
        assertEquals(commit, result.get());
    }

    @Test
    public void testGetCommit() throws Exception {
        // Setup:
        Resource commitId = VALUE_FACTORY.createIRI(COMMITS + "test0");
        Commit commit = commitFactory.createNew(commitId);
        doReturn(Optional.of(commit)).when(utilsService).optObject(eq(commitId), eq(commitFactory), any(RepositoryConnection.class));

        Optional<Commit> result = manager.getCommit(commitId);
        verify(utilsService).optObject(eq(commitId), eq(commitFactory), any(RepositoryConnection.class));
        assertTrue(result.isPresent());
        assertEquals(commit, result.get());
    }

    @Test
    public void testGetCommitThatIsTheHead() throws Exception {
        // Setup:
        Resource commitId = VALUE_FACTORY.createIRI(COMMITS + "test4a");
        Branch branch = branchFactory.createNew(MASTER_BRANCH_IRI);
        Commit commit = commitFactory.createNew(commitId);
        doReturn(commitId).when(utilsService).getHeadCommitIRI(branch);
        doReturn(branch).when(utilsService).getExpectedObject(eq(MASTER_BRANCH_IRI), eq(branchFactory), any(RepositoryConnection.class));
        doReturn(commit).when(utilsService).getExpectedObject(eq(commitId), eq(commitFactory), any(RepositoryConnection.class));
        doReturn(true).when(utilsService).commitInBranch(eq(MASTER_BRANCH_IRI), eq(commitId), any(RepositoryConnection.class));

        Optional<Commit> result = manager.getCommit(distributedCatalogId, VERSIONED_RDF_RECORD_IRI, MASTER_BRANCH_IRI, commitId);
        verify(utilsService).validateBranch(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(MASTER_BRANCH_IRI), any(RepositoryConnection.class));
        verify(utilsService).commitInBranch(eq(MASTER_BRANCH_IRI), eq(commitId), any(RepositoryConnection.class));
        verify(utilsService).getExpectedObject(eq(commitId), eq(commitFactory), any(RepositoryConnection.class));
        verify(utilsService, times(0)).getCommitChain(eq(commitId), eq(false), any(RepositoryConnection.class));
        assertTrue(result.isPresent());
        assertEquals(commit, result.get());
    }

    @Test
    public void testGetCommitThatDoesNotBelongToBranch() {
        // Setup:
        Resource headId = VALUE_FACTORY.createIRI(COMMITS + "test4a");
        Branch branch = branchFactory.createNew(MASTER_BRANCH_IRI);
        doReturn(headId).when(utilsService).getHeadCommitIRI(branch);
        doReturn(branch).when(utilsService).getExpectedObject(eq(MASTER_BRANCH_IRI), eq(branchFactory), any(RepositoryConnection.class));
        doReturn(false).when(utilsService).commitInBranch(eq(MASTER_BRANCH_IRI), eq(COMMIT_IRI), any(RepositoryConnection.class));

        Optional<Commit> result = manager.getCommit(distributedCatalogId, VERSIONED_RDF_RECORD_IRI, MASTER_BRANCH_IRI, COMMIT_IRI);
        verify(utilsService).validateBranch(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(MASTER_BRANCH_IRI), any(RepositoryConnection.class));
        verify(utilsService, times(0)).getExpectedObject(eq(COMMIT_IRI), eq(commitFactory), any(RepositoryConnection.class));
        assertFalse(result.isPresent());
    }

    /* getHeadCommit */

    @Test
    public void getHeadCommit() throws Exception {
        // Setup:
        Resource commitId = VALUE_FACTORY.createIRI(COMMITS + "test4a");
        Branch branch = branchFactory.createNew(BRANCH_IRI);
        Commit commit = commitFactory.createNew(commitId);
        doReturn(commitId).when(utilsService).getHeadCommitIRI(branch);
        doReturn(branch).when(utilsService).getExpectedObject(eq(BRANCH_IRI), eq(branchFactory), any(RepositoryConnection.class));
        doReturn(commit).when(utilsService).getExpectedObject(eq(commitId), eq(commitFactory), any(RepositoryConnection.class));

        Commit result = manager.getHeadCommit(distributedCatalogId, RECORD_IRI, BRANCH_IRI);
        verify(utilsService).validateBranch(eq(distributedCatalogId), eq(RECORD_IRI), eq(BRANCH_IRI), any(RepositoryConnection.class));
        verify(utilsService).getExpectedObject(eq(BRANCH_IRI), eq(branchFactory), any(RepositoryConnection.class));
        verify(utilsService).getExpectedObject(eq(commitId), eq(commitFactory), any(RepositoryConnection.class));
        assertEquals(commit, result);
    }

    /* getInProgressCommit(Resource, Resource, User) */

    @Test
    public void testGetInProgressCommitWithUser() throws Exception {
        // Setup:
        User user = userFactory.createNew(USER_IRI);
        InProgressCommit commit = inProgressCommitFactory.createNew(IN_PROGRESS_COMMIT_IRI);
        doReturn(Optional.of(IN_PROGRESS_COMMIT_IRI)).when(utilsService).getInProgressCommitIRI(eq(VERSIONED_RDF_RECORD_IRI), eq(USER_IRI), any(RepositoryConnection.class));
        doReturn(commit).when(utilsService).getExpectedObject(eq(IN_PROGRESS_COMMIT_IRI), eq(inProgressCommitFactory), any(RepositoryConnection.class));

        Optional<InProgressCommit> result = manager.getInProgressCommit(distributedCatalogId, VERSIONED_RDF_RECORD_IRI, user);
        verify(utilsService).validateRecord(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService).getInProgressCommitIRI(eq(VERSIONED_RDF_RECORD_IRI), eq(USER_IRI), any(RepositoryConnection.class));
        verify(utilsService).getExpectedObject(eq(IN_PROGRESS_COMMIT_IRI), eq(inProgressCommitFactory), any(RepositoryConnection.class));
        assertTrue(result.isPresent());
        assertEquals(commit, result.get());
    }

    @Test
    public void testGetInProgressCommitForUserWithoutOne() {
        // Setup:
        User user = userFactory.createNew(USER_IRI);
        doReturn(Optional.empty()).when(utilsService).getInProgressCommitIRI(eq(VERSIONED_RDF_RECORD_IRI), eq(user.getResource()), any(RepositoryConnection.class));

        Optional<InProgressCommit> result = manager.getInProgressCommit(distributedCatalogId, VERSIONED_RDF_RECORD_IRI, user);
        verify(utilsService).validateRecord(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService).getInProgressCommitIRI(eq(VERSIONED_RDF_RECORD_IRI), eq(user.getResource()), any(RepositoryConnection.class));
        verify(utilsService, times(0)).getExpectedObject(eq(IN_PROGRESS_COMMIT_IRI), eq(inProgressCommitFactory), any(RepositoryConnection.class));
        assertFalse(result.isPresent());
    }

    /* getInProgressCommit(Resource, Resource, Resource) */

    @Test
    public void testGetInProgressCommitWithResource() throws Exception {
        // Setup:
        InProgressCommit commit = inProgressCommitFactory.createNew(IN_PROGRESS_COMMIT_IRI);
        commit.setOnVersionedRDFRecord(versionedRDFRecordFactory.createNew(VERSIONED_RDF_RECORD_IRI));
        doReturn(Optional.of(commit)).when(utilsService).optObject(eq(IN_PROGRESS_COMMIT_IRI), eq(inProgressCommitFactory), any(RepositoryConnection.class));

        Optional<InProgressCommit> result = manager.getInProgressCommit(distributedCatalogId, VERSIONED_RDF_RECORD_IRI, IN_PROGRESS_COMMIT_IRI);
        verify(utilsService).validateRecord(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService).optObject(eq(IN_PROGRESS_COMMIT_IRI), eq(inProgressCommitFactory), any(RepositoryConnection.class));
        assertTrue(result.isPresent());
        assertEquals(commit, result.get());
    }

    @Test
    public void testGetMissingInProgressCommitWithResource() {
        // Setup:
        doReturn(Optional.empty()).when(utilsService).optObject(eq(EMPTY_IRI), eq(inProgressCommitFactory), any(RepositoryConnection.class));

        Optional<InProgressCommit> result = manager.getInProgressCommit(distributedCatalogId, VERSIONED_RDF_RECORD_IRI, EMPTY_IRI);
        verify(utilsService).validateRecord(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService).optObject(eq(EMPTY_IRI), eq(inProgressCommitFactory), any(RepositoryConnection.class));
        assertFalse(result.isPresent());
    }

    @Test
    public void testGetInProgressCommitWithResourceForWrongRecord() {
        // Setup:
        InProgressCommit commit = inProgressCommitFactory.createNew(IN_PROGRESS_COMMIT_IRI);
        commit.setOnVersionedRDFRecord(versionedRDFRecordFactory.createNew(EMPTY_IRI));
        doReturn(Optional.of(commit)).when(utilsService).optObject(eq(IN_PROGRESS_COMMIT_IRI), eq(inProgressCommitFactory), any(RepositoryConnection.class));

        Optional<InProgressCommit> result = manager.getInProgressCommit(distributedCatalogId, VERSIONED_RDF_RECORD_IRI, IN_PROGRESS_COMMIT_IRI);
        verify(utilsService).validateRecord(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService).optObject(eq(IN_PROGRESS_COMMIT_IRI), eq(inProgressCommitFactory), any(RepositoryConnection.class));
        assertFalse(result.isPresent());
    }

    @Test
    public void testGetInProgressCommitWithResourceAndNoRecordSet() {
        // Setup:
        InProgressCommit commit = inProgressCommitFactory.createNew(IN_PROGRESS_COMMIT_IRI);
        doReturn(Optional.of(commit)).when(utilsService).optObject(eq(IN_PROGRESS_COMMIT_IRI), eq(inProgressCommitFactory), any(RepositoryConnection.class));
        thrown.expect(IllegalStateException.class);
        thrown.expectMessage("InProgressCommit " + IN_PROGRESS_COMMIT_IRI + " has no Record set.");

        manager.getInProgressCommit(distributedCatalogId, VERSIONED_RDF_RECORD_IRI, IN_PROGRESS_COMMIT_IRI);
    }

    /* getCommitDifference */

    @Test
    public void testGetCommitDifference() throws Exception {
        // Setup:
        Model addModel = MODEL_FACTORY.createModel(Collections.singleton(
                VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/add"), titleIRI, VALUE_FACTORY.createLiteral("Add"))));
        Model delModel = MODEL_FACTORY.createModel(Collections.singleton(
                VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/delete"), titleIRI, VALUE_FACTORY.createLiteral("Delete"))));
        Difference expect = new Difference.Builder().additions(addModel).deletions(delModel).build();
        doReturn(expect).when(utilsService).getCommitDifference(eq(COMMIT_IRI), any(RepositoryConnection.class));

        Difference result = manager.getCommitDifference(COMMIT_IRI);
        verify(utilsService).validateResource(eq(COMMIT_IRI), eq(commitFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService).getCommitDifference(eq(COMMIT_IRI), any(RepositoryConnection.class));
        assertEquals(expect, result);
    }

    /* removeInProgressCommit(Resource, Resource, Resource) */

    @Test
    public void testRemoveInProgressCommit() throws Exception {
        // Setup:
        InProgressCommit commit = inProgressCommitFactory.createNew(IN_PROGRESS_COMMIT_IRI);
        doReturn(commit).when(utilsService).getInProgressCommit(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(IN_PROGRESS_COMMIT_IRI), any(RepositoryConnection.class));

        manager.removeInProgressCommit(distributedCatalogId, VERSIONED_RDF_RECORD_IRI, IN_PROGRESS_COMMIT_IRI);
        verify(utilsService).getInProgressCommit(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(IN_PROGRESS_COMMIT_IRI), any(RepositoryConnection.class));
        verify(utilsService).removeInProgressCommit(eq(commit), any(RepositoryConnection.class));
    }

    /* removeInProgressCommit(Resource, Resource, User) */

    @Test
    public void testRemoveInProgressCommitWithUser() throws Exception {
        // Setup:
        User user = userFactory.createNew(USER_IRI);
        InProgressCommit commit = inProgressCommitFactory.createNew(IN_PROGRESS_COMMIT_IRI);
        doReturn(commit).when(utilsService).getInProgressCommit(eq(VERSIONED_RDF_RECORD_IRI), eq(USER_IRI), any(RepositoryConnection.class));

        manager.removeInProgressCommit(distributedCatalogId, VERSIONED_RDF_RECORD_IRI, user);
        verify(utilsService).validateRecord(eq(distributedCatalogId), eq(VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService).getInProgressCommit(eq(VERSIONED_RDF_RECORD_IRI), eq(USER_IRI), any(RepositoryConnection.class));
        verify(utilsService).removeInProgressCommit(eq(commit), any(RepositoryConnection.class));
    }

    /* applyInProgressCommit */

    @Test
    public void testApplyInProgressCommit() throws Exception {
        // Setup:
        Difference diff = new Difference.Builder().build();
        Model entity = MODEL_FACTORY.createModel();
        Model expected = MODEL_FACTORY.createModel();
        doReturn(diff).when(utilsService).getCommitDifference(eq(IN_PROGRESS_COMMIT_IRI), any(RepositoryConnection.class));
        doReturn(expected).when(utilsService).applyDifference(entity, diff);

        Model result = manager.applyInProgressCommit(IN_PROGRESS_COMMIT_IRI, entity);
        assertEquals(expected, result);
        verify(utilsService).validateResource(eq(IN_PROGRESS_COMMIT_IRI), eq(inProgressCommitFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService).getCommitDifference(eq(IN_PROGRESS_COMMIT_IRI), any(RepositoryConnection.class));
        verify(utilsService).applyDifference(entity, diff);
    }

    /* getCompiledResource */

    @Test
    public void testGetCompiledResourceWithList() throws Exception {
        // Setup:
        Model expected = MODEL_FACTORY.createModel();
        expected.add(VALUE_FACTORY.createIRI("http://mobi.com/test/ontology"), typeIRI, VALUE_FACTORY.createIRI("http://www.w3.org/2002/07/owl#Ontology"));
        doReturn(expected).when(utilsService).getCompiledResource(eq(testCommits.stream().map(commit ->
                commit.getResource()).collect(Collectors.toList())), any(RepositoryConnection.class));

        Model result = manager.getCompiledResource(testCommits);
        verify(utilsService).getCompiledResource(eq(testCommits.stream().map(commit ->
                commit.getResource()).collect(Collectors.toList())), any(RepositoryConnection.class));
        result.forEach(statement -> assertTrue(expected.contains(statement)));
    }

    @Test
    public void testGetCompiledResourceWithListEmpty() throws Exception {
        // Setup:
        List<Commit> emptyList = new ArrayList<>();
        Model expected = MODEL_FACTORY.createModel();
        doReturn(expected).when(utilsService).getCompiledResource(eq(emptyList.stream().map(commit ->
                commit.getResource()).collect(Collectors.toList())), any(RepositoryConnection.class));

        Model result = manager.getCompiledResource(emptyList);
        verify(utilsService).getCompiledResource(eq(emptyList.stream().map(commit ->
                commit.getResource()).collect(Collectors.toList())), any(RepositoryConnection.class));
        assertTrue(result.isEmpty());
    }

    @Test
    public void testGetCompiledResourceWithUnmergedPast() throws Exception {
        // Setup:
        Resource commitId = VALUE_FACTORY.createIRI(COMMITS + "test0");
        Model expected = MODEL_FACTORY.createModel();
        expected.add(VALUE_FACTORY.createIRI("http://mobi.com/test/ontology"), typeIRI, VALUE_FACTORY.createIRI("http://www.w3.org/2002/07/owl#Ontology"));
        doReturn(expected).when(utilsService).getCompiledResource(eq(commitId), any(RepositoryConnection.class));

        Model result = manager.getCompiledResource(commitId);
        verify(utilsService).validateResource(eq(commitId), eq(commitFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService).getCompiledResource(eq(commitId), any(RepositoryConnection.class));
        result.forEach(statement -> assertTrue(expected.contains(statement)));
    }

    @Test
    public void testGetCompiledResourceWithPathAndUnmergedPast() throws Exception {
        // Setup:
        Resource commitId = VALUE_FACTORY.createIRI(COMMITS + "test0");
        Model expected = MODEL_FACTORY.createModel();
        expected.add(VALUE_FACTORY.createIRI("http://mobi.com/test/ontology"), typeIRI, VALUE_FACTORY.createIRI("http://www.w3.org/2002/07/owl#Ontology"));
        doReturn(expected).when(utilsService).getCompiledResource(eq(commitId), any(RepositoryConnection.class));

        Model result = manager.getCompiledResource(RECORD_IRI, BRANCH_IRI, commitId);
        verify(utilsService).validateCommitPath(eq(localCatalogId), eq(RECORD_IRI), eq(BRANCH_IRI), eq(commitId), any(RepositoryConnection.class));
        verify(utilsService).getCompiledResource(eq(commitId), any(RepositoryConnection.class));
        result.forEach(statement -> assertTrue(expected.contains(statement)));
    }

    /* getDifference */

    @Test
    public void testGetDifference() throws Exception {
        // Setup:
        Resource sourceId = VALUE_FACTORY.createIRI(COMMITS + "test4a");
        Resource targetId = VALUE_FACTORY.createIRI(COMMITS + "test1");

        Difference sourceDiff = new Difference.Builder()
                .additions(MODEL_FACTORY.createModel())
                .deletions(MODEL_FACTORY.createModel())
                .build();
        doReturn(sourceDiff).when(utilsService).getCommitDifference(eq(Collections.singletonList(sourceId)), any(RepositoryConnection.class));
        doReturn(Collections.singletonList(sourceId)).when(utilsService).getDifferenceChain(eq(sourceId), eq(targetId), any(RepositoryConnection.class), anyBoolean());

        Difference diff = manager.getDifference(sourceId, targetId);
        assertEquals(sourceDiff, diff);
        verify(utilsService).getCommitDifference(eq(Collections.singletonList(sourceId)), any(RepositoryConnection.class));
        verify(utilsService).getDifferenceChain(eq(sourceId), eq(targetId), any(RepositoryConnection.class), eq(true));
    }

    @Test
    public void testGetDifferenceDisconnectedNodes() throws Exception {
        // Setup
        Resource sourceId = VALUE_FACTORY.createIRI(COMMITS + "test4a");
        Resource targetId = VALUE_FACTORY.createIRI(COMMITS + "test1");

        Difference sourceDiff = new Difference.Builder()
                .additions(MODEL_FACTORY.createModel())
                .deletions(MODEL_FACTORY.createModel())
                .build();

        doReturn(sourceDiff).when(utilsService).getCommitDifference(eq(Collections.singletonList(sourceId)), any(RepositoryConnection.class));
        doReturn(Collections.singletonList(sourceId)).when(utilsService).getDifferenceChain(eq(sourceId), eq(targetId), any(RepositoryConnection.class), anyBoolean());

        Difference diff = manager.getDifference(sourceId, targetId);
        assertEquals(sourceDiff, diff);
    }

    /* getConflicts */

    @Test
    public void testGetConflicts() throws Exception {
        // Setup:
        Resource leftId = VALUE_FACTORY.createIRI("urn:left");
        Resource rightId = VALUE_FACTORY.createIRI("urn:right");
        Set<Conflict> set = Collections.singleton(conflict);
        when(utilsService.getConflicts(any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(set);

        Set<Conflict> result = manager.getConflicts(leftId, rightId);
        verify(utilsService).getConflicts(eq(leftId), eq(rightId), any(RepositoryConnection.class));
        assertEquals(result, set);
    }

    /* getDiff */

    @Test
    public void testGetDiff() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Model original = RepositoryResults.asModel(conn.getStatements(null, null, null, VALUE_FACTORY.createIRI("http://mobi.com/test/diff1")), MODEL_FACTORY);
            Model changed = RepositoryResults.asModel(conn.getStatements(null, null, null, VALUE_FACTORY.createIRI("http://mobi.com/test/diff2")), MODEL_FACTORY);
            Model additions = MODEL_FACTORY.createModel();
            conn.getStatements(null, null, null, VALUE_FACTORY.createIRI("http://mobi.com/test/diff/additions"))
                    .forEach(additions::add);
            Model deletions = MODEL_FACTORY.createModel();
            conn.getStatements(null, null, null, VALUE_FACTORY.createIRI("http://mobi.com/test/diff/deletions"))
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
            Model changed = RepositoryResults.asModel(conn.getStatements(null, null, null, VALUE_FACTORY.createIRI("http://mobi.com/test/diff1")), MODEL_FACTORY);
            Model original = RepositoryResults.asModel(conn.getStatements(null, null, null, VALUE_FACTORY.createIRI("http://mobi.com/test/diff2")), MODEL_FACTORY);
            Model deletions = MODEL_FACTORY.createModel();
            conn.getStatements(null, null, null, VALUE_FACTORY.createIRI("http://mobi.com/test/diff/additions"))
                    .forEach(deletions::add);
            Model additions = MODEL_FACTORY.createModel();
            conn.getStatements(null, null, null, VALUE_FACTORY.createIRI("http://mobi.com/test/diff/deletions"))
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
            Model original = RepositoryResults.asModel(conn.getStatements(null, null, null, VALUE_FACTORY.createIRI("http://mobi.com/test/diff2")), MODEL_FACTORY);

            Difference diff = manager.getDiff(original, original);
            assertEquals(0, diff.getAdditions().size());
            assertEquals(0, diff.getDeletions().size());
        }
    }

    /* export() */

    @Test
    public void testExportNonExistingRecord() {
        RecordOperationConfig config = new OperationConfig();
        String expected = "No known record services for this record type.";
        IRI nonRecord = VALUE_FACTORY.createIRI("http://mobi.com/test/records#random");
        try{
            manager.export(nonRecord, config);
        }catch(Exception e){
            assertEquals(e.getMessage(), expected);
        }
    }

    @Test
    public void testExportRecordWithoutList() throws Exception {
        RecordOperationConfig config = new OperationConfig();
        manager.export(RECORD_IRI, config);
        verify(recordService).export(eq(RECORD_IRI), any(OperationConfig.class), any(RepositoryConnection.class));
    }

    @Test
    public void testExportVersionedRecordWithoutList() throws Exception {
        RecordOperationConfig config = new OperationConfig();
        manager.export(VERSIONED_RECORD_IRI, config);
        verify(versionedRecordService).export(eq(VERSIONED_RECORD_IRI), any(OperationConfig.class),
                any(RepositoryConnection.class));
    }

    @Test
    public void testExportUnversionedRecordWithoutList() throws Exception {
        RecordOperationConfig config = new OperationConfig();
        manager.export(UNVERSIONED_RECORD_IRI, config);
        verify(unversionedRecordService).export(eq(UNVERSIONED_RECORD_IRI), any(OperationConfig.class),
                any(RepositoryConnection.class));
    }

    @Test
    public void testExportVersionedRDFRecordWithoutList() throws Exception {
        RecordOperationConfig config = new OperationConfig();
        manager.export(VERSIONED_RDF_RECORD_IRI, config);
        verify(versionedRDFRecordService).export(eq(VERSIONED_RDF_RECORD_IRI), any(OperationConfig.class),
                any(RepositoryConnection.class));
    }

    @Test
    public void testExportWithList() throws Exception {
        RecordOperationConfig config = new OperationConfig();
        List<Resource> exportList = new ArrayList<>();
        exportList.add(RECORD_IRI);
        exportList.add(VERSIONED_RECORD_IRI);
        manager.export(exportList, config);
        verify(recordService).export(eq(RECORD_IRI),  any(OperationConfig.class), any(RepositoryConnection.class));
        verify(versionedRecordService).export(eq(VERSIONED_RECORD_IRI),  any(OperationConfig.class),
                any(RepositoryConnection.class));
    }
}
