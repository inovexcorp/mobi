package org.matonto.query;

/*-
 * #%L
 * org.matonto.persistence.api
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

import org.matonto.query.api.QueryResult;
import org.matonto.rdf.api.Statement;
import org.matonto.query.exception.QueryEvaluationException;

import java.util.Map;


public abstract class GraphQueryResult extends QueryResult<Statement> {

    /**
     * Retrieves relevant namespaces from the query result.
     *
     * @return a Map< String, String > object containing (prefix, namespace) pairs
     * @throws QueryEvaluationException when the query can not be properly evaluated
     */
    public abstract Map<String, String> getNamespaces() throws QueryEvaluationException;

}
