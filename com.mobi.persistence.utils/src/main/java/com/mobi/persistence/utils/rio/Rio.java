package com.mobi.persistence.utils.rio;

/*-
 * #%L
 * com.mobi.persistence.utils
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

import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Namespace;
import com.mobi.rdf.api.Statement;
import org.eclipse.rdf4j.rio.RDFHandler;

public class Rio {

    /**
     * Writes the given statements to the given {@link RDFHandler}.
     * <p>
     * If the collection is a {@link Model}, its namespaces will also be written.
     *
     * @param iterable A collection of statements, such as a {@link Model}, to be written.
     */
    public static void write(Iterable<Statement> iterable, RDFHandler writer, SesameTransformer transformer,
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
            org.eclipse.rdf4j.model.Statement sesameStatement = transformer.sesameStatement(handledStatement);
            writer.handleStatement(sesameStatement);
        }
        writer.endRDF();
    }

    /**
     * TODO:
     * @param statement
     * @param writer
     * @param transformer
     * @param statementHandlers
     */
    public static void write(Statement statement, RDFHandler writer, SesameTransformer transformer,
                             StatementHandler... statementHandlers) {
        for (StatementHandler statementHandler : statementHandlers) {
            statement = statementHandler.handleStatement(statement);
        }
        org.eclipse.rdf4j.model.Statement sesameStatement = transformer.sesameStatement(statement);
        writer.handleStatement(sesameStatement);
    }

    /**
     * Writes the given statements to the given {@link RDFHandler}.
     *
     * @param iterable A collection of statements, such as a {@link Model}, to be written.
     * @param writer RDFHandler
     * @param transformer SesameTransformer
     * @param limit number of records to be written
     * @param statementHandlers StatementHandler
     * @return boolean if limit has been exceeded
     */
    public static boolean write(Iterable<Statement> iterable, RDFHandler writer, SesameTransformer transformer,
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

            org.eclipse.rdf4j.model.Statement sesameStatement = transformer.sesameStatement(handledStatement);
            writer.handleStatement(sesameStatement);

            if (limitExceededCounter >= limit) {
                limitExceeded = true;
                break;
            }
        }
        writer.endRDF();
        return limitExceeded;
    }

}
