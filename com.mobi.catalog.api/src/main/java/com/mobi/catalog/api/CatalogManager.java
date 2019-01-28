package com.mobi.catalog.api;

/*-
 * #%L
 * com.mobi.catalog.api
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

import com.mobi.catalog.api.builder.Conflict;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.builder.DistributionConfig;
import com.mobi.catalog.api.builder.RecordConfig;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.Distribution;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.ontologies.mcat.Revision;
import com.mobi.catalog.api.ontologies.mcat.Version;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.orm.OrmFactory;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import javax.annotation.Nonnull;
import javax.annotation.Nullable;

public interface CatalogManager {

    /**
     * Retrieves the distributed Catalog containing the published Records.
     *
     * @return The Catalog object which contains the published Records.
     * @throws IllegalStateException Thrown if the Catalog could not be found.
     */
    Catalog getDistributedCatalog();

    /**
     * Retrieves the local Catalog containing the unpublished Records.
     *
     * @return The Catalog object which contains the unpublished Records.
     * @throws IllegalStateException Thrown if the Catalog could not be found.
     */
    Catalog getLocalCatalog();

    /**
     * Searches the provided Catalog for Records that match the provided PaginatedSearchParams. Acceptable
     * sortBy parameters are http://purl.org/dc/terms/title, http://purl.org/dc/terms/modified, and
     * http://purl.org/dc/terms/issued.
     *
     * @param catalogId    The Resource identifying the Catalog to find the Records in.
     * @param searchParams Search parameters.
     * @return The PaginatedSearchResults for a page matching the search criteria.
     * @throws IllegalArgumentException Thrown if the passed offset is greater than the number of results.
     */
    PaginatedSearchResults<Record> findRecord(Resource catalogId, PaginatedSearchParams searchParams);

    /**
     * Gets a Set of all Resources identifying Records which exist within the Catalog identified by the provided
     * Resource.
     *
     * @param catalogId The Resource identifying the Catalog that you would like to get the Records from.
     * @return The Set of all Resources identifying Records contained within the Catalog identified by the provided
     * Resource.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found
     */
    Set<Resource> getRecordIds(Resource catalogId);

    /**
     * Creates and adds a Record to the repository using provided RecordOperationConfig.
     *
     * @param <T> An Object which extends Record.
     * @param user The User that is creating the Record.
     * @param config The RecordOperationConfig containing the Record's metadata.
     * @param recordClass The Class of the Record to be created.
     * @return The Record Object that was added to the repository of type T.
     */
    <T extends Record> T createRecord(User user, RecordOperationConfig config, Class<T> recordClass);

    /**
     * Creates an Object that extends Record using provided RecordConfig and Factory.
     *
     * @param config  The RecordConfig containing the Record's metadata.
     * @param factory The OrmFactory for creating the entity.
     * @param <T>     An Object which extends Record.
     * @return The Record Object of type T consisting of all the provided metadata.
     */
    <T extends Record> T createRecord(RecordConfig config, OrmFactory<T> factory);

    /**
     * Stores the provided Record in the repository and adds it to the Catalog identified by the provided Resource.
     *
     * @param catalogId The Resource identifying the Catalog which will get the new Record.
     * @param record    The Object which extends Record to add to the Catalog.
     * @param <T>       An Object which extends Record.
     * @throws IllegalArgumentException Thrown if Catalog could not be found or the Record already exists in the
     *                                  repository.
     */
    <T extends Record> void addRecord(Resource catalogId, T record);

    /**
     * Uses the provided Record to find the Resource of the existing Record and replaces it.
     *
     * @param catalogId The Resource identifying the Catalog which contains the Record.
     * @param newRecord The Record with the desired changes.
     * @param <T>       An Object which extends Record.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, or
     *                                  the Record does not belong to the Catalog.
     */
    <T extends Record> void updateRecord(Resource catalogId, T newRecord);

    /**
     * Removes the Record identified by the provided Resources from the repository.
     *
     * @param catalogId The Resource identifying the Catalog which contains the Record.
     * @param recordId  The Resource identifying the Record which you want to remove.
     * @param factory   The OrmFactory of the Type of Record you want to get back.
     * @param <T>       An Object which extends Record.
     * @return The Record object which was removed.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, or
     *                                  the Record does not belong to the Catalog.
     */
    <T extends Record> T removeRecord(Resource catalogId, Resource recordId, OrmFactory<T> factory);

    /**
     * Deletes a Record using the appropriate {@link com.mobi.catalog.api.record.RecordService}.
     *
     * @param user The user performing the deletion activity
     * @param recordId The record Resource to delete
     * @param recordClass The Class of Record you want to delete.
     * @param <T>       An Object which extends Record.
     * @return The deleted Object
     */
    <T extends Record> T deleteRecord(User user, Resource recordId, Class<T> recordClass);

    /**
     * Gets the Record from the provided Catalog. The Record will be of type T which is determined by the provided
     * OrmFactory. Returns an empty Optional if the Record could not be found, or the Record does not belong to the
     * Catalog.
     *
     * @param catalogId The Resource identifying the Catalog which contains the Record.
     * @param recordId  The Resource identifying the Record you want to get.
     * @param factory   The OrmFactory of the Type of Record you want to get back.
     * @param <T>       An Object which extends Record.
     * @return The Record if it exists.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found.
     */
    <T extends Record> Optional<T> getRecord(Resource catalogId, Resource recordId, OrmFactory<T> factory);

    /**
     * Gets the Set of Distributions for an UnversionedRecord identified by the provided Resources.
     *
     * @param catalogId           The Resource identifying the Catalog which contains the Record.
     * @param unversionedRecordId The Resource identifying the UnversionedRecord which has the Distributions.
     * @return The Set of Distributions for the UnversionedRecord if they exist.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or any of the Distributions could not be found.
     */
    Set<Distribution> getUnversionedDistributions(Resource catalogId, Resource unversionedRecordId);

    /**
     * Creates a Distribution with the metadata from the provided DistributionConfig.
     *
     * @param config The DistributionConfig which contains the needed metadata to create the Distribution.
     * @return Distribution created with the provided metadata.
     */
    Distribution createDistribution(DistributionConfig config);

    /**
     * Stores the provided Distribution in the repository and adds it to the UnversionedRecord identified by the
     * provided Resource.
     *
     * @param catalogId           The Resource identifying the Catalog which contains the Record.
     * @param unversionedRecordId The Resource identifying the UnversionedRecord which will get the new Distribution.
     * @param distribution        The Distribution to add to the UnversionedRecord.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or the Distribution already exists in the repository.
     */
    void addUnversionedDistribution(Resource catalogId, Resource unversionedRecordId, Distribution distribution);

    /**
     * Uses the provided Resources and Distribution to find the Resource of an existing Distribution on an
     * UnversionedRecord and replaces it.
     *
     * @param catalogId           The Resource identifying the Catalog which contains the Record.
     * @param unversionedRecordId The Resource identifying the UnversionedRecord which has the Distribution.
     * @param newDistribution     The Distribution with the desired changes.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or the Distribution could not be found.
     */
    void updateUnversionedDistribution(Resource catalogId, Resource unversionedRecordId, Distribution newDistribution);

    /**
     * Removes the Distribution of a UnversionedRecord identified by the provided Resources from the repository.
     *
     * @param catalogId           The Resource identifying the Catalog which contains the Record.
     * @param unversionedRecordId The Resource identifying the UnversionedRecord which has the Distribution.
     * @param distributionId      The Resource identifying the Distribution you want to remove.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or the Distribution could not be found.
     */
    void removeUnversionedDistribution(Resource catalogId, Resource unversionedRecordId, Resource distributionId);

    /**
     * Gets the Distribution of an UnversionedRecord identified by the provided Resources. Returns an empty Optional if
     * the Distribution does not belong to the Record.
     *
     * @param catalogId           The Resource identifying the Catalog which contains the Record.
     * @param unversionedRecordId The Resource identifying the UnversionedRecord which has the Distribution.
     * @param distributionId      The Resource identifying the Distribution to retrieve.
     * @return The Distribution if it exists.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, or the
     *                                  Record does not belong to the Catalog.
     * @throws IllegalStateException    Thrown if the Distribution could not be found.
     */
    Optional<Distribution> getUnversionedDistribution(Resource catalogId, Resource unversionedRecordId,
                                                      Resource distributionId);

    /**
     * Gets the Set of Versions for a VersionedRecord identified by the provided Resources.
     *
     * @param catalogId         The Resource identifying the Catalog which contains the Record.
     * @param versionedRecordId The Resource identifying the VersionedRecord which has the Versions.
     * @return The Set of Distributions for the VersionedRecord if they exist.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or any of the Versions could not be found.
     */
    Set<Version> getVersions(Resource catalogId, Resource versionedRecordId);

    /**
     * Creates an Object which extends Version with the provided metadata using the provided OrmFactory.
     *
     * @param title       The title text.
     * @param description The description text.
     * @param factory     The OrmFactory used to create T.
     * @param <T>         An Object which extends Version.
     * @return Version created with the provided metadata.
     */
    <T extends Version> T createVersion(@Nonnull String title, String description, OrmFactory<T> factory);

    /**
     * Stores the provided Version in the repository and adds it to the VersionedRecord identified by the provided
     * Resources. This also updates the latestVersion associated with that VersionedRecord to be this Version.
     *
     * @param catalogId         The Resource identifying the Catalog which contains the Record.
     * @param versionedRecordId The Resource identifying the VersionedRecord which will get the new Version.
     * @param version           The Version to add to the VersionedRecord.
     * @param <T>               An Object which extends Version.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or the Version already exists in the repository.
     */
    <T extends Version> void addVersion(Resource catalogId, Resource versionedRecordId, T version);

    /**
     * Uses the provided Resources and Version to find the Resource of the existing Version and replaces it.
     *
     * @param catalogId         The Resource identifying the Catalog which contains the Record.
     * @param versionedRecordId The Resource identifying the VersionedRecord which has the Version.
     * @param newVersion        The Version with the desired changes.
     * @param <T>               An Object which extends Version.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or the Version could not be found.
     */
    <T extends Version> void updateVersion(Resource catalogId, Resource versionedRecordId, T newVersion);

    /**
     * Removes the Version identified by the provided Resources from the repository.
     *
     * @param catalogId         The Resource identifying the Catalog which has the Record.
     * @param versionedRecordId The Resource identifying the VersionedRecord which has the Version.
     * @param versionId         The Resource identifying the Version you want to remove.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or the Version could not be found.
     */
    void removeVersion(Resource catalogId, Resource versionedRecordId, Resource versionId);

    /**
     * Gets the Version identified by the provided Resources. The Version will be of type T which is determined by the
     * provided OrmFactory. Returns an empty Optional if the Version does not belong to the Record.
     *
     * @param catalogId         The Resource identifying the Catalog which contains the Record.
     * @param versionedRecordId The Resource identifying the VersionedRecord which has the Version.
     * @param versionId         The Resource identifying the Version you want to get.
     * @param factory           The OrmFactory identifying the type of Version you want to get.
     * @param <T>               An Object which extends Version.
     * @return The Version if it exists.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, or the
     *                                  Record does not belong to the Catalog.
     * @throws IllegalStateException    Thrown if the Version could not be found.
     */
    <T extends Version> Optional<T> getVersion(Resource catalogId, Resource versionedRecordId, Resource versionId,
                                               OrmFactory<T> factory);

    /**
     * Gets the latest Version of the VersionedRecord identified by the provided Resources. The Version will be of
     * type T which is determined by the provided OrmFactory. Returns an empty Optional if the Record has no latest
     * Version.
     *
     * @param catalogId         The Resource identifying the Catalog which contains the Record.
     * @param versionedRecordId The Resource identified the VersionedRecord which has the Version.
     * @param factory           The OrmFactory identified the type of version you want to get.
     * @param <T>               An Object which extends Version.
     * @return The latest Version if it exists.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, or the
     *                                  Record does not belong to the Catalog.
     * @throws IllegalStateException    Thrown if the Version could not be found.
     */
    <T extends Version> Optional<T> getLatestVersion(Resource catalogId, Resource versionedRecordId,
                                                     OrmFactory<T> factory);

    /**
     * Gets the Commit of the Tag identified by the provided Resources.
     *
     * @param catalogId         The Resource identifying the Catalog which contains the Record.
     * @param versionedRecordId The Resource identified the VersionedRecord which has the Tag.
     * @param tagId             The Resource identifying the Tag which has the Commit.
     * @return The Commit of the Tag if it exists.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or the Tag does not belong to the Record.
     * @throws IllegalStateException    Thrown if the Version could not be found, the Tag does not have a Commit,
     *                                  or the Commit could not be found.
     */
    Commit getTaggedCommit(Resource catalogId, Resource versionedRecordId, Resource tagId);

    /**
     * Gets the Set of Distributions for the Version identified by the provided Resources.
     *
     * @param catalogId         The Resource identifying the Catalog which contains the Record.
     * @param versionedRecordId The Resource identifying the VersionedRecord which has the Version.
     * @param versionId         The Resource identifying the Version which has the Distributions.
     * @return The Set of Distributions for the Version if they exist.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, the Version could not be found, or any of the Distributions could
     *                                  not be found.
     */
    Set<Distribution> getVersionedDistributions(Resource catalogId, Resource versionedRecordId, Resource versionId);

    /**
     * Stores the provided Distribution in the repository and adds it to the Version identified by the provided
     * Resources.
     *
     * @param catalogId         The Resource identifying the Catalog which contains the Record.
     * @param versionedRecordId The Resource identifying the VersionedRecord which has the Version.
     * @param versionId         The Resource identifying the Version which will get the new Distribution.
     * @param distribution      The Distribution to add to the Version.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, the Version could not be found, or the Distribution already exists
     *                                  in the repository.
     */
    void addVersionedDistribution(Resource catalogId, Resource versionedRecordId, Resource versionId,
                                  Distribution distribution);

    /**
     * Uses the provided Resources and Distribution to find the Resource of an existing Distribution on a Version and
     * replaces it.
     *
     * @param catalogId         The Resource identifying the Catalog which contains the Record.
     * @param versionedRecordId The Resource identifying the VersionedRecord which has the Version.
     * @param versionId         The Resource identifying the Version which has the Distribution.
     * @param newDistribution   The Distribution with the desired changes.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, the Version could not be found, or the Distribution could not be
     *                                  found.
     */
    void updateVersionedDistribution(Resource catalogId, Resource versionedRecordId, Resource versionId,
                                     Distribution newDistribution);

    /**
     * Removes the Distribution of a Version identified by the provided Resources from the repository.
     *
     * @param catalogId         The Resource identifying the Catalog which contains the Record.
     * @param versionedRecordId The Resource identifying the VersionedRecord which has the Version.
     * @param versionId         The Resource identifying the Version which has the Distribution.
     * @param distributionId    The Resource identifying the Distribution you want to remove.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, the Version could not be found, or the Distribution could not be
     *                                  found.
     */
    void removeVersionedDistribution(Resource catalogId, Resource versionedRecordId, Resource versionId,
                                     Resource distributionId);

    /**
     * Gets the Distribution of an Version identified by the provided Resources. Returns an empty Optional if the
     * Distribution does not belong to the Version.
     *
     * @param catalogId         The Resource identifying the Catalog which contains the Record.
     * @param versionedRecordId The Resource identifying the VersionedRecord which has the Version.
     * @param versionId         The Resource identifying the Version which has the Distribution.
     * @param distributionId    The Resource identifying the Distribution to retrieve.
     * @return The Distribution if it exists.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or the Version does not belong to the Record.
     * @throws IllegalStateException    Thrown if the Version could not be found, or the Distribution could not be
     *                                  found.
     */
    Optional<Distribution> getVersionedDistribution(Resource catalogId, Resource versionedRecordId, Resource versionId,
                                                    Resource distributionId);

    /**
     * Gets the Set of Branches for a VersionedRDFRecord identified by the provided Resources.
     *
     * @param catalogId            The Resource identifying the Catalog which has the Record.
     * @param versionedRDFRecordId The Resource identifying the VersionedRDFRecord which has the Branches.
     * @return The Set of Branches for the VersionedRDFRecord if they exist.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or any of the Branches could not be found.
     */
    Set<Branch> getBranches(Resource catalogId, Resource versionedRDFRecordId);

    /**
     * Creates a Branch with the provided metadata using the provided OrmFactory.
     *
     * @param title       The title text.
     * @param description The description text.
     * @param factory     The OrmFactory identifying the type of Branch you want to get back.
     * @param <T>         An Object which extends Branch.
     * @return Branch created with the provided metadata.
     */
    <T extends Branch> T createBranch(@Nonnull String title, String description, OrmFactory<T> factory);

    /**
     * Stores the provided Branch in the repository and adds it to the VersionedRDFRecord identified by the provided
     * Resources.
     *
     * @param catalogId            The Resource identifying the Catalog which has the Record.
     * @param versionedRDFRecordId The Resource identifying the VersionedRDFRecord which will get the new Branch.
     * @param branch               The Branch to add to the VersionedRDFRecord.
     * @param <T>                  An Object which extends Branch.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or the Branch already exists in the repository.
     */
    <T extends Branch> void addBranch(Resource catalogId, Resource versionedRDFRecordId, T branch);

    /**
     * Creates a new Branch, adds it to the VersionedRDFRecord identified by the provided Resources as the master
     * Branch, and stores the Branch in the repository. This method will not create a new master Branch if one
     * already exists.
     *
     * @param catalogId            The Resource identifying the Catalog which contains the Record.
     * @param versionedRDFRecordId The Resource identifying the VersionedRDFRecord which will get the new Branch.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, or the
     *                                  Record does not belong to the Catalog.
     * @throws IllegalStateException    Thrown if the Branch already has a master Branch.
     */
    void addMasterBranch(Resource catalogId, Resource versionedRDFRecordId);

    /**
     * Uses the provided Resources and Branch to find the Resource of the existing non-master Branch and replaces it.
     * If the provided Branch is the master Branch, it will not be updated.
     *
     * @param catalogId            The Resource identifying the Catalog which contains the Record.
     * @param versionedRDFRecordId The Resource identifying the VersionedRDFRecord that has the Branch.
     * @param newBranch            The Branch with the desired changes.
     * @param <T>                  An Object which extends Branch.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or the Branch could not be found.
     * @throws IllegalStateException    Thrown if the Branch is the master Branch of the Record.
     */
    <T extends Branch> void updateBranch(Resource catalogId, Resource versionedRDFRecordId, T newBranch);

    /**
     * Updates the head of a Branch identified by the provided Resources to point to the specified Commit.
     *
     * @param catalogId            The Resource identifying the Catalog which contains the Record.
     * @param versionedRDFRecordId The Resource identifying the VersionedRDFRecord that has the Branch.
     * @param branchId             The Resource identifying the Branch whose head Commit will be updated.
     * @param commitId             The Resource identifying the new head Commit.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, the Branch could not be found, or the Commit could not be found.
     */
    void updateHead(Resource catalogId, Resource versionedRDFRecordId, Resource branchId, Resource commitId);

    /**
     * Removes the non-master Branch identified by the provided Resources from the repository. If the provided Branch
     * is the master Branch, it will not be removed.
     *
     * @param catalogId            The Resource identifying the Catalog which contains the Record.
     * @param versionedRDFRecordId The Resource identifying the VersionedRDFRecord which has the Branch.
     * @param branchId             The Resource identifying the Branch you want to remove.
     * @return List of IRIs of all the Commits removed as part of the Branch
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or the Branch could not be found.
     * @throws IllegalStateException    Thrown if a Commit in the Branch does not have the additions/deletions set.
     */
    List<Resource> removeBranch(Resource catalogId, Resource versionedRDFRecordId, Resource branchId);

    /**
     * Gets the Branch identified by the provided Resources. The Branch will be of type T which is determined by the
     * provided OrmFactory. Returns an empty Optional if the Branch does not belong to the Record.
     *
     * @param catalogId            The Resource identifying the Catalog which contains the Record.
     * @param versionedRDFRecordId The Resource identifying the VersionedRDFRecord which has the Branch.
     * @param branchId             The Resource identifying the Branch you want to get.
     * @param factory              The OrmFactory identifying the type of Branch you want to get.
     * @param <T>                  An Object which extends Branch.
     * @return The Branch if it exists.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, or the
     *                                  Record does not belong to the Catalog.
     * @throws IllegalStateException    Thrown if the Branch could not be found.
     */
    <T extends Branch> Optional<T> getBranch(Resource catalogId, Resource versionedRDFRecordId, Resource branchId,
                                             OrmFactory<T> factory);

    /**
     * Gets the master Branch of the VersionedRDFRecord identified by the provided Resources.
     *
     * @param catalogId            The Resource identifying the Catalog which contains the Record.
     * @param versionedRDFRecordId The Resource identifying the VersionedRDFRecord which has the Branch.
     * @return The master Branch of the VersionedRDFRecord if it exists.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, or the
     *                                  Record does not belong to the Catalog.
     * @throws IllegalStateException    Thrown if the Branch could not be found or the VersionedRDFRecord does not have
     *                                  a master Branch.
     */
    Branch getMasterBranch(Resource catalogId, Resource versionedRDFRecordId);

    /**
     * Creates a Commit from the provided InProgressCommit and message whose parents are the passed base and
     * auxiliary Commit.
     *
     * @param inProgressCommit The InProgressCommit which is the basis for the created Commit.
     * @param message          The String with the message text associated with the Commit.
     * @param baseCommit       The base Commit for the created Commit. Used for associating the Revisions as well.
     * @param auxCommit        The auxiliary Commit for the created Commit. Used for associating the Revisions as well.
     * @return Commit created based on the provided InProgressCommit with the message metadata.
     * @throws IllegalArgumentException If a auxiliary commit is passed, but not a base commit
     */
    Commit createCommit(@Nonnull InProgressCommit inProgressCommit, @Nonnull String message, Commit baseCommit,
                        Commit auxCommit);

    /**
     * Creates an InProgressCommit which is a Commit that a User is actively working on. Once it is completed, the
     * InProgressCommit will be used to create a Commit with a provided message.
     *
     * @param user The User that this InProgressCommit is associated with.
     * @return Optional with an InProgressCommit created using the provided metadata.
     */
    InProgressCommit createInProgressCommit(User user);

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
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or the InProgressCommit could not be found.
     * @throws IllegalStateException    Thrown if the InProgressCommit does not have the additions/deletions set.
     */
    void updateInProgressCommit(Resource catalogId, Resource versionedRDFRecordId, Resource commitId,
                                @Nullable Model additions, @Nullable Model deletions);

    /**
     * Updates the InProgressCommit identified by the provided Resources and User using the provided addition and
     * deletion statements. These statements were added and deleted respectively and will be used when creating the
     * completed named graph.
     *
     * @param catalogId            The Resource identifying the Catalog which contains the Record.
     * @param versionedRDFRecordId The Resource identifying the VersionedRDFRecord which has the InProgressCommit.
     * @param user                 The User with the InProgressCommit.
     * @param additions            The statements which were added to the named graph.
     * @param deletions            The statements which were added to the named graph.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or the InProgressCommit could not be found.
     * @throws IllegalStateException    Thrown if the InProgressCommit does not have the additions/deletions set.
     */
    void updateInProgressCommit(Resource catalogId, Resource versionedRDFRecordId, User user, @Nullable Model additions,
                                @Nullable Model deletions);

    /**
     * Adds the provided InProgressCommit to the repository for the VersionedRDFRecord identified by the provided
     * Resources.
     *
     * @param catalogId            The Resource identifying the Catalog which contains the Record.
     * @param versionedRDFRecordId The Resource identifying the VersionedRDFRecord which will get the new
     *                             InProgressCommit.
     * @param inProgressCommit     The InProgressCommit to add to the VersionedRDFRecord.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or the InProgressCommit already exists in the repository.
     */
    void addInProgressCommit(Resource catalogId, Resource versionedRDFRecordId, InProgressCommit inProgressCommit);

    /**
     * Gets the Commit identified by the provided Resource. The Model backing the commit will contain all the data in
     * the commit named graph. This includes the commit and revision metadata.
     *
     * @param commitId The Resource identifying the Commit to get.
     * @return The Commit if it exists.
     * @throws IllegalStateException Thrown if the Commit could not be found.
     */
    Optional<Commit> getCommit(Resource commitId);

    /**
     * Gets the Commit identified by the provided Resources. Returns an empty Optional if the Commit does not belong to
     * the Branch. The Model backing the commit will contain all the data in the commit named graph. This includes the
     * commit and revision metadata.
     *
     * @param catalogId            The Resource identifying the Catalog which contains the Record.
     * @param versionedRDFRecordId The Resource identifying the VersionedRDFRecord which has the Branch.
     * @param branchId             The Resource identifying the Branch which has the Commit.
     * @param commitId             The Resource identifying the Commit to get.
     * @return The Commit if it exists.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or the Branch does not belong to the Record.
     * @throws IllegalStateException    Thrown if the Branch could not be found, the Branch does not have a head Commit, or
     *                                  the Commit could not be found.
     */
    Optional<Commit> getCommit(Resource catalogId, Resource versionedRDFRecordId, Resource branchId, Resource commitId);

    /**
     * Gets the head Commit of the Branch identified by the provided Resources.
     *
     * @param catalogId            The Resource identifying the Catalog which contains the Record.
     * @param versionedRDFRecordId The Resource identifying the VersionedRDFRecord which has the Branch.
     * @param branchId             The Resource identifying the Branch which has the head Commit.
     * @return The head Commit if it exists
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or the Branch does not belong to the Record.
     * @throws IllegalStateException    Thrown if the Branch could not be found, the Branch does not have a head Commit
     *                                  or the Commit could not be found.
     */
    Commit getHeadCommit(Resource catalogId, Resource versionedRDFRecordId, Resource branchId);

    /**
     * Gets the InProgressCommit for the provided User for the VersionedRDFRecord identified by the provided Resources
     * and User. Returns an empty Optional if there is no InProgressCommit for the Record and User.
     *
     * @param catalogId            The Resource identifying the Catalog which contains the Record.
     * @param versionedRDFRecordId The Resource identifying the VersionedRDFRecord which has the InProgressCommit.
     * @param user                 The User with the InProgressCommit.
     * @return The InProgressCommit if it exists
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, or the
     *                                  Record does not belong to the Catalog.
     * @throws IllegalStateException    Thrown if the InProgressCommit could not be found.
     */
    Optional<InProgressCommit> getInProgressCommit(Resource catalogId, Resource versionedRDFRecordId, User user);

    /**
     * Gets the InProgressCommit identified by the provided Resources. Returns an empty Optional if the
     * InProgressCommit could not be found, or the InProgressCommit does not belong to the Record.
     *
     * @param catalogId            The Resource identifying the Catalog which contains the Record.
     * @param versionedRDFRecordId The Resource identifying the VersionedRDFRecord which has the InProgressCommit.
     * @param inProgressCommitId   The Resource identifying the InProgressCommit.
     * @return The InProgressCommit if it exists
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, or the
     *                                  Record does not belong to the Catalog.
     * @throws IllegalStateException    Thrown if the InProgressCommit has no Record set.
     */
    Optional<InProgressCommit> getInProgressCommit(Resource catalogId, Resource versionedRDFRecordId,
                                                   Resource inProgressCommitId);

    /**
     * Gets the Revision associated with the provided commit Resource.
     *
     * @param commitId The Resource identifying the commit
     * @return The Revision associated with the provided commit Resource.
     */
    Revision getRevision(Resource commitId);

    /**
     * Gets the addition and deletion statements of a Commit identified by the provided Resource as a Difference. The
     * statements contained in the returned Difference will have a context that matches the storage quad. That is,
     * tracked triples will have a context that matches the Revision additions and deletions contexts and tracked quads
     * will have a context that matches the GraphRevision additions and deletions contexts.
     *
     * @param commitId The Resource identifying the Commit to retrieve the Difference from.
     * @return A Difference object containing the addition and deletion statements of a Commit.
     */
    Difference getRevisionChanges(Resource commitId);

    /**
     * Gets the addition and deletion statements of a Commit identified by the provided Resource as a Difference. The
     * statements contained in the returned Difference will have a context that matches the tracked quad. That is,
     * tracked triples will have no context and tracked quads will have a context that matches the data named graph.
     *
     * @param commitId The Resource identifying the Commit to retrieve the Difference from.
     * @return A Difference object containing the addition and deletion statements of a Commit.
     * @throws IllegalArgumentException Thrown if the Commit could not be found
     * @throws IllegalStateException    Thrown if the Commit does not have the additions/deletions set.
     */
    Difference getCommitDifference(Resource commitId);

    /**
     * Removes the InProgressCommit identified by the provided Resources.
     *
     * @param catalogId            The Resource identifying the Catalog which contains the Record.
     * @param versionedRDFRecordId The Resource identifying the VersionedRDFRecord which has the InProgressCommit.
     * @param inProgressCommitId   The Resource identifying the InProgressCommit to be removed.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or the InProgressCommit could not be found
     */
    void removeInProgressCommit(Resource catalogId, Resource versionedRDFRecordId, Resource inProgressCommitId);

    /**
     * Removes the InProgressCommit identified by the provided Resources and User.
     *
     * @param catalogId            The Resource identifying the Catalog which contains the Record.
     * @param versionedRDFRecordId The Resource identifying the VersionedRDFRecord which has the InProgressCommit.
     * @param user                 The User with the InProgressCommit.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or the InProgressCommit could not be found
     */
    void removeInProgressCommit(Resource catalogId, Resource versionedRDFRecordId, User user);

    /**
     * Applies the addition and deletion statements from the InProgressCommit identified by the provided Resource to the
     * Model provided and returns the combined Model.
     *
     * @param inProgressCommitId The Resource identifying the InProgressCommit to be added.
     * @param entity             The Model which you want to apply the statements to.
     * @return A Model consisting of the provided Model statements with the proper statements added and/or removed.
     * @throws IllegalArgumentException Thrown if the InProgressCommit could not be found
     * @throws IllegalStateException    Thrown if the InProgressCommit has no Revision set or the InProgressCommit's
     *                                  Revision does not have the additions/deletions set.
     */
    Model applyInProgressCommit(Resource inProgressCommitId, Model entity);

    /**
     * Gets a List of Commits ordered by date descending within the repository. The Commit identified by the provided
     * Resource is the first item in the List and it was informed by the previous Commit in the List. This association
     * is repeated until you get to the beginning of the List. The resulting List can then be thought about the chain of
     * Commits on a Branch starting with the Commit identified by the provided Resource.
     *
     * @param commitId The Resource identifying the Commit for the desired chain.
     * @return List of Commits which make up the commit chain for the provided Commit.
     * @throws IllegalArgumentException Thrown if any of the Commits could not be found.
     */
    List<Commit> getCommitChain(Resource commitId);

    /**
     * Gets a List of Commits ordered by date descending within the repository. The Commit identified by the first
     * provided Resource is the first item in the List and it was informed by the previous Commit in the List. This
     * association is repeated until you get to the second Resource which is beginning of the List. The resulting List
     * can then be thought about the chain of Commits starting with the Commit identified by the first provided Resource
     * and ending with the second provided Resource.
     *
     * @param commitId The Resource identifying the Commit for the desired chain.
     * @param targetId The Resource identifying the Commit to terminate the chain.
     * @return List of Commits which make up the commit chain for the provided Commit.
     * @throws IllegalArgumentException Thrown if any of the Commits could not be found.
     */
    List<Commit> getCommitChain(Resource commitId, Resource targetId);

    /**
     * Gets the list of commits between the HEAD of a branch and the HEAD of a target branch.
     *
     * @param catalogId            The Resource identifying the Catalog which contains the Record.
     * @param versionedRDFRecordId The Resource identifying the VersionedRDFRecord which has the Branch.
     * @param branchId             The Resource identifying the Branch with the chain of Commit.
     * @param targetId             The Resource identifying the target Branch
     * @return List of Commits between the HEAD of the source branch and the HEAD of the target branch
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, the Branch could not be found, or any of the Commits could not be
     *                                  found.
     * @throws IllegalStateException    Thrown if either Branch does not have a head Commit or if the commit history does
     *                                  not have a common parent.
     */
    List<Commit> getCommitChain(Resource catalogId, Resource versionedRDFRecordId, Resource branchId,
                                Resource targetId);

    /**
     * Gets a List of Commits ordered by date descending within the repository starting with the head Commit of the
     * Branch identified by the provided Resources. The head Commit is the first one in the List and it was informed
     * by the previous Commit in the List. This association is repeated until you get to the beginning of the List. The
     * resulting List can then be thought as the chain of Commits on the Branch starting with the head Commit.
     *
     * @param catalogId            The Resource identifying the Catalog which contains the Record.
     * @param versionedRDFRecordId The Resource identifying the VersionedRDFRecord which has the Branch.
     * @param branchId             The Resource identifying the Branch with the chain of Commit.
     * @return List of Commits which make up the commit chain for the head Commit of the Branch.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, the Branch could not be found, or any of the Commits could not be
     *                                  found.
     * @throws IllegalStateException    Thrown if the Branch does not have a head Commit.
     */
    List<Commit> getCommitChain(Resource catalogId, Resource versionedRDFRecordId, Resource branchId);

    /**
     * Gets a List of Commits ordered by date descending within the repository. The Commit identified by the first
     * provided Resource is the first item in the List and it was informed by the previous Commit in the List. Each
     * addition or deletion of a Commit is then compared to the Entity IRI and removes graphs that don't contain the
     * entityId. The resulting List can then be thought as the chain of Commits starting with the
     * Commit identified by the first provided Resource filtered to those containing the Entity IRI.
     *
     * @param commitId The Resource identifying the Commit for the desired chain.
     * @param entityId The Resource identifying the Entity to filter the chain of Commit.
     * @return List of Commits which make up the commit chain for the provided Commit.
     * @throws IllegalArgumentException Thrown if any of the Commits could not be found.
     */
    List<Commit> getCommitEntityChain(Resource commitId, Resource entityId);

    /**
     * Gets a List of Commits ordered by date descending within the repository starting with the head Commit of the
     * Branch identified by the provided Resources. The head Commit is the first one in the List and it was informed
     * by the previous Commit in the List. This association is repeated until you get to the second Resource which is
     * beginning of the List. Each addition or deletion of a Commit is then compared to the Entity IRI and removes
     * graphs that don't contain the entityId. The resulting List can then be thought as the chain of Commits on the
     * Branch starting with the head Commit. That list is then filtered by an Entity IRI resulting in Commits containing
     * the Entity IRI in the additions or deletions of a Commit.
     *
     * @param catalogId            The Resource identifying the Catalog which contains the Record.
     * @param targetId             The Resource identifying the Commit to terminate the chain.
     * @param entityId             The Resource identifying the Entity to filter the chain of Commit.
     * @return List of Commits which make up the commit chain for the provided Commit and Entity IRI.
     * @throws IllegalArgumentException Thrown if any of the Commits could not be found.
     */
    List<Commit> getCommitEntityChain(Resource catalogId, Resource targetId, Resource entityId);

    /**
     * Gets the Model which represents the entity at the instance of the Commit identified by the provided Resource
     * using previous Commit data to construct it.
     *
     * @param commitId The Resource identifying the Commit identifying the spot in the entity's history that you wish
     *                 to retrieve.
     * @return Model which represents the resource at the Commit's point in history.
     * @throws IllegalArgumentException Thrown if the Commit could not be found.
     */
    Model getCompiledResource(Resource commitId);

    /**
     * Gets the Model which represents the entity at the instance of the Commit identified by the provided Resource
     * using previous Commit data to construct it.
     *
     * @param commitId             The Resource identifying the Commit identifying the spot in the entity's history that you wish
     *                             to retrieve.
     * @param branchId             The Resource identifying the Branch from where the Commit should originate.
     * @param versionedRDFRecordId The Resource identifying the Record from where the Branch should originate.
     * @return Model which represents the resource at the Commit's point in history.
     * @throws IllegalArgumentException Thrown if the Commit could not be found.
     */
    Model getCompiledResource(Resource versionedRDFRecordId, Resource branchId, Resource commitId);

    /**
     * Gets the Difference between the Commits identified by the two provided Resources. Essentially returns the
     * culmination of changes from a common ancestor between the Commits to the source Commit.
     *
     * @param sourceCommitId The source (first) Commit.
     * @param targetCommitId The target (second) Commit.
     * @return The Difference between the two Commits identified by the provided Resources.
     * @throws IllegalArgumentException Thrown if either Commit could not be found or the Commits have no common parent.
     * @throws IllegalStateException    Thrown if a Commit in either chain does not have the additions/deletions set.
     */
    Difference getDifference(Resource sourceCommitId, Resource targetCommitId);

    /**
     * Gets all of the conflicts between the Commits identified by the two provided Resources.
     *
     * @param leftId  The left (first) Commit.
     * @param rightId The right (second) Commit.
     * @return The Set of Conflicts between the two Commits identified by the provided Resources.
     * @throws IllegalArgumentException Thrown if either Commit could not be found.
     * @throws IllegalStateException    Thrown if a Commit in either chain does not have the additions/deletions set.
     */
    Set<Conflict> getConflicts(Resource leftId, Resource rightId);

    /**
     * Gets the Difference, consisting of Models of additions and deletions, made between the original and the changed
     * Model.
     *
     * @param original The original Model.
     * @param changed  The changed Model.
     * @return The Difference between the two Models.
     */
    Difference getDiff(Model original, Model changed);

    /**
     * Exports the record data based on the record type and associated configurations. Export implementation is defined
     * by available RecordServices.
     *
     * @param recordIRI The record IRI
     * @param config The configuration of the record
     */
    void export(Resource recordIRI, RecordOperationConfig config);

    /**
     * Exports a list of record data based on the record type and associated configurations. Export implementation is
     * defined by available RecordServices.
     *
     * @param recordIRIs The list of record IRIs
     * @param config The configuration of the record
     */
    void export(List<Resource> recordIRIs, RecordOperationConfig config);
}
