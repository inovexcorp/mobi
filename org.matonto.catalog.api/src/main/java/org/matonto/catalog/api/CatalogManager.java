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
import org.matonto.exception.MatOntoException;
import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.orm.OrmFactory;

import javax.annotation.Nonnull;
import java.security.InvalidParameterException;
import java.util.*;

public interface CatalogManager {

    /**
     * Retrieves the distributed Catalog containing the published Records.
     *
     * @return The Catalog object which contains the published Records.
     * @throws MatOntoException Thrown if a connection to the repository could not be made.
     */
    Catalog getDistributedCatalog() throws MatOntoException;

    /**
     * Retrieves the local Catalog containing the unpublished Records.
     *
     * @return The Catalog object which contains the unpublished Records.
     * @throws MatOntoException thrown if a connection to the repository could not be made
     */
    Catalog getLocalCatalog() throws MatOntoException;

    /**
     * Searches the provided Catalog for Records that match the provided PaginatedSearchParams.
     *
     * @param catalogId The Resource identifying the Catalog to find the Records in.
     * @param searchParams Search parameters.
     * @return The PaginatedSearchResults for a page matching the search criteria.
     * @throws MatOntoException Thrown if a connection to the repository could not be made.
     */
    PaginatedSearchResults<Record> findRecord(Resource catalogId, PaginatedSearchParams searchParams) throws
            MatOntoException;

    /**
     * Gets a Set of all Resources identifying Records which exist within the Catalog identified by the provided
     * Resource.
     *
     * @param catalogId The Resource identifying the Catalog that you would like to get the Records from.
     * @return The Set of all Resources identifying Records contained within the Catalog identified by the provided
     *         Resource.
     * @throws MatOntoException Thrown if a connection to the repository could not be made.
     */
    Set<Resource> getRecordIds(Resource catalogId) throws MatOntoException;

    /**
     * Creates an Object that extends Record using provided RecordConfig and Factory.
     *
     * @param config The RecordConfig containing the Record's metadata.
     * @param factory The OrmFactory for creating the entity.
     * @param <T> An Object which extends Record.
     * @return The Record Object of type T consisting of all the provided metadata.
     */
    <T extends Record> T createRecord(RecordConfig config, OrmFactory<T> factory);

    /**
     * Stores the provided Record in the repository and adds it to the Catalog identified by the provided Resource.
     *
     * @param catalogId The Resource identifying the catalog to add the Record to.
     * @param record The Object which extends Record to add to the Catalog.
     * @param <T> An Object which extends Record.
     * @throws MatOntoException Thrown if a connection to the repository could not be made.
     */
    <T extends Record> void addRecord(Resource catalogId, T record) throws MatOntoException;

    /**
     * Uses the provided Record to find the Resource of the existing Record and replaces it.
     *
     * @param catalogId The Resource identifying the catalog which contains desired Record.
     * @param newRecord The Record with the desired changes.
     * @param <T> An Object which extends Record.
     * @throws MatOntoException Thrown if a connection to the repository could not be made.
     */
    <T extends Record> void updateRecord(Resource catalogId, T newRecord) throws MatOntoException;

    /**
     * Removes the Record identified by the provided Resource from the repository if it was contained within the Catalog
     * identified by the provided Resource.
     *
     * @param catalogId The Resource identifying the catalog which contains the record you want to remove.
     * @param recordId The Resource identifying the Record which you want to remove.
     * @throws MatOntoException Thrown if a connection to the repository could not be made.
     */
    void removeRecord(Resource catalogId, Resource recordId) throws MatOntoException;

    /**
     * Gets the Record from the provided Catalog. The Record will be of type T which is determined by the provided
     * OrmFactory.
     *
     * @param catalogId The Resource identifying the catalog which optionally contains the Record you want to get.
     * @param recordId The Resource identifying the Record you want to get.
     * @param factory The OrmFactory of the Type of Record you want to get back.
     * @param <T> An Object which extends Record.
     * @return An Optional with a Record with the recordId if it was found.
     * @throws MatOntoException Thrown if a connection to the repository could not be made.
     */
    <T extends Record> Optional<T> getRecord(Resource catalogId, Resource recordId, OrmFactory<T> factory) throws
            MatOntoException;

