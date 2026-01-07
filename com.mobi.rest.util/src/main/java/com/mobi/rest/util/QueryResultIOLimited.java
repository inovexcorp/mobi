package com.mobi.rest.util;

/*-
 * #%L
 * com.mobi.sparql.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import org.eclipse.rdf4j.query.BindingSet;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.query.impl.MapBindingSet;
import org.eclipse.rdf4j.query.resultio.QueryResultIO;
import org.eclipse.rdf4j.query.resultio.TupleQueryResultFormat;
import org.eclipse.rdf4j.query.resultio.TupleQueryResultWriter;

import java.io.OutputStream;

public class QueryResultIOLimited extends QueryResultIO {

    /**
     * Method streams out Tuple Query Results into the given TupleQueryResultFormat.
     *
     * @param tqr TupleQueryResult the tuple results
     * @param format TupleQueryResultFormat the format to stream in
     * @param out OutputStream Stream of TupleQueryResult in the TupleQueryResultFormat
     * @param limit the max number of records
     *
     * @return boolean value, if true then limit was exceeded, if false then limit was not exceeded
     */
    public static boolean writeTuple(TupleQueryResult tqr, TupleQueryResultFormat format, OutputStream out,
                                     int limit) {
        TupleQueryResultWriter writer = createTupleWriter(format, out);
        try {
            writer.startDocument();
            writer.startHeader();
            writer.startQueryResult(tqr.getBindingNames());

            int limitCounter = 1;
            while (tqr.hasNext()) {
                BindingSet bindingSet = tqr.next();
                MapBindingSet mapBindingSet = new MapBindingSet();
                bindingSet.forEach(binding ->
                        mapBindingSet.addBinding(binding.getName(),binding.getValue()));
                writer.handleSolution(mapBindingSet);

                if (limit > 0 && limitCounter >= limit) {
                    return true;
                }
                limitCounter++;
            }
        } catch (Exception e) {
            throw new MobiException(e);
        } finally {
            tqr.close();
            writer.endQueryResult();
        }
        return false;
    }
}
