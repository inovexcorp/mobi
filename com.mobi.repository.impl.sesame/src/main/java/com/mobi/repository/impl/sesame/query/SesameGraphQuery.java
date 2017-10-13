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
import com.mobi.query.api.GraphQuery;
import com.mobi.query.exception.QueryEvaluationException;
import com.mobi.query.GraphQueryResult;
import com.mobi.query.api.BindingSet;
import com.mobi.query.api.GraphQuery;
import com.mobi.query.exception.QueryEvaluationException;
import com.mobi.rdf.api.Value;

public class SesameGraphQuery extends SesameOperation implements GraphQuery {

    private org.openrdf.query.GraphQuery sesameGraphQuery;

    public SesameGraphQuery( org.openrdf.query.GraphQuery sesameGraphQuery) {
        super(sesameGraphQuery);
        setDelegate(sesameGraphQuery);
    }

    protected void setDelegate(org.openrdf.query.GraphQuery sesameGraphQuery) {
        this.sesameGraphQuery = sesameGraphQuery;
    }

    @Override
    public GraphQueryResult evaluate() throws QueryEvaluationException {
        try {
            return new SesameGraphQueryResult(sesameGraphQuery.evaluate());
        } catch (org.openrdf.query.QueryEvaluationException e) {
            throw new QueryEvaluationException(e);
        }
    }

    public String toString() {
        return sesameGraphQuery.toString();
    }
}
