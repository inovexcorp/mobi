package com.mobi.catalog.api.versioning;

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
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.repository.RepositoryConnection;

import javax.annotation.Nullable;

public interface VersioningService<T extends VersionedRDFRecord> {
    /**
     * Adds the provided {@link Commit} to the provided {@link Branch}, updating the head Commit. NOTE: This method
     * is intended to be used for existing InProgressCommits and assumes the additions and deletions statements already
     * exist in the Repository.
     *
     * @param branch The Branch which will get the new Commit.
     * @param commit The Commit to add to the Branch.
     * @param conn A RepositoryConnection to use for lookup.
     */
    void addCommit(VersionedRDFRecord record, Branch branch, Commit commit, RepositoryConnection conn);

    /**
     * Adds a new {@link Commit} to the provided {@link Branch} created for the provided {@link User} using the provided
     * message, addition and deletion {@link Model Models}, and base and auxiliary Commits. NOTE: This method is
     * intended to be used with merges and assumes no commit or revision data exists in the Repository.
     *
     * @param branch The Branch which will get the new Commit.
     * @param user The User who will be associated with the new Commit.
     * @param message The String with the message text associated with the Commit.
     * @param additions The statements which were added to the named graph.
     * @param deletions The statements which were deleted from the named graph.
     * @param baseCommit The base Commit for the newCommit.
     * @param auxCommit The auxiliary Commit for the newCommit.
     * @param conn A RepositoryConnection to use for lookup.
     * @return The Resource identifying the new Commit.
     */
    Resource addCommit(VersionedRDFRecord record, Branch branch, User user, String message, Model additions,
                       Model deletions, @Nullable Commit baseCommit, @Nullable Commit auxCommit,
                       RepositoryConnection conn);

    /**
     * Retrieves the IRI of the type of {@link VersionedRDFRecord} this service versions.
     *
     * @return A IRI string of a subclass of VersionedRDFRecord
     */
    String getTypeIRI();
}
