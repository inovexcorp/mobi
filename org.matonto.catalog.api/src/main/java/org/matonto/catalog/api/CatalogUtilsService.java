package org.matonto.catalog.api;

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
import org.matonto.catalog.api.ontologies.mcat.Distribution;
import org.matonto.catalog.api.ontologies.mcat.InProgressCommit;
import org.matonto.catalog.api.ontologies.mcat.Record;
import org.matonto.catalog.api.ontologies.mcat.Version;
import org.matonto.catalog.api.ontologies.mcat.VersionedRDFRecord;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.orm.OrmFactory;
import org.matonto.rdf.orm.Thing;
import org.matonto.repository.api.RepositoryConnection;

import java.util.Optional;

public interface CatalogUtilsService {
    /**
     * Checks to see if the provided Resource exists as a context in the Repository.
     *
     * @param resourceIRI The Resource context to look for in the Repository.
     * @param conn A RepositoryConnection to use for lookup.
     * @return True if the Resource is in the Repository as a context for statements; otherwise, false.
     */
    boolean resourceExists(Resource resourceIRI, RepositoryConnection conn);

    /**
     * Checks to see if the provided Resource exists in the Repository and is of the provided type.
     *
     * @param resourceIRI The Resource to look for in the Repository.
     * @param type The String of the IRI identifying the type of entity in the Repository.
     * @param conn A RepositoryConnection to use for lookup.
     * @return True if the Resource is in the Repository; otherwise, false.
     */
    boolean resourceExists(Resource resourceIRI, String type, RepositoryConnection conn);

    /**
     * Tests if the provided Resource exists as the class identified by the provided IRI in the Repository. If not,
     * throws an IllegalArgumentException.
     *
     * @param objectId The Resource to search for in the Repository.
     * @param classId The IRI identifying the type the entity should be.
     * @param conn A RepositoryConnection to use for lookup.
     * @throws IllegalArgumentException Thrown if the Resource does not exist as the class.
     */
    void testObjectId(Resource objectId, IRI classId, RepositoryConnection conn);

    /**
     * Adds the provided object to the Repository in a named graph of its Resource.
     *
     * @param object An object to add to the Repository.
     * @param conn A RepositoryConnection to use for lookup.
     * @param <T> A Class that extends Thing.
     */
    <T extends Thing> void addObject(T object, RepositoryConnection conn);

    /**
     * Updates the provided object in the Repository by first removing it, then adding the new model back in.
     *
     * @param object A new version of an object to update in the Repository.
     * @param conn A RepositoryConnection to use for lookup.
     * @param <T> A Class that extends Thing.
     */
    <T extends Thing> void updateObject(T object, RepositoryConnection conn);

    /**
     * Retrieves an object identified by the provided Resource from the Repository using the provided OrmFactory if
     * found.
     *
     * @param id The Resource identifying the object to retrieve.
     * @param factory The OrmFactory which specifies the type the object should be.
     * @param conn A RepositoryConnection to use for lookup.
     * @param <T> A Class that extends Thing.
     * @return The identified object if found; empty Optional otherwise.
     */
    <T extends Thing> Optional<T> optObject(Resource id, OrmFactory<T> factory, RepositoryConnection conn);

    /**
     * Retrieves an object identified by the provided Resource from the Repository using the provided OrmFactory.
     * Throws a IllegalArgumentException if the object cannot be found.
     *
     * @param id The Resource identifying the object to retrieve.
     * @param factory The OrmFactory which specifies the type the object should be.
     * @param conn A RepositoryConnection to use for lookup.
     * @param <T> A Class that extends Thing.
     * @return The identified object.
     * @throws IllegalArgumentException Thrown if the object cannot be found.
     */
    <T extends Thing> T getObject(Resource id, OrmFactory<T> factory, RepositoryConnection conn);

    /**
     * Removes the object identified by the provided Resource.
     *
     * @param resourceId The Resource identifying the object to be removed.
     * @param conn A RepositoryConnection to use for lookup.
     */
    void remove(Resource resourceId, RepositoryConnection conn);

