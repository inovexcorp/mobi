package org.matonto.rdf.core.impl.sesame.factory;

/*-
 * #%L
 * org.matonto.rdf.impl.sesame
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

import org.matonto.rdf.api.Statement;
import org.matonto.rdf.core.impl.sesame.SimpleStatement;
import org.matonto.rdf.core.utils.Values;

public class StatementValueFactory implements SesameMatOntoValueFactory<Statement, org.openrdf.model.Statement> {

    @Override
    public Statement asMatOntoObject(org.openrdf.model.Statement object) {
        return new SimpleStatement(Values.matontoResource(object.getSubject()), Values.matontoIRI(object.getPredicate()),
                Values.matontoValue(object.getObject()), Values.matontoResource(object.getContext()));
    }
}
