package com.mobi.catalog.impl.mergerequest;

/*-
 * #%L
 * com.mobi.catalog.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.builder.Conflict;
import com.mobi.catalog.api.mergerequest.MergeRequestConfig;
import com.mobi.catalog.api.mergerequest.MergeRequestFilterParams;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.ontologies.mergerequests.AcceptedMergeRequest;
import com.mobi.catalog.api.ontologies.mergerequests.Comment;
import com.mobi.catalog.api.ontologies.mergerequests.CommentFactory;
import com.mobi.catalog.api.ontologies.mergerequests.MergeRequest;
import com.mobi.catalog.api.versioning.VersioningManager;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.persistence.utils.ConnectionUtils;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.security.policy.api.PDP;
import com.mobi.security.policy.api.Request;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.repository.RepositoryConnection;
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
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Predicate;

public class SimpleMergeRequestManagerTest extends OrmEnabledTestCase {
    private AutoCloseable closeable;
    private MemoryRepositoryWrapper repo;
    private SimpleMergeRequestManager manager;
    private OrmFactory<MergeRequest> mergeRequestFactory = getRequiredOrmFactory(MergeRequest.class);
    private OrmFactory<AcceptedMergeRequest> acceptedMergeRequestFactory = getRequiredOrmFactory(AcceptedMergeRequest.class);
    private OrmFactory<Comment> commentFactory = getRequiredOrmFactory(Comment.class);
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
    private Comment comment1;
    private Comment comment2;
    private Comment comment3;
    private Comment comment4;
    private Comment commentA;
    private Comment commentB;
    private Comment commentC;
    private Comment commentI;
    private Comment commentX;
    private Comment commentY;
    private Comment commentZ;

    private final IRI LOCAL_CATALOG_IRI = VALUE_FACTORY.createIRI("http://mobi.com/catalogs#local");
    private final IRI RECORD_1_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/records#versioned-rdf-record1");
    private final IRI RECORD_2_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/records#versioned-rdf-record2");
    private final IRI SOURCE_BRANCH_1_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#source1");
    private final IRI SOURCE_BRANCH_2_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#source2");
    private final String SOURCE_BRANCH_TITLE = "Source Title";
    private final IRI TARGET_BRANCH_1_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#target1");
    private final IRI TARGET_BRANCH_2_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#target2");
    private final IRI DOES_NOT_EXIST_IRI = VALUE_FACTORY.createIRI("urn:does_not_exist");
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

    @Mock
    private PDP pdp;

    @Mock
    private Request request;

    @Before
    public void setUp() {
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));

        titleIRI = VALUE_FACTORY.createIRI(_Thing.title_IRI);

        versionedRDFRecord1 = versionedRDFRecordFactory.createNew(RECORD_1_IRI);
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
        request1.setRemoveSource(true);
        request2 = mergeRequestFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/merge-requests#2"));
        request2.setProperty(VALUE_FACTORY.createLiteral(OffsetDateTime.of(2018, 1, 2, 0, 0, 0, 0, ZoneOffset.UTC)), VALUE_FACTORY.createIRI(_Thing.issued_IRI));
        request2.setProperty(VALUE_FACTORY.createLiteral("Request 2"), VALUE_FACTORY.createIRI(_Thing.title_IRI));
        request2.setAssignee(userSet2);
        request2.setOnRecord(versionedRDFRecord2);
        request2.setSourceBranch(sourceBranch2);
        request2.setTargetBranch(targetBranch2);
        request2.setRemoveSource(false);
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


        comment1 = commentFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/comments#1"));
        comment1.setOnMergeRequest(request1);
        comment1.setProperty(VALUE_FACTORY.createLiteral("2018-11-05T13:40:55.257-07:00"), VALUE_FACTORY.createIRI(_Thing.issued_IRI));
        comment1.setProperty(VALUE_FACTORY.createLiteral("2018-11-05T13:40:55.257-07:00"), VALUE_FACTORY.createIRI(_Thing.modified_IRI));
        comment1.setProperty(user1.getResource(), VALUE_FACTORY.createIRI(_Thing.creator_IRI));
        comment1.setProperty(VALUE_FACTORY.createLiteral("Comment1"), VALUE_FACTORY.createIRI(_Thing.description_IRI));
        comment2 = commentFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/comments#2"));
        comment2.setProperty(VALUE_FACTORY.createLiteral("Comment2"), VALUE_FACTORY.createIRI(_Thing.description_IRI));
        comment2.setOnMergeRequest(request1);
        comment3 = commentFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/comments#3"));
        comment3.setProperty(VALUE_FACTORY.createLiteral("Comment3"), VALUE_FACTORY.createIRI(_Thing.description_IRI));
        comment3.setOnMergeRequest(request1);
        comment4 = commentFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/comments#4"));
        comment4.setProperty(VALUE_FACTORY.createLiteral("Comment4"), VALUE_FACTORY.createIRI(_Thing.description_IRI));
        comment4.setOnMergeRequest(request1);

        comment1.setReplyComment(comment2);
        comment2.setReplyComment(comment3);
        comment3.setReplyComment(comment4);

        commentA = commentFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/comments#A"));
        commentA.setOnMergeRequest(request1);
        commentA.setProperty(VALUE_FACTORY.createLiteral("2018-11-04T13:40:55.257-07:00"), VALUE_FACTORY.createIRI(_Thing.issued_IRI));
        commentA.setProperty(VALUE_FACTORY.createLiteral("2018-11-04T13:40:55.257-07:00"), VALUE_FACTORY.createIRI(_Thing.modified_IRI));
        commentA.setProperty(VALUE_FACTORY.createLiteral("CommentA"), VALUE_FACTORY.createIRI(_Thing.description_IRI));
        commentB = commentFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/comments#B"));
        commentB.setProperty(VALUE_FACTORY.createLiteral("CommentB"), VALUE_FACTORY.createIRI(_Thing.description_IRI));
        commentB.setOnMergeRequest(request1);
        commentC = commentFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/comments#C"));
        commentC.setProperty(VALUE_FACTORY.createLiteral("CommentC"), VALUE_FACTORY.createIRI(_Thing.description_IRI));
        commentC.setOnMergeRequest(request1);

        commentA.setReplyComment(commentB);
        commentB.setReplyComment(commentC);

        commentI = commentFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/comments#I"));
        commentI.setOnMergeRequest(request1);
        commentI.setProperty(VALUE_FACTORY.createLiteral("2018-11-10T13:40:55.257-07:00"), VALUE_FACTORY.createIRI(_Thing.issued_IRI));
        commentI.setProperty(VALUE_FACTORY.createLiteral("2018-11-10T13:40:55.257-07:00"), VALUE_FACTORY.createIRI(_Thing.modified_IRI));
        commentI.setProperty(VALUE_FACTORY.createLiteral("CommentI"), VALUE_FACTORY.createIRI(_Thing.description_IRI));

        commentX = commentFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/comments#X"));
        commentX.setProperty(VALUE_FACTORY.createLiteral("2018-11-02T13:40:55.257-07:00"), VALUE_FACTORY.createIRI(_Thing.issued_IRI));
        commentX.setProperty(VALUE_FACTORY.createLiteral("2018-11-02T13:40:55.257-07:00"), VALUE_FACTORY.createIRI(_Thing.modified_IRI));
        commentX.setProperty(VALUE_FACTORY.createLiteral("CommentX"), VALUE_FACTORY.createIRI(_Thing.description_IRI));
        commentX.setOnMergeRequest(request2);
        commentY = commentFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/comments#Y"));
        commentY.setProperty(VALUE_FACTORY.createLiteral("CommentY"), VALUE_FACTORY.createIRI(_Thing.description_IRI));
        commentY.setOnMergeRequest(request2);
        commentZ = commentFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/comments#Z"));
        commentZ.setProperty(VALUE_FACTORY.createLiteral("CommentZ"), VALUE_FACTORY.createIRI(_Thing.description_IRI));
        commentZ.setOnMergeRequest(request2);

        commentX.setReplyComment(commentY);
        commentY.setReplyComment(commentZ);

        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(request1.getModel(), request1.getResource());
            conn.add(request2.getModel(), request2.getResource());
            conn.add(request4.getModel(), request4.getResource());
            conn.add(request5.getModel(), request5.getResource());

            conn.add(comment1.getModel(), comment1.getResource());
            conn.add(comment2.getModel(), comment2.getResource());
            conn.add(comment3.getModel(), comment3.getResource());
            conn.add(comment4.getModel(), comment4.getResource());

            conn.add(commentA.getModel(), commentA.getResource());
            conn.add(commentB.getModel(), commentB.getResource());
            conn.add(commentC.getModel(), commentC.getResource());

            conn.add(commentI.getModel(), commentI.getResource());

            conn.add(commentX.getModel(), commentX.getResource());
            conn.add(commentY.getModel(), commentY.getResource());
            conn.add(commentZ.getModel(), commentZ.getResource());
        }

        closeable = MockitoAnnotations.openMocks(this);

        when(configProvider.getRepository()).thenReturn(repo);
        when(configProvider.getLocalCatalogIRI()).thenReturn(LOCAL_CATALOG_IRI);

        when(utilsService.getExpectedObject(any(Resource.class), eq(mergeRequestFactory), any(RepositoryConnection.class))).thenAnswer(i -> {
            Resource iri = i.getArgument(0, Resource.class);
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
            Resource iri = i.getArgument(0, Resource.class);
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
        when(utilsService.optObject(any(Resource.class), eq(mergeRequestFactory), any(RepositoryConnection.class))).thenReturn(Optional.empty());
        when(utilsService.optObject(eq(request1.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class))).thenReturn(Optional.of(request1));
        when(utilsService.optObject(eq(request4.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class))).thenReturn(Optional.of(request4));
        when(utilsService.optObject(eq(request5.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class))).thenReturn(Optional.of(request5));
        when(utilsService.throwAlreadyExists(any(Resource.class), any(OrmFactory.class))).thenReturn(new IllegalArgumentException());
        doThrow(new IllegalArgumentException()).when(utilsService).validateResource(eq(request3.getResource()), eq(mergeRequestFactory.getTypeIRI()), any(RepositoryConnection.class));
        when(utilsService.getConflicts(any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(Collections.emptySet());

        when(utilsService.optObject(eq(DOES_NOT_EXIST_IRI), eq(commentFactory), any(RepositoryConnection.class))).thenReturn(Optional.empty());
        when(utilsService.optObject(eq(comment1.getResource()), eq(commentFactory), any(RepositoryConnection.class))).thenReturn(Optional.of(comment1));
        when(utilsService.optObject(eq(comment2.getResource()), eq(commentFactory), any(RepositoryConnection.class))).thenReturn(Optional.of(comment2));
        when(utilsService.optObject(eq(comment3.getResource()), eq(commentFactory), any(RepositoryConnection.class))).thenReturn(Optional.of(comment3));
        when(utilsService.optObject(eq(comment4.getResource()), eq(commentFactory), any(RepositoryConnection.class))).thenReturn(Optional.of(comment4));
        when(utilsService.optObject(eq(commentA.getResource()), eq(commentFactory), any(RepositoryConnection.class))).thenReturn(Optional.of(commentA));
        when(utilsService.optObject(eq(commentB.getResource()), eq(commentFactory), any(RepositoryConnection.class))).thenReturn(Optional.of(commentB));
        when(utilsService.optObject(eq(commentC.getResource()), eq(commentFactory), any(RepositoryConnection.class))).thenReturn(Optional.of(commentC));
        when(utilsService.optObject(eq(commentX.getResource()), eq(commentFactory), any(RepositoryConnection.class))).thenReturn(Optional.of(commentX));
        when(utilsService.optObject(eq(commentY.getResource()), eq(commentFactory), any(RepositoryConnection.class))).thenReturn(Optional.of(commentY));
        when(utilsService.optObject(eq(commentZ.getResource()), eq(commentFactory), any(RepositoryConnection.class))).thenReturn(Optional.of(commentZ));
        when(utilsService.optObject(eq(commentI.getResource()), eq(commentFactory), any(RepositoryConnection.class))).thenReturn(Optional.of(commentI));
        doThrow(new IllegalArgumentException()).when(utilsService).validateResource(eq(DOES_NOT_EXIST_IRI), eq(commentFactory.getTypeIRI()), any(RepositoryConnection.class));

        when(pdp.createRequest(any(List.class), any(Map.class), any(List.class), any(Map.class), any(List.class), any(Map.class))).thenReturn(request);
        when(pdp.filter(eq(request), any(IRI.class))).thenReturn(Collections.singleton(versionedRDFRecord2.getResource().stringValue()));

        manager = spy(new SimpleMergeRequestManager());
        injectOrmFactoryReferencesIntoService(manager);
        manager.catalogUtils = utilsService;
        manager.versioningManager = versioningManager;
        manager.configProvider = configProvider;
        manager.pdp = pdp;
    }

    @After
    public void tearDown() throws Exception {
        repo.shutDown();
        closeable.close();
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
    public void getOpenMergeRequestsRemoveSource() {
        try (RepositoryConnection conn = repo.getConnection()) {
            MergeRequestFilterParams.Builder builder = new MergeRequestFilterParams.Builder().setSortBy(VALUE_FACTORY.createIRI(_Thing.title_IRI));
            builder.setRemoveSource(true);
            List<MergeRequest> result = manager.getMergeRequests(builder.build(), conn);
            assertEquals(1, result.size());
            assertEquals(request1.getResource(), result.get(0).getResource());
            verify(utilsService).getExpectedObject(eq(request1.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));

            builder.setRemoveSource(false);
            result = manager.getMergeRequests(builder.build(), conn);
            assertEquals(1, result.size());
            assertEquals(request2.getResource(), result.get(0).getResource());
            verify(utilsService).getExpectedObject(eq(request2.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));
        }
    }

    @Test
    public void getOpenMergeRequestsRequestingUserTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            MergeRequestFilterParams.Builder builder = new MergeRequestFilterParams.Builder();
            builder.setRequestingUser(user2);
            List<MergeRequest> result = manager.getMergeRequests(builder.build(), conn);
            assertEquals(1, result.size());
            assertEquals(request2.getResource(), result.get(0).getResource());
            verify(utilsService).getExpectedObject(eq(request1.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));
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
        MergeRequestConfig config = new MergeRequestConfig.Builder("title", RECORD_1_IRI, SOURCE_BRANCH_1_IRI, TARGET_BRANCH_1_IRI, user1, true)
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
            assertTrue(result.getRemoveSource().get());
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
        MergeRequestConfig config = new MergeRequestConfig.Builder("title", RECORD_1_IRI, SOURCE_BRANCH_1_IRI, TARGET_BRANCH_1_IRI, user1, true).build();

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.createMergeRequest(config, LOCAL_CATALOG_IRI, conn);
        }
    }

    /* addMergeRequest */

    @Test
    public void addMergeRequestTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.addMergeRequest(request3, conn);
            assertTrue(ConnectionUtils.containsContext(conn, request3.getResource()));
            assertTrue(ConnectionUtils.contains(conn, request3.getResource(), null, null, request3.getResource()));
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
        verify(utilsService, times(13)).validateResource(any(Resource.class), eq(commentFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService).remove(eq(comment1.getResource()), any(RepositoryConnection.class));
        verify(utilsService).remove(eq(comment2.getResource()), any(RepositoryConnection.class));
        verify(utilsService).remove(eq(comment3.getResource()), any(RepositoryConnection.class));
        verify(utilsService).remove(eq(comment4.getResource()), any(RepositoryConnection.class));
        verify(utilsService).remove(eq(commentA.getResource()), any(RepositoryConnection.class));
        verify(utilsService).remove(eq(commentB.getResource()), any(RepositoryConnection.class));
        verify(utilsService).remove(eq(commentC.getResource()), any(RepositoryConnection.class));
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
        verify(utilsService, never()).validateResource(any(Resource.class), eq(commentFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService, never()).remove(any(Resource.class), any(RepositoryConnection.class));
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
            boolean hasNoRemoveSource = !r.getRemoveSource().isPresent();
            boolean hasSourceTitle = r.getSourceBranchTitle().isPresent() && r.getSourceBranchTitle().get().equals(SOURCE_BRANCH_TITLE);
            boolean hasTargetTitle = r.getTargetBranchTitle().isPresent() && r.getTargetBranchTitle().get().equals(TARGET_BRANCH_TITLE);
            boolean hasSourceCommit = r.getSourceCommit_resource().isPresent() && r.getSourceCommit_resource().get().equals(sourceCommit1.getResource());
            boolean hasTargetCommit = r.getTargetCommit_resource().isPresent() && r.getTargetCommit_resource().get().equals(targetCommit1.getResource());
            return hasResource && hasNoSourceBranch && hasNoTargetBranch && hasNoRemoveSource && hasSourceTitle && hasTargetTitle && hasSourceCommit && hasTargetCommit ;
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
        verify(utilsService, never()).remove(eq(request2.getResource()), any(RepositoryConnection.class));
        verify(utilsService, never()).remove(eq(request3.getResource()), any(RepositoryConnection.class));
        verify(utilsService, never()).remove(eq(request4.getResource()), any(RepositoryConnection.class));
        verify(manager, never()).updateMergeRequest(any(Resource.class), any(MergeRequest.class));
    }

    @Test
    public void cleanMergeRequestsTargetBranch() {
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.cleanMergeRequests(RECORD_1_IRI, TARGET_BRANCH_1_IRI, conn);
        }
        verify(utilsService).validateResource(eq(request1.getResource()), eq(mergeRequestFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService, never()).validateResource(eq(request2.getResource()), eq(mergeRequestFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService, never()).validateResource(eq(request3.getResource()), eq(mergeRequestFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService, never()).validateResource(eq(request4.getResource()), eq(mergeRequestFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService, never()).remove(any(Resource.class), any(RepositoryConnection.class));
    }

    @Test
    public void cleanMergeRequestsRecordWithNoMR() {
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.cleanMergeRequests(VALUE_FACTORY.createIRI("http://mobi.com/test/records#versioned-rdf-record3"), TARGET_BRANCH_1_IRI, conn);
        }
        verify(utilsService, never()).updateObject(any(MergeRequest.class), any(RepositoryConnection.class));
        verify(utilsService, never()).remove(any(Resource.class), any(RepositoryConnection.class));
    }

    /* deleteMergeRequestsWithRecordId */

    @Test
    public void deleteMergeRequestsWithRecordId() {
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.deleteMergeRequestsWithRecordId(RECORD_1_IRI, conn);
        }
        verify(utilsService, times(13)).validateResource(any(Resource.class), eq(commentFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService).remove(eq(comment1.getResource()), any(RepositoryConnection.class));
        verify(utilsService).remove(eq(comment2.getResource()), any(RepositoryConnection.class));
        verify(utilsService).remove(eq(comment3.getResource()), any(RepositoryConnection.class));
        verify(utilsService).remove(eq(comment4.getResource()), any(RepositoryConnection.class));
        verify(utilsService).remove(eq(commentA.getResource()), any(RepositoryConnection.class));
        verify(utilsService).remove(eq(commentB.getResource()), any(RepositoryConnection.class));
        verify(utilsService).remove(eq(commentC.getResource()), any(RepositoryConnection.class));        verify(utilsService).remove(eq(request1.getResource()), any(RepositoryConnection.class));
        verify(utilsService).remove(eq(request4.getResource()), any(RepositoryConnection.class));
        verify(utilsService, never()).remove(eq(request2.getResource()), any(RepositoryConnection.class));
        verify(utilsService, never()).remove(eq(request3.getResource()), any(RepositoryConnection.class));
    }

    @Test
    public void deleteMergeRequestsWithRecordIdRecordWithNoMR() {
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.deleteMergeRequestsWithRecordId(VALUE_FACTORY.createIRI("http://mobi.com/test/records#versioned-rdf-record3"), conn);
        }
        verify(utilsService, never()).remove(any(Resource.class), any(RepositoryConnection.class));
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

    /* getComment */

    @Test
    public void getCommentTest() {
        Optional<Comment> commentOpt = manager.getComment(comment1.getResource());
        assertTrue(commentOpt.isPresent());
        Comment comment = commentOpt.get();
        assertEquals(comment1.getModel(), comment.getModel());
        verify(utilsService).optObject(eq(comment1.getResource()), any(CommentFactory.class), any(RepositoryConnection.class));
    }

    @Test
    public void getCommentDoesNotExistTest() {
        Optional<Comment> commentOpt = manager.getComment(DOES_NOT_EXIST_IRI);
        assertTrue(!commentOpt.isPresent());
        verify(utilsService).optObject(eq(DOES_NOT_EXIST_IRI), any(CommentFactory.class), any(RepositoryConnection.class));
    }

    @Test
    public void getCommentWithConnTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            Optional<Comment> commentOpt = manager.getComment(comment1.getResource(), conn);
            assertTrue(commentOpt.isPresent());
            Comment comment = commentOpt.get();
            assertEquals(comment1.getModel(), comment.getModel());
            verify(utilsService).optObject(eq(comment1.getResource()), any(CommentFactory.class), any(RepositoryConnection.class));
        }
    }

    @Test
    public void getCommentDoesNotExistWithConnTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            Optional<Comment> commentOpt = manager.getComment(DOES_NOT_EXIST_IRI, conn);
            assertTrue(!commentOpt.isPresent());
            verify(utilsService).optObject(eq(DOES_NOT_EXIST_IRI), any(CommentFactory.class), any(RepositoryConnection.class));
        }
    }

    /* getComments */

    @Test
    public void getCommentsTest() {
        List<List<Comment>> comments = manager.getComments(request1.getResource());
        assertEquals(3, comments.size());
        String firstThreadTime = comments.get(0).get(0).getProperty(VALUE_FACTORY.createIRI(_Thing.issued_IRI)).get().stringValue();
        String secondThreadTime = comments.get(1).get(0).getProperty(VALUE_FACTORY.createIRI(_Thing.issued_IRI)).get().stringValue();
        assertTrue(OffsetDateTime.parse(firstThreadTime).isBefore(OffsetDateTime.parse(secondThreadTime)));
    }

    @Test
    public void getCommentsDoesNotExistTest() {
        thrown.expect(IllegalArgumentException.class);

        manager.getComments(DOES_NOT_EXIST_IRI);
    }

    @Test
    public void getCommentsWithNoCommentsOnRequestTest() {
        List<List<Comment>> comments = manager.getComments(request5.getResource());
        assertEquals(0, comments.size());
    }

    /* createComment */

    @Test
    public void createCommentTest() {
        String commentStr = "This is a test comment.";
        Comment comment = manager.createComment(request1.getResource(), user1, commentStr);
        assertEquals(request1.getResource(), comment.getOnMergeRequest_resource().get());
        assertEquals(user1.getResource(), comment.getProperty(VALUE_FACTORY.createIRI(_Thing.creator_IRI)).get());
        assertEquals(commentStr, comment.getProperty(VALUE_FACTORY.createIRI(_Thing.description_IRI)).get().stringValue());
        assertTrue(comment.getProperty(VALUE_FACTORY.createIRI(_Thing.modified_IRI)).isPresent());
        assertTrue(comment.getProperty(VALUE_FACTORY.createIRI(_Thing.issued_IRI)).isPresent());
        assertFalse(comment.getReplyComment().isPresent());

        verify(utilsService).optObject(eq(request1.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));
    }

    @Test
    public void createCommentLargeStringTest() {
        thrown.expect(IllegalArgumentException.class);

        String commentStr = new String(new char[1100000]).replace('\0', ' ');
        Comment comment = manager.createComment(request1.getResource(), user1, commentStr);

        verify(utilsService).optObject(eq(request1.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));
    }

    @Test
    public void createCommentRequestDoesNotExistTest() {
        thrown.expect(IllegalArgumentException.class);

        String commentStr = "This is a test comment.";
        manager.createComment(DOES_NOT_EXIST_IRI, user1, commentStr);

        verify(utilsService).optObject(eq(request1.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));
    }

    @Test
    public void createReplyCommentTest() {
        String commentStr = "This is a test comment.";
        Comment comment = manager.createComment(request1.getResource(), user1, commentStr, commentZ.getResource());
        assertEquals(request1.getResource(), comment.getOnMergeRequest_resource().get());
        assertEquals(user1.getResource(), comment.getProperty(VALUE_FACTORY.createIRI(_Thing.creator_IRI)).get());
        assertEquals(commentStr, comment.getProperty(VALUE_FACTORY.createIRI(_Thing.description_IRI)).get().stringValue());
        assertTrue(comment.getProperty(VALUE_FACTORY.createIRI(_Thing.modified_IRI)).isPresent());
        assertTrue(comment.getProperty(VALUE_FACTORY.createIRI(_Thing.issued_IRI)).isPresent());
        assertFalse(comment.getReplyComment().isPresent());

        Comment commentZRepo = manager.getComment(commentZ.getResource()).get();
        assertEquals(comment.getResource(), commentZRepo.getReplyComment_resource().get());

        verify(utilsService).optObject(eq(request1.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));
    }

    @Test
    public void createReplyCommentParentHasReplyAlreadyTest() {
        String commentStr = "This is a test comment.";
        Comment comment = manager.createComment(request1.getResource(), user1, commentStr, commentA.getResource());
        assertEquals(request1.getResource(), comment.getOnMergeRequest_resource().get());
        assertEquals(user1.getResource(), comment.getProperty(VALUE_FACTORY.createIRI(_Thing.creator_IRI)).get());
        assertEquals(commentStr, comment.getProperty(VALUE_FACTORY.createIRI(_Thing.description_IRI)).get().stringValue());
        assertTrue(comment.getProperty(VALUE_FACTORY.createIRI(_Thing.modified_IRI)).isPresent());
        assertTrue(comment.getProperty(VALUE_FACTORY.createIRI(_Thing.issued_IRI)).isPresent());
        assertFalse(comment.getReplyComment().isPresent());

        Comment commentCRepo = manager.getComment(commentC.getResource()).get();
        assertEquals(comment.getResource(), commentCRepo.getReplyComment_resource().get());

        verify(utilsService).optObject(eq(request1.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));
    }

    @Test
    public void createReplyCommentRequestDoesNotExistTest() {
        thrown.expect(IllegalArgumentException.class);

        String commentStr = "This is a test comment.";
        manager.createComment(DOES_NOT_EXIST_IRI, user1, commentStr, commentZ.getResource());

        verify(utilsService).optObject(eq(DOES_NOT_EXIST_IRI), eq(mergeRequestFactory), any(RepositoryConnection.class));
    }

    @Test
    public void createReplyCommentParentDoesNotExistTest() {
        thrown.expect(IllegalArgumentException.class);

        String commentStr = "This is a test comment.";
        manager.createComment(request1.getResource(), user1, commentStr, DOES_NOT_EXIST_IRI);

        verify(utilsService).optObject(eq(DOES_NOT_EXIST_IRI), eq(mergeRequestFactory), any(RepositoryConnection.class));
    }

    /* updateComment */

    @Test
    public void updateCommentTest() {
        Comment comment1Update = commentFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/comments#1"));
        comment1Update.setProperty(VALUE_FACTORY.createLiteral("Comment1Update"), VALUE_FACTORY.createIRI(_Thing.description_IRI));
        manager.updateComment(comment1Update.getResource(), comment1Update);

        verify(utilsService).validateResource(eq(comment1Update.getResource()), eq(commentFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService).updateObject(eq(comment1Update), any(RepositoryConnection.class));
    }

    @Test
    public void updateCommentTooLargeTest() {
        // Setup
        thrown.expect(IllegalArgumentException.class);

        Comment comment1Update = commentFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/comments#1"));
        comment1Update.setProperty(VALUE_FACTORY.createLiteral(StringUtils.repeat("*", 2000000)), VALUE_FACTORY.createIRI(_Thing.description_IRI));
        manager.updateComment(comment1Update.getResource(), comment1Update);

        verify(utilsService, never()).validateResource(eq(comment1Update.getResource()), eq(commentFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService, never()).updateObject(eq(comment1Update), any(RepositoryConnection.class));
    }

    @Test
    public void updateCommentEmptyDescriptionTest() {
        // Setup
        thrown.expect(IllegalArgumentException.class);

        Comment comment1Update = commentFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/comments#1"));
        comment1Update.setProperty(VALUE_FACTORY.createLiteral(""), VALUE_FACTORY.createIRI(_Thing.description_IRI));
        manager.updateComment(comment1Update.getResource(), comment1Update);

        verify(utilsService, never()).validateResource(eq(comment1Update.getResource()), eq(commentFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService, never()).updateObject(eq(comment1Update), any(RepositoryConnection.class));
    }

    @Test
    public void updateCommentNoDescriptionTest() {
        // Setup
        thrown.expect(IllegalArgumentException.class);

        Comment comment1Update = commentFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/comments#1"));
        manager.updateComment(comment1Update.getResource(), comment1Update);

        verify(utilsService, never()).validateResource(eq(comment1Update.getResource()), eq(commentFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService, never()).updateObject(eq(comment1Update), any(RepositoryConnection.class));
    }

    @Test
    public void updateCommentDoesNotExistTest() {
        // Setup
        thrown.expect(IllegalArgumentException.class);

        Comment commentDoesNotExist = commentFactory.createNew(DOES_NOT_EXIST_IRI);
        commentDoesNotExist.setProperty(VALUE_FACTORY.createLiteral("commentDoesNotExist"), VALUE_FACTORY.createIRI(_Thing.description_IRI));
        manager.updateComment(DOES_NOT_EXIST_IRI, commentDoesNotExist);

        verify(utilsService).validateResource(eq(commentDoesNotExist.getResource()), eq(commentFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService).updateObject(eq(commentDoesNotExist), any(RepositoryConnection.class));
    }

    @Test
    public void updateCommentTimeTest() {
        Optional<Value> preUpdateTime = comment1.getProperty(VALUE_FACTORY.createIRI(_Thing.modified_IRI));
        manager.updateComment(comment1.getResource(), comment1);
        Optional<Value> postUpdateTime = comment1.getProperty(VALUE_FACTORY.createIRI(_Thing.modified_IRI));

        assertNotEquals(preUpdateTime.get().stringValue(), postUpdateTime.get().stringValue());
        verify(utilsService).validateResource(eq(comment1.getResource()), eq(commentFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService).updateObject(eq(comment1), any(RepositoryConnection.class));
    }

    /* deleteComment */

    @Test
    public void deleteCommentHeadTest() {
        manager.deleteComment(comment1.getResource());

        verify(manager).getComment(eq(comment1.getResource()), any(RepositoryConnection.class));
        verify(manager, never()).updateComment(any(Resource.class), any(Comment.class));
        verify(utilsService).validateResource(eq(comment1.getResource()), eq(commentFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService).remove(eq(comment1.getResource()), any(RepositoryConnection.class));
    }

    @Test
    public void deleteCommentMiddleTest() {
        manager.deleteComment(comment2.getResource());

        comment1.setReplyComment(comment3);

        verify(manager).getComment(eq(comment2.getResource()), any(RepositoryConnection.class));
        verify(manager).getComment(eq(comment1.getResource()), any(RepositoryConnection.class));
        verify(manager).getComment(eq(comment3.getResource()), any(RepositoryConnection.class));
        verify(manager).updateComment(eq(comment1.getResource()), eq(comment1));
        verify(utilsService).validateResource(eq(comment2.getResource()), eq(commentFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService).remove(eq(comment2.getResource()), any(RepositoryConnection.class));
    }

    @Test
    public void deleteCommentTailTest() {
        manager.deleteComment(comment4.getResource());

        comment3.removeProperty(comment4.getResource(), VALUE_FACTORY.createIRI(Comment.replyComment_IRI));

        verify(manager).getComment(eq(comment4.getResource()), any(RepositoryConnection.class));
        verify(manager).getComment(eq(comment3.getResource()), any(RepositoryConnection.class));
        verify(manager).updateComment(eq(comment3.getResource()), eq(comment3));
        verify(utilsService).validateResource(eq(comment4.getResource()), eq(commentFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService).remove(eq(comment4.getResource()), any(RepositoryConnection.class));
    }

    @Test
    public void deleteCommentDoesNotExistTest() {
        // Setup
        thrown.expect(IllegalArgumentException.class);

        manager.deleteComment(DOES_NOT_EXIST_IRI);
        verify(utilsService).validateResource(eq(DOES_NOT_EXIST_IRI), eq(commentFactory.getTypeIRI()), any(RepositoryConnection.class));
    }

    /* deleteCommentsWithRequestId */

    @Test
    public void deleteCommentsWithRequestId() {
        manager.deleteCommentsWithRequestId(request1.getResource());

        verify(utilsService, times(13)).validateResource(any(Resource.class), eq(commentFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(utilsService).remove(eq(comment1.getResource()), any(RepositoryConnection.class));
        verify(utilsService).remove(eq(comment2.getResource()), any(RepositoryConnection.class));
        verify(utilsService).remove(eq(comment3.getResource()), any(RepositoryConnection.class));
        verify(utilsService).remove(eq(comment4.getResource()), any(RepositoryConnection.class));
        verify(utilsService).remove(eq(commentA.getResource()), any(RepositoryConnection.class));
        verify(utilsService).remove(eq(commentB.getResource()), any(RepositoryConnection.class));
        verify(utilsService).remove(eq(commentC.getResource()), any(RepositoryConnection.class));
    }

    @Test
    public void deleteCommentsWithRequestIdRequestWithNoComments() {
        manager.deleteCommentsWithRequestId(request4.getResource());
        verify(utilsService, never()).remove(any(Resource.class), any(RepositoryConnection.class));
    }
}