    /**
     * Removes the provided Object from the Repository.
     *
     * @param object The Object in the Repository to remove.
     * @param conn A RepositoryConnection to use for lookup.
     * @param <T> A Class that extends Thing.
     */
    <T extends Thing> void removeObject(T object, RepositoryConnection conn);

    /**
     * Tests the path to a Record using the provided Resources and IRI of a subclass of Record. If a portion of the
     * path is incorrect, throws a IllegalArgumentException.
     *
     * @param catalogId The Resource identifying the Catalog which should have the Record.
     * @param recordId The Resource of the Record.
     * @param recordType The IRI of the type of Record.
     * @param conn A RepositoryConnection to use for lookup.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, or the
     *      Record does not belong to the Catalog.
     */
    void testRecordPath(Resource catalogId, Resource recordId, IRI recordType, RepositoryConnection conn);

    /**
     * Retrieves a Record identified by the provided Resources. The Record will be of type T which is determined by the
     * provided OrmFactory.
     *
     * @param catalogId The Resource identifying the Catalog which should have the Record.
     * @param recordId The Resource of the Record to retrieve.
     * @param factory The OrmFactory of the type of Record you want to get back.
     * @param conn A RepositoryConnection to use for lookup.
     * @param <T> A Class that extends Record.
     * @return The identified Record.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, or the
     *      Record does not belong to the Catalog.
     */
    <T extends Record> T getRecord(Resource catalogId, Resource recordId, OrmFactory<T> factory,
                                   RepositoryConnection conn);

    /**
     * Tests the path to a unversioned Distribution using the provided Resources. If a portion of the path is
     * incorrect, throws an IllegalArgumentException.
     *
     * @param catalogId The Resource identifying the Catalog which should have the Record.
     * @param recordId The Resource identifying the Record which should have the Distribution.
     * @param distributionId The Resource of the Distribution.
     * @param conn A RepositoryConnection to use for lookup.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *      Record does not belong to the Catalog, or the Distribution does not belong to the Record.
     */
    void testUnversionedDistributionPath(Resource catalogId, Resource recordId, Resource distributionId,
                                         RepositoryConnection conn);

    /**
     * Retrieves a unversioned Distribution identified by the provided Resources.
     *
     * @param catalogId The Resource identifying the Catalog which has the Record.
     * @param recordId The Resource identifying the Record which has the Distribution.
     * @param distributionId The Resource of the Distribution to retrieve.
     * @param conn A RepositoryConnection to use for lookup.
     * @return The identified Distribution.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *      Record does not belong to the Catalog, the Distribution does not belong to the Record, or the Distribution
     *      could not be found.
     */
    Distribution getUnversionedDistribution(Resource catalogId, Resource recordId, Resource distributionId,
                                            RepositoryConnection conn);

    /**
     * Tests the path to a Version using the provided Resources. If a portion of the path is incorrect, throws an
     * IllegalArgumentException.
     *
     * @param catalogId The Resource identifying the Catalog which should have the Record.
     * @param recordId The Resource identifying the Record which should have the Version.
     * @param versionId The Resource of the Version.
     * @param conn A RepositoryConnection to use for lookup.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *      Record does not belong to the Catalog, or the Version does not belong to the Record.
     */
    void testVersionPath(Resource catalogId, Resource recordId, Resource versionId, RepositoryConnection conn);

    /**
     * Retrieves a Version identified by the provided Resources. The Version will be of type T which is determined by
     * the provided OrmFactory.
     *
     * @param catalogId The Resource identifying the Catalog which has the Record.
     * @param recordId The Resource of the Record which has the Version.
     * @param versionId The Resource of the Version to retrieve.
     * @param factory The OrmFactory of the type of Version you want to get back.
     * @param conn A RepositoryConnection to use for lookup.
     * @param <T> A Class that extends Version.
     * @return The identified Version.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *      Record does not belong to the Catalog, the Version does not belong to the Record, or the Version could
     *      not be found.
     */
    <T extends Version> T getVersion(Resource catalogId, Resource recordId, Resource versionId, OrmFactory<T> factory,
                                     RepositoryConnection conn);

