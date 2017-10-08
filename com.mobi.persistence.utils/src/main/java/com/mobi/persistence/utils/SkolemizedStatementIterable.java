package com.mobi.persistence.utils;

/*-
 * #%L
 * com.mobi.persistence.utils
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

import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.persistence.utils.api.SesameTransformer;
import org.openrdf.model.Statement;

import java.util.Iterator;

public class SkolemizedStatementIterable extends StatementIterable {
    private Iterator<com.mobi.rdf.api.Statement> it;
    private SesameTransformer transformer;
    private BNodeService service;

    public SkolemizedStatementIterable(Iterable<com.mobi.rdf.api.Statement> it, SesameTransformer transformer,
                                       BNodeService service) {
        super(it, transformer);
        this.it = it.iterator();
        this.transformer = transformer;
        this.service = service;
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
        return transformer.sesameStatement(service.skolemize(it.next()));
    }
}
