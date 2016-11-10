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

import org.matonto.rdf.api.Model;

/**
 * This class provides details about the conflicts that occur when two Models are compared. These conflicts would be any
 * statement where the same subject and predicate was either added or deleted. These two Models were constructed from
 * two different Commit chains that had a similar Commit somewhere in their history. The statements associated with the
 * conflicted subject and predicate at the common point is stored in the original. The leftAdditions and leftDeletions
 * store the statements that were added or deleted for the left Commit. The rightAdditions and rightDeletions store the
 * statements that were added or deleted for the right Commit.
 */
public interface Conflict {

    Model getOriginal();

    Model getLeftAdditions();

    Model getLeftDeletions();

    Model getRightAdditions();

    Model getRightDeletions();
}
