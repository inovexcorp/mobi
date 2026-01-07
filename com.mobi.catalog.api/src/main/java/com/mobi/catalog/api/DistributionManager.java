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

import com.mobi.catalog.api.builder.DistributionConfig;
import com.mobi.catalog.api.ontologies.mcat.Distribution;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.repository.RepositoryConnection;

import java.util.Set;

public interface DistributionManager {

    /**
     * Stores the provided Distribution in the repository and adds it to the UnversionedRecord identified by the
     * provided Resource.
     *
     * @param catalogId           The Resource identifying the Catalog which contains the Record.
     * @param unversionedRecordId The Resource identifying the UnversionedRecord which will get the new Distribution.
     * @param distribution        The Distribution to add to the UnversionedRecord.
     * @param conn                A RepositoryConnection to use for lookup.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or the Distribution already exists in the
     *                                  repository.
     */
    void addUnversionedDistribution(Resource catalogId, Resource unversionedRecordId, Distribution distribution,
                                    RepositoryConnection conn);

    /**
     * Stores the provided Distribution in the repository and adds it to the Version identified by the provided
     * Resources.
     *
     * @param catalogId         The Resource identifying the Catalog which contains the Record.
     * @param versionedRecordId The Resource identifying the VersionedRecord which has the Version.
     * @param versionId         The Resource identifying the Version which will get the new Distribution.
     * @param distribution      The Distribution to add to the Version.
     * @param conn              A RepositoryConnection to use for lookup.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, the Version could not be found, or the
     *                                  Distribution already exists in the repository.
     */
    void addVersionedDistribution(Resource catalogId, Resource versionedRecordId, Resource versionId,
                                  Distribution distribution, RepositoryConnection conn);

    /**
     * Creates a Distribution with the metadata from the provided DistributionConfig.
     *
     * @param config The DistributionConfig which contains the needed metadata to create the Distribution.
     * @return Distribution created with the provided metadata.
     */
    Distribution createDistribution(DistributionConfig config);

    /**
     * Retrieves a unversioned Distribution identified by the provided Resources.
     *
     * @param catalogId      The Resource identifying the Catalog which has the Record.
     * @param recordId       The Resource identifying the Record which has the Distribution.
     * @param distributionId The Resource of the Distribution to retrieve.
     * @param conn           A RepositoryConnection to use for lookup.
     * @return The identified Distribution.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, the Distribution does not belong to the
     *                                  Record, or the Distribution could not be found.
     */
    Distribution getUnversionedDistribution(Resource catalogId, Resource recordId, Resource distributionId,
                                            RepositoryConnection conn);

    /**
     * Gets the Set of Distributions for an UnversionedRecord identified by the provided Resources.
     *
     * @param catalogId           The Resource identifying the Catalog which contains the Record.
     * @param unversionedRecordId The Resource identifying the UnversionedRecord which has the Distributions.
     * @param conn                A RepositoryConnection to use for lookup.
     * @return The Set of Distributions for the UnversionedRecord if they exist.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or any of the Distributions could not be
     *                                  found.
     */
    Set<Distribution> getUnversionedDistributions(Resource catalogId, Resource unversionedRecordId,
                                                  RepositoryConnection conn);

    /**
     * Retrieves a versioned Distribution identified by the provided Resources.
     *
     * @param catalogId      The Resource identifying the Catalog which has the Record.
     * @param recordId       The Resource of the Record which has the Version.
     * @param versionId      The Resource of the Version which has the Distribution.
     * @param distributionId The Resource of the Distribution to retrieve.
     * @param conn           A RepositoryConnection to use for lookup.
     * @return The identified Distribution.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, the Version does not belong to the
     *                                  Record, the Version could not be found, the Distribution does not belong to the
     *                                  Version, or the Distribution could not be found.
     */
    Distribution getVersionedDistribution(Resource catalogId, Resource recordId, Resource versionId,
                                          Resource distributionId, RepositoryConnection conn);

