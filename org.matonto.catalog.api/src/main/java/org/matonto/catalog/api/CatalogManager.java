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

import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.Resource;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

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
     * Retrieves a set of all the Records contained within the provided Catalog object.
     *
     * @param catalog The Catalog object with the desired Records.
     * @return The Set of Records within the provided Catalog.
     */
    Set<Record> getRecords(Catalog catalog);

    /**
     * Searches the provided Catalog for Records that match the provided PaginatedSearchParams.
     *
     * @param catalog The Catalog object to find the Records.
     * @param searchParams Search parameters.
     * @return The PaginatedSearchResults for a page matching the search criteria.
     */
    PaginatedSearchResults<Record> findRecord(Catalog catalog, PaginatedSearchParams searchParams);

    /**
     * Creates an UnversionedRecord with the provided metadata.
     *
     * @param title The title text.
     * @param description The description text.
     * @param identifier The identifying text.
     * @param keywords The associated keywords.
     * @param publishers The publishers.
     * @return An UnversionedRecord consisting of all the provided metadata.
     */
    UnversionedRecord createUnversionedRecord(String title, String description, String identifier, Set<String> keywords,
                                   Set<User> publishers);

    /**
     * Creates a VersionedRecord with the provided metadata.
     *
     * @param title The title text.
     * @param description The description text.
     * @param identifier The identifying text.
     * @param keywords The associated keywords.
     * @param publishers The publishers.
     * @return A VersionedRecord consisting of all the provided metadata.
     */
    VersionedRecord createVersionedRecord(String title, String description, String identifier, Set<String> keywords,
                                              Set<User> publishers);

    /**
     * Creates an OntologyRecord with the provided metadata.
     *
     * @param title The title text.
     * @param description The description text.
     * @param identifier The identifying text.
     * @param keywords The associated keywords.
     * @param publishers The publishers.
     * @return An OntologyRecord consisting of all the provided metadata.
     */
    OntologyRecord createOntologyRecord(String title, String description, String identifier, Set<String> keywords,
                                          Set<User> publishers);

    /**
     * Creates a MappingRecord with the provided metadata.
     *
     * @param title The title text.
     * @param description The description text.
     * @param identifier The identifying text.
     * @param keywords The associated keywords.
     * @param publishers The publishers.
     * @return A MappingRecord consisting of all the provided metadata.
     */
    MappingRecord createMappingRecord(String title, String description, String identifier, Set<String> keywords,
                                         Set<User> publishers);

    /**
     * Creates a DatasetRecord with the provided metadata.
     *
     * @param title The title text.
     * @param description The description text.
     * @param identifier The identifying text.
     * @param keywords The associated keywords.
     * @param publishers The publishers.
     * @return A DatasetRecord consisting of all the provided metadata.
     */
    DatasetRecord createDatasetRecord(String title, String description, String identifier, Set<String> keywords,
                                      Set<User> publishers);

    /**
     * Adds a Record to the provided Catalog object.
     *
     * @param catalog The Catalog object to add the Record to.
     * @param record The Record to add to the Catalog.
     * @return True if the Record was successfully added; otherwise, false.
     */
    boolean addRecord(Catalog catalog, Record record);

    /**
     * Replaces the Record with the provided recordId with the newRecord.
     *
     * @param recordId The Resource identifying the Record you want to update.
     * @param newRecord The Record with the desired changes.
     * @return True if the Record was successfully updated; otherwise, false.
     */
    boolean updateRecord(Resource recordId, Record newRecord);

    /**
     * Removes the Record from the provided Catalog.
     *
     * @param catalog The Catalog which contains the Record you want to remove.
     * @param record The Record which you want to remove.
     * @return True if the Record was successfully removed; otherwise, false.
     */
    boolean removeRecord(Catalog catalog, Record record);

    /**
     * Gets the Record from the provided Catalog.
     *
     * @param catalog The Catalog which optionally contains the Record you want to get.
     * @param recordId The Resource identifying the Record you want to get.
     * @return An Optional with a Record with the recordId if it was found
     */
    Optional<Record> getRecord(Catalog catalog, Resource recordId);

    /**
     * Creates a Distribution with the provided metadata.
     *
     * @param title The title text.
     * @param description The description text.
     * @param format The format identifier.
     * @param accessURL The accessURL for the Distribution.
     * @param downloadURL The downloadURL for the Distribution.
     * @return Distribution created with the provided metadata.
     */
    Distribution createDistribution(String title, String description, String format, Resource accessURL,
                                    Resource downloadURL);

    /**
     * Adds the provided Distribution to the provided UnversionedResource.
     *
     * @param distribution The Distribution to add to the UnversionedResource.
     * @param unversionedRecord The UnversionedRecord which will get a new Distribution.
     * @return True if the Distribution was successfully added; otherwise, false.
     */
    boolean addDistribution(Distribution distribution, UnversionedRecord unversionedRecord);

    /**
     * Adds the provided Distribution to the provided Version.
     *
     * @param distribution The Distribution to add to the Version.
     * @param version The Version which will get a new Distribution.
     * @return True if the Distribution was successfully added; otherwise, false.
     */
    boolean addDistribution(Distribution distribution, Version version);

    /**
     * Replaces the Distribution with the provided distributionId with the newDistribution.
     *
     * @param distributionId The Resource identifying the Distribution you want to update.
     * @param newDistribution The Distribution with the desired changes.
     * @return True if the
     */
    boolean updateDistribution(Resource distributionId, Distribution newDistribution);

    /**
     * Removes the Distribution with the provided distributionId from the provided UnversionedRecord.
     *
     * @param distributionId The Resource identifying the Distribution you want to remove.
     * @param unversionedRecord The UnversionedRecord to remove the Distribution from.
     * @return True if the Distribution was successfully removed; otherwise, false.
     */
    boolean removeDistribution(Resource distributionId, UnversionedRecord unversionedRecord);

    /**
     * Removes the Distribution with the provided distributionId from the provided Version.
     *
     * @param distributionId The Resource identifying the Distribution you want to remove.
     * @param version The Version to remove the Distribution from.
     * @return True if the Distribution was successfully removed; otherwise, false.
     */
    boolean removeDistribution(Resource distributionId, Version version);

    /**
     * Creates a Version with the provided metadata.
     *
     * @param title The title text.
     * @param description The description text.
     * @return Version created with the provided metadata.
     */
    Version createVersion(String title, String description);

    /**
     * Creates a Tag with the provided metadata.
     *
     * @param title The title text.
     * @param description The description text.
     * @return Tag created with the provided metadata.
     */
    Tag createTag(String title, String description);

    /**
     * Adds the provided Version to the provided VersionedRecord.
     *
     * @param version The Version to add to the VersionedRecord.
     * @param versionedRecord The VersionedRecord which will get a new Version.
     * @return True if the Version was successfully added; otherwise, false.
     */
    boolean addVersion(Version version, VersionedRecord versionedRecord);

    /**
     * Replaces the Version with the provided versionId with the newVersion.
     *
     * @param versionId The Resource identifying the Version you want to update.
     * @param newVersion The Version with the desired changes.
     * @return True if the Version was successfully updated; otherwise, false.
     */
    boolean updateVersion(Resource versionId, Version newVersion);

    /**
     * Removes the Version with the provided versionId from the provided VersionedRecord.
     *
     * @param versionId The Resource identifying the Version you want to remove.
     * @param versionedRecord The VersionedRecord to remove the Version from.
     * @return True if the Version was successfully removed; otherwise, false.
     */
    boolean removeVersion(Resource versionId, VersionedRecord versionedRecord);

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
     * @param versionedRDFRecord The VersionedRDFRecord which will get a new Branch.
     * @return True if the Branch was successfully added; otherwise, false.
     */
    boolean addBranch(Branch branch, VersionedRDFRecord versionedRDFRecord);

    /**
     * Replaces the Branch with the provided branchId with the newBranch.
     *
     * @param branchId The Resource identifying the Branch you want to update.
     * @param newBranch The Branch with the desired changes.
     * @return True if the Branch was successfully updated; otherwise, false.
     */
    boolean updateBranch(Resource branchId, Branch newBranch);

    /**
     * Removes the Branch with the provided branchId from the provided VersionedRDFRecord.
     *
     * @param branchId The Resource identifying the Branch you want to remove.
     * @param versionedRDFRecord The VersionedRDFRecord to remove the Branch from.
     * @return True if the Branch was successfully removed; otherwise, false.
     */
    boolean removeBranch(Resource branchId, VersionedRDFRecord versionedRDFRecord);

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
     * @param branch The Branch that this InProgressCommit is on.
     * @return InProgressCommit created using the provided metadata.
     */
    InProgressCommit createInProgressCommit(Set<Commit> parents, User user, Branch branch);

    /**
     * Adds the provided statements to the provided Commit as additions. These statements were added and will be used
     * when creating the completed named graph.
     *
     * @param statements The statements which were added to the named graph.
     * @param commit The Commit that these statements are associated with.
     * @return True if the statements were successfully added to the correct named graph; otherwise, false.
     */
    boolean addAdditions(Model statements, Commit commit);

    /**
     * Adds the provided statements to the provided Commit as deletions. These statements were deleted and will be used
     * when creating the completed named graph.
     *
     * @param statements The statements which were added to the named graph.
     * @param commit The Commit that these statements are associated with.
     * @return True if the statements were successfully added to the correct named graph; otherwise, false.
     */
    boolean addDeletions(Model statements, Commit commit);

    /**
     * Stores the provided Commit in the Repository.
     *
     * @param commit The Commit to store in the Repository.
     * @return True if the Commit was successfully stored; otherwise, false.
     */
    boolean storeCommit(Commit commit);

    /**
     * Removes the Commit identified by the provided Resource.
     *
     * @param commitId The Resource identifying the Commit to delete.
     * @return
     */
    boolean removeCommit(Resource commitId);

    /**
     * Gets the Commit identified by the provided Resource.
     *
     * @param commitId The Resource identifying the Commit to get.
     * @return Commit identified by the provided Resource if it exists.
     */
    Optional<Commit> getCommit(Resource commitId);

    /**
     * Checks to see if the provided Resource to identify a Commit actually exists within the Repository.
     *
     * @param commitId The Resource identifying the Commit.
     * @return True if the Commit identified by the provided Resource actually exists; otherwise, false.
     */
    boolean commitExists(Resource commitId);

    /**
     * Gets the commit chain (set of commits) which ends at the provided Commit.
     *
     * @param commit The ending Commit for the desired chain.
     * @return Set of Commits which make up the commit chain for the provided Commit.
     */
    Set<Commit> getCommitChain(Commit commit);

    /**
     * Gets the Model which represents the resource for the provided Commit.
     *
     * @param commit The Commit identifying the spot in the Resource's history that you wish to retrieve.
     * @return Model which represents the Resource at the Commit's point in history.
     */
    Model getCompiledResource(Commit commit);

    /**
     * Gets all of the conflicted between the two provided Commits.
     *
     * @param commit1 The first Commit.
     * @param commit2 The second Commit.
     * @return Map of Strings with associated Maps
     */
    // Optional<Map<String, Map<String, List<Model>>>> getConflicts(Commit commit1, Commit commit2);
}
