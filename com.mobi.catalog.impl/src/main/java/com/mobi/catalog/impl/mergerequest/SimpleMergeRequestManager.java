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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.builder.Conflict;
import com.mobi.catalog.api.mergerequest.MergeRequestConfig;
import com.mobi.catalog.api.mergerequest.MergeRequestFilterParams;
import com.mobi.catalog.api.mergerequest.MergeRequestManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
import com.mobi.catalog.api.ontologies.mcat.CommitFactory;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecordFactory;
import com.mobi.catalog.api.ontologies.mergerequests.AcceptedMergeRequest;
import com.mobi.catalog.api.ontologies.mergerequests.AcceptedMergeRequestFactory;
import com.mobi.catalog.api.ontologies.mergerequests.Comment;
import com.mobi.catalog.api.ontologies.mergerequests.CommentFactory;
import com.mobi.catalog.api.ontologies.mergerequests.MergeRequest;
import com.mobi.catalog.api.ontologies.mergerequests.MergeRequestFactory;
import com.mobi.catalog.api.versioning.VersioningManager;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.persistence.utils.Bindings;
import com.mobi.query.api.TupleQuery;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.RepositoryConnection;
import org.apache.commons.io.IOUtils;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Component(name = SimpleMergeRequestManager.COMPONENT_NAME)
public class SimpleMergeRequestManager implements MergeRequestManager {

    static final String MERGE_REQUEST_NAMESPACE = "https://mobi.com/merge-requests#";
    static final String COMMENT_NAMESPACE = "https://mobi.com/comments#";
    static final String COMPONENT_NAME = "com.mobi.catalog.api.mergerequest.MergeRequestManager";

    private ValueFactory vf;
    private CatalogConfigProvider configProvider;
    private CatalogUtilsService catalogUtils;
    private VersioningManager versioningManager;
    private MergeRequestFactory mergeRequestFactory;
    private CommentFactory commentFactory;
    private AcceptedMergeRequestFactory acceptedMergeRequestFactory;
    private VersionedRDFRecordFactory recordFactory;
    private BranchFactory branchFactory;
    private CommitFactory commitFactory;

    private static final String GET_COMMENT_CHAINS;
    private static final int MAX_COMMENT_STRING_LENGTH = 1000000;

