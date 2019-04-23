package com.mobi.cache.impl.repository.jcache;

/*-
 * #%L
 * com.mobi.cache.impl.repository
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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

import com.mobi.dataset.api.DatasetConnection;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.dataset.ontology.dataset.Dataset;
import com.mobi.dataset.ontology.dataset.DatasetFactory;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Literal;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.base.RepositoryResult;

import java.time.OffsetDateTime;
import javax.cache.Cache;

public abstract class AbstractDatasetRepositoryCache<K, V> implements Cache<K, V> {

    protected static final String DEFAULT_DS_NAMESPACE = "http://mobi.com/dataset/";
    protected static final String SYSTEM_DEFAULT_NG_SUFFIX = "_system_dng";
    protected static final String TIMESTAMP_IRI_STRING = "http://mobi.com/ontologies/graph#lastAccessed";

    protected ValueFactory vf;
    protected ModelFactory mf;
    protected Repository repository;
    protected DatasetFactory datasetFactory;
    protected DatasetManager datasetManager;

    protected DatasetConnection getDatasetConnection(Resource datasetIRI, boolean createNotExists) {
        try (RepositoryConnection conn = repository.getConnection()) {
            if (!conn.getStatements(datasetIRI, null, null).hasNext()) {
                if (createNotExists) {
                    Dataset dataset = datasetFactory.createNew(datasetIRI);
                    dataset.setSystemDefaultNamedGraph(vf.createIRI(datasetIRI + SYSTEM_DEFAULT_NG_SUFFIX));
                    conn.add(dataset.getModel(), datasetIRI);
                } else {
                    throw new IllegalArgumentException("The dataset " + datasetIRI
                            + " does not exist in the specified repository.");
                }
            }
        }
        return datasetManager.getConnection(datasetIRI, repository.getConfig().id());
    }

    protected void updateNamedGraphTimestamps(Resource datasetIRI) {
        DatasetConnection conn = getDatasetConnection(datasetIRI, false);
        updateNamedGraphTimestamps(conn);
    }

    protected void updateNamedGraphTimestamps(DatasetConnection conn) {
        IRI pred = vf.createIRI(TIMESTAMP_IRI_STRING);
        Literal timestamp = vf.createLiteral(OffsetDateTime.now());
        RepositoryResult<Resource> namedGraphs = conn.getNamedGraphs();
        namedGraphs.forEach(namedGraph -> {
            conn.remove(namedGraph, pred, null, namedGraph);
            conn.add(namedGraph, pred, timestamp, namedGraph);
        });
        Resource sdNg = conn.getSystemDefaultNamedGraph();
        conn.remove(sdNg, pred, null, sdNg);
        conn.add(sdNg, pred, timestamp, sdNg);
    }

    protected void requireNotClosed() {
        if (isClosed()) {
            throw new IllegalStateException("Cache is closed. Cannot perform operation.");
        }
    }
}