    /**
     * Gets the Record based on the provided identifier. The Record will be of type T which is determined by the
     * provided OrmFactory.
     *
     * @param identifier The String identifying the Record you want to get.
     * @param factory The OrmFactory of the Type of Record you want to get back.
     * @param <T> An Object which extends Record.
     * @return An Optional with a Record with the identifier if it was found.
     * @throws MatOntoException Thrown if a connection to the repository could not be made.
     */
    <T extends Record> Optional<T> getRecord(String identifier, OrmFactory<T> factory) throws MatOntoException;

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
     * @param distribution The Distribution to add to the UnversionedRecord.
     * @param unversionedRecordId The Resource identifying the UnversionedRecord which will get a new Distribution.
     * @throws MatOntoException Thrown if a connection to the repository could not be made.
     */
    void addDistributionToUnversionedRecord(Distribution distribution, Resource unversionedRecordId) throws
            MatOntoException;

    /**
     * Stores the provided Distribution in the repository and adds it to the Version identified by the provided
     * Resource.
     *
     * @param distribution The Distribution to add to the Version.
     * @param versionId The Resource identifying the Version which will get a new Distribution.
     * @throws MatOntoException Thrown if a connection to the repository could not be made.
     */
    void addDistributionToVersion(Distribution distribution, Resource versionId) throws MatOntoException;

    /**
     * Uses the provided Distribution to find the Resource of the existing Distribution and replaces it.
     *
     * @param newDistribution The Distribution with the desired changes.
     * @throws MatOntoException Thrown if a connection to the repository could not be made.
     */
    void updateDistribution(Distribution newDistribution) throws MatOntoException;

    /**
     * Removes the Distribution identified by the provided Resource from the repository if it was a Distribution for the
     * UnversionedRecord identified by the provided Resource.
     *
     * @param distributionId The Resource identifying the Distribution you want to remove.
     * @param unversionedRecordId The Resource identifying the UnversionedRecord to remove the Distribution from.
     * @throws MatOntoException Thrown if a connection to the repository could not be made.
     */
    void removeDistributionFromUnversionedRecord(Resource distributionId, Resource unversionedRecordId) throws
            MatOntoException;

    /**
     * Removes the Distribution identified by the provided Resource from the repository if it was a Distribution for the
     * Version identified by the provided Resource.
     *
     * @param distributionId The Resource identifying the Distribution you want to remove.
     * @param versionId The Resource identifying the Version to remove the Distribution from.
     * @throws MatOntoException Thrown if a connection to the repository could not be made.
     */
    void removeDistributionFromVersion(Resource distributionId, Resource versionId) throws MatOntoException;

    /**
     * Gets the Distribution identified by the provided Resource.
     *
     * @param distributionId The Resource identifying the Distribution you want to get.
     * @return An Optional of the Distribution if it exists.
     * @throws MatOntoException Thrown if a connection to the repository could not be made.
     */
    Optional<Distribution> getDistribution(Resource distributionId) throws MatOntoException;

    /**
     * Creates an Object which extends Version with the provided metadata using the provided OrmFactory.
     *
     * @param title The title text.
     * @param description The description text.
     * @param factory The OrmFactory used to create T.
     * @param <T> An Object which extends Version.
     * @return Version created with the provided metadata.
     */
    <T extends Version> T createVersion(@Nonnull String title, String description, OrmFactory<T> factory);

    /**
     * Stores the provided Version in the repository and adds it to the VersionedRecord identified by the provided
     * Resource. This also updates the latestVersion associated with that VersionedRecord to be this Version.
     *
     * @param version The Version to add to the VersionedRecord.
     * @param versionedRecordId The Resource identifying the VersionedRecord which will get a new Version.
     * @param <T> An Object which extends Version.
     * @throws MatOntoException Thrown if a connection to the repository could not be made.
     */
    <T extends Version> void addVersion(T version, Resource versionedRecordId) throws MatOntoException;

    /**
     * Uses the provided Version to find the Resource of the existing Version and replaces it.
     *
     * @param newVersion The Version with the desired changes.
     * @param <T> An Object which extends Version.
     * @throws MatOntoException Thrown if a connection to the repository could not be made.
     */
    <T extends Version> void updateVersion(T newVersion) throws MatOntoException;

