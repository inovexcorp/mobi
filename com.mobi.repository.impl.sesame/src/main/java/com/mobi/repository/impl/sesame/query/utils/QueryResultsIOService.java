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
import com.mobi.rdf.core.utils.Values;
import org.eclipse.rdf4j.query.impl.MapBindingSet;
import org.eclipse.rdf4j.query.resultio.TupleQueryResultFormat;
import org.eclipse.rdf4j.query.resultio.TupleQueryResultWriter;
import org.osgi.service.component.annotations.Component;

import java.io.OutputStream;

@Component
public class QueryResultsIOService implements QueryResultsIO {

    @Override
    public void writeTuple(TupleQueryResult tqr, TupleQueryResultFormat format, OutputStream out) {
        writeTupleToStream(tqr, format, out, -1);
    }

    @Override
    public boolean writeTuple(TupleQueryResult tqr, TupleQueryResultFormat format, int limit, OutputStream out) {
        return writeTupleToStream(tqr, format, out, limit);
    }

    private boolean writeTupleToStream(TupleQueryResult tqr, TupleQueryResultFormat format, OutputStream out,
                                       int limit) {
        TupleQueryResultWriter writer = org.eclipse.rdf4j.query.resultio.QueryResultIO.createTupleWriter(format,
                out);
        try {
            writer.startDocument();
            writer.startHeader();
            writer.startQueryResult(tqr.getBindingNames());

            int limitCounter = 1;
            while (tqr.hasNext()) {
                com.mobi.query.api.BindingSet bindingSet = tqr.next();
                MapBindingSet mapBindingSet = new MapBindingSet();
                bindingSet.forEach(binding ->
                        mapBindingSet.addBinding(binding.getName(), Values.sesameValue(binding.getValue())));
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
