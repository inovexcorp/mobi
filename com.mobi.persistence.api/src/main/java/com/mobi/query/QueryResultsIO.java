package com.mobi.query;

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

import org.eclipse.rdf4j.query.resultio.TupleQueryResultFormat;

import java.io.IOException;
import java.io.OutputStream;

public interface QueryResultsIO {

    /**
     * Method streams out Tuple Query Results into the given TupleQueryResultFormat
     * @param tqr TupleQueryResult the tuple results
     * @param format TupleQueryResultFormat the format to stream in
     * @param out OutputStream Stream of TupleQueryResult in the TupleQueryResultFormat
     * @throws IOException
     */
    public void writeTuple(TupleQueryResult tqr, TupleQueryResultFormat format, OutputStream out) throws IOException;

}