    /**
     * Tests the path to a versioned Distribution using the provided Resources. If a portion of the path is incorrect,
     * throws an IllegalArgumentException.
     *
     * @param catalogId The Resource identifying the Catalog which should have the Record.
     * @param recordId The Resource identifying the Record which should have the Version.
     * @param versionId The Resource identifying the Version which should have the Distribution.
     * @param distributionId The Resource of the Distribution.
     * @param conn A RepositoryConnection to use for lookup.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *      Record does not belong to the Catalog, the Version does not belong to the Record, the Version could not be
     *      found, or the Distribution does not belong to the Version.
     */
    void testVersionedDistributionPath(Resource catalogId, Resource recordId, Resource versionId,
                                       Resource distributionId, RepositoryConnection conn);

    /**
     * Retrieves a versioned Distribution identified by the provided Resources.
     *
     * @param catalogId The Resource identifying the Catalog which has the Record.
     * @param recordId The Resource of the Record which has the Version.
     * @param versionId The Resource of the Version which has the Distribution.
     * @param distributionId The Resource of the Distribution to retrieve.
     * @param conn A RepositoryConnection to use for lookup.
     * @return The identified Distribution.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *      Record does not belong to the Catalog, the Version does not belong to the Record, the Version could not be
     *      found, the Distribution does not belong to the Version, or the Distribution could not be found.
     */
    Distribution getVersionedDistribution(Resource catalogId, Resource recordId, Resource versionId,
                                          Resource distributionId, RepositoryConnection conn);

    /**
     * Tests the path to a Branch using the provided Resources. If a portion of the path is incorrect, throws a
     * IllegalArgumentException.
     *
     * @param catalogId The Resource identifying the Catalog which should have the Record.
     * @param recordId The Resource identifying the Record which should have the Branch.
     * @param branchId The Resource of the Branch.
     * @param conn A RepositoryConnection to use for lookup.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *      Record does not belong to the Catalog, or the Branch does not belong to the Record.
     */
    void testBranchPath(Resource catalogId, Resource recordId, Resource branchId, RepositoryConnection conn);

    /**
     * Retrieves a Branch identified by the provided Resources. The Branch will be of type T which is determined by
     * the provided OrmFactory.
     *
     * @param catalogId The Resource identifying the Catalog which should have the Record.
     * @param recordId The Resource of the Record which should have the Branch.
     * @param branchId The Resource of the Branch to retrieve.
     * @param factory The OrmFactory of the type of Branch you want to get back.
     * @param conn A RepositoryConnection to use for lookup.
     * @param <T> A Class that extends Branch.
     * @return The identified Branch.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *      Record does not belong to the Catalog, the Branch does not belong to the Record, or the Branch could not
     *      be found.
     */
    <T extends Branch> T getBranch(Resource catalogId, Resource recordId, Resource branchId, OrmFactory<T> factory,
                                   RepositoryConnection conn);

    /**
     * Retrieves a Branch from the provided VersionedRDFRecord. The Branch will be of type T which is determined by the
     * provided OrmFactory.
     *
     * @param record The Record which should have the Branch.
     * @param branchId The Resource of the Branch to retrieve.
     * @param factory The OrmFactory of the type of Branch you want to get back.
     * @param conn A RepositoryConnection to use for lookup.
     * @param <T> A Class that extends Branch.
     * @return The identified Branch.
     * @throws IllegalArgumentException Thrown if the Branch does not belong to the Record or the Branch could not
     *      be found.
     */
    <T extends Branch> T getBranch(VersionedRDFRecord record, Resource branchId, OrmFactory<T> factory,
                                   RepositoryConnection conn);

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
     * Tests the path to an InProgressCommit using the provided Resources. If a portion of the path is incorrect,
     * throws a IllegalArgumentException.
     *
     * @param catalogId The Resource identifying the Catalog which should have the Record.
     * @param recordId The Resource identifying the Record which should have the InProgressCommit.
     * @param commitId The Resource of the InProgressCommit.
     * @param conn A RepositoryConnection to use for lookup.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *      Record does not belong to the Catalog, the InProgressCommit could not be found, or the InProgressCommit
     *      does not belong to the Record.
     * @throws IllegalStateException Thrown if the InProgressCommit has no Record set.
     */
    void testInProgressCommitPath(Resource catalogId, Resource recordId, Resource commitId,
                                  RepositoryConnection conn);

