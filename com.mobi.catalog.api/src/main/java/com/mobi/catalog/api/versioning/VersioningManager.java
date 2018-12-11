package com.mobi.catalog.api.versioning;

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
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.repository.api.RepositoryConnection;

public interface VersioningManager {
    /**
     * Commits the provided addition and deletion {@link Model Models} for the provided {@link User} to
     * the {@link Branch} identified by the provided Resource IDs with the
     * provided message.
     *
     * @param catalogId The Resource identifying the Catalog which contains the Record.
     * @param recordId The Resource identifying the VersionedRDFRecord which has the Branch.
     * @param branchId The Resource identifying the Branch which will get the new Commit.
     * @param user The User which will be associated with the new Commit.
     * @param message The String with the message text associated with the new Commit.
     * @param additions The statements which were added to the named graph.
     * @param deletions The statements which were added to the named graph.
     * @return The Resource of the new Commit.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *      Record does not belong to the Catalog, or the Branch could not be found.
     */
    Resource commit(Resource catalogId, Resource recordId, Resource branchId, User user,
                                                   String message, Model additions, Model deletions);

    /**
     * Commits the provided addition and deletion {@link Model Models} for the provided {@link User} to
     * the {@link Branch} identified by the provided Resource IDs with the
     * provided message.
     *
     * @param catalogId The Resource identifying the Catalog which contains the Record.
     * @param recordId The Resource identifying the VersionedRDFRecord which has the Branch.
     * @param branchId The Resource identifying the Branch which will get the new Commit.
     * @param user The User which will be associated with the new Commit.
     * @param message The String with the message text associated with the new Commit.
     * @param additions The statements which were added to the named graph.
     * @param deletions The statements which were added to the named graph.
     * @param conn A RepositoryConnection used by the VersioningService.
     * @return The Resource of the new Commit.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *      Record does not belong to the Catalog, or the Branch could not be found.
     */
    Resource commit(Resource catalogId, Resource recordId, Resource branchId, User user,
                    String message, Model additions, Model deletions, RepositoryConnection conn);

    /**
     * Commits the {@link InProgressCommit} for the provided {@link User} to
     * the {@link Branch} identified by the provided Resource IDs with the
     * provided message.
     *
     * @param catalogId The Resource identifying the Catalog which contains the Record.
     * @param recordId The Resource identifying the VersionedRDFRecord which has the Branch.
     * @param branchId The Resource identifying the Branch which will get the new Commit.
     * @param user The User with the InProgressCommit.
     * @param message The String with the message text associated with the new Commit.
     * @return The Resource of the new Commit.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *      Record does not belong to the Catalog, the Branch could not be found, or the InProgress could not be found.
     */
    Resource commit(Resource catalogId, Resource recordId, Resource branchId, User user, String message);

    /**
     * Commits the {@link InProgressCommit} for the provided {@link User} to
     * the {@link Branch} identified by the provided Resource IDs with the
     * provided message.
     *
     * @param catalogId The Resource identifying the Catalog which contains the Record.
     * @param recordId The Resource identifying the VersionedRDFRecord which has the Branch.
     * @param branchId The Resource identifying the Branch which will get the new Commit.
     * @param user The User with the InProgressCommit.
     * @param message The String with the message text associated with the new Commit.
     * @param conn A RepositoryConnection used by the VersioningService.
     * @return The Resource of the new Commit.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *      Record does not belong to the Catalog, the Branch could not be found, or the InProgress could not be found.
     */
    Resource commit(Resource catalogId, Resource recordId, Resource branchId, User user, String message,
                    RepositoryConnection conn);

    /**
     * Merges a {@link Branch} identified by the provided Resources into
     * another Branch identified by the provided Resources. Both Branches must belong to the same
     * {@link VersionedRDFRecord}. The provided addition and deletion
     * {@link Model Models} should resolve any conflicts and will be used to create the merge
     * {@link Commit} which will be associated with the provided {@link User}.
     * The head of the target Branch will be the new merge Commit, but the head of the source Branch will not change.
     *
     * @param catalogId The Resource identifying the Catalog which contains the Record.
     * @param recordId The Resource identifying the VersionedRDFRecord which has the Branches.
     * @param sourceBranchId The Resource identifying the source Branch which will merge into the target Branch.
     * @param targetBranchId The Resource identifying the target Branch which will be merged into by the source Branch.
     * @param user The User with the InProgressCommit.
     * @param additions The statements which were added to the named graph.
     * @param deletions The statements which were deleted from the named graph.
     * @return The Resource of the new merge Commit.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *      Record does not belong to the Catalog, or either Branch could not be found
     */
    Resource merge(Resource catalogId, Resource recordId, Resource sourceBranchId, Resource targetBranchId, User user,
                   Model additions, Model deletions);

    /**
     * Merges a {@link Branch} identified by the provided Resources into
     * another Branch identified by the provided Resources. Both Branches must belong to the same
     * {@link VersionedRDFRecord}. The provided addition and deletion
     * {@link Model Models} should resolve any conflicts and will be used to create the merge
     * {@link Commit} which will be associated with the provided {@link User}.
     * The head of the target Branch will be the new merge Commit, but the head of the source Branch will not change.
     *
     * @param catalogId The Resource identifying the Catalog which contains the Record.
     * @param recordId The Resource identifying the VersionedRDFRecord which has the Branches.
     * @param sourceBranchId The Resource identifying the source Branch which will merge into the target Branch.
     * @param targetBranchId The Resource identifying the target Branch which will be merge into by the source Branch.
     * @param user The User with the InProgressCommit.
     * @param additions The statements which were added to the named graph.
     * @param deletions The statements which were deleted from the named graph.
     * @param conn A RepositoryConnection used by the VersioningService.
     * @return The Resource of the new merge Commit.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *      Record does not belong to the Catalog, or either Branch could not be found
     */
    Resource merge(Resource catalogId, Resource recordId, Resource sourceBranchId, Resource targetBranchId, User user,
                   Model additions, Model deletions, RepositoryConnection conn);
}
