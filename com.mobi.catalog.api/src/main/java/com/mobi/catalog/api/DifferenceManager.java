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

import com.mobi.catalog.api.builder.Conflict;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.builder.PagedDifference;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.repository.RepositoryConnection;

import java.util.List;
import java.util.Set;

public interface DifferenceManager {

    /**
     * Applies the additions and deletions in the provided Difference to the provided Model and returns the result.
     *
     * @param base A Model.
     * @param diff A Difference containing statements to add and to delete.
     * @return The base Model with statements added and deleted.
     */
    Model applyDifference(Model base, Difference diff);

    /**
     * Applies the addition and deletion statements from the InProgressCommit identified by the provided Resource to the
     * Model provided and returns the combined Model.
     *
     * @param inProgressCommitId The Resource identifying the InProgressCommit to be added.
     * @param entity             The Model which you want to apply the statements to.
     * @param conn               A RepositoryConnection to use for lookup.
     * @return A Model consisting of the provided Model statements with the proper statements added and/or removed.
     * @throws IllegalArgumentException Thrown if the InProgressCommit could not be found
     * @throws IllegalStateException    Thrown if the InProgressCommit has no Revision set or the InProgressCommit's
     *                                  Revision does not have the additions/deletions set.
     */
    Model applyInProgressCommit(Resource inProgressCommitId, Model entity, RepositoryConnection conn);

    /**
     * Gets the addition and deletion statements of a Commit identified by the provided Resource as a Difference. The
     * statements contained in the returned Difference will have a context that matches the tracked quad. That is,
     * tracked triples will have no context and tracked quads will have a context that matches the data named graph.
     *
     * @param commitId The Resource identifying the Commit to retrieve the Difference from.
     * @param conn     The RepositoryConnection which contains the requested Commit.
     * @return A Difference object containing the addition and deletion statements of a Commit.
     */
    Difference getCommitDifference(Resource commitId, RepositoryConnection conn);

    /**
     * Gets the addition and deletion statements for an entity of a Commit identified by the provided Resource as a
     * Difference. The statements contained in the returned Difference will have a context that matches the tracked
     * uad. That is, tracked triples will have no context and tracked quads will have a context that matches the data
     * named graph.
     *
     * @param subjectId The Resource representing the subject to retrieve additions and deletions for.
     * @param commitId The Resource identifying the Commit to retrieve the Difference from.
     * @param conn     The RepositoryConnection which contains the requested Commit.
     * @return A Difference object containing the addition and deletion statements for an entity of a Commit.
     */
    Difference getCommitDifferenceForSubject(Resource subjectId, Resource commitId, RepositoryConnection conn);

    /**
     * Gets the addition and deletion statements of a Commit identified by the provided Resource as a PagedDifference.
     * The statements returned will be paged by subject using the provided limit and offset. The statements contained in
     * the returned PagedDifference will have no context. Quads will not be included in the paged difference.
     *
     * @param commitId The Resource identifying the Commit to retrieve the Difference from.
     * @param limit    The number of results to retrieve.
     * @param offset   The number of subjects to skip when retrieving results.
     * @param conn     The RepositoryConnection which contains the requested Commit.
     * @return A PagedDifference object containing the addition and deletion statements of a Commit and a boolean
     * indicating whether another page of results exist.
     */
    PagedDifference getCommitDifferencePaged(Resource commitId, int limit, int offset, RepositoryConnection conn);

    /**
     * Builds the PagedDifference based on the provided List of Commit ids. The statements returned will be paged by
     * subject using the provided limit and offset. The statements contained in the returned PagedDifference will have
     * not context.  Quads will not be included in the PagedDifference.
     *
     * @param commits The List of Commit ids which are supposed to be contained in the Model in ascending order.
     * @param limit   The number of results to retrieve.
     * @param offset  The number of subjects to skip when retrieving results.
     * @param conn    The RepositoryConnection which contains the requested Commits.
     * @return The PagedDifference containing the aggregation of all the Commit additions and deletions and a boolean
     * indicating whether another page of results exist..
     */
    PagedDifference getCommitDifferencePaged(List<Resource> commits, int limit, int offset, RepositoryConnection conn);

    /**
     * Gets the PagedDifference between the Commits identified by the two provided Resources. The statements returned
     * will be paged by subject using the provided limit and offset. Essentially returns the culmination of changes from
     * a common ancestor between the Commits to the source Commit.
     *
     * @param sourceCommitId The source (first) Commit.
     * @param targetCommitId The target (second) Commit.
     * @param limit          The number of results to retrieve.
     * @param offset         The number of subjects to skip when retrieving results.
     * @param conn           A RepositoryConnection to use for lookup.
     * @return A PagedDifference between the two Commits identified by the provided Resources a boolean
     * indicating whether another page of results exist.
     * @throws IllegalArgumentException Thrown if either Commit could not be found or the Commits have no common parent.
     * @throws IllegalStateException    Thrown if a Commit in either chain does not have the additions/deletions set.
     */
    PagedDifference getCommitDifferencePaged(Resource sourceCommitId, Resource targetCommitId, int limit, int offset,
                                             RepositoryConnection conn);

    /**
     * Gets all of the conflicts between the Commits identified by the two provided {@link Resource Resources}.
     *
     * @param sourceCommitId The {@link Resource} ID of the source Commit.
     * @param targetCommitId The {@link Resource} ID of the target Commit.
     * @param conn A RepositoryConnection to use for lookup.
     * @return The Set of Conflicts between the two Commits identified by the provided {@link Resource Resources}.
     * @throws IllegalArgumentException Thrown if either Commit could not be found.
     * @throws IllegalStateException    Thrown if a Commit in either chain does not have the additions/deletions set.
     */
    Set<Conflict> getConflicts(Resource sourceCommitId, Resource targetCommitId, RepositoryConnection conn);

    /**
     * Gets the Difference, consisting of Models of additions and deletions, made by comparing the provided original
     * and changed Models. The Difference is created regardless of statement context, meaning only triples are compared.
     * The resulting Difference retains the original statement contexts.
     *
     * @param original The original Model.
     * @param changed  The changed Model.
     * @return The Difference between the two Models regardless of statement context.
     */
    Difference getDiff(Model original, Model changed);

    /**
     * Gets the Difference between the Commits identified by the two provided Resources. Essentially returns the
     * culmination of changes from a common ancestor between the Commits to the source Commit.
     *
     * @param sourceCommitId The source (first) Commit.
     * @param targetCommitId The target (second) Commit.
     * @param conn           A RepositoryConnection to use for lookup.
     * @return The Difference between the two Commits identified by the provided Resources.
     * @throws IllegalArgumentException Thrown if either Commit could not be found or the Commits have no common parent.
     * @throws IllegalStateException    Thrown if a Commit in either chain does not have the additions/deletions set.
     */
    Difference getDifference(Resource sourceCommitId, Resource targetCommitId, RepositoryConnection conn);
}
