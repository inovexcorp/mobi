package com.mobi.rdf.core.utils;

/*-
 * #%L
 * com.mobi.rdf.impl.sesame
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

import org.eclipse.rdf4j.model.Statement;

import java.util.Iterator;

public class SesameStatementIterable implements Iterable<Statement>, Iterator<Statement> {
    private Iterator<? extends com.mobi.rdf.api.Statement> it;

    public SesameStatementIterable(Iterable<? extends com.mobi.rdf.api.Statement> it) {
        this.it = it.iterator();
    }

    @Override
    public Iterator<Statement> iterator() {
        return this;
    }

    @Override
    public boolean hasNext() {
        return it.hasNext();
    }

    @Override
    public Statement next() {
        return Values.sesameStatement(it.next());
    }
}
