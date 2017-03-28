package org.matonto.sparql.utils;

/*-
 * #%L
 * org.matonto.sparql.query
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

import static org.junit.Assert.assertEquals;

import org.antlr.v4.runtime.ANTLRInputStream;
import org.antlr.v4.runtime.BaseErrorListener;
import org.antlr.v4.runtime.CommonTokenStream;
import org.antlr.v4.runtime.RecognitionException;
import org.antlr.v4.runtime.Recognizer;
import org.antlr.v4.runtime.TokenStreamRewriter;
import org.antlr.v4.runtime.tree.ParseTreeWalker;
import org.junit.Test;

public class SparqlTest {

    @Test
    public void parseSimpleQuery() throws Exception {
        SparqlLexer lexer = new SparqlLexer(new ANTLRInputStream(getClass().getResourceAsStream("/example1.rq")));
        CommonTokenStream tokens = new CommonTokenStream(lexer);
        SparqlParser parser = new SparqlParser(tokens);
        parser.addErrorListener(new BaseErrorListener() {
            @Override
            public void syntaxError(Recognizer<?, ?> recognizer, Object offendingSymbol, int line, int charPositionInLine, String msg, RecognitionException e) {
                throw new IllegalStateException("failed to parse at line " + line + " due to " + msg, e);
            }
        });
        parser.query();
    }

    @Test
    public void replaceDatasetClause() throws Exception {
        SparqlLexer lexer = new SparqlLexer(new ANTLRInputStream(getClass().getResourceAsStream("/example2.rq")));
        CommonTokenStream tokens = new CommonTokenStream(lexer);
        SparqlParser parser = new SparqlParser(tokens);
        parser.addErrorListener(new BaseErrorListener() {
            @Override
            public void syntaxError(Recognizer<?, ?> recognizer, Object offendingSymbol, int line, int charPositionInLine, String msg, RecognitionException e) {
                throw new IllegalStateException("failed to parse at line " + line + " due to " + msg, e);
            }
        });

        SparqlParser.QueryContext queryContext = parser.query();

        // Rewrite the dataset clause
        TokenStreamRewriter rewriter = new TokenStreamRewriter(parser.getTokenStream());
        ParseTreeWalker walker = new ParseTreeWalker();
        DatasetListener listener = new DatasetListener(rewriter);
        walker.walk(listener, queryContext);

        // Test result
        String newText = rewriter.getText();
        lexer = new SparqlLexer(new ANTLRInputStream(newText));
        tokens = new CommonTokenStream(lexer);
        parser = new SparqlParser(tokens);
        assertEquals("FROM<test:iri>", parser.query().selectQuery().datasetClause().get(0).getText());
    }

    private static class DatasetListener extends SparqlBaseListener {

        TokenStreamRewriter rewriter;

        DatasetListener(TokenStreamRewriter rewriter) {
            this.rewriter = rewriter;
        }

        @Override
        public void enterDatasetClause(SparqlParser.DatasetClauseContext ctx) {
            rewriter.replace(ctx.getStart(), ctx.getStop(), "FROM <test:iri>");
        }
    }
}
