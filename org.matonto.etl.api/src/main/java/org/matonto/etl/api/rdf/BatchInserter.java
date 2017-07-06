package org.matonto.etl.api.rdf;

/*-
 * #%L
 * org.matonto.etl.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.exception.RepositoryException;
import org.openrdf.model.Statement;
import org.openrdf.repository.util.RDFInserter;
import org.openrdf.rio.RDFHandler;
import org.openrdf.rio.RDFHandlerException;
import org.openrdf.rio.helpers.AbstractRDFHandler;

import java.util.HashMap;
import java.util.Map;

public class BatchInserter extends AbstractRDFHandler {

    private RepositoryConnection conn;

    private SesameTransformer transformer;

    private long count = 0;

    private long batchSize = 10000;

    private final Map<String, String> namespaces;

    public BatchInserter(RepositoryConnection conn, SesameTransformer transformer) {
        namespaces = new HashMap<>();
        this.conn = conn;
        this.transformer = transformer;
    }

    @Override
    public void startRDF() throws RDFHandlerException {
        conn.begin();
    }

    @Override
    public void endRDF() throws RDFHandlerException {
        conn.commit();
    }

    @Override
    public void handleNamespace(String prefix, String uri) throws RDFHandlerException {
        if (!namespaces.containsKey(prefix)) {
            namespaces.put(prefix, uri);
        }
    }

    @Override
    public void handleStatement(Statement st) throws RDFHandlerException {
        conn.add(transformer.matontoStatement(st));
        count++;
        if (count % batchSize == 0) {
            try {
                conn.commit();
            } catch (RepositoryException e) {
                throw new RDFHandlerException(e);
            }
        }
    }
}
