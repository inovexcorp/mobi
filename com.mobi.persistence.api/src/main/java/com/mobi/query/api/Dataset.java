package com.mobi.query.api;

/*-
 * #%L
 * com.mobi.persistence.api
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

import com.mobi.rdf.api.IRI;

import java.util.Set;

public interface Dataset {
    /**
     * Gets the default remove graph URIs of this dataset. An empty set indicates the the store's default behaviour
     * should be used, if not otherwise indicated in the operation.
     */
    public Set<IRI> getDefaultRemoveGraphs();

    /**
     * Adds a graph URI to the set of default remove graph URIs.
     */
    public void addDefaultRemoveGraph(IRI graphURI);

    /**
     * Removes a graph URI from the set of default remove graph URIs.
     *
     * @return <tt>true</tt> if the URI was removed from the set, <tt>false</tt> if the set did not contain the URI.
     */
    public boolean removeDefaultRemoveGraph(IRI graphURI);

    /**
     * Gets the default insert graph URI of this dataset. An null value indicates that the store's default behaviour
     * should be used, if not otherwise indicated in the operation.
     */
    public IRI getDefaultInsertGraph();

    /**
     * Adds a graph URI to the set of default graph URIs.
     */
    public void addDefaultGraph(IRI graphURI);

    /**
     * Removes a graph URI from the set of default graph URIs.
     *
     * @return <tt>true</tt> if the URI was removed from the set, <tt>false</tt> if the set did not contain the URI.
     */
    public boolean removeDefaultGraph(IRI graphURI);

    /**
     * @param defaultInsertGraph The default insert graph to used.
     */
    public void setDefaultInsertGraph(IRI defaultInsertGraph);

    /**
     * Gets the default graph URIs of this dataset. An empty default graph set and a non-empty named graph set indicates
     * that the default graph is an empty graph. However, if both the default graph set and the named graph set are
     * empty, that indicates that the store's default behaviour should be used.
     */
    public Set<IRI> getDefaultGraphs();

    /**
     * Gets the named graph URIs of this dataset. An empty named graph set and a non-empty default graph set indicates
     * that there are no named graphs. However, if both the default graph set and the named graph set are empty, that
     * indicates that the store's default behaviour should be used.
     */
    public Set<IRI> getNamedGraphs();

    /**
     * Adds a graph URI to the set of named graph URIs.
     */
    public void addNamedGraph(IRI graphURI);

    /**
     * Removes a graph URI from the set of named graph URIs.
     *
     * @return <tt>true</tt> if the URI was removed from the set, <tt>false</tt> if the set did not contain the URI.
     */
    public boolean removeNamedGraph(IRI graphURI);

    /**
     * Removes all graph URIs (both default and named) from this dataset.
     */
    public void clear();
}
