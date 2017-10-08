package com.mobi.sparql.utils;

/*-
 * #%L
 * com.mobi.sparql.query
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

import com.mobi.query.exception.MalformedQueryException;
import com.mobi.sparql.utils.impl.CaseInsensitiveInputStream;
import org.antlr.v4.runtime.BaseErrorListener;
import org.antlr.v4.runtime.CommonTokenStream;
import org.antlr.v4.runtime.RecognitionException;
import org.antlr.v4.runtime.Recognizer;
import com.mobi.query.exception.MalformedQueryException;
import com.mobi.sparql.utils.impl.CaseInsensitiveInputStream;

public class Query {

    public static Sparql11Parser getParser(String query) {
        Sparql11Lexer lexer = new Sparql11Lexer(new CaseInsensitiveInputStream(query));
        CommonTokenStream tokens = new CommonTokenStream(lexer);
        Sparql11Parser parser = new Sparql11Parser(tokens);
        parser.addErrorListener(new BaseErrorListener() {
            @Override
            public void syntaxError(Recognizer<?, ?> recognizer, Object offendingSymbol, int line, int charPositionInLine, String msg, RecognitionException e) {
                throw new MalformedQueryException("Failed to parse at line " + line + " due to " + msg, e);
            }
        });
        return parser;
    }
}
