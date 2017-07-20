package org.matonto.catalog.api.versioning;

/*-
 * #%L
 * org.matonto.catalog.api
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


import org.matonto.catalog.api.ontologies.mcat.Branch;
import org.matonto.catalog.api.ontologies.mcat.Commit;
import org.matonto.catalog.api.ontologies.mcat.InProgressCommit;
import org.matonto.catalog.api.ontologies.mcat.VersionedRDFRecord;
import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.Resource;
import org.matonto.repository.api.RepositoryConnection;

import javax.annotation.Nullable;

public interface VersioningService<T extends VersionedRDFRecord> {
    /**
     * Retrieves the IRI of the type of {@link VersionedRDFRecord} this service versions.
     *
     * @return A IRI string of a subclass of VersionedRDFRecord
     */
    String getTypeIRI();

    /**
     * Retrieves the source {@link Branch} for a merge process identified by the provided Resource IDs.
     *
     * @param record The VersionedRDFRecord which has the Branch.
     * @param branchId The Resource identifying the Branch.
     * @param conn A RepositoryConnection to use for lookup.
     * @return The source Branch for a merge process
     */
    Branch getSourceBranch(T record, Resource branchId, RepositoryConnection conn);

    /**
     * Retrieves the target {@link Branch} for a commit or merge process identified by the provided Resource IDs.
     *
     * @param record The VersionedRDFRecord which has the Branch.
     * @param branchId The Resource identifying the Branch.
     * @param conn A RepositoryConnection to use for lookup.
     * @return The target Branch for a commit or merge process
     */
    Branch getTargetBranch(T record, Resource branchId, RepositoryConnection conn);

    /**
     * Retrieves the head {@link Commit} of the provided {@link Branch}. Returns null if the Branch has no head Commit.
     *
     * @param branch The Branch which has a head Commit.
     * @param conn A RepositoryConnection to use for lookup.
     * @return The head Commit of the Branch; null if it does not have one set
     */
    Commit getBranchHeadCommit(Branch branch, RepositoryConnection conn);

    /**
     * Gets the {@link InProgressCommit} of the {@link User} and the {@link VersionedRDFRecord} identified by the
     * provided Resource.
     *
     * @param recordId The Resource identifying the Record with the InProgressCommit.
     * @param user The User with the InProgressCommit
     * @param conn A RepositoryConnection to use for lookup.
     * @return The InProgressCommit of the User for the VersionedRDFRecord
     */
    InProgressCommit getInProgressCommit(Resource recordId, User user, RepositoryConnection conn);

    /**
     * Creates a {@link Commit} using the provided {@link InProgressCommit} and message whose parents are the passed
     * base and auxiliary {@link Commit Commits}.
     *
     * @param commit The InProgressCommit which is the basis for the created Commit.
     * @param message The String with the message text associated with the Commit.
     * @param baseCommit The base Commit for the created Commit. Used for associating the Revisions as well.
     * @param auxCommit The auxiliary Commit for the created Commit. Used for associating the Revisions as well.
     * @return Commit created based on the provided InProgressCommit with the message metadata.
     * @throws IllegalArgumentException If a auxiliary commit is passed, but not a base commit
     */
    Commit createCommit(InProgressCommit commit, String message, @Nullable Commit baseCommit,
                        @Nullable Commit auxCommit);

    /**
     * Adds the provided {@link Commit} to the provided {@link Branch}, updating the head Commit. NOTE: This method
     * is intended to be used for existing InProgressCommits and assumes the additions and deletions statements already
     * exist in the Repository.
     *
     * @param branch The Branch which will get the new Commit.
     * @param commit The Commit to add to the Branch.
     * @param conn A RepositoryConnection to use for lookup.
     */
    void addCommit(Branch branch, Commit commit, RepositoryConnection conn);

    /**
     * Adds a new {@link Commit} to the provided {@link Branch} created for the provided {@link User} using the provided
     * message, addition and deletion {@link Model Models}, and base and auxiliary Commits. NOTE: This method is
     * intended to be used with merges and assumes no commit or revision data exists in the Repository.
     *
     * @param branch The Branch which will get the new Commit.
     * @param user The User who will be associated with the new Commit.
     * @param message The String with the message text associated with the Commit.
     * @param additions The statements which were added to the named graph.
     * @param deletions The statements which were deleted from the named graph.
     * @param baseCommit The base Commit for the newCommit.
     * @param auxCommit The auxiliary Commit for the newCommit.
     * @param conn A RepositoryConnection to use for lookup.
     * @return The Resource identifying the new Commit.
     */
    Resource addCommit(Branch branch, User user, String message, Model additions, Model deletions,
                       @Nullable Commit baseCommit, @Nullable Commit auxCommit, RepositoryConnection conn);

    /**
     * Removes the provided {@link InProgressCommit} from the Repository.
     *
     * @param commit The InProgressCommit which will be removed.
     * @param conn A RepositoryConnection to use for lookup.
     */
    void removeInProgressCommit(InProgressCommit commit, RepositoryConnection conn);
}
