package com.mobi.repository.impl.sesame.query.utils;

/*-
 * #%L
 * com.mobi.repository.impl.sesame
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2020 iNovex Information Systems, Inc.
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

import com.mobi.exception.MobiException;
import com.mobi.query.QueryResultsIO;
import com.mobi.query.TupleQueryResult;
import com.mobi.repository.impl.sesame.query.SesameTupleQueryResult;
import org.eclipse.rdf4j.query.BindingSet;
import org.eclipse.rdf4j.query.QueryEvaluationException;
import org.eclipse.rdf4j.query.QueryResultHandler;
import org.eclipse.rdf4j.query.QueryResultHandlerException;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.query.TupleQueryResultHandlerException;
import org.eclipse.rdf4j.query.resultio.TupleQueryResultFormat;
import org.eclipse.rdf4j.query.resultio.TupleQueryResultWriter;
import org.osgi.service.component.annotations.Component;

import java.io.IOException;
import java.io.OutputStream;

@Component
public class QueryResultsIOService implements QueryResultsIO {

    @Override
    public void writeTuple(TupleQueryResult tqr, TupleQueryResultFormat format, OutputStream out) throws IOException {
        if (tqr instanceof SesameTupleQueryResult) {
            SesameTupleQueryResult sesameTupleQueryResult = (SesameTupleQueryResult) tqr;
            org.eclipse.rdf4j.query.resultio.QueryResultIO.writeTuple(sesameTupleQueryResult.getTupleQueryResult(), format, out);
        } else {
            throw new MobiException("TupleQueryResult is not an instance of SesameTupleQueryResult");
        }
    }

    @Override
    public boolean writeTuple(TupleQueryResult tqr, TupleQueryResultFormat format, int limit, OutputStream out) throws IOException {
        boolean limitExceeded = false;

        if (tqr instanceof SesameTupleQueryResult) {
            SesameTupleQueryResult sesameTupleQueryResult = (SesameTupleQueryResult) tqr;
            TupleQueryResultWriter writer = org.eclipse.rdf4j.query.resultio.QueryResultIO.createTupleWriter(format, out);

            try {
                writer.startDocument();
                writer.startHeader();
                limitExceeded = report(sesameTupleQueryResult.getTupleQueryResult(), writer, limit);
            } catch (QueryResultHandlerException var5) {
                if (var5.getCause() instanceof IOException) {
                    throw (IOException) var5.getCause();
                } else if (var5 instanceof TupleQueryResultHandlerException) {
                    throw (TupleQueryResultHandlerException) var5;
                } else {
                    throw new TupleQueryResultHandlerException(var5);
                }
            }
        } else {
            throw new MobiException("TupleQueryResult is not an instance of SesameTupleQueryResult");
        }
        return limitExceeded;
    }

    private static boolean report(org.eclipse.rdf4j.query.TupleQueryResult tqr, QueryResultHandler handler, int limit) throws TupleQueryResultHandlerException, QueryEvaluationException {
        boolean limitExceeded = false;
        try {
            int limitCounter = 0;
            handler.startQueryResult(tqr.getBindingNames());

            while(tqr.hasNext()) {
                limitCounter += 1;

                BindingSet bindingSet = (BindingSet)tqr.next();
                handler.handleSolution(bindingSet);

                if(limitCounter >= limit){
                    limitExceeded = true;
                    break;
                }
            }
        } finally {
            tqr.close();
        }
        handler.endQueryResult();
        return limitExceeded;
    }

}