    /**
     * Retrieves an InProgressCommit identified by the provided Record Resource and User Resource.
     *
     * @param recordId The Resource identifying the Record with the InProgressCommit.
     * @param userId The Resource identifying the User with the InProgressCommit.
     * @param conn A RepositoryConnection to use for lookup.
     * @return The identified InProgressCommit.
     * @throws IllegalArgumentException Thrown if the InProgressCommit could not be found.
     */
    InProgressCommit getInProgressCommit(Resource recordId, Resource userId, RepositoryConnection conn);

    /**
     * Retrieves an InProgressCommit identified by the provided Resources.
     *
     * @param catalogId The Resource identifying the Catalog with the Record.
     * @param recordId The Resource identifying the Record with the InProgressCommit.
     * @param commitId The Resource identifying the InProgressCommit.
     * @param conn A RepositoryConnection to use for lookup.
     * @return The identified InProgressCommit.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *      Record does not belong to the Catalog, the InProgressCommit could not be found, or the InProgressCommit
     *      does not belong to the Record.
     * @throws IllegalStateException Thrown if the InProgressCommit has no Record set.
     */
    InProgressCommit getInProgressCommit(Resource catalogId, Resource recordId, Resource commitId,
                                         RepositoryConnection conn);

    /**
     * Gets the IRI of the InProgressCommit for the User identified by the provided Resource for the VersionedRDFRecord
     * identified by the provided Resource.
     *
     * @param recordId The Resource identifying the Record which should have the InProgressCommit.
     * @param userId The Resource identifying the User which should have the InProgressCommit.
     * @return The Resource of the InProgressCommit if it exists.
     */
    Optional<Resource> getInProgressCommitIRI(Resource recordId, Resource userId, RepositoryConnection conn);

    /**
     * Removes the provided InProgressCommit from the Repository. Removes the delta named graphs of the InProgressCommit
     * if they are not referenced elsewhere.
     *
     * @param commit The InProgressCommit to remove.
     * @param conn A RepositoryConnection to use for lookup.
     */
    void removeInProgressCommit(InProgressCommit commit, RepositoryConnection conn);

    /**
     * Adds the provided addition and deletion Models to the Commit identified by the provided Resource.
     *
     * @param commitId The Resource identifying the Commit which will get the changes.
     * @param additions The statements which were added to the named graph.
     * @param deletions The statements which were deleted from the named graph.
     * @param conn A RepositoryConnection to use for lookup.
     * @throws IllegalStateException Thrown if the Commit has no addition or deletion graph.
     */
    void updateCommit(Resource commitId, Model additions, Model deletions, RepositoryConnection conn);

    /**
     * Adds the provided addition and deletion Models to the provided Commit.
     *
     * @param commit The Commit which will get the changes.
     * @param additions The statements which were added to the named graph.
     * @param deletions The statements which were deleted from the named graph.
     * @param conn A RepositoryConnection to use for lookup.
     * @throws IllegalStateException Thrown if the Commit has no addition or deletion graph.
     */
    void updateCommit(Commit commit, Model additions, Model deletions, RepositoryConnection conn);

    /**
     * Adds the provided Commit to the provided Branch, updating the head Commit in the process.
     *
     * @param branch The Branch which will get the new Commit.
     * @param commit The Commit to add to the Branch.
     * @param conn A RepositoryConnection to use for lookup.
     * @throws IllegalArgumentException Thrown if the Commit already exists.
     */
    void addCommit(Branch branch, Commit commit, RepositoryConnection conn);

