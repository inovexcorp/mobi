package com.mobi.rest.util;

/*-
 * #%L
 * com.mobi.rest.util
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

import com.mobi.jaas.api.ontologies.usermanagement.User;

/**
 * A POJO of VersionedRdfRecord parameters to use when querying.
 *
 * @param branchId String representing the Branch ID
 * @param commitId String representing the Commit ID
 * @param includeImports Boolean indicating whether imports should be included in the query
 * @param applyInProgressCommit Whether to apply the in progress commit for the user making the request
 * @param user The User making the request
 */
public record VersionedRDFRecordParams(String branchId, String commitId, boolean includeImports,
                                       boolean applyInProgressCommit, User user) {
}
