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

import com.mobi.query.TupleQueryResult;
import com.mobi.query.api.TupleQuery;
import com.mobi.query.exception.QueryEvaluationException;
import com.mobi.query.TupleQueryResult;
import com.mobi.query.api.TupleQuery;
import com.mobi.query.exception.QueryEvaluationException;
import org.openrdf.query.impl.MutableTupleQueryResult;

public class SesameTupleQuery extends SesameOperation implements TupleQuery {

    private org.openrdf.query.TupleQuery sesameTupleQuery;

    public SesameTupleQuery(org.openrdf.query.TupleQuery sesameTupleQuery) {
        super(sesameTupleQuery);
        setDelegate(sesameTupleQuery);
    }

    protected void setDelegate(org.openrdf.query.TupleQuery tupleQuery) {
        this.sesameTupleQuery = tupleQuery;
    }

    @Override
    public TupleQueryResult evaluate() throws QueryEvaluationException {
        try {
            return new SesameTupleQueryResult(sesameTupleQuery.evaluate());
        } catch (org.openrdf.query.QueryEvaluationException e) {
            throw new QueryEvaluationException(e);
        }
    }

    @Override
    public TupleQueryResult evaluateAndReturn() throws QueryEvaluationException {
        try {
            return new SesameTupleQueryResult(new MutableTupleQueryResult(sesameTupleQuery.evaluate()));
        } catch (org.openrdf.query.QueryEvaluationException e) {
            throw new QueryEvaluationException(e);
        }
    }

    public String toString() {
        return sesameTupleQuery.toString();
    }
}