    /**
     * Gets the Resource identifying the graph that contains the additions statements of the Commit identified by the
     * provided Resource.
     *
     * @param commitId The Resource identifying the Commit that has the additions.
     * @param conn A RepositoryConnection to use for lookup.
     * @return The Resource for the additions graph.
     * @throws IllegalStateException Thrown if the Commit has no additions graph.
     */
    Resource getAdditionsResource(Resource commitId, RepositoryConnection conn);

    /**
     * Gets the Resource identifying the graph that contains the additions statements of the provided Commit.
     *
     * @param commit The Commit with the additions.
     * @return The Resource for the additions graph.
     * @throws IllegalStateException Thrown if the Commit has no additions graph.
     */
    Resource getAdditionsResource(Commit commit);

    /**
     * Gets the Resource identifying the graph that contains the deletions statements of the Commit identified by the
     * provided Resource.
     *
     * @param commitId The Resource identifying the Commit that has the deletions.
     * @param conn A RepositoryConnection to use for lookup.
     * @return The Resource for the deletions graph.
     * @throws IllegalStateException Thrown if the Commit has no deletions graph.
     */
    Resource getDeletionsResource(Resource commitId, RepositoryConnection conn);

    /**
     * Gets the Resource identifying the graph that contains the additions statements of the provided Commit.
     *
     * @param commit The Commit with the deletions.
     * @return The Resource for the deletions graph.
     * @throws IllegalStateException Thrown if the Commit has no deletions graph.
     */
    Resource getDeletionsResource(Commit commit);

    /**
     * Adds the provided statements as changes in the target named graph. If a statement in the changes exists in the
     * opposite named graph, they are removed from that named graph and not added to the target.
     *
     * @param targetNamedGraph A Resource identifying the target named graph for the changes. Assumed to be the
     *                         additions or deletions named graph of a Commit.
     * @param oppositeNamedGraph A Resource identifying the opposite named graph from the target. For example, the
     *                           opposite of a deletions named graph is the additions and vice versa.
     * @param changes The statements which represent changes to the named graph.
     * @param conn A RepositoryConnection to use for lookup.
     */
    void addChanges(Resource targetNamedGraph, Resource oppositeNamedGraph, Model changes, RepositoryConnection conn);

    /**
     * Returns an IllegalArgumentException stating that an object of the type determined by the provided OrmFactory with
     * the provided Resource ID already exists within the Repository.
     *
     * @param id The Resource ID of the object that already exists.
     * @param factory The OrmFactory of the type of the object.
     * @param <T> A Class that extends Thing.
     * @return An IllegalArgumentException with an appropriate message.
     */
    <T extends Thing> IllegalArgumentException throwAlreadyExists(Resource id, OrmFactory<T> factory);

    /**
     * Returns an IllegalStateException stating that an object of the type determined by the provided OrmFactory with
     * the provided Resource ID could not be found within the Repository.
     *
     * @param id The Resource ID of the object that could not be found.
     * @param factory The OrmFactory of the type of the object.
     * @param <T> A Class that extends Thing.
     * @return An IllegalStateException with an appropriate message.
     */
    <T extends Thing> IllegalStateException throwThingNotFound(Resource id, OrmFactory<T> factory);

    /**
     * Returns an IllegalArgumentException stating that an object of the type determined by the first provided
     * OrmFactory with the first provided Resource ID does not belong to an object of the type determined by the second
     * provided OrmFactory with the second provided Resource ID.
     *
     * @param child The Resource ID of the child object that does not belong to the parent.
     * @param childFactory The OrmFactory of the type of the child object.
     * @param parent The Resource ID of the parent object that does not have the child.
     * @param parentFactory The OrmFactory of the type of the parent object.
     * @param <T> A Class that extends Thing.
     * @param <S> A Class that extends Thing.
     * @return An IllegalArgumentException with an appropriate message.
     */
    <T extends Thing, S extends Thing> IllegalArgumentException throwDoesNotBelong(Resource child,
                                                                                   OrmFactory<T> childFactory,
                                                                                   Resource parent,
                                                                                   OrmFactory<S> parentFactory);
}
