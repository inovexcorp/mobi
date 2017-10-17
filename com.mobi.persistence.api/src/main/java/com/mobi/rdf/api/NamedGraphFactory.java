package com.mobi.rdf.api;

/*-
 * #%L
 * com.mobi.persistence.api
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

import javax.annotation.Nonnull;
import java.util.Collection;
import java.util.Set;

public interface NamedGraphFactory {

    /**
     * Creates an empty NamedGraph with a BlankNode Resource as its graph ID.
     *
     * @return The created NamedGraph.
     */
    NamedGraph createNamedGraph();

    /**
     * Creates an empty NamedGraph with the supplied Resource as its graph ID.
     *
     * @return The created NamedGraph.
     */
    NamedGraph createNamedGraph(Resource graphID);

    /**
     * Creates a NamedGraph with the supplied Resource as its graph ID, the Model's Namespaces as its
     * namespaces, and populated with the contents of the supplied Model. Note that all Statements in the
     * supplied Model must have a context that matches the graph ID.
     *
     * @return The created NamedGraph.
     */
    NamedGraph createNamedGraph(Resource graphID, @Nonnull Model model);

    /**
     * Creates a NamedGraph with the supplied Resource as its graph ID and populated with the
     * contents of the supplied Collection. Note that all Statements in the supplied Collection must have a
     * context that matches the graph ID.
     *
     * @return The created NamedGraph.
     */
    NamedGraph createNamedGraph(Resource graphID, @Nonnull Collection<@Nonnull ? extends Statement> c);

    /**
     * Creates a empty NamedGraph with the supplied Resource as its graph ID and supplied Namespaces as its
     * namespaces.
     *
     * @return The created NamedGraph.
     */
    NamedGraph createNamedGraph(Resource graphID, @Nonnull Set<@Nonnull Namespace> namespaces);

    /**
     * Creates a NamedGraph with the supplied Resource as its graph ID, the supplied Namespaces as its
     * namespaces, and populated with the contents of the supplied Collection. Note that all Statements
     * in the supplied Collection must have a context that matches the graph ID.
     *
     * @return The created NamedGraph.
     */
    NamedGraph createNamedGraph(Resource graphID, @Nonnull Set<@Nonnull Namespace> namespaces,
                                @Nonnull Collection<@Nonnull ? extends Statement> c);
}
