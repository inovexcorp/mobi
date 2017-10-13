package com.mobi.query.api;

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

import com.mobi.query.GraphQueryResult;
import com.mobi.query.exception.QueryEvaluationException;
import com.mobi.query.GraphQueryResult;
import com.mobi.query.exception.QueryEvaluationException;

public interface GraphQuery extends Operation {

    /**
     * Evaluates a SPARQL Graph Query.
     * @return a GraphQueryResult based on the graph query given
     * @throws QueryEvaluationException If there is an error processing the query
     */
    GraphQueryResult evaluate() throws QueryEvaluationException;

}