    /**
     * Gets the Set of Distributions for the Version identified by the provided Resources.
     *
     * @param catalogId         The Resource identifying the Catalog which contains the Record.
     * @param versionedRecordId The Resource identifying the VersionedRecord which has the Version.
     * @param versionId         The Resource identifying the Version which has the Distributions.
     * @param conn              A RepositoryConnection to use for lookup.
     * @return The Set of Distributions for the Version if they exist.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, the Version could not be found, or any
     *                                  of the Distributions could not be found.
     */
    Set<Distribution> getVersionedDistributions(Resource catalogId, Resource versionedRecordId, Resource versionId,
                                                RepositoryConnection conn);

    /**
     * Removes the Distribution of a UnversionedRecord identified by the provided Resources from the repository.
     *
     * @param catalogId           The Resource identifying the Catalog which contains the Record.
     * @param unversionedRecordId The Resource identifying the UnversionedRecord which has the Distribution.
     * @param distributionId      The Resource identifying the Distribution you want to remove.
     * @param conn                A RepositoryConnection to use for lookup.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or the Distribution could not be found.
     */
    void removeUnversionedDistribution(Resource catalogId, Resource unversionedRecordId, Resource distributionId,
                                       RepositoryConnection conn);

    /**
     * Removes the Distribution of a Version identified by the provided Resources from the repository.
     *
     * @param catalogId         The Resource identifying the Catalog which contains the Record.
     * @param versionedRecordId The Resource identifying the VersionedRecord which has the Version.
     * @param versionId         The Resource identifying the Version which has the Distribution.
     * @param distributionId    The Resource identifying the Distribution you want to remove.
     * @param conn              A RepositoryConnection to use for lookup.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, the Version could not be found, or the
     *                                  Distribution could not be found.
     */
    void removeVersionedDistribution(Resource catalogId, Resource versionedRecordId, Resource versionId,
                                     Resource distributionId, RepositoryConnection conn);

    /**
     * Uses the provided Resources and Distribution to find the Resource of an existing Distribution on an
     * UnversionedRecord and replaces it.
     *
     * @param catalogId           The Resource identifying the Catalog which contains the Record.
     * @param unversionedRecordId The Resource identifying the UnversionedRecord which has the Distribution.
     * @param newDistribution     The Distribution with the desired changes.
     * @param conn                A RepositoryConnection to use for lookup.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or the Distribution could not be found.
     */
    void updateUnversionedDistribution(Resource catalogId, Resource unversionedRecordId, Distribution newDistribution,
                                       RepositoryConnection conn);

    /**
     * Uses the provided Resources and Distribution to find the Resource of an existing Distribution on a Version and
     * replaces it.
     *
     * @param catalogId         The Resource identifying the Catalog which contains the Record.
     * @param versionedRecordId The Resource identifying the VersionedRecord which has the Version.
     * @param versionId         The Resource identifying the Version which has the Distribution.
     * @param newDistribution   The Distribution with the desired changes.
     * @param conn              A RepositoryConnection to use for lookup.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, the Version could not be found, or the
     *                                  Distribution could not be found.
     */
    void updateVersionedDistribution(Resource catalogId, Resource versionedRecordId, Resource versionId,
                                     Distribution newDistribution, RepositoryConnection conn);

    /**
     * Validates the existence of a Distribution of an UnversionedRecord.
     *
     * @param catalogId      The Resource identifying the Catalog which should have the Record.
     * @param recordId       The Resource identifying the Record which should have the Distribution.
     * @param distributionId The Resource of the Distribution.
     * @param conn           A RepositoryConnection to use for lookup.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or the Distribution does not belong to
     *                                  the Record.
     */
    void validateUnversionedDistribution(Resource catalogId, Resource recordId, Resource distributionId,
                                         RepositoryConnection conn);

    /**
     * Validates the existence of a Distribution of a Version.
     *
     * @param catalogId      The Resource identifying the Catalog which should have the Record.
     * @param recordId       The Resource identifying the Record which should have the Version.
     * @param versionId      The Resource identifying the Version which should have the Distribution.
     * @param distributionId The Resource of the Distribution.
     * @param conn           A RepositoryConnection to use for lookup.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, the Version does not belong to the
     *                                  Record, the Version could not be found, or the Distribution does not belong to
     *                                  the Version.
     */
    void validateVersionedDistribution(Resource catalogId, Resource recordId, Resource versionId,
                                       Resource distributionId, RepositoryConnection conn);
}
