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

import com.mobi.catalog.api.ontologies.mcat.Version;
import com.mobi.rdf.orm.OrmFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.repository.RepositoryConnection;

import java.util.Optional;
import java.util.Set;
import javax.annotation.Nonnull;

public interface VersionManager {

    /**
     * Stores the provided Version in the repository and adds it to the VersionedRecord identified by the provided
     * Resources. This also updates the latestVersion associated with that VersionedRecord to be this Version.
     *
     * @param <T>               An Object which extends Version.
     * @param catalogId         The Resource identifying the Catalog which contains the Record.
     * @param versionedRecordId The Resource identifying the VersionedRecord which will get the new Version.
     * @param version           The Version to add to the VersionedRecord.
     * @param conn              A RepositoryConnection to use for lookup.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or the Version already exists in the
     *                                  repository.
     */
    <T extends Version> void addVersion(Resource catalogId, Resource versionedRecordId, T version,
                                        RepositoryConnection conn);

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
     * Gets the latest Version of the VersionedRecord identified by the provided Resources. The Version will be of
     * type T which is determined by the provided OrmFactory. Returns an empty Optional if the Record has no latest
     * Version.
     *
     * @param <T>               An Object which extends Version.
     * @param catalogId         The Resource identifying the Catalog which contains the Record.
     * @param versionedRecordId The Resource identified the VersionedRecord which has the Version.
     * @param factory           The OrmFactory identified the type of version you want to get.
     * @param conn              A RepositoryConnection to use for lookup.
     * @return The latest Version if it exists.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, or the
     *                                  Record does not belong to the Catalog.
     * @throws IllegalStateException    Thrown if the Version could not be found.
     */
    <T extends Version> Optional<T> getLatestVersion(Resource catalogId, Resource versionedRecordId,
                                                     OrmFactory<T> factory, RepositoryConnection conn);

    /**
     * Retrieves a Version identified by the provided Resources. The Version will be of type T which is determined by
     * the provided OrmFactory.
     *
     * @param catalogId The Resource identifying the Catalog which has the Record.
     * @param recordId  The Resource of the Record which has the Version.
     * @param versionId The Resource of the Version to retrieve.
     * @param factory   The OrmFactory of the type of Version you want to get back.
     * @param conn      A RepositoryConnection to use for lookup.
     * @param <T>       A Class that extends Version.
     * @return The identified Version.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, the Version does not belong to the
     *                                  Record, or the Version could not be found.
     */
    <T extends Version> T getVersion(Resource catalogId, Resource recordId, Resource versionId, OrmFactory<T> factory,
                                     RepositoryConnection conn);

    /**
     * Gets the Set of Versions for a VersionedRecord identified by the provided Resources.
     *
     * @param catalogId         The Resource identifying the Catalog which contains the Record.
     * @param versionedRecordId The Resource identifying the VersionedRecord which has the Versions.
     * @param conn              A RepositoryConnection to use for lookup.
     * @return The Set of Versions for the VersionedRecord if they exist.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or any of the Versions could not be
     *                                  found.
     */
    Set<Version> getVersions(Resource catalogId, Resource versionedRecordId, RepositoryConnection conn);

    /**
     * Removes the Version identified by the provided Resources from the repository.
     *
     * @param recordId  The Resource identifying the VersionedRecord which has the Version.
     * @param versionId The Resource identifying the Version you want to remove.
     * @param conn      A RepositoryConnection to use for lookup.
     */
    void removeVersion(Resource recordId, Resource versionId, RepositoryConnection conn);

    /**
     * Removes the Version identified by the provided Resources from the repository.
     *
     * @param catalogId         The Resource identifying the Catalog which has the Record.
     * @param versionedRecordId The Resource identifying the VersionedRecord which has the Version.
     * @param versionId         The Resource identifying the Version you want to remove.
     * @param conn              A RepositoryConnection to use for lookup.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or the Version could not be found.
     */
    void removeVersion(Resource catalogId, Resource versionedRecordId, Resource versionId, RepositoryConnection conn);

    /**
     * Removes the Version identified by the provided RecordId and Version from the repository.
     *
     * @param recordId The Resource identifying the VersionedRecord which has the Version.
     * @param version  The Version object to remove
     * @param conn     A RepositoryConnection to use for lookup.
     */
    void removeVersion(Resource recordId, Version version, RepositoryConnection conn);

    /**
     * Uses the provided Resources and Version to find the Resource of the existing Version and replaces it.
     *
     * @param <T>               An Object which extends Version.
     * @param catalogId         The Resource identifying the Catalog which contains the Record.
     * @param versionedRecordId The Resource identifying the VersionedRecord which has the Version.
     * @param newVersion        The Version with the desired changes.
     * @param conn              A RepositoryConnection to use for lookup.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or the Version could not be found.
     */
    <T extends Version> void updateVersion(Resource catalogId, Resource versionedRecordId, T newVersion,
                                           RepositoryConnection conn);

    /**
     * Validates the existence of a Version of a VersionedRecord.
     *
     * @param catalogId The Resource identifying the Catalog which should have the Record.
     * @param recordId  The Resource identifying the Record which should have the Version.
     * @param versionId The Resource of the Version.
     * @param conn      A RepositoryConnection to use for lookup.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, the
     *                                  Record does not belong to the Catalog, or the Version does not belong to the
     *                                  Record.
     */
    void validateVersion(Resource catalogId, Resource recordId, Resource versionId, RepositoryConnection conn);
}
