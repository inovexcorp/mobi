package com.mobi.query;

/*-
 * #%L
 * com.mobi.persistence.api
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

import com.mobi.query.exception.QueryEvaluationException;
import com.mobi.query.api.BindingSet;
import com.mobi.query.api.QueryResult;
import com.mobi.query.exception.QueryEvaluationException;

import java.util.List;

public abstract class TupleQueryResult extends QueryResult<BindingSet> {

    /**
     * Gets the names of the bindings, in order of projection.
     *
     * @return The binding names, in order of projection.
     * @throws QueryEvaluationException when the query can not be properly evaluated
     */
    public abstract List<String> getBindingNames()
            throws QueryEvaluationException;

}
