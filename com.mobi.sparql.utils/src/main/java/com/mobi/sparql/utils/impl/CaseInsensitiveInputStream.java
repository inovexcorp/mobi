package com.mobi.sparql.utils.impl;

/*-
 * #%L
 * com.mobi.sparql.utils
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

import org.antlr.v4.runtime.ANTLRInputStream;
import org.antlr.v4.runtime.IntStream;

public class CaseInsensitiveInputStream extends ANTLRInputStream {

    protected char[] lookaheadData;

    public CaseInsensitiveInputStream(String input) {
        super(input);
        lookaheadData = input.toLowerCase().toCharArray();
    }

    @Override
    public int LA(int i) {
        if (i == 0) {
            return 0; // undefined
        }
        if (i < 0) {
            i++; // e.g., translate LA(-1) to use offset i=0; then data[p+0-1]
            if ((p + i - 1) < 0) {
                return IntStream.EOF; // invalid; no char before first char
            }
        }

        if ((p + i - 1) >= n) {
            return IntStream.EOF;
        }

        return lookaheadData[p + i - 1];
    }

}