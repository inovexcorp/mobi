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

import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.Revision;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.repository.RepositoryConnection;

import java.util.List;
import java.util.Set;
import java.util.UUID;

public interface RevisionManager {

    /**
     * Creates a Revision with a unique identifier.
     *
     * @param uuid The UUID to use as the unique identifier
     * @return A Revision with a unique identifier.
     */
    Revision createRevision(UUID uuid);


    /**
     * Retrieves the Revision with the given revisionId from the provided RepositoryConnection.
     *
     * @param revisionId The Resource identifying the revision
     * @param conn The connection to the repository
     * @return The Revision with the given revisionId
     */
    Revision getRevision(Resource revisionId, RepositoryConnection conn);

    /**
     * Gets the prov:generated Revision associated with the provided commit Resource.
     *
     * @param commitId The Resource identifying the commit
     * @param conn     The connection to the repository
     * @return The Revision associated with the provided commit Resource.
     */
    Revision getRevisionFromCommitId(Resource commitId, RepositoryConnection conn);

    /**
     * Gets the Revisions associated with the provided commit Resource.
     *
     * @param commitId The Resource identifying the commit
     * @param conn     The connection to the repository
     * @return The Set of Revisions associated with the provided commit Resource.
     */
    Set<Revision> getAllRevisionsFromCommitId(Resource commitId, RepositoryConnection conn);

    /**
     * Gets the display Revision associated with the provided commit Resource.
     *
     * @param commitId The Resource identifying the commit
     * @param conn     The connection to the repository
     * @return The Revision associated with the provided commit Resource.
     */
    Revision getDisplayRevisionFromCommitId(Resource commitId, RepositoryConnection conn);

    /**
     * Gets the Revision associated from the provided Commit.
     *
     * @param commit The Commit to retrieve the revision from
     * @return The Revision associated with the provided commit Resource.
     */
    Revision getGeneratedRevision(Commit commit);

    /**
     * Gets the List of Influenced Revisions associated with the provided commit Resource. These Revisions are the
     * reverse deltas of a branch that branched off of the provided commit.
     *
     * @param commitId The Resource identifying the commit
     * @param conn     The connection to the repository
     * @return The Revision associated with the provided commit Resource.
     */
    List<Revision> getInfluencedRevisions(Resource commitId, RepositoryConnection conn);

    /**
     * Retrieves the {@link RevisionChain} associated with a given commit ID.
     *
     * @param commitId The Resource identifying the commit
     * @param conn The connection to the repository
     * @return The {@link RevisionChain} associated with the provided commit ID
     */
    RevisionChain getRevisionChain(Resource commitId, RepositoryConnection conn);
}
