package com.mobi.persistence.utils;

/*-
 * #%L
 * com.mobi.etl.api
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

import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.exception.RepositoryException;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.exception.RepositoryException;
import org.openrdf.model.Statement;
import org.openrdf.rio.RDFHandlerException;
import org.openrdf.rio.helpers.AbstractRDFHandler;
import org.slf4j.Logger;

import java.util.HashMap;
import java.util.Map;

public class BatchInserter extends AbstractRDFHandler {

    private RepositoryConnection conn;
    private SesameTransformer transformer;
    private long count = 0;
    private long batchSize = 10000;
    private final Map<String, String> namespaces = new HashMap<>();
    private Logger logger = null;
    private boolean printToSystem = false;

    /**
     * Creates a new BatchInserter that will use the provided RepositoryConnection to insert statements
     * in batch chunks of the default size. The RepositoryConnection will not be closed after all the statements
     * are added.
     *
     * @param conn The RepositoryConnection to use to add statements
     * @param transformer A SesameTransformer for converting statements
     */
    public BatchInserter(RepositoryConnection conn, SesameTransformer transformer) {
        this.conn = conn;
        this.transformer = transformer;
    }

    /**
     * Creates a new BatchInserter that will use the provided RepositoryConnection to insert statements in the
     * batch chunks of the provided size. The RepositoryConnection will not be closed after all the statements
     * are added.
     *
     * @param conn The RepositoryConnection to use to add statements
     * @param transformer A SesameTransformer for converting statements
     * @param batchSize How may statemtns should be added at a time
     */
    public BatchInserter(RepositoryConnection conn, SesameTransformer transformer, long batchSize) {
        this.conn = conn;
        this.transformer = transformer;
        this.batchSize = batchSize;
    }

    /**
     * Begins a transaction for committing statements.
     */
    @Override
    public void startRDF() throws RDFHandlerException {
        conn.begin();
    }

    /**
     * Commits any lingering transactions. Does not close the connection.
     */
    @Override
    public void endRDF() throws RDFHandlerException {
        conn.commit();
        if (logger != null) {
            logger.debug("Import complete. " + count + " statements imported");
        }
        if (printToSystem) {
            System.out.println("Import complete. " + count + " statements imported");
        }
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
                if (logger != null) {
                    logger.debug(batchSize + " statements imported");
                }
                if (printToSystem) {
                    System.out.println(batchSize + " statements imported");
                }
            } catch (RepositoryException e) {
                throw new RDFHandlerException(e);
            }
        }
    }

    /**
     * Sets the Logger for status updates.
     *
     * @param logger A Logger
     */
    public void setLogger(Logger logger) {
        this.logger = logger;
    }

    /**
     * Sets the value of printToSystem which determines whether or not logging will be printed to System.out.
     *
     * @param printToSystem True if logs will be printed; false otherwise
     */
    public void setPrintToSystem(boolean printToSystem) {
        this.printToSystem = printToSystem;
    }

    /**
     * Returns the final number of statements added.
     *
     * @return The number of statements added
     */
    public long getFinalCount() {
        return count;
    }
}
