package com.mobi.catalog.api;

/*-
 * #%L
 * com.mobi.catalog.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import com.mobi.catalog.api.ontologies.mcat.MasterBranch;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.rdf.orm.OrmFactory;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.repository.RepositoryConnection;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import javax.annotation.Nonnull;

public interface BranchManager {

    /**
     * Stores the provided Branch in the repository and adds it to the VersionedRDFRecord identified by the provided
     * Resources.
     *
     * @param <T>                  An Object which extends Branch.
     * @param catalogId            The Resource identifying the Catalog which has the Record.
     * @param versionedRDFRecordId The Resource identifying the VersionedRDFRecord which will get the new Branch.
     * @param branch               The Branch to add to the VersionedRDFRecord.
     * @param conn                 A RepositoryConnection to use for lookup.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or the Branch already exists in the
     *                                  repository.
     */
    <T extends Branch> void addBranch(Resource catalogId, Resource versionedRDFRecordId, T branch,
                                      RepositoryConnection conn);

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
     * Retrieves a Branch identified by the provided Resources. The Branch will be of type T which is determined by
     * the provided OrmFactory.
     *
     * @param catalogId The Resource identifying the Catalog which should have the Record.
     * @param recordId  The Resource of the Record which should have the Branch.
     * @param branchId  The Resource of the Branch to retrieve.
     * @param factory   The OrmFactory of the type of Branch you want to get back.
     * @param conn      A RepositoryConnection to use for lookup.
     * @param <T>       A Class that extends Branch.
     * @return The identified Branch.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, the Branch does not belong to the Record,
     *                                  or the Branch could not be found.
     */
    <T extends Branch> T getBranch(Resource catalogId, Resource recordId, Resource branchId, OrmFactory<T> factory,
                                   RepositoryConnection conn);

    /**
     * Retrieves a Branch from the provided VersionedRDFRecord. The Branch will be of type T which is determined by the
     * provided OrmFactory.
     *
     * @param record   The Record which should have the Branch.
     * @param branchId The Resource of the Branch to retrieve.
     * @param factory  The OrmFactory of the type of Branch you want to get back.
     * @param conn     A RepositoryConnection to use for lookup.
     * @param <T>      A Class that extends Branch.
     * @return The identified Branch.
     * @throws IllegalArgumentException Thrown if the Branch does not belong to the Record or the Branch could not
     *                                  be found.
     */
    <T extends Branch> T getBranch(VersionedRDFRecord record, Resource branchId, OrmFactory<T> factory,
                                   RepositoryConnection conn);

    /**
     * Gets the Set of Branches for a VersionedRDFRecord identified by the provided Resources.
     *
     * @param catalogId            The Resource identifying the Catalog which has the Record.
     * @param versionedRDFRecordId The Resource identifying the VersionedRDFRecord which has the Branches.
     * @param conn                 A RepositoryConnection to use for lookup.
     * @return The Set of Branches for the VersionedRDFRecord if they exist.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or any of the Branches could not be
     *                                  found.
     */
    Set<Branch> getBranches(Resource catalogId, Resource versionedRDFRecordId, RepositoryConnection conn);

    /**
     * Gets the Branch identified by the provided Resources. The Branch will be of type T which is determined by the
     * provided OrmFactory. Returns an empty Optional if the Branch does not belong to the Record.
     *
     * @param <T>                  An Object which extends Branch.
     * @param catalogId            The Resource identifying the Catalog which contains the Record.
     * @param versionedRDFRecordId The Resource identifying the VersionedRDFRecord which has the Branch.
     * @param branchId             The Resource identifying the Branch you want to get.
     * @param factory              The OrmFactory identifying the type of Branch you want to get.
     * @param conn                 A RepositoryConnection to use for lookup.
     * @return The Branch if it exists.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found or the Record could not be found.
     * @throws IllegalStateException    Thrown if the Branch could not be found.
     */
    <T extends Branch> Optional<T> getBranchOpt(Resource catalogId, Resource versionedRDFRecordId, Resource branchId,
                                                OrmFactory<T> factory, RepositoryConnection conn);

    /**
     * Retrieves the HEAD graph of the MASTER branch.
     *
     * @param masterBranch The MasterBranch to retrieve the HEAD graph from
     * @return A Resource identifying the HEAD graph of the MASTER branch
     */
    IRI getHeadGraph(MasterBranch masterBranch);

    /**
     * Gets the master Branch of the VersionedRDFRecord identified by the provided Resources.
     *
     * @param catalogId            The Resource identifying the Catalog which contains the Record.
     * @param versionedRDFRecordId The Resource identifying the VersionedRDFRecord which has the Branch.
     * @param conn                 A RepositoryConnection to use for lookup.
     * @return The master Branch of the VersionedRDFRecord if it exists.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, or the
     *                                  Record does not belong to the Catalog.
     * @throws IllegalStateException    Thrown if the Branch could not be found or the VersionedRDFRecord does not have
     *                                  a master Branch.
     */
    MasterBranch getMasterBranch(Resource catalogId, Resource versionedRDFRecordId, RepositoryConnection conn);

    /**
     * Retrieves the MasterBranch version of the supplied Branch.
     *
     * @param branch The branch that is the MasterBranch
     * @param conn A RepositoryConnection to use for lookup
     * @return The MasterBranch version of the supplied Branch
     */
    MasterBranch getMasterBranch(Branch branch, RepositoryConnection conn);

    /**
     * Determines if the provided Branch the master branch.
     *
     * @param record The VersionedRDFRecord to compare the branch against
     * @param branch The Branch to check if it is the master branch
     * @return true if the branch is the master branch, otherwise false
     */
    boolean isMasterBranch(VersionedRDFRecord record, Branch branch);

    /**
     * Removes the non-master Branch identified by the provided Resources from the repository. If the provided Branch
     * is the master Branch, it will not be removed.
     *
     * @param catalogId            The Resource identifying the Catalog which contains the Record.
     * @param versionedRDFRecordId The Resource identifying the VersionedRDFRecord which has the Branch.
     * @param branchId             The Resource identifying the Branch you want to remove.
     * @param conn                 A RepositoryConnection to use for lookup.
     * @return List of IRIs of all the Commits removed as part of the Branch
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or the Branch could not be found.
     * @throws IllegalStateException    Thrown if a Commit in the Branch does not have the additions/deletions set.
     */
    List<Resource> removeBranch(Resource catalogId, Resource versionedRDFRecordId, Resource branchId,
                                RepositoryConnection conn);

    /**
     * Uses the provided Resources and Branch to find the Resource of the existing non-master Branch and replaces it.
     * If the provided Branch is the master Branch, it will not be updated.
     *
     * @param <T>                  An Object which extends Branch.
     * @param catalogId            The Resource identifying the Catalog which contains the Record.
     * @param versionedRDFRecordId The Resource identifying the VersionedRDFRecord that has the Branch.
     * @param newBranch            The Branch with the desired changes.
     * @param conn                 A RepositoryConnection to use for lookup.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or the Branch could not be found.
     * @throws IllegalStateException    Thrown if the Branch is the master Branch of the Record.
     */
    <T extends Branch> void updateBranch(Resource catalogId, Resource versionedRDFRecordId, T newBranch,
                                         RepositoryConnection conn);

    /**
     * Validates the existence of a Branch of a VersionedRDFRecord.
     *
     * @param catalogId The Resource identifying the Catalog which should have the Record.
     * @param recordId  The Resource identifying the Record which should have the Branch.
     * @param branchId  The Resource of the Branch.
     * @param conn      A RepositoryConnection to use for lookup.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or the Branch does not belong to the
     *                                  Record.
     */
    void validateBranch(Resource catalogId, Resource recordId, Resource branchId, RepositoryConnection conn);
}
