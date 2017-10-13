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

import com.mobi.query.TupleQueryResult;
import com.mobi.query.exception.QueryEvaluationException;
import com.mobi.query.TupleQueryResult;
import com.mobi.query.exception.QueryEvaluationException;

public interface TupleQuery extends Operation {

    /**
     * Evaluates the SPARQL tuple query and returns the result. This TupleQueryResult is backed by
     * the RepositoryConnection and must be closed before the RepositoryConnection is closed.
     * @return a TupleQueryResult with the results of the query
     * @throws QueryEvaluationException if there is an error processing the query
     */
    TupleQueryResult evaluate() throws QueryEvaluationException;

    /**
     * Evaluates the SPARQL tuple query and returns the result. This TupleQueryResult stores and returns
     * the complete query result in memory, and is safe to use outside of the scope of the RepositoryConnection.
     * @return a TupleQueryResult with the results of the query
     * @throws QueryEvaluationException if there is an error processing the query
     */
    TupleQueryResult evaluateAndReturn() throws QueryEvaluationException;
}
