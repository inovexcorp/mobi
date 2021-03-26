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

import com.mobi.query.api.OperationDataset;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.core.utils.Values;
import org.eclipse.rdf4j.query.impl.SimpleDataset;

import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

public class SesameOperationDataset implements OperationDataset {
    SimpleDataset dataset = new SimpleDataset();

    public SesameOperationDataset() {
    }

    public SesameOperationDataset(org.eclipse.rdf4j.query.Dataset dataset) {
        this.dataset = (SimpleDataset) dataset;
    }

    @Override
    public Set<IRI> getDefaultRemoveGraphs() {
        return Collections.unmodifiableSet(dataset.getDefaultRemoveGraphs()
                .stream()
                .map(Values::mobiIRI)
                .collect(Collectors.toSet()));
    }

    @Override
    public void addDefaultRemoveGraph(IRI graphURI) {
        dataset.addDefaultRemoveGraph(Values.sesameIRI(graphURI));
    }

    @Override
    public boolean removeDefaultRemoveGraph(IRI graphURI) {
        return dataset.removeDefaultRemoveGraph(Values.sesameIRI(graphURI));
    }

    @Override
    public IRI getDefaultInsertGraph() {
        return Values.mobiIRI(dataset.getDefaultInsertGraph());
    }

    @Override
    public void setDefaultInsertGraph(IRI defaultInsertGraph) {
        dataset.setDefaultInsertGraph(Values.sesameIRI(defaultInsertGraph));
    }

    @Override
    public Set<IRI> getDefaultGraphs() {
        return Collections.unmodifiableSet(dataset.getDefaultGraphs()
                .stream()
                .map(Values::mobiIRI)
                .collect(Collectors.toSet()));
    }

    @Override
    public void addDefaultGraph(IRI graphURI) {
        dataset.addDefaultGraph(Values.sesameIRI(graphURI));
    }

    @Override
    public boolean removeDefaultGraph(IRI graphURI) {
        return dataset.removeDefaultGraph(Values.sesameIRI(graphURI));
    }

    @Override
    public Set<IRI> getNamedGraphs() {
        return Collections.unmodifiableSet(dataset.getNamedGraphs()
                .stream()
                .map(Values::mobiIRI)
                .collect(Collectors.toSet()));
    }

    @Override
    public void addNamedGraph(IRI graphURI) {
        dataset.addNamedGraph(Values.sesameIRI(graphURI));
    }

    @Override
    public boolean removeNamedGraph(IRI graphURI) {
        return dataset.removeNamedGraph(Values.sesameIRI(graphURI));
    }

    @Override
    public void clear() {
        dataset.clear();
    }

    @Override
    public String toString() {
        return dataset.toString();
    }

    public SimpleDataset getDelegate() {
        return dataset;
    }
}
