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

import com.mobi.query.exception.QueryEvaluationException;
import com.mobi.query.TupleQueryResult;
import com.mobi.query.api.BindingSet;
import com.mobi.query.exception.QueryEvaluationException;

import java.util.List;

public class SesameTupleQueryResult extends TupleQueryResult {

    private org.openrdf.query.TupleQueryResult tupleQueryResult;

    public SesameTupleQueryResult(org.openrdf.query.TupleQueryResult tupleQueryResult) {
        this.tupleQueryResult = tupleQueryResult;
    }

    @Override
    public List<String> getBindingNames() throws QueryEvaluationException {
        try {
            return tupleQueryResult.getBindingNames();
        } catch (org.openrdf.query.QueryEvaluationException e) {
            throw new QueryEvaluationException(e);
        }
    }

    @Override
    public void close() throws QueryEvaluationException {
        try {
            tupleQueryResult.close();
        } catch (org.openrdf.query.QueryEvaluationException e) {
            throw new QueryEvaluationException(e);
        }
    }

    @Override
    public boolean hasNext() throws QueryEvaluationException {
        try {
            return tupleQueryResult.hasNext();
        } catch (org.openrdf.query.QueryEvaluationException e) {
            throw new QueryEvaluationException(e);
        }
    }

    @Override
    public BindingSet next() throws QueryEvaluationException {
        try {
            return new SesameBindingSet(tupleQueryResult.next());
        } catch (org.openrdf.query.QueryEvaluationException e) {
            throw new QueryEvaluationException(e);
        }
    }
}
