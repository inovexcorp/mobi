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

import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.ValueFactory;

public class AddContextHandler implements StatementHandler {

    private ValueFactory vf;
    private Resource context;

    public AddContextHandler(ValueFactory valueFactory, Resource context) {
        this.vf = valueFactory;
        this.context = context;
    }

    @Override
    public Statement handleStatement(Statement st) {
        return vf.createStatement(st.getSubject(), st.getPredicate(), st.getObject(), context);
    }
}