    static {
        try {
            GET_COMMENT_CHAINS = IOUtils.toString(
                    SimpleMergeRequestManager.class.getResourceAsStream("/get-comment-chains.rq"), "UTF-8");
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Reference
    void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    @Reference
    void setConfigProvider(CatalogConfigProvider configProvider) {
        this.configProvider = configProvider;
    }

    @Reference
    void setCatalogUtils(CatalogUtilsService catalogUtils) {
        this.catalogUtils = catalogUtils;
    }

    @Reference
    void setVersioningManager(VersioningManager versioningManager) {
        this.versioningManager = versioningManager;
    }

    @Reference
    void setMergeRequestFactory(MergeRequestFactory mergeRequestFactory) {
        this.mergeRequestFactory = mergeRequestFactory;
    }

    @Reference
    void setCommentFactory(CommentFactory commentFactory) {
        this.commentFactory = commentFactory;
    }

    @Reference
    void setAcceptedMergeRequestFactory(AcceptedMergeRequestFactory acceptedMergeRequestFactory) {
        this.acceptedMergeRequestFactory = acceptedMergeRequestFactory;
    }

    @Reference
    void setRecordFactory(VersionedRDFRecordFactory recordFactory) {
        this.recordFactory = recordFactory;
    }

    @Reference
    void setBranchFactory(BranchFactory branchFactory) {
        this.branchFactory = branchFactory;
    }

    @Reference
    void setCommitFactory(CommitFactory commitFactory) {
        this.commitFactory = commitFactory;
    }

    private static final String GET_MERGE_REQUESTS_QUERY;
    private static final String FILTERS = "%FILTERS%";
    private static final String REQUEST_ID_BINDING = "requestId";
    private static final String ASSIGNEE_BINDING = "assignee";
    private static final String ON_RECORD_BINDING = "onRecord";
    private static final String SOURCE_BRANCH_BINDING = "sourceBranch";
    private static final String TARGET_BRANCH_BINDING = "targetBranch";
    private static final String SOURCE_COMMIT_BINDING = "sourceCommit";
    private static final String TARGET_COMMIT_BINDING = "targetCommit";
    private static final String REMOVE_SOURCE_BINDING = "removeSource";
    private static final String SORT_PRED_BINDING = "sortPred";

    static {
        try {
            GET_MERGE_REQUESTS_QUERY = IOUtils.toString(SimpleMergeRequestManager.class
                    .getResourceAsStream("/get-merge-requests.rq"), "UTF-8"
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Override
    public List<MergeRequest> getMergeRequests(MergeRequestFilterParams params) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            return getMergeRequests(params, conn);
        }
    }

    @Override
    public List<MergeRequest> getMergeRequests(MergeRequestFilterParams params, RepositoryConnection conn) {
        StringBuilder filters = new StringBuilder("FILTER ");
        if (!params.getAccepted()) {
            filters.append("NOT ");
        }
        filters.append("EXISTS { ?").append(REQUEST_ID_BINDING).append(" a mq:AcceptedMergeRequest . } ");
        Resource sortBy = params.getSortBy().orElseGet(() -> vf.createIRI(_Thing.issued_IRI));
        filters.append("?").append(REQUEST_ID_BINDING).append(" <").append(sortBy).append("> ?")
                .append(SORT_PRED_BINDING).append(". ");

        if (params.hasFilters()) {
            filters.append("FILTER (");
            params.getAssignee().ifPresent(assignee -> filters.append("?").append(ASSIGNEE_BINDING).append(" = <")
                    .append(assignee).append("> && "));
            params.getOnRecord().ifPresent(onRecord -> filters.append("?").append(ON_RECORD_BINDING).append(" = <")
                    .append(onRecord).append("> && "));
            params.getSourceBranch().ifPresent(sourceBranch -> filters.append("?").append(SOURCE_BRANCH_BINDING)
                    .append(" = <").append(sourceBranch).append("> && "));
            params.getTargetBranch().ifPresent(targetBranch -> filters.append("?").append(TARGET_BRANCH_BINDING)
                    .append(" = <").append(targetBranch).append("> && "));
            params.getSourceCommit().ifPresent(sourceCommit -> filters.append("?").append(SOURCE_COMMIT_BINDING)
                    .append(" = <").append(sourceCommit).append("> && "));
            params.getTargetCommit().ifPresent(targetCommit -> filters.append("?").append(TARGET_COMMIT_BINDING)
                    .append(" = <").append(targetCommit).append("> && "));
            params.getRemoveSource().ifPresent(removeSource -> filters.append("?").append(REMOVE_SOURCE_BINDING)
                    .append(" = ").append(removeSource).append(" && "));
            filters.delete(filters.lastIndexOf(" && "), filters.length());
            filters.append(")");
        }

        StringBuilder queryBuilder = new StringBuilder(GET_MERGE_REQUESTS_QUERY.replace(FILTERS, filters.toString()));
        queryBuilder.append(" ORDER BY ");
        if (params.sortAscending()) {
            queryBuilder.append("?").append(SORT_PRED_BINDING);
        } else {
            queryBuilder.append("DESC(?").append(SORT_PRED_BINDING).append(")");
        }

        TupleQuery query = conn.prepareTupleQuery(queryBuilder.toString());
        return StreamSupport.stream(query.evaluate().spliterator(), false)
                .map(bindings -> Bindings.requiredResource(bindings, REQUEST_ID_BINDING))
                .map(resource -> catalogUtils.getExpectedObject(resource, mergeRequestFactory, conn))
                .collect(Collectors.toList());
    }

    @Override
    public MergeRequest createMergeRequest(MergeRequestConfig config, Resource localCatalog) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            return createMergeRequest(config, localCatalog, conn);
        }
    }

    @Override
    public MergeRequest createMergeRequest(MergeRequestConfig config, Resource localCatalog,
                                           RepositoryConnection conn) {
        catalogUtils.validateBranch(localCatalog, config.getRecordId(), config.getSourceBranchId(), conn);
        catalogUtils.validateBranch(localCatalog, config.getRecordId(), config.getTargetBranchId(), conn);

        OffsetDateTime now = OffsetDateTime.now();
        MergeRequest request = mergeRequestFactory.createNew(vf.createIRI(MERGE_REQUEST_NAMESPACE + UUID.randomUUID()));
        request.setProperty(vf.createLiteral(now), vf.createIRI(_Thing.issued_IRI));
        request.setProperty(vf.createLiteral(now), vf.createIRI(_Thing.modified_IRI));
        request.setOnRecord(recordFactory.createNew(config.getRecordId()));
        request.setSourceBranch(branchFactory.createNew(config.getSourceBranchId()));
        request.setTargetBranch(branchFactory.createNew(config.getTargetBranchId()));
        request.setProperty(vf.createLiteral(config.getTitle()), vf.createIRI(_Thing.title_IRI));
        request.setRemoveSource(config.getRemoveSource());
        config.getDescription().ifPresent(description ->
                request.setProperty(vf.createLiteral(description), vf.createIRI(_Thing.description_IRI)));
        request.setProperty(config.getCreator().getResource(), vf.createIRI(_Thing.creator_IRI));
        config.getAssignees().forEach(request::addAssignee);
        return request;
    }

    @Override
    public void addMergeRequest(MergeRequest request) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            addMergeRequest(request, conn);
        }
    }

    @Override
    public void addMergeRequest(MergeRequest request, RepositoryConnection conn) {
        if (conn.containsContext(request.getResource())) {
            throw catalogUtils.throwAlreadyExists(request.getResource(), recordFactory);
        }
        conn.add(request.getModel(), request.getResource());
    }

    @Override
    public Optional<MergeRequest> getMergeRequest(Resource requestId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            return getMergeRequest(requestId, conn);
        }
    }

    @Override
    public Optional<MergeRequest> getMergeRequest(Resource requestId, RepositoryConnection conn) {
        return catalogUtils.optObject(requestId, mergeRequestFactory, conn);
    }

    @Override
    public void updateMergeRequest(Resource requestId, MergeRequest request) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            updateMergeRequest(requestId, request, conn);
        }
    }

    @Override
    public void updateMergeRequest(Resource requestId, MergeRequest request, RepositoryConnection conn) {
        catalogUtils.validateResource(requestId, mergeRequestFactory.getTypeIRI(), conn);
        catalogUtils.updateObject(request, conn);
    }

    @Override
    public void deleteMergeRequest(Resource requestId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            deleteMergeRequest(requestId, conn);
        }
    }

    @Override
    public void deleteMergeRequest(Resource requestId, RepositoryConnection conn) {
        catalogUtils.validateResource(requestId, mergeRequestFactory.getTypeIRI(), conn);
        deleteCommentsWithRequestId(requestId);
        catalogUtils.remove(requestId, conn);
    }

    @Override
    public void acceptMergeRequest(Resource requestId, User user) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            acceptMergeRequest(requestId, user, conn);
        }
    }

    @Override
    public void acceptMergeRequest(Resource requestId, User user,  RepositoryConnection conn) {
        // Validate MergeRequest
        MergeRequest request = catalogUtils.getExpectedObject(requestId, mergeRequestFactory, conn);
        if (request.getModel().contains(requestId, vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI),
                vf.createIRI(AcceptedMergeRequest.TYPE))) {
            throw new IllegalArgumentException("Request " + requestId + " has already been accepted");
        }

        // Collect information about the VersionedRDFRecord, Branches, and Commits
        Resource recordId = request.getOnRecord_resource().orElseThrow(() ->
                new IllegalStateException("Request " + requestId + " does not have a VersionedRDFRecord"));
        Resource targetId = request.getTargetBranch_resource().orElseThrow(() ->
                new IllegalArgumentException("Request " + requestId + " does not have a target Branch"));
        Branch target = catalogUtils.getExpectedObject(targetId, branchFactory, conn);
        Resource sourceId = request.getSourceBranch_resource().orElseThrow(() ->
                new IllegalStateException("Request " + requestId + " does not have a source Branch"));
        Branch source = catalogUtils.getExpectedObject(sourceId, branchFactory, conn);
        Resource sourceCommitId = getBranchHead(source);
        Resource targetCommitId = getBranchHead(target);
        String sourceTitle = getBranchTitle(source);
        String targetTitle = getBranchTitle(target);

        // Check conflicts and perform merge
        Set<Conflict> conflicts = catalogUtils.getConflicts(sourceCommitId, targetCommitId, conn);
        if (conflicts.size() > 0) {
            throw new IllegalArgumentException("Branch " + sourceId + " and " + targetId
                    + " have conflicts and cannot be merged");
        }
        versioningManager.merge(configProvider.getLocalCatalogIRI(), recordId, sourceId, targetId, user, null, null);

        // Turn MergeRequest into an AcceptedMergeRequest
        AcceptedMergeRequest acceptedRequest = acceptedMergeRequestFactory.createNew(request.getResource(),
                request.getModel());
        acceptedRequest.removeProperty(targetId, vf.createIRI(MergeRequest.targetBranch_IRI));
        acceptedRequest.removeProperty(sourceId, vf.createIRI(MergeRequest.sourceBranch_IRI));
        IRI removeSourceIRI = vf.createIRI(MergeRequest.removeSource_IRI);
        request.getProperty(removeSourceIRI).ifPresent(removeSource -> acceptedRequest.removeProperty(removeSource,
                removeSourceIRI));
        acceptedRequest.setTargetBranchTitle(targetTitle);
        acceptedRequest.setSourceBranchTitle(sourceTitle);
        acceptedRequest.setTargetCommit(commitFactory.createNew(targetCommitId));
        acceptedRequest.setSourceCommit(commitFactory.createNew(sourceCommitId));
        catalogUtils.updateObject(acceptedRequest, conn);
    }

    @Override
    public void deleteMergeRequestsWithRecordId(Resource recordId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            deleteMergeRequestsWithRecordId(recordId, conn);
        }
    }

    @Override
    public void deleteMergeRequestsWithRecordId(Resource recordId, RepositoryConnection conn) {
        MergeRequestFilterParams.Builder builder = new MergeRequestFilterParams.Builder();
        builder.setOnRecord(recordId);

        List<MergeRequest> mergeRequests = getMergeRequests(builder.build(), conn);
        mergeRequests.forEach(mergeRequest -> deleteMergeRequest(mergeRequest.getResource(), conn));

        builder.setAccepted(true);
        mergeRequests = getMergeRequests(builder.build(), conn);
        mergeRequests.forEach(mergeRequest -> deleteMergeRequest(mergeRequest.getResource(), conn));
    }

    @Override
    public void cleanMergeRequests(Resource recordId, Resource branchId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            cleanMergeRequests(recordId, branchId, conn);
        }
    }

    @Override
    public void cleanMergeRequests(Resource recordId, Resource branchId, RepositoryConnection conn) {
        MergeRequestFilterParams.Builder builder = new MergeRequestFilterParams.Builder();
        builder.setOnRecord(recordId);

        List<MergeRequest> mergeRequests = getMergeRequests(builder.build(), conn);
        mergeRequests.forEach(mergeRequest -> {
            mergeRequest.getTargetBranch_resource().ifPresent(targetResource -> {
                if (targetResource.equals(branchId)) {
                    mergeRequest.getModel().remove(mergeRequest.getResource(),
                            vf.createIRI(MergeRequest.targetBranch_IRI), targetResource);
                    updateMergeRequest(mergeRequest.getResource(), mergeRequest, conn);
                }
            });
            mergeRequest.getSourceBranch_resource().ifPresent(sourceResource -> {
                if (sourceResource.equals(branchId)) {
                    deleteMergeRequest(mergeRequest.getResource(), conn);
                }
            });
        });
    }

    @Override
    public Comment createComment(Resource requestId, User user, String commentStr) {
        if (commentStr.length() > MAX_COMMENT_STRING_LENGTH) {
            throw new IllegalArgumentException("Comment string length must be less than " + MAX_COMMENT_STRING_LENGTH);
        }
        OffsetDateTime now = OffsetDateTime.now();
        Comment comment = commentFactory.createNew(vf.createIRI(COMMENT_NAMESPACE + UUID.randomUUID()));
        comment.setProperty(vf.createLiteral(now), vf.createIRI(_Thing.issued_IRI));
        comment.setProperty(vf.createLiteral(now), vf.createIRI(_Thing.modified_IRI));
        comment.setProperty(user.getResource(), vf.createIRI(_Thing.creator_IRI));
        comment.setProperty(vf.createLiteral(commentStr), vf.createIRI(_Thing.description_IRI));
        MergeRequest mergeRequest = getMergeRequest(requestId).orElseThrow(
                () -> new IllegalArgumentException("MergeRequest " + requestId + " does not exist"));
        comment.setOnMergeRequest(mergeRequest);

        try (RepositoryConnection connection = configProvider.getRepository().getConnection()) {
            connection.add(comment.getModel(), comment.getResource());
        }
        return comment;
    }

    @Override
    public Comment createComment(Resource requestId, User user, String commentStr, Resource parentCommentId) {
        Comment parent = getComment(parentCommentId).orElseThrow(
                () -> new IllegalArgumentException("Parent comment " + parentCommentId + " does not exist"));
        while (parent.getReplyComment_resource().isPresent()) {
            parent = getComment(parent.getReplyComment_resource().get()).orElseThrow(
                    () -> new IllegalArgumentException("Parent comment " + parentCommentId + " does not exist"));
        }
        Comment comment = createComment(requestId, user, commentStr);
        parent.setReplyComment(comment);
        updateComment(parent.getResource(), parent);

        return comment;
    }

    @Override
    public List<List<Comment>> getComments(Resource requestId) {
        getMergeRequest(requestId).orElseThrow(
                () -> new IllegalArgumentException("MergeRequest " + requestId + " does not exist"));

        List<List<Comment>> commentChains = new ArrayList<>();
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            TupleQuery query = conn.prepareTupleQuery(GET_COMMENT_CHAINS);
            query.setBinding("mergeRequest", requestId);
            query.evaluate().forEach(bindings -> {
                bindings.getValue("parent").ifPresent(parent -> {
                    List<String> chain = new ArrayList<String>(Arrays.asList(
                            Bindings.requiredLiteral(bindings, "chain").stringValue().split(" ")));
                    chain.add(0, parent.stringValue());
                    chain.remove("");
                    commentChains.add(chain.stream().map(vf::createIRI)
                            .map(iri -> getComment(iri).orElseThrow(() -> new IllegalStateException("Comment " + iri
                                    + " does not exist.")))
                            .collect(Collectors.toList()));
                });
            });
        }
        return commentChains;
    }

    @Override
    public Optional<Comment> getComment(Resource commentId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            return getComment(commentId, conn);
        }
    }

    @Override
    public Optional<Comment> getComment(Resource commentId, RepositoryConnection conn) {
        return catalogUtils.optObject(commentId, commentFactory, conn);
    }

    @Override
    public void updateComment(Resource commentId, Comment comment) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            catalogUtils.validateResource(commentId, commentFactory.getTypeIRI(), conn);
            catalogUtils.updateObject(comment, conn);
        }
    }

    @Override
    public void deleteComment(Resource commentId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            // Adjust comment chain pointers if they exist
            Comment comment = getComment(commentId, conn).orElseThrow(
                    () -> new IllegalArgumentException("Comment " + commentId + " does not exist"));
            Iterator<Statement> statements = conn.getStatements(null, vf.createIRI(Comment.replyComment_IRI),
                    commentId);
            if (statements.hasNext()) {
                Resource parentCommentIRI = statements.next().getSubject();
                Comment parentComment = getComment(parentCommentIRI, conn).orElseThrow(
                        () -> new IllegalArgumentException("Parent comment " + parentCommentIRI + " does not exist"));
                Optional<Resource> childCommentResourceOpt = comment.getReplyComment_resource();
                if (childCommentResourceOpt.isPresent()) {
                    Comment childComment = getComment(childCommentResourceOpt.get(), conn).orElseThrow(
                            () -> new IllegalArgumentException("Child comment " + childCommentResourceOpt.get()
                                    + " does not exist"));
                    parentComment.setReplyComment(childComment);
                    updateComment(parentComment.getResource(), parentComment);
                } else {
                    parentComment.removeProperty(commentId, vf.createIRI(Comment.replyComment_IRI));
                    updateComment(parentComment.getResource(), parentComment);
                }
            }
            catalogUtils.validateResource(commentId, commentFactory.getTypeIRI(), conn);
            catalogUtils.remove(commentId, conn);
        }
    }

    @Override
    public void deleteCommentsWithRequestId(Resource requestId) {
        getComments(requestId).forEach(commentChain -> commentChain.forEach(
                comment -> deleteComment(comment.getResource())));
    }

    private String getBranchTitle(Branch branch) {
        return branch.getProperty(vf.createIRI(_Thing.title_IRI)).orElseThrow(() ->
                new IllegalStateException("Branch " + branch.getResource() + " does not have a title")).stringValue();
    }

    private Resource getBranchHead(Branch branch) {
        return branch.getHead_resource().orElseThrow(() ->
                new IllegalStateException("Branch " + branch.getResource() + " does not have a head Commit"));
    }
}
