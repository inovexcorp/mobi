package org.matonto.catalog.api;

/*-
 * #%L
 * org.matonto.catalog.api
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

import org.matonto.catalog.api.builder.DistributionConfig;
import org.matonto.catalog.api.builder.RecordConfig;
import org.matonto.catalog.api.ontologies.mcat.*;
import org.matonto.jaas.ontologies.usermanagement.User;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.orm.OrmFactory;

import java.util.*;

public interface CatalogManager {

    /**
     * Retrieves the Catalog containing the published Records.
     *
     * @return The Catalog object which contains the published Records.
     */
    Catalog getPublishedCatalog();

    /**
     * Retrieves the Catalog containing the unpublished Records.
     *
     * @return The Catalog object which contains the unpublished Records.
     */
    Catalog getUnpublishedCatalog();

    /**
     * Searches the provided Catalog for Records that match the provided PaginatedSearchParams.
     *
     * @param catalogId The Resource identifying the Catalog to find the Records in.
     * @param searchParams Search parameters.
     * @return The PaginatedSearchResults for a page matching the search criteria.
     */
    PaginatedSearchResults<Record> findRecord(Resource catalogId, PaginatedSearchParams searchParams);

    /**
     * Gets a Set of all Resources identifying Records which exist within the Catalog identified by the provided
     * Resource.
     *
     * @param catalogId The Resource identifying the Catalog that you would like to get the Records from.
     * @return The Set of all Records contained within the Catalog identified by the provided Resource.
     */
    Set<Resource> getRecordIds(Resource catalogId);

    /**
     * Creates an Object that extends Record using provided RecordBuilder and Factory.
     *
     * @param config The RecordConfig containing the Record's metadata.
     * @param factory The OrmFactory for creating the entity.
     * @param <T> The type of Record that you wish to create.
     * @return The Record Object of type T consisting of all the provided metadata.
     */
    <T extends Record> T createRecord(RecordConfig config, OrmFactory<T> factory);

    /**
     * Adds a Record to the provided Catalog object.
     *
     * @param catalogId The Resource identifying the catalog to add the Record to.
     * @param record The Object which extends Record to add to the Catalog.
     * @return True if the Record was successfully added; otherwise, false.
     */
    boolean addRecord(Resource catalogId, Record record);

    /**
     * Uses the provided Record to find the Resource of the existing Record and replaces it.
     *
     * @param catalogId The Resource identifying the catalog which contains desired Record.
     * @param newRecord The Record with the desired changes.
     * @return True if the Record was successfully updated; otherwise, false.
     */
    boolean updateRecord(Resource catalogId, Record newRecord);

    /**
     * Removes the Record from the provided Catalog.
     *
     * @param catalogId The Resource identifying the catalog which contains the record you want to remove.
     * @param recordId The Resource identifying the Record which you want to remove.
     * @return True if the Record was successfully removed; otherwise, false.
     */
    boolean removeRecord(Resource catalogId, Resource recordId);

    /**
     * Gets the Record from the provided Catalog.
     *
     * @param catalogId The Resource identifying the catalog which optionally contains the Record you want to get.
     * @param recordId The Resource identifying the Record you want to get.
     * @return An Optional with a Record with the recordId if it was found
     */
    Optional<Record> getRecord(Resource catalogId, Resource recordId);

    /**
     * Creates a Distribution with the provided metadata.
     *
     * @param config The DistributionConfig which contains the needed metadata to create the Distribution.
     * @return Distribution created with the provided metadata.
     */
    Distribution createDistribution(DistributionConfig config);

    /**
     * Adds the provided Distribution to the UnversionedResource identified by the provided Resource.
     *
     * @param distribution The Distribution to add to the UnversionedResource.
     * @param unversionedRecordId The Resource identifying the UnversionedRecord which will get a new Distribution.
     * @return True if the Distribution was successfully added; otherwise, false.
     */
    boolean addDistributionToUnversionedRecord(Distribution distribution, Resource unversionedRecordId);

    /**
     * Adds the provided Distribution to the Version identified by the provided Resource.
     *
     * @param distribution The Distribution to add to the Version.
     * @param versionId The Resource identifying the Version which will get a new Distribution.
     * @return True if the Distribution was successfully added; otherwise, false.
     */
    boolean addDistributionToVersion(Distribution distribution, Resource versionId);

    /**
     * Uses the Distribution provided to find the Resource of the existing Distribution to update.
     *
     * @param newDistribution The Distribution with the desired changes.
     * @return True if the Distribution was successfully updated; otherwise, false.
     */
    boolean updateDistribution(Distribution newDistribution);

    /**
     * Removes the Distribution with the provided distributionId from the provided UnversionedRecord.
     *
     * @param distributionId The Resource identifying the Distribution you want to remove.
     * @param unversionedRecordId The Resource identifying the UnversionedRecord to remove the Distribution from.
     * @return True if the Distribution was successfully removed; otherwise, false.
     */
    boolean removeDistributionFromUnversionedRecord(Resource distributionId, Resource unversionedRecordId);

    /**
     * Removes the Distribution with the provided distributionId from the provided Version.
     *
     * @param distributionId The Resource identifying the Distribution you want to remove.
     * @param versionId The Resource identifying the Version to remove the Distribution from.
     * @return True if the Distribution was successfully removed; otherwise, false.
     */
    boolean removeDistributionFromVersion(Resource distributionId, Resource versionId);

    /**
     * Gets the Distribution identified by the provided Resource.
     *
     * @param distributionId The Resource identifying the Distribution you want to get.
     * @return An Optional of the Distribution if it exists.
     */
    Optional<Distribution> getDistribution(Resource distributionId);

    /**
     * Creates an Object which extends Version with the provided metadata using the provided factory.
     *
     * @param title The title text.
     * @param description The description text.
     * @param factory The factory used to create T.
     * @param <T> An Object which extends Version.
     * @return Version created with the provided metadata.
     */
    <T extends Version> T createVersion(String title, String description, OrmFactory<T> factory);

    /**
     * Adds the provided Version to the provided VersionedRecord. This also updates the latestVersion to be this
     * Version.
     *
     * @param version The Version to add to the VersionedRecord.
     * @param versionedRecordId The Resource identifying the VersionedRecord which will get a new Version.
     * @return True if the Version was successfully added; otherwise, false.
     */
    boolean addVersion(Version version, Resource versionedRecordId);

    /**
     * Uses the Version provided to find the Resource of the existing Version to update.
     *
     * @param newVersion The Version with the desired changes.
     * @return True if the Version was successfully updated; otherwise, false.
     */
    boolean updateVersion(Version newVersion);

    /**
     * Removes the Version with the provided versionId from the provided VersionedRecord.
     *
     * @param versionId The Resource identifying the Version you want to remove.
     * @param versionedRecordId The Resource identifying the VersionedRecord to remove the Version from.
     * @return True if the Version was successfully removed; otherwise, false.
     */
    boolean removeVersion(Resource versionId, Resource versionedRecordId);

    /**
     * Gets the Version identified by the provided Resource.
     *
     * @param versionId The Resource identifying the Version you want to get.
     * @return An Optional of the Version if it exists.
     */
    Optional<Version> getVersion(Resource versionId);

    /**
     * Creates a Branch with the provided metadata.
     *
     * @param title The title text.
     * @param description The description text.
     * @return Branch created with the provided metadata.
     */
    Branch createBranch(String title, String description);

    /**
     * Adds the provided Branch to the provided VersinedRDFRecord.
     *
     * @param branch The Branch to add to the VersionedRDFRecord.
     * @param versionedRDFRecordId The Resource identifying the VersionedRDFRecord which will get a new Branch.
     * @return True if the Branch was successfully added; otherwise, false.
     */
    boolean addBranch(Branch branch, Resource versionedRDFRecordId);

    /**
     * Uses the Branch provided to find the Resource of the existing Branch to update.
     *
     * @param newBranch The Branch with the desired changes.
     * @return True if the Branch was successfully updated; otherwise, false.
     */
    boolean updateBranch(Branch newBranch);

    /**
     * Removes the Branch with the provided branchId from the provided VersionedRDFRecord.
     *
     * @param branchId The Resource identifying the Branch you want to remove.
     * @param versionedRDFRecordId The Resource identifying the VersionedRDFRecord to remove the Branch from.
     * @return True if the Branch was successfully removed; otherwise, false.
     */
    boolean removeBranch(Resource branchId, Resource versionedRDFRecordId);

    /**
     * Gets the Branch identified by the provided Resource.
     *
     * @param branchId The Resource identifying the Branch you want to get.
     * @return An Optional of the Branch if it exists.
     */
    Optional<Branch> getBranch(Resource branchId);

    /**
     * Creates a Commit from the provided InProgressCommit along with the message.
     *
     * @param inProgressCommit The InProgressCommit which is the basis for the created Commit.
     * @param message The String with the message text associated with the Commit.
     * @return Commit created based on the provided InProgressCommit with the message metadata.
     */
    Commit createCommit(InProgressCommit inProgressCommit, String message);

    /**
     * Creates an InProgressCommit which is a Commit that a User is actively working on. Once it is completed, the
     * InProgressCommit will be used to create a Commit with associated message.
     *
     * @param parents The Commit(s) that this InProgressCommit was informed by.
     * @param user The User that this InProgressCommit is associated with.
     * @param branchId The Resource identifying the Branch that this InProgressCommit is on.
     * @return Optional with an InProgressCommit created using the provided metadata if the identified branch exists.
     */
    Optional<InProgressCommit> createInProgressCommit(Set<Commit> parents, User user, Resource branchId);

    /**
     * Adds the provided statements to the provided Commit as additions. These statements were added and will be used
     * when creating the completed named graph.
     *
     * @param statements The statements which were added to the named graph.
     * @param commitId The Resource identifying the Commit that these statements are associated with.
     * @return True if the statements were successfully added to the correct named graph; otherwise, false.
     */
    boolean addAdditions(Model statements, Resource commitId);

    /**
     * Adds the provided statements to the provided Commit as deletions. These statements were deleted and will be used
     * when creating the completed named graph.
     *
     * @param statements The statements which were added to the named graph.
     * @param commitId The Resource identifying the Commit that these statements are associated with.
     * @return True if the statements were successfully added to the correct named graph; otherwise, false.
     */
    boolean addDeletions(Model statements, Resource commitId);

    /**
     * Adds the provided Commit to the Branch identified by the provided Resource in the Repository.
     *
     * @param commit The Commit to store in the Repository.
     * @param branchId The Resource identifying the Branch to add the Commit to.
     * @return True if the Commit was successfully added to the Branch; otherwise, false.
     */
    boolean addCommitToBranch(Commit commit, Resource branchId);

    /**
     * Adds the provided Commit to the Tag identified by the provided Resource in the Repository.
     *
     * @param commit The Commit to store in the Repository.
     * @param tagId The Resource identifying the Tag to add the Commit to.
     * @return True if the Commit was successfully added to the Branch; otherwise, false.
     */
    boolean addCommitToTag(Commit commit, Resource tagId);

    /**
     * Adds the provided InProgressCommit to the Repository.
     *
     * @param inProgressCommit The InProgressCommit to add to the Repository.
     * @return True if the InProgressCommit is successfully added to the Repository; otherwise, false.
     */
    boolean addInProgressCommit(InProgressCommit inProgressCommit);

    /**
     * Gets the Commit identified by the provided Resource.
     *
     * @param commitId The Resource identifying the Commit to get.
     * @return Commit identified by the provided Resource if it exists.
     */
    Optional<Commit> getCommit(Resource commitId);

    /**
     * Removes the InProgressCommit identified by the provided Resource.
     *
     * @param inProgressCommitId The Resource identifying the InProgressCommit to be removed.
     * @return True if the InProgressCommit was removed; otherwise, false.
     */
    boolean removeInProgressCommit(Resource inProgressCommitId);

    /**
     * Gets the commit chain (set of resources) which ends at the provided Commit.
     *
     * @param commitId The Resource identifying the Commit for the desired chain.
     * @return Set of Resources identifying the Commits which make up the commit chain for the provided Commit.
     */
    LinkedHashSet<Resource> getCommitChain(Resource commitId);

    /**
     * Gets the Model which represents the resource for the provided Commit.
     *
     * @param commitId The Resource identifying the Commit identifying the spot in the Resource's history that you wish
     *                 to retrieve.
     * @return Model which represents the Resource at the Commit's point in history.
     */
    Optional<Model> getCompiledResource(Resource commitId);

    /**
     * Gets all of the conflicts between the two provided Commits.
     *
     * @param leftId The left (first) Commit.
     * @param rightId The right (second) Commit.
     * @return Set of Conflicts
     */
    Set<Conflict> getConflicts(Resource leftId, Resource rightId);

    /**
     * Gets the Difference, consisting of Models of additions and deletions, made between the original and the changed
     * Model.
     *
     * @param original The original Model.
     * @param changed The changed Model.
     * @return The Difference between the two Models.
     */
    Difference getDiff(Model original, Model changed);
}