    /**
     * Removes the Version identified by the provided Resource from the repository if it was a Version of the
     * VersionedRecord identified by the provided Resource.
     *
     * @param versionId The Resource identifying the Version you want to remove.
     * @param versionedRecordId The Resource identifying the VersionedRecord to remove the Version from.
     * @throws MatOntoException Thrown if a connection to the repository could not be made.
     */
    void removeVersion(Resource versionId, Resource versionedRecordId) throws MatOntoException;

    /**
     * Gets the Version identified by the provided Resource. The Version will be of type T which is determined by the
     * provided OrmFactory.
     *
     * @param versionId The Resource identifying the Version you want to get.
     * @param factory The OrmFactory identifying the type of Version you want to get back.
     * @param <T> An Object which extends Version.
     * @return An Optional of the Version if it exists.
     * @throws MatOntoException Thrown if a connection to the repository could not be made.
     */
    <T extends Version> Optional<T> getVersion(Resource versionId, OrmFactory<T> factory) throws MatOntoException;

    /**
     * Creates a Branch with the provided metadata.
     *
     * @param title The title text.
     * @param description The description text.
     * @return Branch created with the provided metadata.
     */
    Branch createBranch(@Nonnull String title, String description);

    /**
     * Stores the provided Branch in the repository and adds it to the VersinedRDFRecord identified by the provided
     * Resource.
     *
     * @param branch The Branch to add to the VersionedRDFRecord.
     * @param versionedRDFRecordId The Resource identifying the VersionedRDFRecord which will get a new Branch.
     * @throws MatOntoException Thrown if a connection to the repository could not be made.
     */
    void addBranch(Branch branch, Resource versionedRDFRecordId) throws MatOntoException;

    /**
     * Uses the provided Branch to find the Resource of the existing Branch and replaces it.
     *
     * @param newBranch The Branch with the desired changes.
     * @throws MatOntoException Thrown if a connection to the repository could not be made.
     */
    void updateBranch(Branch newBranch) throws MatOntoException;

    /**
     * Removes the Branch identified by the provided Resource from the repository if it was a Branch of the
     * VersionedRDFRecord identified by the provided Resource.
     *
     * @param branchId The Resource identifying the Branch you want to remove.
     * @param versionedRDFRecordId The Resource identifying the VersionedRDFRecord to remove the Branch from.
     * @throws MatOntoException Thrown if a connection to the repository could not be made.
     */
    void removeBranch(Resource branchId, Resource versionedRDFRecordId) throws MatOntoException;

    /**
     * Gets the Branch identified by the provided Resource.
     *
     * @param branchId The Resource identifying the Branch you want to get.
     * @return An Optional of the Branch if it exists.
     * @throws MatOntoException Thrown if a connection to the repository could not be made.
     */
    Optional<Branch> getBranch(Resource branchId) throws MatOntoException;

    /**
     * Creates a Commit from the provided InProgressCommit along with the message.
     *
     * @param inProgressCommit The InProgressCommit which is the basis for the created Commit.
     * @param message The String with the message text associated with the Commit.
     * @return Commit created based on the provided InProgressCommit with the message metadata.
     */
    Commit createCommit(@Nonnull InProgressCommit inProgressCommit, Set<Commit> parents, @Nonnull String message);

    /**
     * Creates an InProgressCommit which is a Commit that a User is actively working on. Once it is completed, the
     * InProgressCommit will be used to create a Commit with associated message.
     *
     * @param parents The Commit(s) that this InProgressCommit was informed by.
     * @param user The User that this InProgressCommit is associated with.
     * @param branchId The Resource identifying the Branch that this InProgressCommit is on.
     * @return Optional with an InProgressCommit created using the provided metadata if the identified branch exists.
     * @throws InvalidParameterException if branchId does not point to a Branch entity in the repository.
     */
    InProgressCommit createInProgressCommit(User user, Resource branchId) throws InvalidParameterException;

    /**
     * Adds the provided statements to the provided Commit as additions. These statements were added and will be used
     * when creating the completed named graph.
     *
     * @param statements The statements which were added to the named graph.
     * @param commitId The Resource identifying the Commit that these statements are associated with.
     * @throws MatOntoException Thrown if a connection to the repository could not be made.
     */
    void addAdditions(Model statements, Resource commitId) throws MatOntoException;

