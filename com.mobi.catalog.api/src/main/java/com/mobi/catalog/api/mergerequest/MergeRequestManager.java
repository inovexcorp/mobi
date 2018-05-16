package com.mobi.catalog.api.mergerequest;

/*-
 * #%L
 * com.mobi.catalog.api
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

import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.ontologies.mergerequests.MergeRequest;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.rdf.api.Resource;
import com.mobi.repository.api.RepositoryConnection;

import java.util.List;
import java.util.Optional;

public interface MergeRequestManager {
    /**
     * Gets the {@link List} of all {@link MergeRequest}s in Mobi that match the provided parameters.
     *
     * @param params The {@link MergeRequestFilterParams} to filter the MergeRequests by
     * @param conn A RepositoryConnection to use for lookup
     * @return The {@link List} of all matching {@link MergeRequest}s
     */
    List<MergeRequest> getMergeRequests(MergeRequestFilterParams params, RepositoryConnection conn);

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
     * Stores the provided {@link MergeRequest} in the repository as long as it does not already exist.
     *
     * @param request A {@link MergeRequest} to add to the repository
     * @param conn A RepositoryConnection to use for lookup
     * @throws IllegalArgumentException If the provided {@link MergeRequest} already exists in the repository
     */
    void addMergeRequest(MergeRequest request, RepositoryConnection conn);

    /**
     * Gets the {@link MergeRequest} identified by the provided {@link Resource}.
     *
     * @param requestId The {@link Resource} identifying a {@link MergeRequest}
     * @param conn A RepositoryConnection to use for lookup
     * @return The {@link MergeRequest} if it exists.
     */
    Optional<MergeRequest> getMergeRequest(Resource requestId, RepositoryConnection conn);

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
     * @param conn A RepositoryConnection to use for lookup
     */
    void deleteMergeRequestsWithRecordId(Resource recordId, RepositoryConnection conn);

    /**
     * Updates any existing MergeRequest that references the provided branchId that is being removed. If a deleted
     * branch is the target of an open MergeRequest, the target will be removed from the MergeRequest. If a deleted
     * branch is the source of an open MergeRequest, the MergeRequest will be deleted.
     *
     * @param recordId A Resource of the recordId representing a VersionedRDFRecord
     * @param branchId A Resource of the branchId representing a deleted Branch
     * @param conn A RepositoryConnection to use for lookup
     */
    void cleanMergeRequests(Resource recordId, Resource branchId, RepositoryConnection conn);
}
