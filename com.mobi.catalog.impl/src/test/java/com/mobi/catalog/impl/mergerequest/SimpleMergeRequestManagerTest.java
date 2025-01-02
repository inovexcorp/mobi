package com.mobi.catalog.impl.mergerequest;

/*-
 * #%L
 * com.mobi.catalog.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import static com.mobi.catalog.impl.mergerequest.SimpleMergeRequestManager.ACCEPTED_MERGE_REQUEST_IRI;
import static com.mobi.catalog.impl.mergerequest.SimpleMergeRequestManager.CLOSED_MERGE_REQUEST_IRI;
import static com.mobi.catalog.impl.mergerequest.SimpleMergeRequestManager.TYPE_IRI;
import static com.mobi.ontologies.rdfs.Resource.type_IRI;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.DifferenceManager;
import com.mobi.catalog.api.PaginatedSearchParams;
import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.api.ThingManager;
import com.mobi.catalog.api.builder.Conflict;
import com.mobi.catalog.api.mergerequest.MergeRequestConfig;
import com.mobi.catalog.api.mergerequest.MergeRequestFilterParams;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.ontologies.mergerequests.AcceptedMergeRequest;
import com.mobi.catalog.api.ontologies.mergerequests.ClosedMergeRequest;
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
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.impl.TreeModel;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatcher;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
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
    private final OrmFactory<MergeRequest> mergeRequestFactory = getRequiredOrmFactory(MergeRequest.class);
    private final OrmFactory<AcceptedMergeRequest> acceptedMergeRequestFactory = getRequiredOrmFactory(AcceptedMergeRequest.class);
    private final OrmFactory<ClosedMergeRequest> closedMergeRequestFactory = getRequiredOrmFactory(ClosedMergeRequest.class);

    private final OrmFactory<Comment> commentFactory = getRequiredOrmFactory(Comment.class);
    private final OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
    private final OrmFactory<Branch> branchFactory = getRequiredOrmFactory(Branch.class);
    private final OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);
    private final OrmFactory<VersionedRDFRecord> versionedRDFRecordFactory = getRequiredOrmFactory(VersionedRDFRecord.class);

    private MergeRequest request1;
    private MergeRequest request2;
    private MergeRequest request3;
    private AcceptedMergeRequest request4;
    private AcceptedMergeRequest request5;
    private ClosedMergeRequest request6;
    private ClosedMergeRequest request7;
    private ClosedMergeRequest request8;
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

    private static final IRI LOCAL_CATALOG_IRI = VALUE_FACTORY.createIRI("http://mobi.com/catalogs#local");
    private static final IRI RECORD_1_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/records#versioned-rdf-record1");
    private static final IRI RECORD_2_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/records#versioned-rdf-record2");
    private static final IRI SOURCE_BRANCH_1_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#source1");
    private static final IRI SOURCE_BRANCH_2_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#source2");
    private static final String SOURCE_BRANCH_TITLE = "Source Title";
    private static final IRI TARGET_BRANCH_1_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#target1");
    private static final IRI TARGET_BRANCH_2_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#target2");
    private static final IRI DOES_NOT_EXIST_IRI = VALUE_FACTORY.createIRI("urn:does_not_exist");
    private static final String TARGET_BRANCH_TITLE = "Target Title";

    private IRI titleIRI;

    @Rule
    public ExpectedException thrown = ExpectedException.none();

    @Mock
    private ThingManager thingManager;

    @Mock
    private RecordManager recordManager;

    @Mock
    private DifferenceManager differenceManager;

    @Mock
    private CommitManager commitManager;

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

        // commits
        sourceCommit1 = commitFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#source-commit1"));
        targetCommit1 = commitFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#target-commit1"));
        sourceCommit2 = commitFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#source-commit2"));
        targetCommit2 = commitFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#target-commit2"));
        // source branches
        sourceBranch1 = branchFactory.createNew(SOURCE_BRANCH_1_IRI);
        sourceBranch1.setProperty(VALUE_FACTORY.createLiteral(SOURCE_BRANCH_TITLE), titleIRI);
        sourceBranch1.setHead(sourceCommit1);
        sourceBranch2 = branchFactory.createNew(SOURCE_BRANCH_2_IRI);
        // target branches
        targetBranch1 = branchFactory.createNew(TARGET_BRANCH_1_IRI);
        targetBranch1.setProperty(VALUE_FACTORY.createLiteral(TARGET_BRANCH_TITLE), titleIRI);
        targetBranch1.setHead(targetCommit1);
        targetBranch2 = branchFactory.createNew(TARGET_BRANCH_2_IRI);

        versionedRDFRecord1 = versionedRDFRecordFactory.createNew(RECORD_1_IRI);
        versionedRDFRecord2 = versionedRDFRecordFactory.createNew(RECORD_2_IRI);
        versionedRDFRecord1.addBranch(sourceBranch1);
        versionedRDFRecord1.setProperty(VALUE_FACTORY.createLiteral("record1"), VALUE_FACTORY.createIRI("http://purl.org/dc/terms/title"));
        versionedRDFRecord1.addBranch(targetBranch1);
        versionedRDFRecord2.setProperty(VALUE_FACTORY.createLiteral("record2"), VALUE_FACTORY.createIRI("http://purl.org/dc/terms/title"));

        user1 = userFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/users#user1"));
        user2 = userFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/users#user2"));
        user1.setUsername(VALUE_FACTORY.createLiteral("User1"));
        user2.setUsername(VALUE_FACTORY.createLiteral("User2"));
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
        request1.setProperty(user2.getResource(), VALUE_FACTORY.createIRI(_Thing.creator_IRI));
        request2 = mergeRequestFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/merge-requests#2"));
        request2.setProperty(VALUE_FACTORY.createLiteral(OffsetDateTime.of(2018, 1, 2, 0, 0, 0, 0, ZoneOffset.UTC)), VALUE_FACTORY.createIRI(_Thing.issued_IRI));
        request2.setProperty(VALUE_FACTORY.createLiteral("Request 2"), VALUE_FACTORY.createIRI(_Thing.title_IRI));
        request2.setProperty(VALUE_FACTORY.createLiteral("Description 1"), VALUE_FACTORY.createIRI(_Thing.description_IRI));
        request2.setAssignee(userSet2);
        request2.setOnRecord(versionedRDFRecord2);
        request2.setSourceBranch(sourceBranch2);
        request2.setTargetBranch(targetBranch2);
        request2.setRemoveSource(false);
        request2.setProperty(user2.getResource(), VALUE_FACTORY.createIRI(_Thing.creator_IRI));
        request3 = mergeRequestFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/merge-requests#3"));
        request3.setProperty(VALUE_FACTORY.createLiteral(OffsetDateTime.of(2018, 1, 3, 0, 0, 0, 0, ZoneOffset.UTC)), VALUE_FACTORY.createIRI(_Thing.issued_IRI));
        request3.setProperty(VALUE_FACTORY.createLiteral("Request 3"), VALUE_FACTORY.createIRI(_Thing.title_IRI));
        request4 = acceptedMergeRequestFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/merge-requests#4"));
        request3.setProperty(user1.getResource(), VALUE_FACTORY.createIRI(_Thing.creator_IRI));
        request4.setProperty(VALUE_FACTORY.createLiteral(OffsetDateTime.of(2018, 1, 4, 0, 0, 0, 0, ZoneOffset.UTC)), VALUE_FACTORY.createIRI(_Thing.issued_IRI));
        request4.setProperty(VALUE_FACTORY.createLiteral("Request 4"), VALUE_FACTORY.createIRI(_Thing.title_IRI));
        request4.setAssignee(userSet1);
        request4.setOnRecord(versionedRDFRecord1);
        request4.setSourceBranch(sourceBranch1);
        request4.setTargetBranch(targetBranch1);
        request4.setSourceCommit(sourceCommit1);
        request4.setTargetCommit(targetCommit1);
        request4.setProperty(user1.getResource(), VALUE_FACTORY.createIRI(_Thing.creator_IRI));
        request5 = acceptedMergeRequestFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/merge-requests#5"));
        request5.setProperty(VALUE_FACTORY.createLiteral(OffsetDateTime.of(2018, 1, 5, 0, 0, 0, 0, ZoneOffset.UTC)), VALUE_FACTORY.createIRI(_Thing.issued_IRI));
        request5.setProperty(VALUE_FACTORY.createLiteral("Request 5"), VALUE_FACTORY.createIRI(_Thing.title_IRI));
        request5.setAssignee(userSet2);
        request5.setOnRecord(versionedRDFRecord2);
        request5.setSourceBranch(sourceBranch2);
        request5.setTargetBranch(targetBranch2);
        request5.setSourceCommit(sourceCommit2);
        request5.setTargetCommit(targetCommit2);
        request5.setProperty(user1.getResource(), VALUE_FACTORY.createIRI(_Thing.creator_IRI));
        request6 = closedMergeRequestFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/merge-requests#6"));
        request6.setProperty(VALUE_FACTORY.createLiteral("Request 6"), VALUE_FACTORY.createIRI(_Thing.title_IRI));
        request6.setProperty(VALUE_FACTORY.createLiteral(OffsetDateTime.of(2018, 1, 1, 0, 0, 0, 0, ZoneOffset.UTC)), VALUE_FACTORY.createIRI(_Thing.issued_IRI));
        request6.setAssignee(userSet1);
        request6.setOnRecord(versionedRDFRecord1);
        request6.setSourceBranch(sourceBranch1);
        request6.setTargetBranch(targetBranch1);
        request6.setRemoveSource(true);
        request6.setSourceCommit(sourceCommit1);
        request6.setTargetCommit(targetCommit1);
        request6.setProperty(user2.getResource(), VALUE_FACTORY.createIRI(_Thing.creator_IRI));
        request7 = closedMergeRequestFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/merge-requests#7"));
        request7.setProperty(VALUE_FACTORY.createLiteral("Request 7"), VALUE_FACTORY.createIRI(_Thing.title_IRI));
        request7.setProperty(VALUE_FACTORY.createLiteral(OffsetDateTime.of(2018, 1, 1, 0, 0, 0, 0, ZoneOffset.UTC)), VALUE_FACTORY.createIRI(_Thing.issued_IRI));
        request7.setAssignee(userSet1);
        request7.setOnRecord(versionedRDFRecord1);
        request7.setSourceBranch(sourceBranch1);
        request7.setSourceCommit(sourceCommit1);
        request7.setTargetCommit(targetCommit1);
        request7.setRemoveSource(true);
        request7.setProperty(user2.getResource(), VALUE_FACTORY.createIRI(_Thing.creator_IRI));
        request8 = closedMergeRequestFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/merge-requests#8"));
        request8.setProperty(VALUE_FACTORY.createLiteral("Request 8"), VALUE_FACTORY.createIRI(_Thing.title_IRI));
        request8.setProperty(VALUE_FACTORY.createLiteral(OffsetDateTime.of(2018, 1, 1, 0, 0, 0, 0, ZoneOffset.UTC)), VALUE_FACTORY.createIRI(_Thing.issued_IRI));
        request8.setAssignee(userSet1);
        request8.setOnRecord(versionedRDFRecord1);
        request8.setSourceCommit(sourceCommit1);
        request8.setTargetBranch(targetBranch1);
        request8.setTargetCommit(targetCommit1);
        request8.setRemoveSource(true);
        request8.setProperty(user2.getResource(), VALUE_FACTORY.createIRI(_Thing.creator_IRI));
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
            conn.add(request6.getModel(), request6.getResource());
            conn.add(request7.getModel(), request7.getResource());
            conn.add(request8.getModel(), request8.getResource());

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

            conn.add(user1.getModel(), user1.getResource());
            conn.add(user2.getModel(), user2.getResource());

            conn.add(versionedRDFRecord1.getModel(), versionedRDFRecord1.getResource());
            conn.add(versionedRDFRecord2.getModel(), versionedRDFRecord2.getResource());
        }

        closeable = MockitoAnnotations.openMocks(this);

        when(configProvider.getRepository()).thenReturn(repo);
        when(configProvider.getLocalCatalogIRI()).thenReturn(LOCAL_CATALOG_IRI);

        when(thingManager.getExpectedObject(any(Resource.class), eq(mergeRequestFactory), any(RepositoryConnection.class))).thenAnswer(i -> {
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
            } if (iri.equals(request6.getResource())) {
                return request6;
            } else if (iri.equals(request7.getResource())) {
                return request7;
            } else if (iri.equals(request8.getResource())) {
                return request8;
            }
            throw new IllegalArgumentException();
        });
        when(thingManager.getExpectedObject(any(Resource.class), eq(closedMergeRequestFactory), any(RepositoryConnection.class))).thenAnswer(i -> {
            Resource iri = i.getArgument(0, Resource.class);
            if (iri.equals(request6.getResource())) {
                return request6;
            } else if (iri.equals(request7.getResource())) {
                return request7;
            } else if (iri.equals(request8.getResource())) {
                return request8;
            }
            throw new IllegalArgumentException();
        });
        when(thingManager.getExpectedObject(any(Resource.class), eq(branchFactory), any(RepositoryConnection.class))).thenAnswer(i -> {
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
        when(thingManager.optObject(any(Resource.class), eq(mergeRequestFactory), any(RepositoryConnection.class))).thenReturn(Optional.empty());
        when(thingManager.optObject(eq(request1.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class))).thenReturn(Optional.of(request1));
        when(thingManager.optObject(eq(request4.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class))).thenReturn(Optional.of(request4));
        when(thingManager.optObject(eq(request5.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class))).thenReturn(Optional.of(request5));
        when(thingManager.throwAlreadyExists(any(Resource.class), any(OrmFactory.class))).thenReturn(new IllegalArgumentException());
        doThrow(new IllegalArgumentException()).when(thingManager).validateResource(eq(request3.getResource()), eq(mergeRequestFactory.getTypeIRI()), any(RepositoryConnection.class));
        when(differenceManager.getConflicts(any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(Collections.emptySet());

        when(thingManager.optObject(eq(DOES_NOT_EXIST_IRI), eq(commentFactory), any(RepositoryConnection.class))).thenReturn(Optional.empty());
        when(thingManager.optObject(eq(comment1.getResource()), eq(commentFactory), any(RepositoryConnection.class))).thenReturn(Optional.of(comment1));
        when(thingManager.optObject(eq(comment2.getResource()), eq(commentFactory), any(RepositoryConnection.class))).thenReturn(Optional.of(comment2));
        when(thingManager.optObject(eq(comment3.getResource()), eq(commentFactory), any(RepositoryConnection.class))).thenReturn(Optional.of(comment3));
        when(thingManager.optObject(eq(comment4.getResource()), eq(commentFactory), any(RepositoryConnection.class))).thenReturn(Optional.of(comment4));
        when(thingManager.optObject(eq(commentA.getResource()), eq(commentFactory), any(RepositoryConnection.class))).thenReturn(Optional.of(commentA));
        when(thingManager.optObject(eq(commentB.getResource()), eq(commentFactory), any(RepositoryConnection.class))).thenReturn(Optional.of(commentB));
        when(thingManager.optObject(eq(commentC.getResource()), eq(commentFactory), any(RepositoryConnection.class))).thenReturn(Optional.of(commentC));
        when(thingManager.optObject(eq(commentX.getResource()), eq(commentFactory), any(RepositoryConnection.class))).thenReturn(Optional.of(commentX));
        when(thingManager.optObject(eq(commentY.getResource()), eq(commentFactory), any(RepositoryConnection.class))).thenReturn(Optional.of(commentY));
        when(thingManager.optObject(eq(commentZ.getResource()), eq(commentFactory), any(RepositoryConnection.class))).thenReturn(Optional.of(commentZ));
        when(thingManager.optObject(eq(commentI.getResource()), eq(commentFactory), any(RepositoryConnection.class))).thenReturn(Optional.of(commentI));
        doThrow(new IllegalArgumentException()).when(thingManager).validateResource(eq(DOES_NOT_EXIST_IRI), eq(commentFactory.getTypeIRI()), any(RepositoryConnection.class));
        when(pdp.createRequest(any(List.class), any(Map.class), any(List.class), any(Map.class), any(List.class), any(Map.class))).thenReturn(request);
        when(pdp.filter(eq(request), any(IRI.class))).thenReturn(Collections.singleton(versionedRDFRecord2.getResource().stringValue()));
        when(commitManager.getHeadCommitIRI(eq(sourceBranch1))).thenReturn(sourceCommit1.getResource());
        when(commitManager.getHeadCommitIRI(eq(sourceBranch2))).thenReturn(sourceCommit2.getResource());
        when(commitManager.getHeadCommitIRI(eq(targetBranch1))).thenReturn(targetCommit1.getResource());
        when(commitManager.getHeadCommitIRI(eq(targetBranch2))).thenReturn(targetBranch2.getResource());

        manager = spy(new SimpleMergeRequestManager());
        doReturn(Optional.of(request1)).when(manager).getMergeRequest(eq(request1.getResource()), any(RepositoryConnection.class));

        injectOrmFactoryReferencesIntoService(manager);
        manager.thingManager = thingManager;
        manager.recordManager = recordManager;
        manager.differenceManager = differenceManager;
        manager.versioningManager = versioningManager;
        manager.configProvider = configProvider;
        manager.commitManager = commitManager;
        manager.pdp = pdp;
    }

    @After
    public void tearDown() throws Exception {
        repo.shutDown();
        closeable.close();
    }

    /* getMergeRequests */

    @Test
    public void getMergeRequests() {
        MergeRequestFilterParams params = new MergeRequestFilterParams.Builder().build();
        List<MergeRequest> result = manager.getMergeRequests(params);
        verify(configProvider).getRepository();
        verify(manager).getMergeRequests(eq(params), any(RepositoryConnection.class));
    }

    @Test
    public void getOpenMergeRequestsSortByNotSet() {
        try (RepositoryConnection conn = repo.getConnection()) {
            MergeRequestFilterParams.Builder builder = new MergeRequestFilterParams.Builder();
            List<MergeRequest> result = manager.getMergeRequests(builder.build(), conn);
            assertEquals(2, result.size());
            Iterator<MergeRequest> it = result.iterator();
            assertEquals(request2.getResource(), it.next().getResource());
            assertEquals(request1.getResource(), it.next().getResource());
            verify(thingManager).getExpectedObject(eq(request1.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));
            verify(thingManager).getExpectedObject(eq(request2.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));
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
            verify(thingManager).getExpectedObject(eq(request1.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));
            verify(thingManager).getExpectedObject(eq(request2.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));

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
            verify(thingManager).getExpectedObject(eq(request1.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));
            verify(thingManager).getExpectedObject(eq(request2.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));

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
            builder.setAssignees(Collections.singletonList(user1.getResource()));
            List<MergeRequest> result = manager.getMergeRequests(builder.build(), conn);
            assertEquals(1, result.size());
            assertEquals(request1.getResource(), result.get(0).getResource());
            verify(thingManager).getExpectedObject(eq(request1.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));

            builder.setAssignees(Collections.singletonList(user2.getResource()));
            result = manager.getMergeRequests(builder.build(), conn);
            assertEquals(1, result.size());
            assertEquals(request2.getResource(), result.get(0).getResource());
            verify(thingManager).getExpectedObject(eq(request2.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));
        }
    }

    @Test
    public void getOpenMergeRequestsOnRecord() {
        try (RepositoryConnection conn = repo.getConnection()) {
            MergeRequestFilterParams.Builder builder = new MergeRequestFilterParams.Builder().setSortBy(VALUE_FACTORY.createIRI(_Thing.title_IRI));
            builder.setOnRecords(Arrays.asList(RECORD_1_IRI));
            List<MergeRequest> result = manager.getMergeRequests(builder.build(), conn);
            assertEquals(1, result.size());
            assertEquals(request1.getResource(), result.get(0).getResource());
            verify(thingManager).getExpectedObject(eq(request1.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));

            builder.setOnRecords(Arrays.asList(RECORD_2_IRI));
            result = manager.getMergeRequests(builder.build(), conn);
            assertEquals(1, result.size());
            assertEquals(request2.getResource(), result.get(0).getResource());
            verify(thingManager).getExpectedObject(eq(request2.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));
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
            verify(thingManager).getExpectedObject(eq(request1.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));

            builder.setSourceBranch(SOURCE_BRANCH_2_IRI);
            result = manager.getMergeRequests(builder.build(), conn);
            assertEquals(1, result.size());
            assertEquals(request2.getResource(), result.get(0).getResource());
            verify(thingManager).getExpectedObject(eq(request2.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));
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
            verify(thingManager).getExpectedObject(eq(request1.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));

            builder.setTargetBranch(TARGET_BRANCH_2_IRI);
            result = manager.getMergeRequests(builder.build(), conn);
            assertEquals(1, result.size());
            assertEquals(request2.getResource(), result.get(0).getResource());
            verify(thingManager).getExpectedObject(eq(request2.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));
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
            verify(thingManager).getExpectedObject(eq(request1.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));

            builder.setRemoveSource(false);
            result = manager.getMergeRequests(builder.build(), conn);
            assertEquals(1, result.size());
            assertEquals(request2.getResource(), result.get(0).getResource());
            verify(thingManager).getExpectedObject(eq(request2.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));
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
            verify(thingManager).getExpectedObject(eq(request1.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));
            verify(thingManager).getExpectedObject(eq(request2.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));
        }
    }

    @Test
    public void getOpenMergeRequestsSearchText() {
        try (RepositoryConnection conn = repo.getConnection()) {
            MergeRequestFilterParams.Builder builder = new MergeRequestFilterParams.Builder();
            builder.setSearchText("1");
            List<MergeRequest> result = manager.getMergeRequests(builder.build(), conn);
            assertEquals(2, result.size());
            Iterator<MergeRequest> it = result.iterator();
            assertEquals(request2.getResource(), it.next().getResource());
            assertEquals(request1.getResource(), it.next().getResource());
            verify(thingManager).getExpectedObject(eq(request1.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));
            verify(thingManager).getExpectedObject(eq(request2.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));
        }
    }

    @Test
    public void getAcceptedMergeRequestsTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            MergeRequestFilterParams.Builder builder = new MergeRequestFilterParams.Builder();
            builder.setSortBy(VALUE_FACTORY.createIRI(_Thing.title_IRI)).setRequestStatus("accepted");
            List<MergeRequest> result = manager.getMergeRequests(builder.build(), conn);
            assertEquals(2, result.size());
            Iterator<MergeRequest> it = result.iterator();
            assertEquals(request5.getResource(), it.next().getResource());
            assertEquals(request4.getResource(), it.next().getResource());
            verify(thingManager).getExpectedObject(eq(request4.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));
        }
    }

    @Test
    public void getAcceptedMergeRequestsSourceCommit() {
        try (RepositoryConnection conn = repo.getConnection()) {
            MergeRequestFilterParams.Builder builder = new MergeRequestFilterParams.Builder().setSortBy(VALUE_FACTORY.createIRI(_Thing.title_IRI));
            builder.setRequestStatus("accepted").setSourceCommit(sourceCommit1.getResource());
            List<MergeRequest> result = manager.getMergeRequests(builder.build(), conn);
            assertEquals(1, result.size());
            assertEquals(request4.getResource(), result.get(0).getResource());
            verify(thingManager).getExpectedObject(eq(request4.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));

            builder.setSourceCommit(sourceCommit2.getResource());
            result = manager.getMergeRequests(builder.build(), conn);
            assertEquals(1, result.size());
            assertEquals(request5.getResource(), result.get(0).getResource());
            verify(thingManager).getExpectedObject(eq(request5.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));
        }
    }

    @Test
    public void getAcceptedMergeRequestsTargetCommit() {
        try (RepositoryConnection conn = repo.getConnection()) {
            MergeRequestFilterParams.Builder builder = new MergeRequestFilterParams.Builder().setSortBy(VALUE_FACTORY.createIRI(_Thing.title_IRI));
            builder.setRequestStatus("accepted").setTargetCommit(targetCommit1.getResource());
            List<MergeRequest> result = manager.getMergeRequests(builder.build(), conn);
            assertEquals(1, result.size());
            assertEquals(request4.getResource(), result.get(0).getResource());
            verify(thingManager).getExpectedObject(eq(request4.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));

            builder.setTargetCommit(targetCommit2.getResource());
            result = manager.getMergeRequests(builder.build(), conn);
            assertEquals(1, result.size());
            assertEquals(request5.getResource(), result.get(0).getResource());
            verify(thingManager).getExpectedObject(eq(request5.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));
        }
    }

    /* getMergeRequest */

    @Test
    public void getMergeRequestWithConnTest() {
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

    /* createMergeRequest */

    @Test
    public void createMergeRequestTest() {
        // Setup:
        when(recordManager.getRecord(any(), any(), any(), any())).thenReturn(versionedRDFRecord1);
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
        doThrow(new IllegalArgumentException()).when(recordManager).getRecord(any(), any(), any(), any());
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
        Optional<MergeRequest> result = manager.getMergeRequest(request1.getResource());
        verify(configProvider).getRepository();
        verify(manager).getMergeRequest(eq(request1.getResource()), any(RepositoryConnection.class));
    }

    /* updateMergeRequest */

    @Test
    public void updateMergeRequestTest() {
        MergeRequest request1Update = mergeRequestFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/merge-requests#1"));
        manager.updateMergeRequest(request1Update.getResource(), request1Update);
        verify(configProvider).getRepository();
        verify(manager).updateMergeRequest(eq(request1Update.getResource()), eq(request1Update), any(RepositoryConnection.class));
    }

    @Test
    public void updateMergeRequestWithConnTest() {
        MergeRequest request1Update = mergeRequestFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/merge-requests#1"));
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.updateMergeRequest(request1Update.getResource(), request1Update, conn);
        }
        verify(thingManager).validateResource(eq(request1Update.getResource()), eq(mergeRequestFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(thingManager).updateObject(eq(request1Update), any(RepositoryConnection.class));
    }

    @Test
    public void updateMergeRequestDoesNotExistTest() {
        // Setup
        thrown.expect(IllegalArgumentException.class);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.updateMergeRequest(request3.getResource(), request3, conn);
        }
        verify(thingManager).validateResource(eq(request3.getResource()), eq(mergeRequestFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(thingManager).updateObject(eq(request3), any(RepositoryConnection.class));
    }

    /* deleteMergeRequest */

    @Test
    public void deleteMergeRequestTest() {
        manager.deleteMergeRequest(request1.getResource());
        verify(configProvider).getRepository();
        verify(manager).deleteMergeRequest(eq(request1.getResource()), any(RepositoryConnection.class));
    }

    @Test
    public void deleteMergeRequestWithConnTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.deleteMergeRequest(request1.getResource(), conn);
        }
        verify(thingManager, times(13)).validateResource(any(Resource.class), eq(commentFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(thingManager).remove(eq(comment1.getResource()), any(RepositoryConnection.class));
        verify(thingManager).remove(eq(comment2.getResource()), any(RepositoryConnection.class));
        verify(thingManager).remove(eq(comment3.getResource()), any(RepositoryConnection.class));
        verify(thingManager).remove(eq(comment4.getResource()), any(RepositoryConnection.class));
        verify(thingManager).remove(eq(commentA.getResource()), any(RepositoryConnection.class));
        verify(thingManager).remove(eq(commentB.getResource()), any(RepositoryConnection.class));
        verify(thingManager).remove(eq(commentC.getResource()), any(RepositoryConnection.class));
        verify(thingManager).validateResource(eq(request1.getResource()), eq(mergeRequestFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(thingManager).remove(eq(request1.getResource()), any(RepositoryConnection.class));
    }

    @Test
    public void deleteMergeRequestDoesNotExistTest() {
        // Setup
        thrown.expect(IllegalArgumentException.class);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.deleteMergeRequest(request3.getResource(), conn);
        }
        verify(thingManager).validateResource(eq(request3.getResource()), eq(mergeRequestFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(thingManager, never()).validateResource(any(Resource.class), eq(commentFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(thingManager, never()).remove(any(Resource.class), any(RepositoryConnection.class));
    }

    /* deleteMergeRequestsWithRecordId */

    @Test
    public void deleteMergeRequestsWithRecordId() {
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.deleteMergeRequestsWithRecordId(RECORD_1_IRI, conn);
        }
        verify(thingManager, times(13)).validateResource(any(Resource.class), eq(commentFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(thingManager).remove(eq(comment1.getResource()), any(RepositoryConnection.class));
        verify(thingManager).remove(eq(comment2.getResource()), any(RepositoryConnection.class));
        verify(thingManager).remove(eq(comment3.getResource()), any(RepositoryConnection.class));
        verify(thingManager).remove(eq(comment4.getResource()), any(RepositoryConnection.class));
        verify(thingManager).remove(eq(commentA.getResource()), any(RepositoryConnection.class));
        verify(thingManager).remove(eq(commentB.getResource()), any(RepositoryConnection.class));
        verify(thingManager).remove(eq(commentC.getResource()), any(RepositoryConnection.class));        verify(thingManager).remove(eq(request1.getResource()), any(RepositoryConnection.class));
        verify(thingManager).remove(eq(request4.getResource()), any(RepositoryConnection.class));
        verify(thingManager, never()).remove(eq(request2.getResource()), any(RepositoryConnection.class));
        verify(thingManager, never()).remove(eq(request3.getResource()), any(RepositoryConnection.class));
    }

    @Test
    public void deleteMergeRequestsWithRecordIdRecordWithNoMR() {
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.deleteMergeRequestsWithRecordId(VALUE_FACTORY.createIRI("http://mobi.com/test/records#versioned-rdf-record3"), conn);
        }
        verify(thingManager, never()).remove(any(Resource.class), any(RepositoryConnection.class));
    }

    /* acceptMergeRequest */

    @Test
    public void acceptMergeRequestTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.acceptMergeRequest(request1.getResource(), user1, conn);

            verify(differenceManager).getConflicts(eq(sourceCommit1.getResource()), eq(targetCommit1.getResource()), any(RepositoryConnection.class));
            verify(versioningManager).merge(LOCAL_CATALOG_IRI, RECORD_1_IRI, SOURCE_BRANCH_1_IRI, TARGET_BRANCH_1_IRI, user1, null, null, new HashMap<>(), conn);
            verify(thingManager).updateObject(argThat(matches((AcceptedMergeRequest r) -> {
                boolean hasResource = r.getResource().equals(request1.getResource());
                boolean hasNoSourceBranch = !r.getSourceBranch_resource().isPresent();
                boolean hasNoTargetBranch = !r.getTargetBranch_resource().isPresent();
                boolean hasNoRemoveSource = !r.getRemoveSource().isPresent();
                boolean hasSourceTitle = r.getSourceBranchTitle().isPresent() && r.getSourceBranchTitle().get().equals(SOURCE_BRANCH_TITLE);
                boolean hasTargetTitle = r.getTargetBranchTitle().isPresent() && r.getTargetBranchTitle().get().equals(TARGET_BRANCH_TITLE);
                boolean hasSourceCommit = r.getSourceCommit_resource().isPresent() && r.getSourceCommit_resource().get().equals(sourceCommit1.getResource());
                boolean hasTargetCommit = r.getTargetCommit_resource().isPresent() && r.getTargetCommit_resource().get().equals(targetCommit1.getResource());
                return hasResource && hasNoSourceBranch && hasNoTargetBranch && hasNoRemoveSource && hasSourceTitle && hasTargetTitle && hasSourceCommit && hasTargetCommit;
            })), any(RepositoryConnection.class));
        }
    }

    @Test
    public void acceptMergeRequestWithoutRecordTest() {
        // Setup
        thrown.expect(IllegalStateException.class);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.acceptMergeRequest(request3.getResource(), user1, conn);
        }
        verify(versioningManager, never()).merge(any(Resource.class), any(Resource.class), any(Resource.class), any(Resource.class), any(User.class), any(), any(), new HashMap<>(), any(RepositoryConnection.class));
    }

    @Test
    public void acceptMergeRequestWithNoSourceTest() {
        // Setup
        request1.removeProperty(SOURCE_BRANCH_1_IRI, VALUE_FACTORY.createIRI(MergeRequest.sourceBranch_IRI));
        thrown.expect(IllegalStateException.class);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.acceptMergeRequest(request1.getResource(), user1, conn);
        }
        verify(versioningManager, never()).merge(any(Resource.class), any(Resource.class), any(Resource.class), any(Resource.class), any(User.class), any(), any(), new HashMap<>(), any(RepositoryConnection.class));
    }

    @Test
    public void acceptMergeRequestWithNoTargetTest() {
        // Setup
        request1.removeProperty(TARGET_BRANCH_1_IRI, VALUE_FACTORY.createIRI(MergeRequest.targetBranch_IRI));
        thrown.expect(IllegalArgumentException.class);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.acceptMergeRequest(request1.getResource(), user1, conn);
        }
        verify(versioningManager, never()).merge(any(Resource.class), any(Resource.class), any(Resource.class), any(Resource.class), any(User.class), any(), any(), new HashMap<>(), any(RepositoryConnection.class));
    }

    @Test
    public void acceptMergeRequestWithNoSourceHeadTest() {
        // Setup
        when(commitManager.getHeadCommitIRI(sourceBranch1)).thenThrow(new IllegalStateException());
        thrown.expect(IllegalStateException.class);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.acceptMergeRequest(request1.getResource(), user1, conn);
        }
        verify(versioningManager, never()).merge(any(Resource.class), any(Resource.class), any(Resource.class), any(Resource.class), any(User.class), any(), any(), new HashMap<>(), any(RepositoryConnection.class));
    }

    @Test
    public void acceptMergeRequestWithNoTargetHeadTest() {
        // Setup
        when(commitManager.getHeadCommitIRI(targetBranch1)).thenThrow(new IllegalStateException());
        thrown.expect(IllegalStateException.class);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.acceptMergeRequest(request1.getResource(), user1, conn);
        }
        verify(versioningManager, never()).merge(any(Resource.class), any(Resource.class), any(Resource.class), any(Resource.class), any(User.class), any(), any(), new HashMap<>(), any(RepositoryConnection.class));
    }

    @Test
    public void acceptMergeRequestWithConflictsTest() {
        // Setup
        when(differenceManager.getConflicts(any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(Collections.singleton(conflict));
        thrown.expect(IllegalArgumentException.class);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.acceptMergeRequest(request1.getResource(), user1, conn);
        }
        verify(differenceManager).getConflicts(eq(sourceCommit1.getResource()), eq(targetCommit1.getResource()), any(RepositoryConnection.class));
        verify(versioningManager, never()).merge(any(Resource.class), any(Resource.class), any(Resource.class), any(Resource.class), any(User.class), any(), any(), new HashMap<>(), any(RepositoryConnection.class));
        verify(thingManager, never()).updateObject(any(), any(RepositoryConnection.class));
    }

    @Test
    public void acceptMergeRequestWithNoSourceTitleTest() {
        // Setup
        sourceBranch1.removeProperty(null, VALUE_FACTORY.createIRI(_Thing.title_IRI));
        thrown.expect(IllegalStateException.class);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.acceptMergeRequest(request1.getResource(), user1, conn);
        }
        verify(versioningManager, never()).merge(any(Resource.class), any(Resource.class), any(Resource.class), any(Resource.class), any(User.class), any(), any(), new HashMap<>(), any(RepositoryConnection.class));
    }

    @Test
    public void acceptMergeRequestWithNoTargetTitleTest() {
        // Setup
        targetBranch1.removeProperty(null, VALUE_FACTORY.createIRI(_Thing.title_IRI));
        thrown.expect(IllegalStateException.class);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.acceptMergeRequest(request1.getResource(), user1, conn);
        }
        verify(versioningManager, never()).merge(any(Resource.class), any(Resource.class), any(Resource.class), any(Resource.class), any(User.class), any(), any(), new HashMap<>(), any(RepositoryConnection.class));
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

    /* closeMergeRequest */

    @Test
    public void closeMergeRequestTest() {
        doNothing().when(manager).closeMergeRequest(any(Resource.class), any(User.class), any(RepositoryConnection.class));
        manager.closeMergeRequest(mock(Resource.class), mock(User.class));
        verify(manager).closeMergeRequest(any(Resource.class), any(User.class), any(RepositoryConnection.class));
    }

    @Test
    public void closeMergeRequestConnTest() {
        Resource requestId = getValueFactory().createIRI("http://mobi.com/test/merge-requests#1");
        manager.closeMergeRequest(requestId, mock(User.class), mock(RepositoryConnection.class));

        ArgumentCaptor<ClosedMergeRequest> captor = ArgumentCaptor.forClass(ClosedMergeRequest.class);
        verify(thingManager).updateObject(captor.capture(), any(RepositoryConnection.class));

        ClosedMergeRequest closedMergeRequest = captor.getValue();
        assertNotNull(closedMergeRequest);
        assertEquals(15, closedMergeRequest.getModel().size());
        assertFalse(closedMergeRequest.getProperty(VALUE_FACTORY.createIRI(_Thing.modified_IRI)).isPresent());
        assertTrue(closedMergeRequest.getProperty(VALUE_FACTORY.createIRI(_Thing.issued_IRI)).isPresent());
        assertFalse(closedMergeRequest.getProperty(VALUE_FACTORY.createIRI(_Thing.description_IRI)).isPresent());
        assertEquals("http://mobi.com/ontologies/merge-requests#ClosedMergeRequest", closedMergeRequest.getProperty(VALUE_FACTORY.createIRI(type_IRI)).get().stringValue());
        assertEquals("Request 1", closedMergeRequest.getProperty(VALUE_FACTORY.createIRI(_Thing.title_IRI)).get().stringValue());
        assertEquals("http://mobi.com/users#user2", closedMergeRequest.getProperty(VALUE_FACTORY.createIRI(_Thing.creator_IRI)).get().stringValue());
        assertEquals("http://mobi.com/users#user1", closedMergeRequest.getProperty(VALUE_FACTORY.createIRI(MergeRequest.assignee_IRI)).get().stringValue());
        assertEquals("http://mobi.com/users#user1", closedMergeRequest.getProperty(VALUE_FACTORY.createIRI(MergeRequest.assignee_IRI)).get().stringValue());
        assertEquals("http://mobi.com/test/records#versioned-rdf-record1", closedMergeRequest.getProperty(VALUE_FACTORY.createIRI(MergeRequest.onRecord_IRI)).get().stringValue());
        assertEquals("http://mobi.com/test/commits#source-commit1", closedMergeRequest.getProperty(VALUE_FACTORY.createIRI(ClosedMergeRequest.sourceCommit_IRI)).get().stringValue());
        assertEquals("http://mobi.com/test/commits#target-commit1", closedMergeRequest.getProperty(VALUE_FACTORY.createIRI(ClosedMergeRequest.targetCommit_IRI)).get().stringValue());
    }

    @Test
    public void closeMergeRequestErrorAlreadyAcceptedTest() {
        Resource requestId = getValueFactory().createIRI("urn:iri");
        MergeRequest mergeRequest = mock(MergeRequest.class);
        Model requestModel = new TreeModel();
        requestModel.add(requestId, TYPE_IRI, ACCEPTED_MERGE_REQUEST_IRI);
        when(mergeRequest.getModel()).thenReturn(requestModel);
        when(thingManager.getExpectedObject(any(Resource.class), eq(mergeRequestFactory), any(RepositoryConnection.class))).thenReturn(mergeRequest);
        try {
            manager.closeMergeRequest(requestId, mock(User.class), mock(RepositoryConnection.class));
            fail("Should have thrown exception");
        } catch(IllegalArgumentException ex) {
            assertEquals("Request urn:iri has already been accepted.", ex.getMessage());
        }
    }

    @Test
    public void closeMergeRequestErrorAlreadyClosedTest() {
        Resource requestId = getValueFactory().createIRI("urn:iri");
        MergeRequest mergeRequest = mock(MergeRequest.class);
        Model requestModel = new TreeModel();
        requestModel.add(requestId, TYPE_IRI, CLOSED_MERGE_REQUEST_IRI);
        when(mergeRequest.getModel()).thenReturn(requestModel);
        when(thingManager.getExpectedObject(any(Resource.class), eq(mergeRequestFactory), any(RepositoryConnection.class))).thenReturn(mergeRequest);
        try {
            manager.closeMergeRequest(requestId, mock(User.class), mock(RepositoryConnection.class));
            fail("Should have thrown exception");
        } catch(IllegalArgumentException ex) {
            assertEquals("Request urn:iri has already been closed.", ex.getMessage());
        }
    }

    /* reopenMergeRequest */

    @Test
    public void reopenMergeRequestTest() {
        doNothing().when(manager).reopenMergeRequest(any(Resource.class), any(User.class), any(RepositoryConnection.class));
        manager.reopenMergeRequest(mock(Resource.class), mock(User.class));
        verify(manager).reopenMergeRequest(any(Resource.class), any(User.class), any(RepositoryConnection.class));
    }

    @Test
    public void reopenMergeRequestConnTest() {
        Resource requestId = getValueFactory().createIRI("http://mobi.com/test/merge-requests#6");
        manager.reopenMergeRequest(requestId, mock(User.class), mock(RepositoryConnection.class));

        ArgumentCaptor<MergeRequest> captor = ArgumentCaptor.forClass(MergeRequest.class);
        verify(thingManager).updateObject(captor.capture(), any(RepositoryConnection.class));

        MergeRequest reopenedMergeRequest = captor.getValue();
        assertNotNull(reopenedMergeRequest);
        assertEquals(10, reopenedMergeRequest.getModel().size());
        assertFalse(reopenedMergeRequest.getProperty(VALUE_FACTORY.createIRI(_Thing.modified_IRI)).isPresent());
        assertTrue(reopenedMergeRequest.getProperty(VALUE_FACTORY.createIRI(_Thing.issued_IRI)).isPresent());
        assertFalse(reopenedMergeRequest.getProperty(VALUE_FACTORY.createIRI(_Thing.description_IRI)).isPresent());
        assertEquals("http://mobi.com/ontologies/merge-requests#MergeRequest", reopenedMergeRequest.getProperty(VALUE_FACTORY.createIRI(type_IRI)).get().stringValue());
        assertEquals("Request 6", reopenedMergeRequest.getProperty(VALUE_FACTORY.createIRI(_Thing.title_IRI)).get().stringValue());
        assertEquals("http://mobi.com/users#user2", reopenedMergeRequest.getProperty(VALUE_FACTORY.createIRI(_Thing.creator_IRI)).get().stringValue());
        assertEquals("http://mobi.com/users#user1", reopenedMergeRequest.getProperty(VALUE_FACTORY.createIRI(MergeRequest.assignee_IRI)).get().stringValue());
        assertEquals("http://mobi.com/users#user1", reopenedMergeRequest.getProperty(VALUE_FACTORY.createIRI(MergeRequest.assignee_IRI)).get().stringValue());
        assertEquals("http://mobi.com/test/records#versioned-rdf-record1", reopenedMergeRequest.getProperty(VALUE_FACTORY.createIRI(MergeRequest.onRecord_IRI)).get().stringValue());
        assertEquals(Optional.empty(), reopenedMergeRequest.getProperty(VALUE_FACTORY.createIRI(ClosedMergeRequest.sourceCommit_IRI)));
        assertEquals(Optional.empty(), reopenedMergeRequest.getProperty(VALUE_FACTORY.createIRI(ClosedMergeRequest.targetCommit_IRI)));
    }

    @Test
    public void reopenMergeRequestErrorAlreadyAcceptedTest() {
        Resource requestId = getValueFactory().createIRI("urn:iri");
        ClosedMergeRequest mergeRequest = mock(ClosedMergeRequest.class);
        Model requestModel = new TreeModel();
        requestModel.add(requestId, TYPE_IRI, ACCEPTED_MERGE_REQUEST_IRI);
        when(mergeRequest.getModel()).thenReturn(requestModel);
        when(thingManager.getExpectedObject(any(Resource.class), eq(mergeRequestFactory), any(RepositoryConnection.class))).thenReturn(mergeRequest);
        when(thingManager.getExpectedObject(any(Resource.class), eq(closedMergeRequestFactory), any(RepositoryConnection.class))).thenReturn(mergeRequest);
        try {
            manager.reopenMergeRequest(requestId, mock(User.class), mock(RepositoryConnection.class));
            fail("Should have thrown exception");
        } catch(IllegalArgumentException ex) {
            assertEquals("Cannot reopen urn:iri as it's already accepted.", ex.getMessage());
        }
    }

    @Test
    public void reopenMergeRequestErrorAlreadyOpenTest() {
        Resource requestId = getValueFactory().createIRI("urn:iri");
        MergeRequest mergeRequest = mock(MergeRequest.class);
        Model requestModel = new TreeModel();
        requestModel.remove(requestId, TYPE_IRI, CLOSED_MERGE_REQUEST_IRI);
        when(mergeRequest.getModel()).thenReturn(requestModel);
        when(thingManager.getExpectedObject(any(Resource.class), eq(mergeRequestFactory), any(RepositoryConnection.class))).thenReturn(mergeRequest);
        try {
            manager.reopenMergeRequest(requestId, mock(User.class), mock(RepositoryConnection.class));
            fail("Should have thrown exception");
        } catch(IllegalArgumentException ex) {
            assertEquals("Request urn:iri is already open.", ex.getMessage());
        }
    }

    @Test
    public void reopenMergeRequestErrorNoSourceTest() {
        when(thingManager.getExpectedObject(any(Resource.class), eq(mergeRequestFactory), any(RepositoryConnection.class))).thenReturn(request8);

        try {
            manager.reopenMergeRequest(request8.getResource(), mock(User.class), mock(RepositoryConnection.class));
            fail("Should have thrown exception");
        } catch(IllegalArgumentException ex) {
            assertEquals("Request " + request8.getResource().stringValue() + " does not have a source Branch", ex.getMessage());
        }
    }

    @Test
    public void reopenMergeRequestErrorNoTargetTest() {
        when(thingManager.getExpectedObject(any(Resource.class), eq(mergeRequestFactory), any(RepositoryConnection.class))).thenReturn(request7);

        try {
            manager.reopenMergeRequest(request7.getResource(), mock(User.class), mock(RepositoryConnection.class));
            fail("Should have thrown exception");
        } catch(IllegalArgumentException ex) {
            assertEquals("Request " + request7.getResource().stringValue() + " does not have a target Branch", ex.getMessage());
        }
    }

    /* cleanMergeRequests */

    @Test
    public void cleanMergeRequestsSourceBranchTest() {
        manager.cleanMergeRequests(RECORD_1_IRI, SOURCE_BRANCH_1_IRI, "branch", Arrays.asList());
        verify(configProvider).getRepository();
        verify(manager).cleanMergeRequests(eq(RECORD_1_IRI), eq(SOURCE_BRANCH_1_IRI), eq("branch"), any(List.class), any(RepositoryConnection.class));
    }

    @Test
    public void cleanMergeRequestsSourceBranchWithConnTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.cleanMergeRequests(RECORD_1_IRI, SOURCE_BRANCH_1_IRI, "branch", Arrays.asList(), conn);
        }
        verify(thingManager).remove(eq(request1.getResource()), any(RepositoryConnection.class));
        verify(thingManager).remove(eq(request4.getResource()), any(RepositoryConnection.class));
        verify(thingManager, never()).remove(eq(request2.getResource()), any(RepositoryConnection.class));
        verify(thingManager, never()).remove(eq(request3.getResource()), any(RepositoryConnection.class));
        verify(manager).updateMergeRequest(eq(request6.getResource()), any(MergeRequest.class), any(RepositoryConnection.class));
        verify(manager).updateMergeRequest(eq(request7.getResource()), any(MergeRequest.class), any(RepositoryConnection.class));
        verify(manager).updateMergeRequest(eq(request8.getResource()), any(MergeRequest.class), any(RepositoryConnection.class));
        verify(manager, never()).updateMergeRequest(eq(request2.getResource()), any(MergeRequest.class), any(RepositoryConnection.class));
        verify(manager, never()).updateMergeRequest(eq(request3.getResource()), any(MergeRequest.class), any(RepositoryConnection.class));
        verify(manager, never()).updateMergeRequest(eq(request4.getResource()), any(MergeRequest.class), any(RepositoryConnection.class));
    }

    @Test
    public void cleanMergeRequestsTargetBranchTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.cleanMergeRequests(RECORD_1_IRI, TARGET_BRANCH_1_IRI,"branch", Arrays.asList(), conn);
        }
        verify(thingManager).validateResource(eq(request1.getResource()), eq(mergeRequestFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(thingManager).validateResource(eq(request4.getResource()), eq(mergeRequestFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(thingManager, never()).validateResource(eq(request2.getResource()), eq(mergeRequestFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(thingManager, never()).validateResource(eq(request3.getResource()), eq(mergeRequestFactory.getTypeIRI()), any(RepositoryConnection.class));
        verify(thingManager, never()).remove(any(Resource.class), any(RepositoryConnection.class));
    }

    @Test
    public void cleanMergeRequestsRecordWithNoMRTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.cleanMergeRequests(VALUE_FACTORY.createIRI("http://mobi.com/test/records#versioned-rdf-record3"), TARGET_BRANCH_1_IRI, "branch", Arrays.asList(), conn);
        }
        verify(thingManager, never()).updateObject(any(MergeRequest.class), any(RepositoryConnection.class));
        verify(thingManager, never()).remove(any(Resource.class), any(RepositoryConnection.class));
    }

    /* clearClosedMergeRequest */

    @Test
    public void clearClosedMergeRequestTest() {
        ClosedMergeRequest closedMergeRequest = Mockito.spy(closedMergeRequestFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/merge-requests#100Closed")));
        closedMergeRequest.setProperty(VALUE_FACTORY.createLiteral("Request 1"), VALUE_FACTORY.createIRI(_Thing.title_IRI));
        closedMergeRequest.setProperty(VALUE_FACTORY.createLiteral(OffsetDateTime.of(2018, 1, 1, 0, 0, 0, 0, ZoneOffset.UTC)), VALUE_FACTORY.createIRI(_Thing.issued_IRI));
        closedMergeRequest.setAssignee(new HashSet<>(Arrays.asList(user1)));
        closedMergeRequest.setOnRecord(versionedRDFRecord1);
        closedMergeRequest.setSourceBranch(sourceBranch1);
        closedMergeRequest.setTargetBranch(targetBranch1);
        closedMergeRequest.setRemoveSource(true);
        closedMergeRequest.setProperty(user2.getResource(), VALUE_FACTORY.createIRI(_Thing.creator_IRI));
        closedMergeRequest.setSourceBranchTitle("Source Title");
        closedMergeRequest.setTargetBranchTitle("Target Title");
        closedMergeRequest.setSourceCommit(sourceCommit1);
        closedMergeRequest.setTargetCommit(targetCommit1);
        List<Resource> deletedCommits = Arrays.asList(sourceCommit1.getResource(), targetCommit1.getResource());

        Mockito.reset(closedMergeRequest);
        verify(closedMergeRequest, never()).clearSourceCommit();
        verify(closedMergeRequest, never()).clearTargetCommit();

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.clearClosedMergeRequest(closedMergeRequest, TARGET_BRANCH_1_IRI, "branch", deletedCommits, conn);
        }

        ArgumentCaptor<ClosedMergeRequest> captor = ArgumentCaptor.forClass(ClosedMergeRequest.class);
        verify(thingManager).updateObject(captor.capture(), any(RepositoryConnection.class));
        ClosedMergeRequest closedMergeRequestUpdate = captor.getValue();
        assertNotNull(closedMergeRequestUpdate);
        verify(closedMergeRequest).clearSourceCommit();
        verify(closedMergeRequest).clearTargetCommit();
        assertFalse(closedMergeRequestUpdate.getProperty(VALUE_FACTORY.createIRI(ClosedMergeRequest.targetCommit_IRI)).isPresent());
        assertFalse(closedMergeRequestUpdate.getProperty(VALUE_FACTORY.createIRI(ClosedMergeRequest.sourceCommit_IRI)).isPresent());
    }

    /* getComment */

    @Test
    public void getCommentTest() {
        Optional<Comment> commentOpt = manager.getComment(comment1.getResource());
        verify(configProvider).getRepository();
        verify(manager).getComment(eq(comment1.getResource()), any(RepositoryConnection.class));
    }

    @Test
    public void getCommentWithConnTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            Optional<Comment> commentOpt = manager.getComment(comment1.getResource(), conn);
            assertTrue(commentOpt.isPresent());
            Comment comment = commentOpt.get();
            assertEquals(comment1.getModel(), comment.getModel());
            verify(thingManager).optObject(eq(comment1.getResource()), any(CommentFactory.class), any(RepositoryConnection.class));
        }
    }

    @Test
    public void getCommentDoesNotExistTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            Optional<Comment> commentOpt = manager.getComment(DOES_NOT_EXIST_IRI, conn);
            assertFalse(commentOpt.isPresent());
            verify(thingManager).optObject(eq(DOES_NOT_EXIST_IRI), any(CommentFactory.class), any(RepositoryConnection.class));
        }
    }

    /* getComments */

    @Test
    public void getCommentsTest() {
        List<List<Comment>> comments = manager.getComments(request1.getResource());
        verify(configProvider).getRepository();
        verify(manager).getComments(eq(request1.getResource()), any(RepositoryConnection.class));
    }

    @Test
    public void getCommentsWithConnTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            List<List<Comment>> comments = manager.getComments(request1.getResource(), conn);
            assertEquals(3, comments.size());
            String firstThreadTime = comments.get(0).get(0).getProperty(VALUE_FACTORY.createIRI(_Thing.issued_IRI)).get().stringValue();
            String secondThreadTime = comments.get(1).get(0).getProperty(VALUE_FACTORY.createIRI(_Thing.issued_IRI)).get().stringValue();
            assertTrue(OffsetDateTime.parse(firstThreadTime).isBefore(OffsetDateTime.parse(secondThreadTime)));
        }
    }

    @Test
    public void getCommentsDoesNotExistTest() {
        thrown.expect(IllegalArgumentException.class);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.getComments(DOES_NOT_EXIST_IRI, conn);
        }
    }

    @Test
    public void getCommentsWithNoCommentsOnRequestTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            List<List<Comment>> comments = manager.getComments(request5.getResource(), conn);
            assertEquals(0, comments.size());
        }
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

        verify(configProvider, times(2)).getRepository();
        verify(manager).getMergeRequest(eq(request1.getResource()), any(RepositoryConnection.class));
    }

    @Test
    public void createCommentLargeStringTest() {
        thrown.expect(IllegalArgumentException.class);

        String commentStr = new String(new char[1100000]).replace('\0', ' ');
        Comment comment = manager.createComment(request1.getResource(), user1, commentStr);

        verify(thingManager).optObject(eq(request1.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));
    }

    @Test
    public void createCommentRequestDoesNotExistTest() {
        thrown.expect(IllegalArgumentException.class);

        String commentStr = "This is a test comment.";
        manager.createComment(DOES_NOT_EXIST_IRI, user1, commentStr);

        verify(thingManager).optObject(eq(request1.getResource()), eq(mergeRequestFactory), any(RepositoryConnection.class));
    }

    @Test
    public void createReplyCommentTest() {
        when(manager.getComment(eq(commentZ.getResource()), any(RepositoryConnection.class))).thenReturn(Optional.of(commentZ));
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

        verify(manager, times(2)).getComment(eq(commentZ.getResource()), any(RepositoryConnection.class));
    }

    @Test
    public void createReplyCommentParentHasReplyAlreadyTest() {
        when(manager.getComment(eq(commentA.getResource()), any(RepositoryConnection.class))).thenReturn(Optional.of(commentA));
        when(manager.getComment(eq(commentB.getResource()), any(RepositoryConnection.class))).thenReturn(Optional.of(commentB));
        when(manager.getComment(eq(commentC.getResource()), any(RepositoryConnection.class))).thenReturn(Optional.of(commentC));

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

        verify(manager).getComment(eq(commentA.getResource()), any(RepositoryConnection.class));
        verify(manager).getComment(eq(commentB.getResource()), any(RepositoryConnection.class));
        verify(manager, times(2)).getComment(eq(commentC.getResource()), any(RepositoryConnection.class));
    }

    @Test
    public void createReplyCommentRequestDoesNotExistTest() {
        thrown.expect(IllegalArgumentException.class);

        String commentStr = "This is a test comment.";
        manager.createComment(DOES_NOT_EXIST_IRI, user1, commentStr, commentZ.getResource());

        verify(thingManager).optObject(eq(DOES_NOT_EXIST_IRI), eq(mergeRequestFactory), any(RepositoryConnection.class));
    }

    @Test
    public void createReplyCommentParentDoesNotExistTest() {
        thrown.expect(IllegalArgumentException.class);

        String commentStr = "This is a test comment.";
        manager.createComment(request1.getResource(), user1, commentStr, DOES_NOT_EXIST_IRI);

        verify(thingManager).optObject(eq(DOES_NOT_EXIST_IRI), eq(mergeRequestFactory), any(RepositoryConnection.class));
    }

    /* updateComment */

    @Test
    public void updateCommentTest() {
        Comment comment1Update = commentFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/comments#1"));
        comment1Update.setProperty(VALUE_FACTORY.createLiteral("Comment1Update"), VALUE_FACTORY.createIRI(_Thing.description_IRI));
        manager.updateComment(comment1Update.getResource(), comment1Update);
        verify(configProvider).getRepository();
        verify(manager).updateComment(eq(comment1Update.getResource()), eq(comment1Update), any(RepositoryConnection.class));
    }

    @Test
    public void updateCommentWithConnTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            Comment comment1Update = commentFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/comments#1"));
            comment1Update.setProperty(VALUE_FACTORY.createLiteral("Comment1Update"), VALUE_FACTORY.createIRI(_Thing.description_IRI));
            manager.updateComment(comment1Update.getResource(), comment1Update, conn);

            verify(thingManager).validateResource(eq(comment1Update.getResource()), eq(commentFactory.getTypeIRI()), any(RepositoryConnection.class));
            verify(thingManager).updateObject(eq(comment1Update), any(RepositoryConnection.class));
        }
    }

    @Test
    public void updateCommentTooLargeTest() {
        // Setup
        thrown.expect(IllegalArgumentException.class);

        try (RepositoryConnection conn = repo.getConnection()) {
            Comment comment1Update = commentFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/comments#1"));
            comment1Update.setProperty(VALUE_FACTORY.createLiteral(StringUtils.repeat("*", 2000000)), VALUE_FACTORY.createIRI(_Thing.description_IRI));
            manager.updateComment(comment1Update.getResource(), comment1Update, conn);

            verify(thingManager, never()).validateResource(eq(comment1Update.getResource()), eq(commentFactory.getTypeIRI()), any(RepositoryConnection.class));
            verify(thingManager, never()).updateObject(eq(comment1Update), any(RepositoryConnection.class));
        }
    }

    @Test
    public void updateCommentEmptyDescriptionTest() {
        // Setup
        thrown.expect(IllegalArgumentException.class);

        try (RepositoryConnection conn = repo.getConnection()) {
            Comment comment1Update = commentFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/comments#1"));
            comment1Update.setProperty(VALUE_FACTORY.createLiteral(""), VALUE_FACTORY.createIRI(_Thing.description_IRI));
            manager.updateComment(comment1Update.getResource(), comment1Update, conn);

            verify(thingManager, never()).validateResource(eq(comment1Update.getResource()), eq(commentFactory.getTypeIRI()), any(RepositoryConnection.class));
            verify(thingManager, never()).updateObject(eq(comment1Update), any(RepositoryConnection.class));
        }
    }

    @Test
    public void updateCommentNoDescriptionTest() {
        // Setup
        thrown.expect(IllegalArgumentException.class);

        try (RepositoryConnection conn = repo.getConnection()) {
            Comment comment1Update = commentFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/comments#1"));
            manager.updateComment(comment1Update.getResource(), comment1Update, conn);

            verify(thingManager, never()).validateResource(eq(comment1Update.getResource()), eq(commentFactory.getTypeIRI()), any(RepositoryConnection.class));
            verify(thingManager, never()).updateObject(eq(comment1Update), any(RepositoryConnection.class));
        }
    }

    @Test
    public void updateCommentDoesNotExistTest() {
        // Setup
        thrown.expect(IllegalArgumentException.class);

        try (RepositoryConnection conn = repo.getConnection()) {
            Comment commentDoesNotExist = commentFactory.createNew(DOES_NOT_EXIST_IRI);
            commentDoesNotExist.setProperty(VALUE_FACTORY.createLiteral("commentDoesNotExist"), VALUE_FACTORY.createIRI(_Thing.description_IRI));
            manager.updateComment(DOES_NOT_EXIST_IRI, commentDoesNotExist, conn);

            verify(thingManager).validateResource(eq(commentDoesNotExist.getResource()), eq(commentFactory.getTypeIRI()), any(RepositoryConnection.class));
            verify(thingManager).updateObject(eq(commentDoesNotExist), any(RepositoryConnection.class));
        }
    }

    @Test
    public void updateCommentTimeTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            Optional<Value> preUpdateTime = comment1.getProperty(VALUE_FACTORY.createIRI(_Thing.modified_IRI));
            manager.updateComment(comment1.getResource(), comment1, conn);
            Optional<Value> postUpdateTime = comment1.getProperty(VALUE_FACTORY.createIRI(_Thing.modified_IRI));

            assertNotEquals(preUpdateTime.get().stringValue(), postUpdateTime.get().stringValue());
            verify(thingManager).validateResource(eq(comment1.getResource()), eq(commentFactory.getTypeIRI()), any(RepositoryConnection.class));
            verify(thingManager).updateObject(eq(comment1), any(RepositoryConnection.class));
        }
    }

    @Test
    public void deleteCommentTest() {
        manager.deleteComment(comment1.getResource());
        verify(configProvider).getRepository();
        verify(manager).deleteComment(eq(comment1.getResource()), any(RepositoryConnection.class));
    }

    /* deleteComment */

    @Test
    public void deleteCommentHeadTest() {
        try (RepositoryConnection conn = repo.getConnection()) {

            manager.deleteComment(comment1.getResource(), conn);

            verify(manager).getComment(eq(comment1.getResource()), any(RepositoryConnection.class));
            verify(manager, never()).updateComment(any(Resource.class), any(Comment.class), eq(conn));
            verify(thingManager).validateResource(eq(comment1.getResource()), eq(commentFactory.getTypeIRI()), any(RepositoryConnection.class));
            verify(thingManager).remove(eq(comment1.getResource()), any(RepositoryConnection.class));
        }
    }

    @Test
    public void deleteCommentMiddleTest() {
        try (RepositoryConnection conn = repo.getConnection()) {

            manager.deleteComment(comment2.getResource(), conn);

            comment1.setReplyComment(comment3);

            verify(manager).getComment(eq(comment2.getResource()), eq(conn));
            verify(manager).getComment(eq(comment1.getResource()), eq(conn));
            verify(manager).getComment(eq(comment3.getResource()), eq(conn));
            verify(manager).updateComment(eq(comment1.getResource()), eq(comment1), eq(conn));
            verify(thingManager).validateResource(eq(comment2.getResource()), eq(commentFactory.getTypeIRI()), any(RepositoryConnection.class));
            verify(thingManager).remove(eq(comment2.getResource()), any(RepositoryConnection.class));
        }
    }

    @Test
    public void deleteCommentTailTest() {
        try (RepositoryConnection conn = repo.getConnection()) {

            manager.deleteComment(comment4.getResource(), conn);

            comment3.removeProperty(comment4.getResource(), VALUE_FACTORY.createIRI(Comment.replyComment_IRI));

            verify(manager).getComment(eq(comment4.getResource()), any(RepositoryConnection.class));
            verify(manager).getComment(eq(comment3.getResource()), any(RepositoryConnection.class));
            verify(manager).updateComment(eq(comment3.getResource()), eq(comment3), eq(conn));
            verify(thingManager).validateResource(eq(comment4.getResource()), eq(commentFactory.getTypeIRI()), any(RepositoryConnection.class));
            verify(thingManager).remove(eq(comment4.getResource()), any(RepositoryConnection.class));
        }
    }

    @Test
    public void deleteCommentDoesNotExistTest() {
        // Setup
        thrown.expect(IllegalArgumentException.class);
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.deleteComment(DOES_NOT_EXIST_IRI, conn);
            verify(thingManager).validateResource(eq(DOES_NOT_EXIST_IRI), eq(commentFactory.getTypeIRI()), any(RepositoryConnection.class));
        }
    }

    /* deleteCommentsWithRequestId */

    @Test
    public void deleteCommentsWithRequestId() {
        manager.deleteCommentsWithRequestId(request1.getResource());
        verify(configProvider).getRepository();
        verify(manager).deleteCommentsWithRequestId(eq(request1.getResource()), any(RepositoryConnection.class));
    }

    @Test
    public void deleteCommentsWithRequestIdRequestWithNoComments() {
        manager.deleteCommentsWithRequestId(request4.getResource());
        verify(thingManager, never()).remove(any(Resource.class), any(RepositoryConnection.class));
    }

    @Test
    public void deleteCommentsWithRequestIdWithConn() {
        try (RepositoryConnection conn = repo.getConnection()) {

            manager.deleteCommentsWithRequestId(request1.getResource(), conn);

            verify(thingManager, times(13)).validateResource(any(Resource.class), eq(commentFactory.getTypeIRI()), any(RepositoryConnection.class));
            verify(thingManager).remove(eq(comment1.getResource()), any(RepositoryConnection.class));
            verify(thingManager).remove(eq(comment2.getResource()), any(RepositoryConnection.class));
            verify(thingManager).remove(eq(comment3.getResource()), any(RepositoryConnection.class));
            verify(thingManager).remove(eq(comment4.getResource()), any(RepositoryConnection.class));
            verify(thingManager).remove(eq(commentA.getResource()), any(RepositoryConnection.class));
            verify(thingManager).remove(eq(commentB.getResource()), any(RepositoryConnection.class));
            verify(thingManager).remove(eq(commentC.getResource()), any(RepositoryConnection.class));
        }
    }

    @Test
    public void deleteCommentsWithRequestIdRequestWithNoCommentsWithConn() {
        try (RepositoryConnection conn = repo.getConnection()) {

            manager.deleteCommentsWithRequestId(request4.getResource(), conn);
            verify(thingManager, never()).remove(any(Resource.class), any(RepositoryConnection.class));
        }
    }

    @Test
    public void testGetCreatorsWithNoConnection() {

        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().build();

        assertEquals(1, manager.getCreators(searchParams).getPageNumber());
        assertFalse(manager.getCreators(searchParams).getPage().isEmpty());
        assertEquals(2, manager.getCreators(searchParams).getPageSize());
        assertEquals(2, manager.getCreators(searchParams).getTotalSize());
    }

    @Test
    public void testGetCreatorsWithConnection() {
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().build();

        try (RepositoryConnection conn = repo.getConnection()) {
            assertEquals(1, manager.getCreators(searchParams, conn).getPageNumber());
            assertFalse(manager.getCreators(searchParams, conn).getPage().isEmpty());
            assertEquals(2, manager.getCreators(searchParams, conn).getPageSize());
            assertEquals(2, manager.getCreators(searchParams, conn).getTotalSize());
        }
    }

    @Test
    public void testGetCreatorsWithUser() {
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().build();

        assertEquals(1, manager.getCreators(searchParams, user1.getResource()).getPageNumber());
        assertFalse(manager.getCreators(searchParams, user1.getResource()).getPage().isEmpty());
        assertEquals(2, manager.getCreators(searchParams, user1.getResource()).getPageSize());
        assertEquals(2, manager.getCreators(searchParams, user1.getResource()).getTotalSize());
    }

    @Test
    public void testGetCreatorWithSearchText() {
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().searchText("1").build();

        assertEquals(1, manager.getCreators(searchParams, user1.getResource()).getPageNumber());
        assertFalse(manager.getCreators(searchParams, user1.getResource()).getPage().isEmpty());
        assertEquals(1, manager.getCreators(searchParams, user1.getResource()).getPageSize());
        assertEquals(1, manager.getCreators(searchParams, user1.getResource()).getTotalSize());
    }

    @Test
    public void testGetCreatorSearchNotExist() {
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().searchText("NotExist").build();

        assertEquals(0, manager.getCreators(searchParams, user1.getResource()).getPageNumber());
        assertTrue(manager.getCreators(searchParams, user1.getResource()).getPage().isEmpty());
        assertEquals(0, manager.getCreators(searchParams, user1.getResource()).getPageSize());
        assertEquals(0, manager.getCreators(searchParams, user1.getResource()).getTotalSize());
    }

    @Test
    public void testGetCreatorsWithConnectionAndUser() {
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().build();

        try (RepositoryConnection conn = repo.getConnection()) {
            assertEquals(1, manager.getCreators(searchParams, conn, user1.getResource()).getPageNumber());
            assertFalse(manager.getCreators(searchParams, conn, user1.getResource()).getPage().isEmpty());
            assertEquals(2, manager.getCreators(searchParams, conn, user1.getResource()).getPageSize());
            assertEquals(2, manager.getCreators(searchParams, conn, user1.getResource()).getTotalSize());
        }
    }

    @Test
    public void testGetAssigneesWithNoConnection() {
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().build();

        assertEquals(1, manager.getAssignees(searchParams).getPageNumber());
        assertFalse(manager.getAssignees(searchParams).getPage().isEmpty());
        assertEquals(2, manager.getAssignees(searchParams).getPageSize());
        assertEquals(2, manager.getAssignees(searchParams).getTotalSize());
    }

    @Test
    public void testGetAssigneesWithConnection() {
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().build();

        try (RepositoryConnection conn = repo.getConnection()) {
            assertEquals(1, manager.getAssignees(searchParams, conn).getPageNumber());
            assertFalse(manager.getAssignees(searchParams, conn).getPage().isEmpty());
            assertEquals(2, manager.getAssignees(searchParams, conn).getPageSize());
            assertEquals(2, manager.getAssignees(searchParams, conn).getTotalSize());
        }
    }

    @Test
    public void testGetAssigneesWithUser() {
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().build();

        assertEquals(1, manager.getAssignees(searchParams, user1.getResource()).getPageNumber());
        assertFalse(manager.getAssignees(searchParams, user1.getResource()).getPage().isEmpty());
        assertEquals(1, manager.getAssignees(searchParams, user1.getResource()).getPageSize());
        assertEquals(1, manager.getAssignees(searchParams, user1.getResource()).getTotalSize());
    }

    @Test
    public void testGetAssigneesWithSearchText() {
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().searchText("2").build();

        assertEquals(1, manager.getAssignees(searchParams, user1.getResource()).getPageNumber());
        assertFalse(manager.getAssignees(searchParams, user1.getResource()).getPage().isEmpty());
        assertEquals(1, manager.getAssignees(searchParams, user1.getResource()).getPageSize());
        assertEquals(1, manager.getAssignees(searchParams, user1.getResource()).getTotalSize());
    }

    @Test
    public void testGetAssigneesSearchNotExist() {
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().searchText("NotExist").build();

        assertEquals(0, manager.getAssignees(searchParams, user1.getResource()).getPageNumber());
        assertTrue(manager.getAssignees(searchParams, user1.getResource()).getPage().isEmpty());
        assertEquals(0, manager.getAssignees(searchParams, user1.getResource()).getPageSize());
        assertEquals(0, manager.getAssignees(searchParams, user1.getResource()).getTotalSize());
    }

    @Test
    public void testGetAssigneesWithConnectionAndUser() {
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().build();

        try (RepositoryConnection conn = repo.getConnection()) {
            assertEquals(1, manager.getAssignees(searchParams, conn, user1.getResource()).getPageNumber());
            assertFalse(manager.getAssignees(searchParams, conn, user1.getResource()).getPage().isEmpty());
            assertEquals(1, manager.getAssignees(searchParams, conn, user1.getResource()).getPageSize());
            assertEquals(1, manager.getAssignees(searchParams, conn, user1.getResource()).getTotalSize());
        }
    }

    @Test
    public void testGetRecordsWithNoConnection() {
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().build();

        assertEquals(1, manager.getRecords(searchParams).getPageNumber());
        assertFalse(manager.getRecords(searchParams).getPage().isEmpty());
        assertEquals(2, manager.getRecords(searchParams).getPageSize());
        assertEquals(2, manager.getRecords(searchParams).getTotalSize());
    }

    @Test
    public void testGetRecordsWithConnection() {
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().build();

        try (RepositoryConnection conn = repo.getConnection()) {
            assertEquals(1, manager.getRecords(searchParams, conn).getPageNumber());
            assertFalse(manager.getRecords(searchParams, conn).getPage().isEmpty());
            assertEquals(2, manager.getRecords(searchParams, conn).getPageSize());
            assertEquals(2, manager.getRecords(searchParams, conn).getTotalSize());
        }
    }

    @Test
    public void testGetRecordsWithUser() {
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().build();

        assertEquals(1, manager.getRecords(searchParams, versionedRDFRecord1.getResource()).getPageNumber());
        assertFalse(manager.getRecords(searchParams, versionedRDFRecord1.getResource()).getPage().isEmpty());
        assertEquals(1, manager.getRecords(searchParams, versionedRDFRecord1.getResource()).getPageSize());
        assertEquals(1, manager.getRecords(searchParams, versionedRDFRecord1.getResource()).getTotalSize());
    }

    @Test
    public void testGetRecordsWithSearchText() {
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().searchText("2").build();

        assertEquals(1, manager.getRecords(searchParams, versionedRDFRecord1.getResource()).getPageNumber());
        assertFalse(manager.getRecords(searchParams, versionedRDFRecord1.getResource()).getPage().isEmpty());
        assertEquals(1, manager.getRecords(searchParams, versionedRDFRecord1.getResource()).getPageSize());
        assertEquals(1, manager.getRecords(searchParams, versionedRDFRecord1.getResource()).getTotalSize());
    }

    @Test
    public void testGetRecordsSearchNotExist() {
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().searchText("NotExist").build();

        assertEquals(0, manager.getRecords(searchParams, versionedRDFRecord1.getResource()).getPageNumber());
        assertTrue(manager.getRecords(searchParams, versionedRDFRecord1.getResource()).getPage().isEmpty());
        assertEquals(0, manager.getRecords(searchParams, versionedRDFRecord1.getResource()).getPageSize());
        assertEquals(0, manager.getRecords(searchParams, versionedRDFRecord1.getResource()).getTotalSize());
    }

    @Test
    public void testGetRecordsWithConnectionAndUser() {
        PaginatedSearchParams searchParams = new PaginatedSearchParams.Builder().build();

        try (RepositoryConnection conn = repo.getConnection()) {
            assertEquals(1, manager.getRecords(searchParams, conn, versionedRDFRecord1.getResource()).getPageNumber());
            assertFalse(manager.getRecords(searchParams, conn, versionedRDFRecord1.getResource()).getPage().isEmpty());
            assertEquals(1, manager.getRecords(searchParams, conn, versionedRDFRecord1.getResource()).getPageSize());
            assertEquals(1, manager.getRecords(searchParams, conn, versionedRDFRecord1.getResource()).getTotalSize());
        }
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
