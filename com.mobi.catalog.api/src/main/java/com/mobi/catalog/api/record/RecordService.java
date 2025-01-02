package com.mobi.catalog.api.record;

/*-
 * #%L
 * com.mobi.catalog.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.api.record.statistic.Statistic;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.repository.RepositoryConnection;

import java.util.List;
import java.util.Optional;

public interface RecordService<T extends Record> {

    /**
     * The type of {@link Record} this service supports.
     *
     * @return The type of Record
     */
    Class<T> getType();

    /**
     * Retrieves the IRI of the type of {@link Record}.
     *
     * @return A IRI string of a subclass of Record
     */
    String getTypeIRI();

    /**
     * Creates and adds a Record based on a provided configuration.
     *
     * @param user The {@link User} that is creating the Record
     * @param config A {@link RecordOperationConfig} that contains the create configuration
     * @param conn A {@link RepositoryConnection} to the repo where the Record exists
     * @return The created Record
     */
    T create(User user, RecordOperationConfig config, RepositoryConnection conn);

    /**
     * Deletes a Record from a Catalog and creates a provenance event for the activity based on the provided user.
     *
     * @param recordId A {@link Resource} of the Record to delete
     * @param user The {@link User} that is deleting the Record
     * @param conn A {@link RepositoryConnection} to the repo where the Record exists
     * @return The deleted Record
     */
    T delete(Resource recordId, User user, RepositoryConnection conn);

    /**
     * Exports a given Record based on a provided configuration.
     *
     * @param iriRecord An {@link Resource} of the record to be exported
     * @param config A {@link RecordOperationConfig} that contains the export configuration
     * @param conn A {@link RepositoryConnection} to the repo where the Record exists
     */
    void export(Resource iriRecord, RecordOperationConfig config, RepositoryConnection conn);

    /**
     * Delete the record's branch if supported.  If operation is not supported on the record an empty Optional will be
     * returned.
     *
     * @param catalogId The Resource identifying the Catalog which should have the Record.
     * @param versionedRDFRecordId The Resource identifying the Record.
     * @param branchId The Resource identifying the Branch for Record.
     * @param conn A RepositoryConnection to use for lookup.
     * @return Optional of Deleted Commits
     */
    Optional<List<Resource>> deleteBranch(Resource catalogId, Resource versionedRDFRecordId, Resource branchId,
                                           RepositoryConnection conn);

    /**
     * Returns a list of statistics
     *
     * @param recordId The Resource identifying the Record.
     * @param conn A RepositoryConnection to use for lookup.
     * @return A list of {@link Statistic}
     */
    List<Statistic> getStatistics(Resource recordId, RepositoryConnection conn);
}
