package com.mobi.catalog.api.mergerequest;

/*-
 * #%L
 * com.mobi.catalog.api
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

import com.mobi.catalog.api.PaginatedSearchParams;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.catalog.api.builder.RecordCount;
import com.mobi.catalog.api.builder.UserCount;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.ontologies.mergerequests.ClosedMergeRequest;
import com.mobi.catalog.api.ontologies.mergerequests.Comment;
import com.mobi.catalog.api.ontologies.mergerequests.MergeRequest;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.repository.RepositoryConnection;

import java.util.List;
import java.util.Optional;

public interface MergeRequestManager {

    /**
     * Accepts a {@link MergeRequest} by performing a merge between the source and target {@link Branch branches},
     * changing the type to an {@link com.mobi.catalog.api.ontologies.mergerequests.AcceptedMergeRequest}, and
     * replacing the sourceBranch and targetBranch predicates with sourceBranchTitle, sourceCommit, targetBranchTitle,
     * and targetCommit.
     *
     * @param requestId The {@link Resource} representing the {@link MergeRequest} ID to delete.
     * @param user The {@link User} performing the acceptance
     * @throws IllegalStateException If any expected links between objects or data properties are not present on the
     *      {@link MergeRequest}, {@link VersionedRDFRecord}, {@link Branch Branches}, or
     *      {@link com.mobi.catalog.api.ontologies.mcat.Commit Commits}
     * @throws IllegalArgumentException If the {@link MergeRequest} has already been accepted, does not have a target
     *      {@link Branch}, or conflicts exist between the source {@link Branch} and target {@link Branch}
     */
    void acceptMergeRequest(Resource requestId, User user);

    /**
     * Accepts a {@link MergeRequest} by performing a merge between the source and target {@link Branch branches},
     * changing the type to an {@link com.mobi.catalog.api.ontologies.mergerequests.AcceptedMergeRequest},
     * replacing the sourceBranch and targetBranch predicates with sourceBranchTitle, sourceCommit, targetBranchTitle,
     * and targetCommit, and removing the removeSource predicate.
     *
     * @param requestId The {@link Resource} representing the {@link MergeRequest} ID to delete.
     * @param user The {@link User} performing the acceptance
     * @param conn A RepositoryConnection to use for lookup
     * @throws IllegalStateException If any expected links between objects or data properties are not present on the
     *      {@link MergeRequest}, {@link VersionedRDFRecord}, {@link Branch Branches}, or
     *      {@link com.mobi.catalog.api.ontologies.mcat.Commit Commits}
     * @throws IllegalArgumentException If the {@link MergeRequest} has already been accepted, does not have a target
     *      {@link Branch}, or conflicts exist between the source {@link Branch} and target {@link Branch}
     */
    void acceptMergeRequest(Resource requestId, User user, RepositoryConnection conn);

    /**
     * Closes a {@link MergeRequest} and changes the type to an {@link ClosedMergeRequest},
     * setting the targetCommit and sourceCommit properties to the current head Commits of the
     * targetBranch and sourceBranch.
     *
     * @param requestId The {@link Resource} representing the {@link MergeRequest} ID to close.
     * @param user The {@link User} performing the closing
     * @param conn A RepositoryConnection to use for lookup
     * @throws IllegalStateException If any expected links between objects or data properties are not present on the
     *      {@link MergeRequest}, {@link VersionedRDFRecord}, {@link Branch Branches}, or
     *      {@link com.mobi.catalog.api.ontologies.mcat.Commit Commits}
     * @throws IllegalArgumentException If the {@link MergeRequest} has already been accepted.
     */
    void closeMergeRequest(Resource requestId, User user, RepositoryConnection conn);

    /**
     * Closes a {@link MergeRequest} and changes the type to an {@link ClosedMergeRequest},
     * setting the targetCommit and sourceCommit properties to the current head Commits of the
     * targetBranch and sourceBranch.
     *
     * @param requestId The {@link Resource} representing the {@link MergeRequest} ID to close.
     * @param user The {@link User} performing the closing
     * @throws IllegalStateException If any expected links between objects or data properties are not present on the
     *      {@link MergeRequest}, {@link VersionedRDFRecord}, {@link Branch Branches}, or
     *      {@link com.mobi.catalog.api.ontologies.mcat.Commit Commits}
     * @throws IllegalArgumentException If the {@link MergeRequest} has already been accepted.
     */
    void closeMergeRequest(Resource requestId, User user);

    /**
     * Reopens a {@link ClosedMergeRequest} and changes the type to an {@link MergeRequest},
     * removing the targetCommit and sourceCommit properties.
     *
     * @param requestId The {@link Resource} representing the {@link ClosedMergeRequest} ID to reopen.
     * @param user the {@link User} requesting to reopen the merge request
     * @param conn the connection to the repository
     */
    void reopenMergeRequest(Resource requestId, User user, RepositoryConnection conn);

    /**
     * Reopens a {@link ClosedMergeRequest} identified by the given requestId for the specified user,
     * removing the targetCommit and sourceCommit properties.
     *
     * @param requestId The {@link Resource} of the {@link ClosedMergeRequest} to be reopened
     * @param user The {@link User} who is reopening the merge request
     */
    void reopenMergeRequest(Resource requestId, User user);

    /**
     * Stores the provided {@link MergeRequest} in the repository as long as it does not already exist.
     *
     * @param request A {@link MergeRequest} to add to the repository
     * @throws IllegalArgumentException If the provided {@link MergeRequest} already exists in the repository
     */
    void addMergeRequest(MergeRequest request);

    /**
     * Stores the provided {@link MergeRequest} in the repository as long as it does not already exist.
     *
     * @param request A {@link MergeRequest} to add to the repository
     * @param conn A RepositoryConnection to use for lookup
     * @throws IllegalArgumentException If the provided {@link MergeRequest} already exists in the repository
     */
    void addMergeRequest(MergeRequest request, RepositoryConnection conn);

    /**
     * Updates any existing MergeRequest that references the provided branchId that is being removed. If a deleted
     * branch is the target of an open MergeRequest, the target will be removed from the MergeRequest. If a deleted
     * branch is the source of an open MergeRequest, the MergeRequest will be deleted.
     *
     * @param recordId A Resource of the recordId representing a VersionedRDFRecord
     * @param branchId A Resource of the branchId representing a deleted Branch
     */
    void cleanMergeRequests(Resource recordId, Resource branchId, String branchTitle, List<Resource> deletedCommits);

    /**
     * Updates any existing MergeRequest that references the provided branchId that is being removed. If a deleted
     * branch is the target of an open MergeRequest, the target will be removed from the MergeRequest. If a deleted
     * branch is the source of an open MergeRequest, the MergeRequest will be deleted.
     *
     * @param recordId A Resource of the recordId representing a VersionedRDFRecord
     * @param branchId A Resource of the branchId representing a deleted Branch
     * @param conn A RepositoryConnection to use for lookup
     * @param branchTitle The title of the branch that was deleted
     * @param deletedCommits A list of the IRIs of the commits that were deleted when the branch was deleted
     */
    void cleanMergeRequests(Resource recordId, Resource branchId, String branchTitle, List<Resource> deletedCommits,
                            RepositoryConnection conn);

    /**
     * Create a {@link Comment} on an existing {@link MergeRequest}. This comment will be the first comment in a thread
     * of comments on the MergeRequest.
     *
     * @param requestId The {@link Resource} of the associated {@link MergeRequest} to comment on
     * @param user The {@link User} making the comment on the MergeRequest
     * @param commentStr The comment String
     * @return A {@link Comment} created with the provided metadata
     * @throws IllegalArgumentException if the {@link MergeRequest} does not exist
     */
    Comment createComment(Resource requestId, User user, String commentStr);

    /**
     * Create a reply {@link Comment} on an existing {@link MergeRequest}. This comment will be in a comment thread
     * on the MergeRequest with its parent {@link Comment} being the provided {@code parentCommentId}. If the parent
     * {@link Comment} has a child, the new reply {@link Comment} will be added to the bottom of the chain.
     *
     * @param requestId The {@link Resource} of the associated {@link MergeRequest} to comment on
     * @param user The {@link User} making the comment on the MergeRequest
     * @param commentStr The comment String
     * @param parentCommentId The {@link Resource} of the {@link Comment} that the new Comment is replying to
     * @return A {@link Comment} created with the provided metadata
     * @throws IllegalArgumentException if the {@link MergeRequest} does not exist or if the parent {@link Comment} does
     *      not exist
     */
    Comment createComment(Resource requestId, User user, String commentStr, Resource parentCommentId);

    /**
     * Creates a {@link MergeRequest} with the metadata within the provided {@link MergeRequestConfig} along with a
     * created and modified date. The title, {@link VersionedRDFRecord} ID, source {@link Branch} ID, target
     * {@link Branch} ID, and creator {@link User} are required. Can optionally include a description and
     * any assigned {@link User}s.
     *
     * @param config A {@link MergeRequestConfig} containing metadata about a {@link MergeRequest}
     * @param localCatalog A {@link Resource} identifying the local catalog ID
     * @return A {@link MergeRequest} created with the provided metadata
     * @throws IllegalArgumentException {@link VersionedRDFRecord} could not be found, the {@link VersionedRDFRecord}
     *      does not belong to the local {@link Catalog}, or the source or target {@link Branch}es do not belong to
     *      the {@link VersionedRDFRecord}.
     */
    MergeRequest createMergeRequest(MergeRequestConfig config, Resource localCatalog);

    /**
     * Creates a {@link MergeRequest} with the metadata within the provided {@link MergeRequestConfig} along with a
     * created and modified date. The title, {@link VersionedRDFRecord} ID, source {@link Branch} ID, target
     * {@link Branch} ID, and creator {@link User} are required. Can optionally include a description and
     * any assigned {@link User}s.
     *
     * @param config A {@link MergeRequestConfig} containing metadata about a {@link MergeRequest}
     * @param localCatalog A {@link Resource} identifying the local catalog ID
     * @param conn A RepositoryConnection to use for lookup
     * @return A {@link MergeRequest} created with the provided metadata
     * @throws IllegalArgumentException {@link VersionedRDFRecord} could not be found, the {@link VersionedRDFRecord}
     *      does not belong to the local {@link Catalog}, or the source or target {@link Branch}es do not belong to
     *      the {@link VersionedRDFRecord}.
     */
    MergeRequest createMergeRequest(MergeRequestConfig config, Resource localCatalog, RepositoryConnection conn);

    /**
     * Deletes an existing {@link Comment} identified by the provided the {@link Resource}.
     *
     * @param commentId The {@link Resource} representing the {@link Comment} ID to delete.
     * @throws IllegalArgumentException If the provided {@link Resource} does not exist in the repository
     */
    void deleteComment(Resource commentId);

    /**
     * Deletes an existing {@link Comment} identified by the provided the {@link Resource}.
     *
     * @param commentId The {@link Resource} representing the {@link Comment} ID to delete.
     * @param conn A RepositoryConnection to use for lookup
     * @throws IllegalArgumentException If the provided {@link Resource} does not exist in the repository
     */
    void deleteComment(Resource commentId, RepositoryConnection conn);

    /**
     * Removes all Comments that are linked to the {@link MergeRequest} identified by the provided Resource.
     *
     * @param requestId Removes all Comments that are linked to the {@link MergeRequest} identified by the provided
     *                  Resource.
     */
    void deleteCommentsWithRequestId(Resource requestId);

    /**
     * Removes all Comments that are linked to the {@link MergeRequest} identified by the provided Resource.
     *
     * @param requestId Removes all Comments that are linked to the {@link MergeRequest} identified by the provided
     *                  Resource.
     * @param conn A RepositoryConnection to use for lookup
     */
    void deleteCommentsWithRequestId(Resource requestId, RepositoryConnection conn);

    /**
     * Deletes an existing {@link MergeRequest} identified by the provided the {@link Resource}.
     *
     * @param requestId The {@link Resource} representing the {@link MergeRequest} ID to delete.
     * @throws IllegalArgumentException If the provided {@link Resource} does not exist in the repository
     */
    void deleteMergeRequest(Resource requestId);

    /**
     * Deletes an existing {@link MergeRequest} identified by the provided the {@link Resource}.
     *
     * @param requestId The {@link Resource} representing the {@link MergeRequest} ID to delete.
     * @param conn A RepositoryConnection to use for lookup
     * @throws IllegalArgumentException If the provided {@link Resource} does not exist in the repository
     */
    void deleteMergeRequest(Resource requestId, RepositoryConnection conn);

    /**
     * Removes all MergeRequests that are linked to the VersionedRDFRecord identified by the provided Resource.
     *
     * @param recordId Removes all MergeRequests that are linked to the VersionedRDFRecord identified by the provided
     *                 Resource.
     */
    void deleteMergeRequestsWithRecordId(Resource recordId);

    /**
     * Removes all MergeRequests that are linked to the VersionedRDFRecord identified by the provided Resource.
     *
     * @param recordId Removes all MergeRequests that are linked to the VersionedRDFRecord identified by the provided
     *                 Resource.
     * @param conn A RepositoryConnection to use for lookup
     */
    void deleteMergeRequestsWithRecordId(Resource recordId, RepositoryConnection conn);

    /**
     * Gets the {@link Comment} identified by the provided {@link Resource}.
     *
     * @param commentId The {@link Resource} identifying a {@link Comment}
     * @return The {@link Comment} if it exists.
     */
    Optional<Comment> getComment(Resource commentId);

    /**
     * Gets the {@link Comment} identified by the provided {@link Resource}.
     *
     * @param commentId The {@link Resource} identifying a {@link Comment}
     * @param conn A RepositoryConnection to use for lookup
     *
     * @return The {@link Comment} if it exists.
     */
    Optional<Comment> getComment(Resource commentId, RepositoryConnection conn);

    /**
     * Gets the {@link List} of all {@link Comment} chains in Mobi for the {@link MergeRequest} sorted by issued date of
     * the head of the chain.
     *
     * @param requestId The {@link Resource} identifying a {@link MergeRequest}
     * @return The sorted {@link List} of {@link Comment} chains for the provided {@link MergeRequest}
     */
    List<List<Comment>> getComments(Resource requestId);

    /**
     * Gets the {@link List} of all {@link Comment} chains in Mobi for the {@link MergeRequest} sorted by issued date of
     * the head of the chain.
     *
     * @param requestId The {@link Resource} identifying a {@link MergeRequest}
     * @param conn A RepositoryConnection to use for lookup
     * @return The sorted {@link List} of {@link Comment} chains for the provided {@link MergeRequest}
     */
    List<List<Comment>> getComments(Resource requestId, RepositoryConnection conn);

    /**
     * Gets the {@link MergeRequest} identified by the provided {@link Resource}.
     *
     * @param requestId The {@link Resource} identifying a {@link MergeRequest}
     * @return The {@link MergeRequest} if it exists.
     */
    Optional<MergeRequest> getMergeRequest(Resource requestId);

    /**
     * Gets the {@link MergeRequest} identified by the provided {@link Resource}.
     *
     * @param requestId The {@link Resource} identifying a {@link MergeRequest}
     * @param conn A RepositoryConnection to use for lookup
     * @return The {@link MergeRequest} if it exists.
     */
    Optional<MergeRequest> getMergeRequest(Resource requestId, RepositoryConnection conn);

    /**
     * Gets the {@link List} of all {@link MergeRequest}s in Mobi that match the provided parameters.
     *
     * @param params The {@link MergeRequestFilterParams} to filter the MergeRequests by
     * @return The {@link List} of all matching {@link MergeRequest}s
     */
    List<MergeRequest> getMergeRequests(MergeRequestFilterParams params);

    /**
     * Gets the {@link List} of all {@link MergeRequest}s in Mobi that match the provided parameters.
     *
     * @param params The {@link MergeRequestFilterParams} to filter the MergeRequests by
     * @param conn A RepositoryConnection to use for lookup
     * @return The {@link List} of all matching {@link MergeRequest}s
     */
    List<MergeRequest> getMergeRequests(MergeRequestFilterParams params, RepositoryConnection conn);

    /**
     * Replaces the stored {@link Comment} of {@code requestId} with the provided {@link Comment}
     * {@code request}. Assumes that {@code comment} is properly populated.
     *
     * @param commentId the {@link Resource} identifying a {@link Comment}
     * @param comment the updated {@link Comment} referenced by {@code commentId}
     * @throws IllegalArgumentException If the provided {@link Comment} does not exist in the repository
     */
    void updateComment(Resource commentId, Comment comment);

    /**
     * Replaces the stored {@link Comment} of {@code requestId} with the provided {@link Comment}
     * {@code request}. Assumes that {@code comment} is properly populated.
     *
     * @param commentId the {@link Resource} identifying a {@link Comment}
     * @param comment the updated {@link Comment} referenced by {@code commentId}
     * @throws IllegalArgumentException If the provided {@link Comment} does not exist in the repository
     */
    void updateComment(Resource commentId, Comment comment, RepositoryConnection conn);

    /**
     * Replaces the stored {@link MergeRequest} of {@code requestId} with the provided {@link MergeRequest}
     * {@code request}. Assumes that {@code request} is properly populated.
     *
     * @param requestId the {@link Resource} identifying a {@link MergeRequest}
     * @param request the updated {@link MergeRequest} referenced by {@code requestId}
     * @throws IllegalArgumentException If the provided {@link MergeRequest} does not exist in the repository
     */
    void updateMergeRequest(Resource requestId, MergeRequest request);

    /**
     * Replaces the stored {@link MergeRequest} of {@code requestId} with the provided {@link MergeRequest} {@code request}
     * Assumes that {@code request} is properly populated.
     *
     * @param requestId the {@link Resource} identifying a {@link MergeRequest}
     * @param request the updated {@link MergeRequest} referenced by {@code requestId}
     * @param conn A RepositoryConnection to use for lookup
     * @throws IllegalArgumentException If the provided {@link MergeRequest} does not exist in the repository
     */
    void updateMergeRequest(Resource requestId, MergeRequest request, RepositoryConnection conn);

    /**
     * Returns a list of records associated with {@link MergeRequest} instances with their counts and titles.
     *
     * @param params Search parameters.
     * @return The {@link PaginatedSearchResults} of the records with the counts of merge requests they are associated with
     */
    PaginatedSearchResults<RecordCount> getRecords(PaginatedSearchParams params);

    /**
     * Returns a list of records associated with {@link MergeRequest} instances with their counts and titles filtered
     * by the Merge Requests that the user with the provided IRI can view.
     *
     * @param params Search parameters.
     * @param user The Resource IRI of the user making the request to filter based on permissions
     * @return The {@link PaginatedSearchResults} of the records with the counts of merge requests they are associated with
     */
    PaginatedSearchResults<RecordCount> getRecords(PaginatedSearchParams params, Resource user);

    /**
     * Returns a list of records associated with {@link MergeRequest} instances with their counts and titles using the
     * provided {@link RepositoryConnection}.
     *
     * @param params Search parameters.
     * @param conn The {@link RepositoryConnection} to use for look up.
     * @return The {@link PaginatedSearchResults} of the records with the counts of merge requests they are associated with
     */
    PaginatedSearchResults<RecordCount> getRecords(PaginatedSearchParams params, RepositoryConnection conn);

    /**
     * Returns a list of records associated with {@link MergeRequest} instances with their counts and titles using the
     * provided {@link RepositoryConnection} filtered by the Merge Requests that the user with the provided IRI can
     * view.
     *
     * @param params Search parameters.
     * @param conn The {@link RepositoryConnection} to use for look up.
     * @param user The Resource IRI of the user making the request to filter based on permissions
     * @return The {@link PaginatedSearchResults} of the records with the counts of merge requests they are associated with
     */
    PaginatedSearchResults<RecordCount> getRecords(PaginatedSearchParams params, RepositoryConnection conn,
                                                   Resource user);

    /**
     * Returns a list of users that created {@link MergeRequest} instances with their counts and display names.
     *
     * @param params Search parameters.
     * @return The {@link PaginatedSearchResults} of the users with the counts of merge requests they have created
     */
    PaginatedSearchResults<UserCount> getCreators(PaginatedSearchParams params);

    /**
     * Returns a list of users that created {@link MergeRequest} instances with their counts and display names filtered
     * by the Merge Requests that the user with the provided IRI can view.
     *
     * @param params Search parameters.
     * @param user The Resource IRI of the user making the request to filter based on permissions
     * @return The {@link PaginatedSearchResults} of the users with the counts of merge requests they have created
     */
    PaginatedSearchResults<UserCount> getCreators(PaginatedSearchParams params, Resource user);

    /**
     * Returns a list of users that created {@link MergeRequest} instances with their counts and display names using the
     * provided {@link RepositoryConnection}.
     *
     * @param params Search parameters.
     * @param conn The {@link RepositoryConnection} to use for look up.
     * @return The {@link PaginatedSearchResults} of the users with the counts of merge requests they have created
     */
    PaginatedSearchResults<UserCount> getCreators(PaginatedSearchParams params, RepositoryConnection conn);

    /**
     * Returns a list of users that created {@link MergeRequest} instances with their counts and display names using the
     * provided {@link RepositoryConnection} filtered by the Merge Requests that the user with the provided IRI can
     * view.
     *
     * @param params Search parameters.
     * @param conn The {@link RepositoryConnection} to use for look up.
     * @param user The Resource IRI of the user making the request to filter based on permissions
     * @return The {@link PaginatedSearchResults} of the users with the counts of merge requests they have created
     */
    PaginatedSearchResults<UserCount> getCreators(PaginatedSearchParams params, RepositoryConnection conn,
                                                  Resource user);

    /**
     * Returns a list of users that are assigned {@link MergeRequest} instances with their counts and display names.
     *
     * @param params Search parameters.
     * @return The {@link PaginatedSearchResults} of the users with the counts of merge requests they are assigned
     */
    PaginatedSearchResults<UserCount> getAssignees(PaginatedSearchParams params);

    /**
     * Returns a list of users that are assigned {@link MergeRequest} instances with their counts and display names
     * filtered by the Merge Requests that the user with the provided IRI can view.
     *
     * @param params Search parameters.
     * @param user The Resource IRI of the user making the request to filter based on permissions
     * @return The {@link PaginatedSearchResults} of the users with the counts of merge requests they are assigned to
     */
    PaginatedSearchResults<UserCount> getAssignees(PaginatedSearchParams params, Resource user);

    /**
     * Returns a list of users that are assigned {@link MergeRequest} instances with their counts and display names
     * using the provided {@link RepositoryConnection}.
     *
     * @param params Search parameters.
     * @param conn The {@link RepositoryConnection} to use for look up.
     * @return The {@link PaginatedSearchResults} of the users with the counts of merge requests they are assigned to
     */
    PaginatedSearchResults<UserCount> getAssignees(PaginatedSearchParams params, RepositoryConnection conn);

    /**
     * Returns a list of users that are assigned {@link MergeRequest} instances with their counts and display names
     * using the provided {@link RepositoryConnection} filtered by the Merge Requests that the user with the provided
     * IRI can view.
     *
     * @param params Search parameters.
     * @param conn The {@link RepositoryConnection} to use for look up.
     * @param user The Resource IRI of the user making the request to filter based on permissions
     * @return The {@link PaginatedSearchResults} of the users with the counts of merge requests they are assigned to
     */
    PaginatedSearchResults<UserCount> getAssignees(PaginatedSearchParams params, RepositoryConnection conn,
                                                  Resource user);
}
