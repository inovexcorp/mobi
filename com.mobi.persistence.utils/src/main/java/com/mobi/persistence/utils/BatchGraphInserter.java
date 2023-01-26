package com.mobi.persistence.utils;

/*-
 * #%L
 * com.mobi.persistence.utils
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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

import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryException;
import org.eclipse.rdf4j.rio.RDFHandlerException;

public class BatchGraphInserter extends BatchInserter {

    private ValueFactory sesameVf;
    private Resource graph;

    /**
     * Creates a new BatchGraphInserter that will use the provided RepositoryConnection to insert statements
     * in batch chunks of the default size into the specified graph. The RepositoryConnection will not be closed after
     * all the statements are added.
     *
     * @param conn The RepositoryConnection to use to add statements
     */
    public BatchGraphInserter(RepositoryConnection conn, Resource graph) {
        super(conn);
        this.graph = graph;
        this.sesameVf = new ValidatingValueFactory();
    }

    /**
     * Creates a new BatchGraphInserter that will use the provided RepositoryConnection to insert statements in the
     * batch chunks of the provided size into the specified graph. The RepositoryConnection will not be closed after
     * all the statements are added.
     *
     * @param conn The RepositoryConnection to use to add statements
     * @param batchSize How may statemtns should be added at a time
     */
    public BatchGraphInserter(RepositoryConnection conn,long batchSize, Resource graph) {
        super(conn, batchSize, false);
        this.graph = graph;
        this.sesameVf = new ValidatingValueFactory();
    }

    /**
     * Begins a transaction for committing statements.
     */
    @Override
    public void startRDF() throws RDFHandlerException {
        conn.begin();
    }

    @Override
    public void handleStatement(Statement st) throws RDFHandlerException {
        Statement statement = sesameVf.createStatement(st.getSubject(), st.getPredicate(), st.getObject(), graph);
        conn.add(statement);
        count++;
        if (count % batchSize == 0) {
            try {
                conn.commit();
                if (logger != null) {
                    logger.debug(batchSize + " statements imported");
                }
                if (printToSystem) {
                    System.out.println(batchSize + " statements imported");
                }
                conn.begin();
            } catch (RepositoryException e) {
                throw new RDFHandlerException(e);
            }
        }
    }
}
