package com.mobi.persistence.utils;

/*-
 * #%L
 * com.mobi.persistence.utils
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import org.eclipse.rdf4j.model.BNode;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.rio.RDFHandlerException;
import org.eclipse.rdf4j.rio.helpers.StatementCollector;

import java.util.Map;

public class SkolemizedStatementCollector extends StatementCollector {
    private final BNodeService bNodeService;
    private final Model statementsToSkolemize;
    private final Map<BNode, IRI> skolemizedBNodes;

    public SkolemizedStatementCollector(ModelFactory modelFactory, BNodeService bNodeService,
                                        Map<BNode, IRI> skolemizedBNodes) {
        super();
        this.bNodeService = bNodeService;
        statementsToSkolemize = modelFactory.createEmptyModel();
        this.skolemizedBNodes = skolemizedBNodes;
    }

    public void handleStatement(Statement st) {
        if (st.getSubject() instanceof BNode || st.getObject() instanceof BNode) {
            statementsToSkolemize.add(st);
        } else {
            super.handleStatement(st);
        }
    }

    public void endRDF() throws RDFHandlerException {
        bNodeService.deterministicSkolemize(statementsToSkolemize, skolemizedBNodes)
                .forEach(super::handleStatement);
        super.endRDF();
    }
}
