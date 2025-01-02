package com.mobi.persistence.utils.rio;

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

import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Namespace;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.rio.RDFHandler;

public class Rio {

    /**
     * Writes the given statements to the given {@link RDFHandler}.
     * If the collection is a {@link Model}, its namespaces will also be written.
     *
     * @param iterable A collection of statements, such as a {@link Model}, to be written.
     */
    public static void write(Iterable<? extends Statement> iterable, RDFHandler writer,
                             StatementHandler... statementHandlers) {
        writer.startRDF();

        if (iterable instanceof Model) {
            for (Namespace nextNamespace : ((Model) iterable).getNamespaces()) {
                writer.handleNamespace(nextNamespace.getPrefix(), nextNamespace.getName());
            }
        }

        for (final Statement st : iterable) {
            Statement handledStatement = st;
            for (StatementHandler statementHandler : statementHandlers) {
                handledStatement = statementHandler.handleStatement(handledStatement);
            }
            writer.handleStatement(handledStatement);
        }
        writer.endRDF();
    }

    /**
     * Writes each statement to the given {@link RDFHandler}. Provides control to start and end writing to external
     * caller. startRDF()/endRDF() are handled outside of this method.
     *
     * @param statement The {@link Statement} to write to the RDFWriter.
     * @param writer The {@link org.eclipse.rdf4j.rio.RDFWriter} to handle writing statements.
     * @param statementHandlers An optional array of {@link StatementHandler}s to apply to the Statement.
     */
    public static void write(Statement statement, RDFHandler writer,
                             StatementHandler... statementHandlers) {
        for (StatementHandler statementHandler : statementHandlers) {
            statement = statementHandler.handleStatement(statement);
        }
        writer.handleStatement(statement);
    }

    /**
     * Writes the given statements to the given {@link RDFHandler}.
     *
     * @param iterable A collection of statements, such as a {@link Model}, to be written.
     * @param writer RDFHandler
     * @param limit number of records to be written
     * @param statementHandlers StatementHandler
     * @return boolean if limit has been exceeded
     */
    public static boolean write(Iterable<? extends Statement> iterable, RDFHandler writer,
                                int limit, StatementHandler... statementHandlers) {
        boolean limitExceeded = false;
        int limitExceededCounter = 0;
        writer.startRDF();
        if (iterable instanceof Model) {
            for (Namespace nextNamespace : ((Model) iterable).getNamespaces()) {
                writer.handleNamespace(nextNamespace.getPrefix(), nextNamespace.getName());
            }
        }
        for (final Statement st : iterable) {
            limitExceededCounter += 1;
            Statement handledStatement = st;
            for (StatementHandler statementHandler : statementHandlers) {
                handledStatement = statementHandler.handleStatement(handledStatement);
            }

            writer.handleStatement(handledStatement);

            if (limitExceededCounter >= limit) {
                limitExceeded = true;
                break;
            }
        }
        writer.endRDF();
        return limitExceeded;
    }

}