    /**
     * Adds the provided statements to the provided Commit as deletions. These statements were deleted and will be used
     * when creating the completed named graph.
     *
     * @param statements The statements which were added to the named graph.
     * @param commitId The Resource identifying the Commit that these statements are associated with.
     * @throws MatOntoException Thrown if a connection to the repository could not be made.
     */
    void addDeletions(Model statements, Resource commitId) throws MatOntoException;

    /**
     * Stores the provided Commit in the repository and adds it to the Branch identified by the provided Resource.
     *
     * @param commit The Commit to store in the repository.
     * @param branchId The Resource identifying the Branch to add the Commit to.
     * @throws MatOntoException Thrown if a connection to the repository could not be made.
     */
    void addCommitToBranch(Commit commit, Resource branchId) throws MatOntoException;

    /**
     * Adds the provided InProgressCommit to the repository.
     *
     * @param inProgressCommit The InProgressCommit to add to the repository.
     * @throws MatOntoException Thrown if a connection to the repository could not be made.
     */
    void addInProgressCommit(InProgressCommit inProgressCommit) throws MatOntoException;

    /**
     * Gets the Commit identified by the provided Resource.
     *
     * @param commitId The Resource identifying the Commit to get.
     * @param factory The OrmFactory identifying the type of Commit you want to get back.
     * @param <T> An Object which extends Commit.
     * @return Commit identified by the provided Resource if it exists.
     * @throws MatOntoException Thrown if a connection to the repository could not be made.
     */
    <T extends Commit> Optional<T> getCommit(Resource commitId, OrmFactory<T> factory) throws MatOntoException;

    /**
     * Removes the InProgressCommit identified by the provided Resource.
     *
     * @param inProgressCommitId The Resource identifying the InProgressCommit to be removed.
     * @throws MatOntoException Thrown if a connection to the repository could not be made.
     */
    void removeInProgressCommit(Resource inProgressCommitId) throws MatOntoException;

    /**
     * Applies the addition and deletion statements from the InProgressCommit identified by the provided Resource to the
     * Model provided and returns the combined Model.
     *
     * @param inProgressCommitId The Resource identifying the InProgressCommit to be added.
     * @param entity The Model which you want to apply the statements to.
     * @return A Model consisting of the provided Model statements with the proper statements added and/or removed.
     * @throws MatOntoException Thrown if a connection to the repository could not be made or the InProgressCommit
     *         could not be found in it's entirety.
     */
    Model applyInProgressCommit(Resource inProgressCommitId, Model entity) throws MatOntoException;

    /**
     * Gets a Set of Resources which all identify different Commits within the repository. The Commit identified by the
     * provided Resource is the last item in the Set and it was informed by the previous Commit in the Set. This
     * association is repeated until you get to the beginning of the Set. The resulting Set can then be thought about
     * the chain of Commits on a Branch terminating at the Commit identified by the provided Resource.
     *
     * @param commitId The Resource identifying the Commit for the desired chain.
     * @return Set of Resources identifying the Commits which make up the commit chain for the provided Commit.
     * @throws MatOntoException Thrown if a connection to the repository could not be made.
     */
    LinkedHashSet<Resource> getCommitChain(Resource commitId) throws MatOntoException;

    /**
     * Gets the Model which represents the entity at the instance of the Commit identified by the provided Resource
     * using previous Commit data to construct it.
     *
     * @param commitId The Resource identifying the Commit identifying the spot in the entity's history that you wish
     *                 to retrieve.
     * @return Model which represents the Resource at the Commit's point in history.
     * @throws MatOntoException Thrown if a connection to the repository could not be made.
     */
    Optional<Model> getCompiledResource(Resource commitId) throws MatOntoException;

    /**
     * Gets all of the conflicts between the two provided Commits.
     *
     * @param leftId The left (first) Commit.
     * @param rightId The right (second) Commit.
     * @return Set of Conflicts
     * @throws MatOntoException Thrown if a connection to the repository could not be made.
     */
    Set<Conflict> getConflicts(Resource leftId, Resource rightId) throws MatOntoException;

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
