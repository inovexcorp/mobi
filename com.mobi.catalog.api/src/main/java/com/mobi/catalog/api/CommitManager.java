package com.mobi.catalog.api;

/*-
 * #%L
 * com.mobi.catalog.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.repository.RepositoryConnection;

import java.io.File;
import java.util.List;
import java.util.Optional;
import javax.annotation.Nonnull;
import javax.annotation.Nullable;

public interface CommitManager {

    /**
     * Adds the provided Commit to the provided Branch, updating the head Commit in the process.
     *
     * @param branch The Branch which will get the new Commit.
     * @param commit The Commit to add to the Branch.
     * @param conn   A RepositoryConnection to use for lookup.
     * @throws IllegalArgumentException Thrown if the Commit already exists.
     */
    void addCommit(Branch branch, Commit commit, RepositoryConnection conn);

    /**
     * Adds the provided InProgressCommit to the repository for the VersionedRDFRecord identified by the provided
     * Resources.
     *
     * @param catalogId            The Resource identifying the Catalog which contains the Record.
     * @param versionedRDFRecordId The Resource identifying the VersionedRDFRecord which will get the new
     *                             InProgressCommit.
     * @param inProgressCommit     The InProgressCommit to add to the VersionedRDFRecord.
     * @param conn                 The RepositoryConnection to add the commit with.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or the InProgressCommit already exists
     *                                  in the repository.
     */
    void addInProgressCommit(Resource catalogId, Resource versionedRDFRecordId,
                             InProgressCommit inProgressCommit, RepositoryConnection conn);

    /**
     * Checks if a {@link Commit} exists in a {@link Branch} on a {@link VersionedRDFRecord}.
     *
     * @param recordId The {@link Resource} of the {@link VersionedRDFRecord} which should have the {@link Commit}.
     * @param commitId The {@link Resource} of the {@link Commit}.
     * @param conn     A RepositoryConnection to use for lookup.
     * @return {@code true} if the (@link Commit} {@link Resource} is in the commit chain of a {@link Branch} on the
     *      {@link VersionedRDFRecord} and {@code false} otherwise.
     */
    boolean commitInRecord(Resource recordId, Resource commitId, RepositoryConnection conn);

    /**
     * Creates a Commit from the provided InProgressCommit and message whose parents are the passed base and
     * auxiliary Commit. Does not update the underlying Revisions (handled by the VersioningServices).
     *
     * @param inProgressCommit The InProgressCommit which is the basis for the created Commit.
     * @param message          The String with the message text associated with the Commit.
     * @param baseCommit       The base Commit for the created Commit. Used for associating the Revisions as well.
     * @param auxCommit        The auxiliary Commit for the created Commit. Used for associating the Revisions as well.
     * @param masterCommit     Indicates if the new commit has a BaseCommit relation on Master. If so, does not populate
     *                         revision statements.
     * @return Commit created based on the provided InProgressCommit with the message metadata.
     * @throws IllegalArgumentException If a auxiliary commit is passed, but not a base commit
     */
    Commit createCommit(@Nonnull InProgressCommit inProgressCommit, @Nonnull String message, Commit baseCommit,
                        Commit auxCommit, boolean masterCommit);

    /**
     * Creates an InProgressCommit which is a Commit that a User is actively working on. Once it is completed, the
     * InProgressCommit will be used to create a Commit with a provided message.
     *
     * @param user The User that this InProgressCommit is associated with.
     * @return InProgressCommit created using the provided metadata.
     */
    InProgressCommit createInProgressCommit(User user);

    /**
     * Creates an InProgressCommit which is a Commit that a User is actively working on. Once it is completed, the
     * InProgressCommit will be used to create a Commit with a provided message.
     *
     * @param catalogId            The Resource identifying the Catalog which contains the Record.
     * @param versionedRDFRecordId The Resource identifying the VersionedRDFRecord which has the InProgressCommit.
     * @param user                 The User with the InProgressCommit.
     * @param additionsFile        A File containing additions triples
     * @param deletionsFile        A File containing deletions triples
     * @param conn                 A RepositoryConnection to use for lookup.
     * @return InProgressCommit created using the provided metadata.
     */
    InProgressCommit createInProgressCommit(Resource catalogId, Resource versionedRDFRecordId, User user,
                                            @Nullable File additionsFile, @Nullable File deletionsFile,
                                            RepositoryConnection conn);

    /**
     * Gets the Commit identified by the provided Resource. The Model backing the commit will contain all the data in
     * the commit named graph. This includes the commit and revision metadata.
     *
     * @param commitId The Resource identifying the Commit to get.
     * @param conn
     * @return The Commit if it exists.
     * @throws IllegalStateException Thrown if the Commit could not be found.
     */
    Optional<Commit> getCommit(Resource commitId, RepositoryConnection conn);

    /**
     * Gets the Commit identified by the provided Resources. Returns an empty Optional if the Commit does not belong to
     * the Branch. The Model backing the commit will contain all the data in the commit named graph. This includes the
     * commit and revision metadata.
     *
     * @param catalogId            The Resource identifying the Catalog which contains the Record.
     * @param versionedRDFRecordId The Resource identifying the VersionedRDFRecord which has the Branch.
     * @param branchId             The Resource identifying the Branch which has the Commit.
     * @param commitId             The Resource identifying the Commit to get.
     * @param conn
     * @return The Commit if it exists.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or the Branch does not belong to the
     *                                  Record.
     * @throws IllegalStateException    Thrown if the Branch could not be found, the Branch does not have a head Commit,
     *                                  or the Commit could not be found.
     */
     Optional<Commit> getCommit(Resource catalogId, Resource versionedRDFRecordId, Resource branchId, Resource commitId,
                               RepositoryConnection conn);

    /**
     * Gets a List of Commits ordered by date descending within the repository. The Commit identified by the provided
     * Resource is the first item in the List and it was informed by the previous Commit in the List. This association
     * is repeated until you get to the beginning of the List. The resulting List can then be thought about the chain of
     * Commits on a Branch starting with the Commit identified by the provided Resource.
     *
     * @param commitId The Resource identifying the Commit for the desired chain.
     * @param conn     A RepositoryConnection for lookup.
     * @return List of Commits which make up the commit chain for the provided Commit.
     * @throws IllegalArgumentException Thrown if any of the Commits could not be found.
     */
    List<Commit> getCommitChain(Resource commitId, RepositoryConnection conn);

    /**
     * Gets a List of Commits ordered by date descending within the repository. The Commit identified by the first
     * provided Resource is the first item in the List and it was informed by the previous Commit in the List. This
     * association is repeated until you get to the second Resource which is beginning of the List. The resulting List
     * can then be thought about the chain of Commits starting with the Commit identified by the first provided Resource
     * and ending with the second provided Resource.
     *
     * @param commitId The Resource identifying the Commit for the desired chain.
     * @param targetId The Resource identifying the Commit to terminate the chain.
     * @param conn     A RepositoryConnection for lookup.
     * @return List of Commits which make up the commit chain for the provided Commit.
     * @throws IllegalArgumentException Thrown if any of the Commits could not be found.
     */
    List<Commit> getCommitChain(Resource commitId, Resource targetId, RepositoryConnection conn);

    /**
     * Gets a List of Commits ordered by date descending within the repository starting with the head Commit of the
     * Branch identified by the provided Resources. The head Commit is the first one in the List and it was informed
     * by the previous Commit in the List. This association is repeated until you get to the beginning of the List. The
     * resulting List can then be thought as the chain of Commits on the Branch starting with the head Commit.
     *
     * @param catalogId            The Resource identifying the Catalog which contains the Record.
     * @param versionedRDFRecordId The Resource identifying the VersionedRDFRecord which has the Branch.
     * @param branchId             The Resource identifying the Branch with the chain of Commit.
     * @param conn                 A RepositoryConnection for lookup.
     * @return List of Commits which make up the commit chain for the head Commit of the Branch.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, the Branch could not be found, or any of
     *                                  the Commits could not be found.
     * @throws IllegalStateException    Thrown if the Branch does not have a head Commit.
     */
    List<Commit> getCommitChain(Resource catalogId, Resource versionedRDFRecordId, Resource branchId,
                                RepositoryConnection conn);

    /**
     * Gets a List which represents the commit chain from the initial commit to the specified commit in either
     * ascending or descending date order.
     *
     * @param commitId The Resource identifying the Commit that you want to get the chain for.
     * @param conn     The RepositoryConnection which will be queried for the Commits.
     * @param asc      Whether or not the List should be ascending by date
     * @return List of Resource ids for the requested Commits.
     */
    List<Resource> getCommitChain(Resource commitId, boolean asc, RepositoryConnection conn);

    /**
     * Gets a List of Commits ordered by date descending within the repository. The Commit identified by the first
     * provided Resource is the first item in the List and it was informed by the previous Commit in the List. Each
     * addition or deletion of a Commit is then compared to the Entity IRI and removes graphs that don't contain the
     * entityId. The resulting List can then be thought as the chain of Commits starting with the
     * Commit identified by the first provided Resource filtered to those containing the Entity IRI.
     *
     * @param commitId The Resource identifying the Commit for the desired chain.
     * @param entityId The Resource identifying the Entity to filter the chain of Commit.
     * @param conn     A RepositoryConnection for lookup.
     * @return List of Commits which make up the commit chain for the provided Commit.
     * @throws IllegalArgumentException Thrown if any of the Commits could not be found.
     */
    List<Commit> getCommitEntityChain(Resource commitId, Resource entityId, RepositoryConnection conn);

    /**
     * Gets a List of Commits ordered by date descending within the repository starting with the head Commit of the
     * Branch identified by the provided Resources. The head Commit is the first one in the List and it was informed
     * by the previous Commit in the List. This association is repeated until you get to the second Resource which is
     * beginning of the List. Each addition or deletion of a Commit is then compared to the Entity IRI and removes
     * graphs that don't contain the entityId. The resulting List can then be thought as the chain of Commits on the
     * Branch starting with the head Commit. That list is then filtered by an Entity IRI resulting in Commits containing
     * the Entity IRI in the additions or deletions of a Commit.
     *
     * @param catalogId The Resource identifying the Catalog which contains the Record.
     * @param targetId  The Resource identifying the Commit to terminate the chain.
     * @param entityId  The Resource identifying the Entity to filter the chain of Commit.
     * @param conn      A RepositoryConnection for lookup.
     * @return List of Commits which make up the commit chain for the provided Commit and Entity IRI.
     * @throws IllegalArgumentException Thrown if any of the Commits could not be found.
     */
    List<Commit> getCommitEntityChain(Resource catalogId, Resource targetId, Resource entityId,
                                      RepositoryConnection conn);

    /**
     * Gets the list of commits between the HEAD of a branch and the HEAD of a target branch.
     *
     * @param catalogId            The Resource identifying the Catalog which contains the Record.
     * @param versionedRDFRecordId The Resource identifying the VersionedRDFRecord which has the Branch.
     * @param sourceBranchId       The Resource identifying the Branch with the chain of Commit.
     * @param targetBranchId       The Resource identifying the target Branch
     * @param conn                 A RepositoryConnection for lookup.
     * @return List of Commits between the HEAD of the source branch and the HEAD of the target branch
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, the Branch could not be found, or any of
     *                                  the Commits could not be found.
     * @throws IllegalStateException    Thrown if either Branch does not have a head Commit or if the commit history
     *                                  does not have a common parent.
     */
    List<Commit> getDifferenceChain(Resource catalogId, Resource versionedRDFRecordId, Resource sourceBranchId,
                                    Resource targetBranchId, RepositoryConnection conn);

    /**
     * Gets the commit chain between two commits, i.e. the list of commits between {@code sourceCommitId} and
     * {@code targetCommitId} in the order specified.
     *
     * @param sourceCommitId Source commit
     * @param targetCommitId Target commit
     * @param asc            Sort in ascending order (earliest to latest).
     * @param conn           Repo connection
     * @return Commit chain between two commits
     * @throws IllegalArgumentException Thrown if either Commit could not be found or the Commits have no common parent.
     * @throws IllegalStateException    Thrown if a Commit in either chain does not have the additions/deletions set.
     */
    List<Resource> getDifferenceChain(Resource sourceCommitId, Resource targetCommitId, boolean asc,
                                      RepositoryConnection conn);

    /**
     * Gets the head Commit of the Branch identified by the provided Resources.
     *
     * @param catalogId            The Resource identifying the Catalog which contains the Record.
     * @param versionedRDFRecordId The Resource identifying the VersionedRDFRecord which has the Branch.
     * @param branchId             The Resource identifying the Branch which has the head Commit.
     * @param conn                 A RepositoryConnection to use for lookup.
     * @return The head Commit if it exists
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or the Branch does not belong to the
     *                                  Record.
     * @throws IllegalStateException    Thrown if the Branch could not be found, the Branch does not have a head Commit
     *                                  or the Commit could not be found.
     */
    Commit getHeadCommit(Resource catalogId, Resource versionedRDFRecordId, Resource branchId, RepositoryConnection conn);

    /**
     * Gets an Optional of the head Commit of the provided Branch.
     *
     * @param branch The Branch to retrieve the head commit from.
     * @param conn   A RepositoryConnection to use for lookup.
     * @return An Optional of the head Commit for the provided Branch.
     */
    Optional<Commit> getHeadCommitFromBranch(Branch branch, RepositoryConnection conn);

    /**
     * Retrieves the IRI of the head Commit of the provided Branch. Throws an IllegalStateException if the Branch does
     * not have a head Commit set.
     *
     * @param branch A Branch with a head Commit
     * @return The Resource ID of the head Commit
     * @throws IllegalStateException Thrown if the Branch does not have a head Commit set.
     */
    Resource getHeadCommitIRI(Branch branch);

    /**
     * Retrieves an InProgressCommit identified by the provided Record Resource and User Resource.
     *
     * @param recordId The Resource identifying the Record with the InProgressCommit.
     * @param userId   The Resource identifying the User with the InProgressCommit.
     * @param conn     A RepositoryConnection to use for lookup.
     * @return The identified InProgressCommit.
     * @throws IllegalArgumentException Thrown if the InProgressCommit could not be found.
     */
    InProgressCommit getInProgressCommit(Resource recordId, Resource userId, RepositoryConnection conn);

    /**
     * Retrieves an InProgressCommit identified by the provided Resources.
     *
     * @param catalogId The Resource identifying the Catalog with the Record.
     * @param recordId  The Resource identifying the Record with the InProgressCommit.
     * @param commitId  The Resource identifying the InProgressCommit.
     * @param conn      A RepositoryConnection to use for lookup.
     * @return The identified InProgressCommit.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, the InProgressCommit could not be found, or the InProgressCommit
     *                                  does not belong to the Record.
     * @throws IllegalStateException    Thrown if the InProgressCommit has no Record set.
     */
    InProgressCommit getInProgressCommit(Resource catalogId, Resource recordId, Resource commitId,
                                         RepositoryConnection conn);

    /**
     * Gets the InProgressCommit for the provided User for the VersionedRDFRecord identified by the provided Resources
     * and User. Returns an empty Optional if there is no InProgressCommit for the Record and User.
     *
     * @param catalogId            The Resource identifying the Catalog which contains the Record.
     * @param versionedRDFRecordId The Resource identifying the VersionedRDFRecord which has the InProgressCommit.
     * @param user                 The User with the InProgressCommit.
     * @param conn
     * @return The InProgressCommit if it exists
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, or the
     *                                  Record does not belong to the Catalog.
     * @throws IllegalStateException    Thrown if the InProgressCommit could not be found.
     */
    Optional<InProgressCommit> getInProgressCommitOpt(Resource catalogId, Resource versionedRDFRecordId, User user,
                                                      RepositoryConnection conn);

    /**
     * Gets a List of InProgressCommits for the provided User. Returns an empty List if there are no InProgressCommits
     * for provided User.
     *
     * @param user The User with an InProgressCommit.
     * @param conn
     * @return The List of InProgressCommits associated with the user.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found.
     * @throws IllegalStateException    Thrown if the InProgressCommit could not be found.
     */
    List<InProgressCommit> getInProgressCommits(User user, RepositoryConnection conn);

    /**
     * Gets the Commit of the Tag identified by the provided Resources.
     *
     * @param catalogId         The Resource identifying the Catalog which contains the Record.
     * @param versionedRecordId The Resource identified the VersionedRecord which has the Tag.
     * @param tagId             The Resource identifying the Tag which has the Commit.
     * @param conn
     * @return The Commit of the Tag if it exists.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or the Tag does not belong to the Record.
     * @throws IllegalStateException    Thrown if the Version could not be found, the Tag does not have a Commit,
     *                                  or the Commit could not be found.
     */
    Commit getTaggedCommit(Resource catalogId, Resource versionedRecordId, Resource tagId, RepositoryConnection conn);

    /**
     * Removes the InProgressCommit identified by the provided Resources and User.
     *
     * @param catalogId            The Resource identifying the Catalog which contains the Record.
     * @param versionedRDFRecordId The Resource identifying the VersionedRDFRecord which has the InProgressCommit.
     * @param user                 The User with the InProgressCommit.
     * @param conn
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or the InProgressCommit could not be
     *                                  found
     */
    void removeInProgressCommit(Resource catalogId, Resource versionedRDFRecordId, User user,
                                RepositoryConnection conn);

    /**
     * Removes the InProgressCommit identified by the provided Resource.
     *
     * @param inProgressCommitId The Resource identifying the InProgressCommit.
     * @param conn
     * @throws IllegalArgumentException Thrown if the InProgressCommit could not be found.
     */
    void removeInProgressCommit(Resource inProgressCommitId, RepositoryConnection conn);

    /**
     * Removes the provided InProgressCommit from the Repository. Removes the delta named graphs of the InProgressCommit
     * if they are not referenced elsewhere.
     *
     * @param commit The InProgressCommit to remove.
     * @param conn   A RepositoryConnection to use for lookup.
     */
    void removeInProgressCommit(InProgressCommit commit, RepositoryConnection conn);

    /**
     * Adds the provided addition and deletion Models to the provided Commit.
     *
     * @param commit    The Commit which will get the changes.
     * @param additions The statements which were added to the named graph.
     * @param deletions The statements which were deleted from the named graph.
     * @param conn      A RepositoryConnection to use for lookup.
     * @throws IllegalStateException Thrown if the Commit has no addition or deletion graph.
     */
    void updateCommit(Commit commit, Model additions, Model deletions, RepositoryConnection conn);

    /**
     * Updates the InProgressCommit identified by the provided Resources using the provided addition and deletion
     * statements. These statements were added and deleted respectively and will be used when creating the completed
     * named graph.
     *
     * @param catalogId            The Resource identifying the Catalog which contains the Record.
     * @param versionedRDFRecordId The Resource identifying the VersionedRDFRecord which has the InProgressCommit.
     * @param commitId             The Resource identifying the InProgressCommit you want to update.
     * @param additions            The statements which were added to the named graph.
     * @param deletions            The statements which were added to the named graph.
     * @param conn
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or the InProgressCommit could not be
     *                                  found.
     * @throws IllegalStateException    Thrown if the InProgressCommit does not have the additions/deletions set.
     */
    void updateInProgressCommit(Resource catalogId, Resource versionedRDFRecordId, Resource commitId,
                                @Nullable Model additions, @Nullable Model deletions, RepositoryConnection conn);

    /**
     * Updates the InProgressCommit identified by the provided Resources and User using the provided addition and
     * deletion statements. These statements were added and deleted respectively and will be used when creating the
     * completed named graph. If the User does not have an InProgressCommit, one will be created with the addition and
     * deletion statements.
     *
     * @param catalogId            The Resource identifying the Catalog which contains the Record.
     * @param versionedRDFRecordId The Resource identifying the VersionedRDFRecord which has the InProgressCommit.
     * @param user                 The User with the InProgressCommit.
     * @param additions            The statements which were added to the named graph.
     * @param deletions            The statements which were added to the named graph.
     * @param conn
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog
     * @throws IllegalStateException    Thrown if the InProgressCommit does not have the additions/deletions set.
     */
    void updateInProgressCommit(Resource catalogId, Resource versionedRDFRecordId, User user, @Nullable Model additions,
                                @Nullable Model deletions, RepositoryConnection conn);

    /**
     * Validates the existence of a Commit on a Branch of a VersionedRDFRecord.
     *
     * @param catalogId The {@link Resource} identifying the {@link Catalog} which should have the {@link Record}.
     * @param recordId  The {@link Resource} identifying the {@link Record} which should have the {@link Branch}.
     * @param branchId  The {@link Resource} of the {@link Branch} which should have the {@link Commit}.
     * @param commitId  The {@link Resource} of the {@link Commit}.
     * @param conn      A RepositoryConnection to use for lookup.
     * @throws IllegalArgumentException Thrown if the {@link Catalog} could not be found, the {@link Record} could not
     *                                  be found, the {@link Record} does not belong to the {@link Catalog}, the {@link Branch} does not belong to
     *                                  the {@link Record}, or the {@link Commit} does not belong to the {@link Branch}.
     */
    void validateCommitPath(Resource catalogId, Resource recordId, Resource branchId, Resource commitId,
                            RepositoryConnection conn);
}
