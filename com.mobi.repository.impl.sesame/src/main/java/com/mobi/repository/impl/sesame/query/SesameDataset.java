package com.mobi.repository.impl.sesame.query;

/*-
 * #%L
 * com.mobi.repository.impl.sesame
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

import com.mobi.query.api.Dataset;
import com.mobi.rdf.api.IRI;

import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Set;

public class SesameDataset implements Dataset {
    private Set<IRI> defaultRemoveGraphs = new LinkedHashSet<>();

    private IRI defaultInsertGraph;

    private Set<IRI> defaultGraphs = new LinkedHashSet<>();

    private Set<IRI> namedGraphs = new LinkedHashSet<>();

    public SesameDataset() {
    }

    @Override
    public Set<IRI> getDefaultRemoveGraphs() {
        return Collections.unmodifiableSet(defaultRemoveGraphs);
    }

    @Override
    public void addDefaultRemoveGraph(IRI graphURI) {
        defaultRemoveGraphs.add(graphURI);
    }

    @Override
    public boolean removeDefaultRemoveGraph(IRI graphURI) {
        return defaultRemoveGraphs.remove(graphURI);
    }

    /**
     * @return Returns the default insert graph.
     */
    @Override
    public IRI getDefaultInsertGraph() {
        return defaultInsertGraph;
    }

    @Override
    public void setDefaultInsertGraph(IRI defaultInsertGraph) {
        this.defaultInsertGraph = defaultInsertGraph;
    }

    @Override
    public Set<IRI> getDefaultGraphs() {
        return Collections.unmodifiableSet(defaultGraphs);
    }

    @Override
    public void addDefaultGraph(IRI graphURI) {
        defaultGraphs.add(graphURI);
    }

    @Override
    public boolean removeDefaultGraph(IRI graphURI) {
        return defaultGraphs.remove(graphURI);
    }

    @Override
    public Set<IRI> getNamedGraphs() {
        return Collections.unmodifiableSet(namedGraphs);
    }

    @Override
    public void addNamedGraph(IRI graphURI) {
        namedGraphs.add(graphURI);
    }

    @Override
    public boolean removeNamedGraph(IRI graphURI) {
        return namedGraphs.remove(graphURI);
    }

    @Override
    public void clear() {
        defaultRemoveGraphs.clear();
        defaultInsertGraph = null;
        defaultGraphs.clear();
        namedGraphs.clear();
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        for (IRI uri : getDefaultRemoveGraphs()) {
            sb.append("DELETE FROM ");
            appendURI(sb, uri);
        }
        if (getDefaultInsertGraph() != null) {
            sb.append("INSERT INTO ");
            appendURI(sb, getDefaultInsertGraph());
        }
        for (IRI uri : getDefaultGraphs()) {
            sb.append("FROM ");
            appendURI(sb, uri);
        }
        for (IRI uri : getNamedGraphs()) {
            sb.append("FROM NAMED ");
            appendURI(sb, uri);
        }
        if (getDefaultGraphs().isEmpty() && getNamedGraphs().isEmpty()) {
            sb.append("## empty dataset ##");
        }
        return sb.toString();
    }

    private void appendURI(StringBuilder sb, IRI uri) {
        String str = uri.toString();
        if (str.length() > 50) {
            sb.append("<").append(str, 0, 19).append("..");
            sb.append(str, str.length() - 29, str.length()).append(">\n");
        } else {
            sb.append("<").append(uri).append(">\n");
        }
    }
}
