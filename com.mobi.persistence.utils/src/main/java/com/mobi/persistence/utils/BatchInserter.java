package com.mobi.persistence.utils;

/*-
 * #%L
 * com.mobi.etl.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryException;
import org.eclipse.rdf4j.rio.RDFHandlerException;
import org.eclipse.rdf4j.rio.helpers.AbstractRDFHandler;
import org.slf4j.Logger;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class BatchInserter extends AbstractRDFHandler {

    protected RepositoryConnection conn;
    protected long count = 0;
    protected long batchSize = 10000;
    protected final Map<String, String> namespaces = new HashMap<>();
    protected Logger logger = null;
    protected boolean printToSystem = false;
    protected boolean cleanGraphs = false;
    protected String MOBI_HTTPS_NAMESPACE = "https://mobi.com/";
    protected String MOBI_HTTP_NAMESPACE = "http://mobi.com/";
    protected Set<String> cleansedGraphStrings = new HashSet<>();

    private static final String STATEMENTS_IMPORTED = " statements imported";

    /**
     * Creates a new BatchInserter that will use the provided RepositoryConnection to insert statements
     * in batch chunks of the default size. The RepositoryConnection will not be closed after all the statements
     * are added.
     *
     * @param conn The RepositoryConnection to use to add statements
     */
    public BatchInserter(RepositoryConnection conn) {
        this.conn = conn;
    }

    /**
     * Creates a new BatchInserter that will use the provided RepositoryConnection to insert statements in the
     * batch chunks of the provided size. The RepositoryConnection will not be closed after all the statements
     * are added.
     *
     * @param conn The RepositoryConnection to use to add statements
     * @param batchSize How may statemtns should be added at a time
     */
    public BatchInserter(RepositoryConnection conn, long batchSize, boolean cleanGraphs) {
        this.conn = conn;
        this.batchSize = batchSize;
        this.cleanGraphs = cleanGraphs;
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
            logger.debug("Import complete. " + count + STATEMENTS_IMPORTED);
            for (String cleansedGraph : getCleansedGraphStrings()) {
                logger.debug("Protected graph " + cleansedGraph + " was cleansed before import.");
            }
        }
        if (printToSystem) {
            System.out.println("Import complete. " + count + STATEMENTS_IMPORTED);
            for (String cleansedGraph : getCleansedGraphStrings()) {
                System.out.println("Protected graph " + cleansedGraph + " was cleansed before import.");
            }

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
        if (cleanGraphs && hasInternallyManagedGraph(st)) {
            cleansedGraphStrings.add(st.getContext().stringValue());
        } else {
            conn.add(st);
            count++;
            if (count % batchSize == 0) {
                try {
                    conn.commit();
                    if (logger != null) {
                        logger.debug(batchSize + STATEMENTS_IMPORTED);
                    }
                    if (printToSystem) {
                        System.out.println(batchSize + STATEMENTS_IMPORTED);
                    }
                    conn.begin();
                } catch (RepositoryException e) {
                    throw new RDFHandlerException(e);
                }
            }
        }
    }

    private boolean hasInternallyManagedGraph(Statement st) {
        return (st.getContext() != null) && (st.getContext().stringValue().contains(MOBI_HTTPS_NAMESPACE)
                || st.getContext().stringValue().contains(MOBI_HTTP_NAMESPACE));
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

    /**
     * Returns the set of strings representing the internal graphs that were cleansed from the batch insert.
     *
     * @return the set of strings representing the internal graphs that were cleansed from the batch insert
     */
    public Set<String> getCleansedGraphStrings() {
        return cleansedGraphStrings;
    }
}
