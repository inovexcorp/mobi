package org.matonto.rdf.core.impl.sesame;

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

import org.matonto.rdf.api.*;

import javax.annotation.Nonnull;
import java.util.Collection;
import java.util.Collections;
import java.util.Set;

public abstract class AbstractNamedGraphFactory implements NamedGraphFactory {

    private static final ValueFactory VF = SimpleValueFactory.getInstance();

    @Override
    public NamedGraph createNamedGraph() {
        return createNamedGraph(VF.createBNode());
    }

    @Override
    public NamedGraph createNamedGraph(Resource graphID, @Nonnull Model model) {
        return createNamedGraph(graphID, model.getNamespaces(), model);
    }

    @Override
    public NamedGraph createNamedGraph(Resource graphID, @Nonnull Collection<@Nonnull ? extends Statement> c) {
        return createNamedGraph(graphID, Collections.emptySet(), c);
    }

    @Override
    public NamedGraph createNamedGraph(Resource graphID, @Nonnull Set<@Nonnull Namespace> namespaces) {
        return createNamedGraph(graphID, namespaces, Collections.emptySet());
    }

    @Override
    public NamedGraph createNamedGraph(Resource graphID, @Nonnull Set<@Nonnull Namespace> namespaces,
                                       @Nonnull Collection<@Nonnull ? extends Statement> c) {
        NamedGraph graph = createNamedGraph();
        graph.addAll(c);
        namespaces.forEach(graph::setNamespace);
        return graph;
    }
}
