/*-
 * #%L
 * org.matonto.web
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
CodeMirror.defineMode("manchestersyntax", function(config) {

    var tokenTypes = {
        "some": "manchester-rest",
        "only": "manchester-rest",
        "value": "manchester-rest",
        "min": "manchester-rest",
        "max": "manchester-rest",
        "exactly": "manchester-rest",
        "and": "manchester-expr",
        "or": "manchester-expr",
        "not": "manchester-expr",
        "(": "open-par",
        ")": "close-par",
        "{": "open-par",
        "}": "close-par",
        "integer": "builtin-kw",
        "double": "builtin-kw",
        "float": "builtin-kw",
        "decimal": "builtin-kw",
        ",": "comma",
        "<": "facet",
        "<=": "facet",
        ">": "facet",
        ">=": "facet",
        "length": "facet",
        "minLength": "facet",
        "maxLength": "facet",
        "pattern": "facet",
        "langRange": "facet",
        "true" : "manchester-lit",
        "false" : "manchester-lit",
        /*"true" : "boolean-lit",
        "false" : "boolean-lit",*/
        "owl:Thing" : "builtin-kw owl-thing",
        "owl:Nothing" : "builtin-kw owl-nothing",
    };
    var tokenRegexes = {
        '<[^>]*>': "iri",
        '"(\\"|[^"])*"': "manchester-lit",
        '\\^\\^[^ ]+': "literal-datatype",
        '@[^ ]+': "lang-tag",
        '(\\+|\\-)?(\\d+(\\.\\d+)?((e|E)(\\+|\\-)?\\d+)?|\\.\\d+((e|E)(\\+|\\-)?\\d+)?)(f|F)': "manchester-lit",
        '(\\+|\\-)?\\d+\\.\\d+': "manchester-lit",
        '(\\+|\\-)?\\d+': "manchester-lit",
        /*'"(\\"|[^"])*"': "string",
        '\\^\\^[^ ]+': "literal-datatype",
        '@[^ ]+': "lang-tag",
        '(\\+|\\-)?(\\d+(\\.\\d+)?((e|E)(\\+|\\-)?\\d+)?|\\.\\d+((e|E)(\\+|\\-)?\\d+)?)(f|F)': "floating-point-lit",
        '(\\+|\\-)?\\d+\\.\\d+': "decimal-lit",
        '(\\+|\\-)?\\d+': "integer-lit",*/
    };
    var delimeters = {
        "(" : "delim",
        ")" : "delim",
        "{" : "delim",
        "}" : "delim",
        "[" : "delim",
        "]" : "delim",
        " " : "delim",
        "\t" : "delim",
        "\r" : "delim",
        "\n" : "delim",
        "," : "delim"
    };

    function consumeUntilTerminator(stream, state, terminatingCharacter, inStateFlag) {
        state[inStateFlag] = true;
        var buffer = stream.next();
        var nextCharIsEscaped = false;
        while (true) {
            var ch = stream.next();
            if (ch == '\\') {
                state.nextCharIsEscaped = true;
            }
            if (!state.nextCharIsEscaped && ch == terminatingCharacter) {
                buffer += ch;
                state[inStateFlag] = false;
                return buffer;
            }
            if (ch != '\\') {
                state.nextCharIsEscaped = false;
            }
            if (ch == null) {
                // Not reached the end of the state
                return buffer;
            }
        }
    }
    function isDelimeter(ch) {
        return delimeters[ch] != null;
    }
    function peekDelimeter(stream, state) {
        return isDelimeter(stream.peek());
    }
    function nextToken(stream, state) {
        if (state.inString) {
            return new Token(consumeUntilTerminator(stream, state, '"', 'inString'), "string");
        }
        if (stream.peek() == '"') {
            return new Token(consumeUntilTerminator(stream, state, '"', 'inString'), "string");
        }
        if (peekDelimeter(stream, state)) {
            var delimeter = stream.next();
            var additionalStyle = tokenTypes[delimeter];
            return new Token(delimeter, "delim " + additionalStyle == null ? "" : additionalStyle);
        }
        var tokenBuffer = "";
        while (!peekDelimeter(stream, state)) {
            if (stream.peek() == null) {
                break;
            }
            tokenBuffer += stream.next();
        }
        var type = tokenTypes[tokenBuffer];
        if (type == null) {
            for (var regex in tokenRegexes) {
                if (tokenRegexes.hasOwnProperty(regex)) {
                    var regExp = new RegExp(regex);
                    var match = regExp.exec(tokenBuffer);
                    if (match != null) {
                        var firstMatch = match[0];
                        if (firstMatch == tokenBuffer) {
                            type = tokenRegexes[regex];
                            break;
                        }
                    }
                }
            }
        }
        if (type == null) {
            type = "word";
        }
        return new Token(tokenBuffer, type);
    }
    function Token(literal, type) {
        this.literal = literal;
        this.type = type;
    }

    return {
        startState: () => {
            return {inString: false, inIRI: false, loc: "start", nextCharIsEscaped: false};
        },
        token: (stream, state) => {
            var token = nextToken(stream, state);
            return token.type;
        }
    }
});

CodeMirror.defineMIME("text/omn", "manchestersyntax");