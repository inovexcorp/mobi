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
import org.eclipse.rdf4j.query.impl.MutableTupleQueryResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class SesameTupleQuery extends SesameOperation implements TupleQuery {

    private final Logger log = LoggerFactory.getLogger(SesameTupleQuery.class);

    private org.eclipse.rdf4j.query.TupleQuery sesameTupleQuery;

    public SesameTupleQuery(org.eclipse.rdf4j.query.TupleQuery sesameTupleQuery) {
        super(sesameTupleQuery);
        setDelegate(sesameTupleQuery);
    }

    protected void setDelegate(org.eclipse.rdf4j.query.TupleQuery tupleQuery) {
        this.sesameTupleQuery = tupleQuery;
    }

    @Override
    public TupleQueryResult evaluate() throws QueryEvaluationException {
        try {
            long start = System.currentTimeMillis();
            SesameTupleQueryResult queryResult = new SesameTupleQueryResult(sesameTupleQuery.evaluate());
            log.debug("Query Plan\n{}", sesameTupleQuery.toString());
            log.info("Query Execution Time: {}ms", System.currentTimeMillis() - start);
            return queryResult;
        } catch (org.eclipse.rdf4j.query.QueryEvaluationException e) {
            throw new QueryEvaluationException(e);
        }
    }

    @Override
    public TupleQueryResult evaluateAndReturn() throws QueryEvaluationException {
        try {
            long start = System.currentTimeMillis();
            SesameTupleQueryResult queryResult = new SesameTupleQueryResult(new MutableTupleQueryResult(sesameTupleQuery.evaluate()));
            log.debug("Query Plan\n{}", sesameTupleQuery.toString());
            log.info("Query Execution Time: {}ms", System.currentTimeMillis() - start);
            return queryResult;
        } catch (org.eclipse.rdf4j.query.QueryEvaluationException e) {
            throw new QueryEvaluationException(e);
        }
    }

    public String toString() {
        return sesameTupleQuery.toString();
    }
}
