package com.mobi.repository.impl.sesame.query;

/*-
 * #%L
 * com.mobi.repository.impl.sesame
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
import com.mobi.rdf.api.Statement;
import com.mobi.query.GraphQueryResult;
import com.mobi.query.exception.QueryEvaluationException;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.core.utils.Values;

import java.util.Map;

public class SesameGraphQueryResult extends GraphQueryResult {

    org.openrdf.query.GraphQueryResult graphQueryResult;

    public SesameGraphQueryResult(org.openrdf.query.GraphQueryResult graphQueryResult) {
        this.graphQueryResult = graphQueryResult;
    }

    @Override
    public Map<String, String> getNamespaces() throws QueryEvaluationException {
        try {
            return graphQueryResult.getNamespaces();
        } catch (org.openrdf.query.QueryEvaluationException e) {
            throw new QueryEvaluationException(e);
        }
    }

    @Override
    public void close() throws QueryEvaluationException {
        try {
            graphQueryResult.close();
        } catch (org.openrdf.query.QueryEvaluationException e) {
            throw new QueryEvaluationException(e);
        }
    }

    @Override
    public boolean hasNext() throws QueryEvaluationException {
        try {
            return graphQueryResult.hasNext();
        } catch (org.openrdf.query.QueryEvaluationException e) {
            throw new QueryEvaluationException(e);
        }
    }

    @Override
    public Statement next() throws QueryEvaluationException {
        try {
            return Values.matontoStatement(graphQueryResult.next());
        } catch (org.openrdf.query.QueryEvaluationException e) {
            throw new QueryEvaluationException(e);
        }
    }

    @Override
    public void remove() throws QueryEvaluationException {
        try {
            graphQueryResult.remove();
        } catch (org.openrdf.query.QueryEvaluationException e) {
            throw new QueryEvaluationException(e);
        }
    }
}
