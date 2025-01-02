package com.mobi.persistence.utils;

/*-
 * #%L
 * com.mobi.persistence.utils
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
import org.eclipse.rdf4j.repository.RepositoryException;
import org.eclipse.rdf4j.rio.RDFHandler;
import org.eclipse.rdf4j.rio.RDFHandlerException;
import org.slf4j.Logger;

public class BatchExporter implements RDFHandler {

    private org.eclipse.rdf4j.rio.RDFHandler delegate;
    private long count = 0;
    private long batchSize = 10000;
    private Logger logger = null;
    private boolean printToSystem = false;
    private boolean active = false;

    /**
     * Creates a new BatchExporter that will log exported statements. Wraps a Sesame RDFHandler and performs conversion
     * from Mobi to Sesame Statements.
     *
     * @param delegate The Sesame RDFHandler to wrap
     */
    public BatchExporter(org.eclipse.rdf4j.rio.RDFHandler delegate) {
        this.delegate = delegate;
    }

    @Override
    public void startRDF() throws com.mobi.persistence.utils.exception.RDFHandlerException {
        active = true;
        delegate.startRDF();
    }

    @Override
    public void endRDF() throws RDFHandlerException {
        active = false;
        delegate.endRDF();
        if (logger != null) {
            logger.debug("Operation complete. " + count + " statements exported.");
        }
        if (printToSystem) {
            System.out.println("Operation complete. " + count + " statements exported.");
        }
    }

    @Override
    public void handleNamespace(String prefix, String namespace) throws RDFHandlerException {
        delegate.handleNamespace(prefix, namespace);
    }

    @Override
    public void handleStatement(Statement statement) throws RDFHandlerException {
        delegate.handleStatement(statement);
        count++;
        if (count % batchSize == 0) {
            try {
                if (logger != null) {
                    logger.debug(batchSize + " statements exported...");
                }
                if (printToSystem) {
                    System.out.println(batchSize + " statements exported...");
                }
            } catch (RepositoryException e) {
                throw new RDFHandlerException(e);
            }
        }
    }

    @Override
    public void handleComment(String comment) throws com.mobi.persistence.utils.exception.RDFHandlerException {

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
     * Returns whether or not the export transaction is currently active.
     *
     * @return boolean True if transaction is active; false otherwise
     */
    public boolean isActive() {
        return active;
    }
}
