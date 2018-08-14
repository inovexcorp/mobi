package com.mobi.catalog.impl.mergerequest;

/*-
 * #%L
 * com.mobi.catalog.impl
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
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.argThat;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.builder.Conflict;
import com.mobi.catalog.api.mergerequest.MergeRequestConfig;
import com.mobi.catalog.api.mergerequest.MergeRequestFilterParams;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.ontologies.mergerequests.AcceptedMergeRequest;
import com.mobi.catalog.api.ontologies.mergerequests.MergeRequest;
import com.mobi.catalog.api.versioning.VersioningManager;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.mockito.ArgumentMatcher;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Collections;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.function.Predicate;

public class SimpleMergeRequestManagerTest extends OrmEnabledTestCase {
    private Repository repo;
    private SimpleMergeRequestManager manager;
    private OrmFactory<MergeRequest> mergeRequestFactory = getRequiredOrmFactory(MergeRequest.class);
    private OrmFactory<AcceptedMergeRequest> acceptedMergeRequestFactory = getRequiredOrmFactory(AcceptedMergeRequest.class);
    private OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
    private OrmFactory<Branch> branchFactory = getRequiredOrmFactory(Branch.class);
    private OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);
    private OrmFactory<VersionedRDFRecord> versionedRDFRecordFactory = getRequiredOrmFactory(VersionedRDFRecord.class);

    private MergeRequest request1;
    private MergeRequest request2;
    private MergeRequest request3;
    private AcceptedMergeRequest request4;
    private AcceptedMergeRequest request5;
    private User user1;
    private User user2;
    private VersionedRDFRecord versionedRDFRecord1;
    private VersionedRDFRecord versionedRDFRecord2;
    private Branch sourceBranch1;
    private Branch sourceBranch2;
    private Branch targetBranch1;
    private Branch targetBranch2;
    private Commit sourceCommit1;
    private Commit targetCommit1;
    private Commit sourceCommit2;
    private Commit targetCommit2;

    private final IRI LOCAL_CATALOG_IRI = VALUE_FACTORY.createIRI("http://mobi.com/catalogs#local");
    private final IRI RECORD_1_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/records#versioned-rdf-record1");
    private final IRI RECORD_2_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/records#versioned-rdf-record2");
    private final IRI SOURCE_BRANCH_1_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#source1");
    private final IRI SOURCE_BRANCH_2_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#source2");
    private final String SOURCE_BRANCH_TITLE = "Source Title";
    private final IRI TARGET_BRANCH_1_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#target1");
    private final IRI TARGET_BRANCH_2_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#target2");
    private final String TARGET_BRANCH_TITLE = "Target Title";
    private IRI titleIRI;

    @Rule
    public ExpectedException thrown = ExpectedException.none();

    @Mock
    private CatalogUtilsService utilsService;

    @Mock
    private VersioningManager versioningManager;

    @Mock
    private Conflict conflict;

    @Mock
    private CatalogConfigProvider configProvider;

    @Before
    public void setUp() {
        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();

        titleIRI = VALUE_FACTORY.createIRI(_Thing.title_IRI);

        versionedRDFRecord1 = versionedRDFRecordFactory.createNew(RECORD_1_IRI);
        versionedRDFRecord1.addProperty(LOCAL_CATALOG_IRI, VALUE_FACTORY.createIRI(Record.catalog_IRI));
        versionedRDFRecord2 = versionedRDFRecordFactory.createNew(RECORD_2_IRI);
        sourceBranch1 = branchFactory.createNew(SOURCE_BRANCH_1_IRI);
        sourceBranch1.setProperty(VALUE_FACTORY.createLiteral(SOURCE_BRANCH_TITLE), titleIRI);
        sourceBranch2 = branchFactory.createNew(SOURCE_BRANCH_2_IRI);
        targetBranch1 = branchFactory.createNew(TARGET_BRANCH_1_IRI);
        targetBranch1.setProperty(VALUE_FACTORY.createLiteral(TARGET_BRANCH_TITLE), titleIRI);
        targetBranch2 = branchFactory.createNew(TARGET_BRANCH_2_IRI);
        sourceCommit1 = commitFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#source-commit1"));
        sourceBranch1.setHead(sourceCommit1);
        targetCommit1 = commitFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#target-commit1"));
        targetBranch1.setHead(targetCommit1);
        sourceCommit2 = commitFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#source-commit2"));
        targetCommit2 = commitFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#target-commit2"));

        user1 = userFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/users#user1"));
        user2 = userFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/users#user2"));
        Set<User> userSet1 = new HashSet<>();
        userSet1.add(user1);
        Set<User> userSet2 = new HashSet<>();
        userSet2.add(user2);

        request1 = mergeRequestFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/merge-requests#1"));
        request1.setProperty(VALUE_FACTORY.createLiteral("Request 1"), VALUE_FACTORY.createIRI(_Thing.title_IRI));
        request1.setProperty(VALUE_FACTORY.createLiteral(OffsetDateTime.of(2018, 1, 1, 0, 0, 0, 0, ZoneOffset.UTC)), VALUE_FACTORY.createIRI(_Thing.issued_IRI));
        request1.setAssignee(userSet1);
        request1.setOnRecord(versionedRDFRecord1);
        request1.setSourceBranch(sourceBranch1);
        request1.setTargetBranch(targetBranch1);
        request2 = mergeRequestFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/merge-requests#2"));
        request2.setProperty(VALUE_FACTORY.createLiteral(OffsetDateTime.of(2018, 1, 2, 0, 0, 0, 0, ZoneOffset.UTC)), VALUE_FACTORY.createIRI(_Thing.issued_IRI));
        request2.setProperty(VALUE_FACTORY.createLiteral("Request 2"), VALUE_FACTORY.createIRI(_Thing.title_IRI));
        request2.setAssignee(userSet2);
        request2.setOnRecord(versionedRDFRecord2);
        request2.setSourceBranch(sourceBranch2);
        request2.setTargetBranch(targetBranch2);
        request3 = mergeRequestFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/merge-requests#3"));
        request3.setProperty(VALUE_FACTORY.createLiteral(OffsetDateTime.of(2018, 1, 3, 0, 0, 0, 0, ZoneOffset.UTC)), VALUE_FACTORY.createIRI(_Thing.issued_IRI));
        request3.setProperty(VALUE_FACTORY.createLiteral("Request 3"), VALUE_FACTORY.createIRI(_Thing.title_IRI));
        request4 = acceptedMergeRequestFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/merge-requests#4"));
        request4.setProperty(VALUE_FACTORY.createLiteral(OffsetDateTime.of(2018, 1, 4, 0, 0, 0, 0, ZoneOffset.UTC)), VALUE_FACTORY.createIRI(_Thing.issued_IRI));
        request4.setProperty(VALUE_FACTORY.createLiteral("Request 4"), VALUE_FACTORY.createIRI(_Thing.title_IRI));
        request4.setAssignee(userSet1);
        request4.setOnRecord(versionedRDFRecord1);
        request4.setSourceBranch(sourceBranch1);
        request4.setTargetBranch(targetBranch1);
        request4.setSourceCommit(sourceCommit1);
        request4.setTargetCommit(targetCommit1);
        request5 = acceptedMergeRequestFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/merge-requests#5"));
        request5.setProperty(VALUE_FACTORY.createLiteral(OffsetDateTime.of(2018, 1, 5, 0, 0, 0, 0, ZoneOffset.UTC)), VALUE_FACTORY.createIRI(_Thing.issued_IRI));
        request5.setProperty(VALUE_FACTORY.createLiteral("Request 5"), VALUE_FACTORY.createIRI(_Thing.title_IRI));
        request5.setAssignee(userSet2);
        request5.setOnRecord(versionedRDFRecord2);
        request5.setSourceBranch(sourceBranch2);
        request5.setTargetBranch(targetBranch2);
        request5.setSourceCommit(sourceCommit2);
        request5.setTargetCommit(targetCommit2);

        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(request1.getModel(), request1.getResource());
            conn.add(request2.getModel(), request2.getResource());
            conn.add(request4.getModel(), request4.getResource());
            conn.add(request5.getModel(), request5.getResource());
        }

        MockitoAnnotations.initMocks(this);

        when(configProvider.getRepository()).thenReturn(repo);

        when(utilsService.getExpectedObject(any(Resource.class), eq(mergeRequestFactory), any(RepositoryConnection.class))).thenAnswer(i -> {
            Resource iri = i.getArgumentAt(0, Resource.class);
            if (iri.equals(request1.getResource())) {
                return request1;
            } else if (iri.equals(request2.getResource())) {
                return request2;
            } else if (iri.equals(request3.getResource())) {
                return request3;
            } else if (iri.equals(request4.getResource())) {
                return request4;
            } else if (iri.equals(request5.getResource())) {
                return request5;
            }
            throw new IllegalArgumentException();
        });
        when(utilsService.getExpectedObject(any(Resource.class), eq(branchFactory), any(RepositoryConnection.class))).thenAnswer(i -> {
            Resource iri = i.getArgumentAt(0, Resource.class);
            if (iri.equals(SOURCE_BRANCH_1_IRI)) {
                return sourceBranch1;
            } else if (iri.equals(SOURCE_BRANCH_2_IRI)) {
                return sourceBranch2;
            } else if (iri.equals(TARGET_BRANCH_1_IRI)) {
                return targetBranch1;
            } else if (iri.equals(TARGET_BRANCH_2_IRI)) {
                return targetBranch2;
            }
            throw new IllegalArgumentException();
        });
        when(utilsService.getExpectedObject(any(Resource.class), eq(versionedRDFRecordFactory), any(RepositoryConnection.class))).thenAnswer(i -> {
            Resource iri = i.getArgumentAt(0, Resource.class);
            if (iri.equals(RECORD_1_IRI)) {
                return versionedRDFRecord1;
            } else if (iri.equals(RECORD_2_IRI)) {
                return versionedRDFRecord2;
            }
            throw new IllegalArgumentException();
        });
        when(utilsService.optObject(any(Resource.class), eq(mergeRequestFactory), any(RepositoryConnection.class))).thenReturn(Optional.empty());
        when(utilsService.optObject(eq(request1.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class))).thenReturn(Optional.of(request1));
        when(utilsService.throwAlreadyExists(any(Resource.class), any(OrmFactory.class))).thenReturn(new IllegalArgumentException());
        doThrow(new IllegalArgumentException()).when(utilsService).validateResource(eq(request3.getResource()), eq(mergeRequestFactory.getTypeIRI()), any(RepositoryConnection.class));
        when(utilsService.getConflicts(any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(Collections.emptySet());

        manager = new SimpleMergeRequestManager();
        injectOrmFactoryReferencesIntoService(manager);
        manager.setVf(VALUE_FACTORY);
        manager.setCatalogUtils(utilsService);
        manager.setVersioningManager(versioningManager);
        manager.setConfigProvider(configProvider);
    }

    @After
    public void tearDown() throws Exception {
        repo.shutDown();
    }

    /* getMergeRequests */

    @Test
    public void getOpenMergeRequestsSortByNotSet() {
        try (RepositoryConnection conn = repo.getConnection()) {
            MergeRequestFilterParams.Builder builder = new MergeRequestFilterParams.Builder();
            List<MergeRequest> result = manager.getMergeRequests(builder.build(), conn);
            assertEquals(2, result.size());
            Iterator<MergeRequest> it = result.iterator();
            assertEquals(request2.getResource(), it.next().getResource());
            assertEquals(request1.getResource(), it.next().getResource());
            verify(utilsService).getExpectedObject(eq(request1.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));
            verify(utilsService).getExpectedObject(eq(request2.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));
        }
    }

    @Test
    public void getOpenMergeRequestsSortByTitleTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            MergeRequestFilterParams.Builder builder = new MergeRequestFilterParams.Builder().setSortBy(VALUE_FACTORY.createIRI(_Thing.title_IRI));
            List<MergeRequest> result = manager.getMergeRequests(builder.build(), conn);
            assertEquals(2, result.size());
            Iterator<MergeRequest> it = result.iterator();
            assertEquals(request2.getResource(), it.next().getResource());
            assertEquals(request1.getResource(), it.next().getResource());
            verify(utilsService).getExpectedObject(eq(request1.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));
            verify(utilsService).getExpectedObject(eq(request2.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));

            builder.setAscending(true);
            result = manager.getMergeRequests(builder.build(), conn);
            assertEquals(2, result.size());
            it = result.iterator();
            assertEquals(request1.getResource(), it.next().getResource());
            assertEquals(request2.getResource(), it.next().getResource());
        }
    }

    @Test
    public void getOpenMergeRequestsSortByIssuedTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            MergeRequestFilterParams.Builder builder = new MergeRequestFilterParams.Builder().setSortBy(VALUE_FACTORY.createIRI(_Thing.issued_IRI));
            List<MergeRequest> result = manager.getMergeRequests(builder.build(), conn);
            assertEquals(2, result.size());
            Iterator<MergeRequest> it = result.iterator();
            assertEquals(request2.getResource(), it.next().getResource());
            assertEquals(request1.getResource(), it.next().getResource());
            verify(utilsService).getExpectedObject(eq(request1.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));
            verify(utilsService).getExpectedObject(eq(request2.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));

            builder.setAscending(true);
            result = manager.getMergeRequests(builder.build(), conn);
            assertEquals(2, result.size());
            it = result.iterator();
            assertEquals(request1.getResource(), it.next().getResource());
            assertEquals(request2.getResource(), it.next().getResource());
        }
    }

    @Test
    public void getOpenMergeRequestsAssignee() {
        try (RepositoryConnection conn = repo.getConnection()) {
            MergeRequestFilterParams.Builder builder = new MergeRequestFilterParams.Builder().setSortBy(VALUE_FACTORY.createIRI(_Thing.title_IRI));
            builder.setAssignee(user1.getResource());
            List<MergeRequest> result = manager.getMergeRequests(builder.build(), conn);
            assertEquals(1, result.size());
            assertEquals(request1.getResource(), result.get(0).getResource());
            verify(utilsService).getExpectedObject(eq(request1.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));

            builder.setAssignee(user2.getResource());
            result = manager.getMergeRequests(builder.build(), conn);
            assertEquals(1, result.size());
            assertEquals(request2.getResource(), result.get(0).getResource());
            verify(utilsService).getExpectedObject(eq(request2.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));
        }
    }

    @Test
    public void getOpenMergeRequestsOnRecord() {
        try (RepositoryConnection conn = repo.getConnection()) {
            MergeRequestFilterParams.Builder builder = new MergeRequestFilterParams.Builder().setSortBy(VALUE_FACTORY.createIRI(_Thing.title_IRI));
            builder.setOnRecord(RECORD_1_IRI);
            List<MergeRequest> result = manager.getMergeRequests(builder.build(), conn);
            assertEquals(1, result.size());
            assertEquals(request1.getResource(), result.get(0).getResource());
            verify(utilsService).getExpectedObject(eq(request1.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));

            builder.setOnRecord(RECORD_2_IRI);
            result = manager.getMergeRequests(builder.build(), conn);
            assertEquals(1, result.size());
            assertEquals(request2.getResource(), result.get(0).getResource());
            verify(utilsService).getExpectedObject(eq(request2.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));
        }
    }

    @Test
    public void getOpenMergeRequestsSourceBranch() {
        try (RepositoryConnection conn = repo.getConnection()) {
            MergeRequestFilterParams.Builder builder = new MergeRequestFilterParams.Builder().setSortBy(VALUE_FACTORY.createIRI(_Thing.title_IRI));
            builder.setSourceBranch(SOURCE_BRANCH_1_IRI);
            List<MergeRequest> result = manager.getMergeRequests(builder.build(), conn);
            assertEquals(1, result.size());
            assertEquals(request1.getResource(), result.get(0).getResource());
            verify(utilsService).getExpectedObject(eq(request1.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));

            builder.setSourceBranch(SOURCE_BRANCH_2_IRI);
            result = manager.getMergeRequests(builder.build(), conn);
            assertEquals(1, result.size());
            assertEquals(request2.getResource(), result.get(0).getResource());
            verify(utilsService).getExpectedObject(eq(request2.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));
        }
    }

    @Test
    public void getOpenMergeRequestsTargetBranch() {
        try (RepositoryConnection conn = repo.getConnection()) {
            MergeRequestFilterParams.Builder builder = new MergeRequestFilterParams.Builder().setSortBy(VALUE_FACTORY.createIRI(_Thing.title_IRI));
            builder.setTargetBranch(TARGET_BRANCH_1_IRI);
            List<MergeRequest> result = manager.getMergeRequests(builder.build(), conn);
            assertEquals(1, result.size());
            assertEquals(request1.getResource(), result.get(0).getResource());
            verify(utilsService).getExpectedObject(eq(request1.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));

            builder.setTargetBranch(TARGET_BRANCH_2_IRI);
            result = manager.getMergeRequests(builder.build(), conn);
            assertEquals(1, result.size());
            assertEquals(request2.getResource(), result.get(0).getResource());
            verify(utilsService).getExpectedObject(eq(request2.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));
        }
    }

    @Test
    public void getAcceptedMergeRequestsTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            MergeRequestFilterParams.Builder builder = new MergeRequestFilterParams.Builder();
            builder.setSortBy(VALUE_FACTORY.createIRI(_Thing.title_IRI)).setAccepted(true);
            List<MergeRequest> result = manager.getMergeRequests(builder.build(), conn);
            assertEquals(2, result.size());
            Iterator<MergeRequest> it = result.iterator();
            assertEquals(request5.getResource(), it.next().getResource());
            assertEquals(request4.getResource(), it.next().getResource());
            verify(utilsService).getExpectedObject(eq(request4.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));
        }
    }

    @Test
    public void getAcceptedMergeRequestsSourceCommit() {
        try (RepositoryConnection conn = repo.getConnection()) {
            MergeRequestFilterParams.Builder builder = new MergeRequestFilterParams.Builder().setSortBy(VALUE_FACTORY.createIRI(_Thing.title_IRI));
            builder.setAccepted(true).setSourceCommit(sourceCommit1.getResource());
            List<MergeRequest> result = manager.getMergeRequests(builder.build(), conn);
            assertEquals(1, result.size());
            assertEquals(request4.getResource(), result.get(0).getResource());
            verify(utilsService).getExpectedObject(eq(request4.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));

            builder.setSourceCommit(sourceCommit2.getResource());
            result = manager.getMergeRequests(builder.build(), conn);
            assertEquals(1, result.size());
            assertEquals(request5.getResource(), result.get(0).getResource());
            verify(utilsService).getExpectedObject(eq(request5.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));
        }
    }

    @Test
    public void getAcceptedMergeRequestsTargetCommit() {
        try (RepositoryConnection conn = repo.getConnection()) {
            MergeRequestFilterParams.Builder builder = new MergeRequestFilterParams.Builder().setSortBy(VALUE_FACTORY.createIRI(_Thing.title_IRI));
            builder.setAccepted(true).setTargetCommit(targetCommit1.getResource());
            List<MergeRequest> result = manager.getMergeRequests(builder.build(), conn);
            assertEquals(1, result.size());
            assertEquals(request4.getResource(), result.get(0).getResource());
            verify(utilsService).getExpectedObject(eq(request4.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));

            builder.setTargetCommit(targetCommit2.getResource());
            result = manager.getMergeRequests(builder.build(), conn);
            assertEquals(1, result.size());
            assertEquals(request5.getResource(), result.get(0).getResource());
            verify(utilsService).getExpectedObject(eq(request5.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));
        }
    }

    /* createMergeRequest */

    @Test
    public void createMergeRequestTest() {
        // Setup:
        MergeRequestConfig config = new MergeRequestConfig.Builder("title", RECORD_1_IRI, SOURCE_BRANCH_1_IRI, TARGET_BRANCH_1_IRI, user1)
                .description("description")
                .addAssignee(user1)
                .build();

        try (RepositoryConnection conn = repo.getConnection()) {
            MergeRequest result = manager.createMergeRequest(config, LOCAL_CATALOG_IRI, conn);
            Optional<Value> title = result.getProperty(VALUE_FACTORY.createIRI(_Thing.title_IRI));
            assertTrue(title.isPresent());
            assertEquals("title", title.get().stringValue());
            Optional<Value> description = result.getProperty(VALUE_FACTORY.createIRI(_Thing.description_IRI));
            assertTrue(description.isPresent());
            assertEquals("description", description.get().stringValue());
            Optional<Resource> record = result.getOnRecord_resource();
            assertTrue(record.isPresent());
            assertEquals(RECORD_1_IRI, record.get());
            Optional<Resource> sourceBranch = result.getSourceBranch_resource();
            assertTrue(sourceBranch.isPresent());
            assertEquals(SOURCE_BRANCH_1_IRI, sourceBranch.get());
            Optional<Resource> targetBranch = result.getTargetBranch_resource();
            assertTrue(targetBranch.isPresent());
            assertEquals(TARGET_BRANCH_1_IRI, targetBranch.get());
            Optional<Value> creator = result.getProperty(VALUE_FACTORY.createIRI(_Thing.creator_IRI));
            assertTrue(creator.isPresent());
            assertEquals(user1.getResource().stringValue(), creator.get().stringValue());
            assertEquals(1, result.getAssignee_resource().size());
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void createMergeRequestWithInvalidBranchTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(utilsService).validateBranch(eq(LOCAL_CATALOG_IRI), eq(RECORD_1_IRI), eq(SOURCE_BRANCH_1_IRI), any(RepositoryConnection.class));
        MergeRequestConfig config = new MergeRequestConfig.Builder("title", RECORD_1_IRI, SOURCE_BRANCH_1_IRI, TARGET_BRANCH_1_IRI, user1).build();

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.createMergeRequest(config, LOCAL_CATALOG_IRI, conn);
        }
    }

    /* addMergeRequest */

    @Test
    public void addMergeRequestTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.addMergeRequest(request3, conn);
            assertTrue(conn.containsContext(request3.getResource()));
            assertTrue(conn.contains(request3.getResource(), null, null, request3.getResource()));
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void addMergeRequestThatAlreadyExistsTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.addMergeRequest(request1, conn);
        }
    }

    /* getMergeRequest */

    @Test
    public void getMergeRequestTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            Optional<MergeRequest> result = manager.getMergeRequest(request1.getResource(), conn);
            assertTrue(result.isPresent());
            assertEquals(request1.getModel(), result.get().getModel());
        }
    }

    @Test
    public void getMergeRequestThatDoesNotExistTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            Optional<MergeRequest> result = manager.getMergeRequest(request3.getResource(), conn);
            assertFalse(result.isPresent());
        }
    }

    /* updateMergeRequest */

    @Test
    public void updateMergeRequestTest() {
        MergeRequest request1Update = mergeRequestFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/merge-requests#1"));
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.updateMergeRequest(request1Update.getResource(), request1Update, conn);
        }
        verify(utilsService).validateResource(eq(request1Update.getResource()), eq(mergeRequestFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService).updateObject(eq(request1Update), any(RepositoryConnection.class));
    }

    @Test
    public void updateMergeRequestDoesNotExistTest() {
        // Setup
        thrown.expect(IllegalArgumentException.class);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.updateMergeRequest(request3.getResource(), request3, conn);
        }
        verify(utilsService).validateResource(eq(request3.getResource()), eq(mergeRequestFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService).updateObject(eq(request3), any(RepositoryConnection.class));
    }

    /* deleteMergeRequest */

    @Test
    public void deleteMergeRequestTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.deleteMergeRequest(request1.getResource(), conn);
        }
        verify(utilsService).validateResource(eq(request1.getResource()), eq(mergeRequestFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService).remove(eq(request1.getResource()), any(RepositoryConnection.class));
    }

    @Test
    public void deleteMergeRequestDoesNotExistTest() {
        // Setup
        thrown.expect(IllegalArgumentException.class);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.deleteMergeRequest(request3.getResource(), conn);
        }
        verify(utilsService).validateResource(eq(request3.getResource()), eq(mergeRequestFactory.getTypeIRI()), any(RepositoryConnection.class));
    }

    /* acceptMergeRequest */

    @Test
    public void acceptMergeRequestTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.acceptMergeRequest(request1.getResource(), user1, conn);
        }
        verify(utilsService).getConflicts(eq(sourceCommit1.getResource()), eq(targetCommit1.getResource()), any(RepositoryConnection.class));
        verify(versioningManager).merge(LOCAL_CATALOG_IRI, RECORD_1_IRI, SOURCE_BRANCH_1_IRI, TARGET_BRANCH_1_IRI, user1, null, null);
        verify(utilsService).updateObject(argThat(matches((AcceptedMergeRequest r) -> {
            boolean hasResource = r.getResource().equals(request1.getResource());
            boolean hasNoSourceBranch = !r.getSourceBranch_resource().isPresent();
            boolean hasNoTargetBranch = !r.getTargetBranch_resource().isPresent();
            boolean hasSourceTitle = r.getSourceBranchTitle().isPresent() && r.getSourceBranchTitle().get().equals(SOURCE_BRANCH_TITLE);
            boolean hasTargetTitle = r.getTargetBranchTitle().isPresent() && r.getTargetBranchTitle().get().equals(TARGET_BRANCH_TITLE);
            boolean hasSourceCommit = r.getSourceCommit_resource().isPresent() && r.getSourceCommit_resource().get().equals(sourceCommit1.getResource());
            boolean hasTargetCommit = r.getTargetCommit_resource().isPresent() && r.getTargetCommit_resource().get().equals(targetCommit1.getResource());
            return hasResource && hasNoSourceBranch && hasNoTargetBranch && hasSourceTitle && hasTargetTitle && hasSourceCommit && hasTargetCommit;
        })), any(RepositoryConnection.class));
    }

    @Test
    public void acceptMergeRequestWithoutRecordTest() {
        // Setup
        thrown.expect(IllegalStateException.class);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.acceptMergeRequest(request3.getResource(), user1, conn);
        }
        verify(versioningManager, never()).merge(any(Resource.class), any(Resource.class), any(Resource.class), any(Resource.class), any(User.class), any(), any());
    }

    @Test
    public void acceptMergeRequestWithNoCatalogTest() {
        // Setup
        thrown.expect(IllegalStateException.class);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.acceptMergeRequest(request2.getResource(), user1, conn);
        }
        verify(versioningManager, never()).merge(any(Resource.class), any(Resource.class), any(Resource.class), any(Resource.class), any(User.class), any(), any());
    }

    @Test
    public void acceptMergeRequestWithNoSourceTest() {
        // Setup
        request1.removeProperty(SOURCE_BRANCH_1_IRI, VALUE_FACTORY.createIRI(MergeRequest.sourceBranch_IRI));
        thrown.expect(IllegalStateException.class);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.acceptMergeRequest(request1.getResource(), user1, conn);
        }
        verify(versioningManager, never()).merge(any(Resource.class), any(Resource.class), any(Resource.class), any(Resource.class), any(User.class), any(), any());
    }

    @Test
    public void acceptMergeRequestWithNoTargetTest() {
        // Setup
        request1.removeProperty(TARGET_BRANCH_1_IRI, VALUE_FACTORY.createIRI(MergeRequest.targetBranch_IRI));
        thrown.expect(IllegalArgumentException.class);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.acceptMergeRequest(request1.getResource(), user1, conn);
        }
        verify(versioningManager, never()).merge(any(Resource.class), any(Resource.class), any(Resource.class), any(Resource.class), any(User.class), any(), any());
    }

    @Test
    public void acceptMergeRequestWithNoSourceHeadTest() {
        // Setup
        sourceBranch1.removeProperty(sourceCommit1.getResource(), VALUE_FACTORY.createIRI(Branch.head_IRI));
        thrown.expect(IllegalStateException.class);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.acceptMergeRequest(request1.getResource(), user1, conn);
        }
        verify(versioningManager, never()).merge(any(Resource.class), any(Resource.class), any(Resource.class), any(Resource.class), any(User.class), any(), any());
    }

    @Test
    public void acceptMergeRequestWithNoTargetHeadTest() {
        // Setup
        targetBranch1.removeProperty(targetCommit1.getResource(), VALUE_FACTORY.createIRI(Branch.head_IRI));
        thrown.expect(IllegalStateException.class);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.acceptMergeRequest(request1.getResource(), user1, conn);
        }
        verify(versioningManager, never()).merge(any(Resource.class), any(Resource.class), any(Resource.class), any(Resource.class), any(User.class), any(), any());
    }

    @Test
    public void acceptMergeRequestWithConflictsTest() {
        // Setup
        when(utilsService.getConflicts(any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(Collections.singleton(conflict));
        thrown.expect(IllegalArgumentException.class);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.acceptMergeRequest(request1.getResource(), user1, conn);
        }
        verify(utilsService).getConflicts(eq(sourceCommit1.getResource()), eq(targetCommit1.getResource()), any(RepositoryConnection.class));
        verify(versioningManager, never()).merge(any(Resource.class), any(Resource.class), any(Resource.class), any(Resource.class), any(User.class), any(), any());
        verify(utilsService, never()).updateObject(any(), any(RepositoryConnection.class));
    }

    @Test
    public void acceptMergeRequestWithNoSourceTitleTest() {
        // Setup
        sourceBranch1.removeProperty(null, VALUE_FACTORY.createIRI(_Thing.title_IRI));
        thrown.expect(IllegalStateException.class);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.acceptMergeRequest(request1.getResource(), user1, conn);
        }
        verify(versioningManager, never()).merge(any(Resource.class), any(Resource.class), any(Resource.class), any(Resource.class), any(User.class), any(), any());
    }

    @Test
    public void acceptMergeRequestWithNoTargetTitleTest() {
        // Setup
        targetBranch1.removeProperty(null, VALUE_FACTORY.createIRI(_Thing.title_IRI));
        thrown.expect(IllegalStateException.class);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.acceptMergeRequest(request1.getResource(), user1, conn);
        }
        verify(versioningManager, never()).merge(any(Resource.class), any(Resource.class), any(Resource.class), any(Resource.class), any(User.class), any(), any());
    }

    @Test(expected = IllegalArgumentException.class)
    public void acceptMergeRequestAlreadyAcceptedTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.acceptMergeRequest(request4.getResource(), user1, conn);
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void acceptMergeRequestThatDoesNotExistTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.acceptMergeRequest(VALUE_FACTORY.createIRI("urn:test"), user1, conn);
        }
    }

    /* cleanMergeRequests */

    @Test
    public void cleanMergeRequestsSourceBranch() {
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.cleanMergeRequests(RECORD_1_IRI, SOURCE_BRANCH_1_IRI, conn);
        }
        verify(utilsService).remove(eq(request1.getResource()), any(RepositoryConnection.class));
        verify(utilsService, times(0)).remove(eq(request2.getResource()), any(RepositoryConnection.class));
        verify(utilsService, times(0)).remove(eq(request3.getResource()), any(RepositoryConnection.class));
        verify(utilsService, times(0)).remove(eq(request4.getResource()), any(RepositoryConnection.class));
        verify(utilsService, times(0)).updateObject(any(MergeRequest.class), any(RepositoryConnection.class));
    }

    @Test
    public void cleanMergeRequestsTargetBranch() {
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.cleanMergeRequests(RECORD_1_IRI, TARGET_BRANCH_1_IRI, conn);
        }
        verify(utilsService).validateResource(eq(request1.getResource()), eq(mergeRequestFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService, times(0)).validateResource(eq(request2.getResource()), eq(mergeRequestFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService, times(0)).validateResource(eq(request3.getResource()), eq(mergeRequestFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService, times(0)).validateResource(eq(request4.getResource()), eq(mergeRequestFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService, times(0)).remove(any(Resource.class), any(RepositoryConnection.class));
    }

    @Test
    public void cleanMergeRequestsRecordWithNoMR() {
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.cleanMergeRequests(VALUE_FACTORY.createIRI("http://mobi.com/test/records#versioned-rdf-record3"), TARGET_BRANCH_1_IRI, conn);
        }
        verify(utilsService, times(0)).updateObject(any(MergeRequest.class), any(RepositoryConnection.class));
        verify(utilsService, times(0)).remove(any(Resource.class), any(RepositoryConnection.class));
    }

    /* deleteMergeRequestsWithRecordId */

    @Test
    public void deleteMergeRequestsWithRecordId() {
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.deleteMergeRequestsWithRecordId(RECORD_1_IRI, conn);
        }
        verify(utilsService).remove(eq(request1.getResource()), any(RepositoryConnection.class));
        verify(utilsService).remove(eq(request4.getResource()), any(RepositoryConnection.class));
        verify(utilsService, times(0)).remove(eq(request2.getResource()), any(RepositoryConnection.class));
        verify(utilsService, times(0)).remove(eq(request3.getResource()), any(RepositoryConnection.class));
    }

    @Test
    public void deleteMergeRequestsWithRecordIdRecordWithNoMR() {
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.deleteMergeRequestsWithRecordId(VALUE_FACTORY.createIRI("http://mobi.com/test/records#versioned-rdf-record3"), conn);
        }
        verify(utilsService, times(0)).remove(any(Resource.class), any(RepositoryConnection.class));
    }

    private static <T> ArgumentMatcher<T> matches(Predicate<T> predicate) {
        return new ArgumentMatcher<T>() {

            @SuppressWarnings("unchecked")
            @Override
            public boolean matches(Object argument) {
                return predicate.test((T) argument);
            }
        };
    }
}
