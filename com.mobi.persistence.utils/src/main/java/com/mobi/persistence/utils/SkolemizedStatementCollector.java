package com.mobi.persistence.utils;

/*-
 * #%L
 * com.mobi.persistence.utils
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import org.eclipse.rdf4j.model.BNode;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.rio.RDFHandlerException;
import org.eclipse.rdf4j.rio.helpers.StatementCollector;

import java.util.Map;

public class SkolemizedStatementCollector extends StatementCollector {
    private final SesameTransformer sesameTransformer;
    private final BNodeService bNodeService;
    private final Model statementsToSkolemize;
    private final Map<com.mobi.rdf.api.BNode, IRI> skolemizedBNodes;

    public SkolemizedStatementCollector(ModelFactory modelFactory, SesameTransformer sesameTransformer,
                                        BNodeService bNodeService, Map<com.mobi.rdf.api.BNode, IRI> skolemizedBNodes) {
        super();
        this.sesameTransformer = sesameTransformer;
        this.bNodeService = bNodeService;
        statementsToSkolemize = modelFactory.createModel();
        this.skolemizedBNodes = skolemizedBNodes;
    }

    public void handleStatement(Statement st) {
        if (st.getSubject() instanceof BNode || st.getObject() instanceof BNode) {
            statementsToSkolemize.add(sesameTransformer.mobiStatement(st));
        } else {
            super.handleStatement(st);
        }
    }

    public void endRDF() throws RDFHandlerException {
        bNodeService.deterministicSkolemize(statementsToSkolemize, skolemizedBNodes)
                .forEach(statement -> super.handleStatement(sesameTransformer.sesameStatement(statement)));
        super.endRDF();
    }
}
