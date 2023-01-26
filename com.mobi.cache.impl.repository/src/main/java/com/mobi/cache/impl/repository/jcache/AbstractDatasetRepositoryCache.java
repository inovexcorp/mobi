package com.mobi.cache.impl.repository.jcache;

/*-
 * #%L
 * com.mobi.cache.impl.repository
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import com.mobi.dataset.ontology.dataset.DatasetFactory;
import com.mobi.ontology.utils.cache.repository.OntologyDatasets;
import com.mobi.repository.api.OsgiRepository;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.OffsetDateTime;
import javax.cache.Cache;

public abstract class AbstractDatasetRepositoryCache<K, V> implements Cache<K, V> {

    private final Logger LOG = LoggerFactory.getLogger(AbstractDatasetRepositoryCache.class);

    protected final ValueFactory vf = new ValidatingValueFactory();
    protected final ModelFactory mf = new DynamicModelFactory();
    protected OsgiRepository repository;
    protected DatasetFactory datasetFactory;
    protected DatasetManager datasetManager;

    protected DatasetConnection getDatasetConnection(Resource datasetIRI, boolean createNotExists) {
        LOG.debug("Retrieving cache dataset connection for " + datasetIRI.stringValue());
        try (RepositoryConnection conn = repository.getConnection()) {
            RepositoryResult<Statement> statements = conn.getStatements(datasetIRI, null, null);
            boolean contains = statements.hasNext();
            statements.close();
            if (!contains) {
                if (createNotExists) {
                    LOG.debug("Creating cache dataset " + datasetIRI.stringValue());
                    datasetManager.createDataset(datasetIRI.stringValue(), repository.getRepositoryID());
                } else {
                    LOG.trace("The dataset " + datasetIRI + " does not exist in the specified repository.");
                    throw new IllegalArgumentException("The dataset " + datasetIRI
                            + " does not exist in the specified repository.");
                }
            }
        }
        DatasetConnection conn = datasetManager.getConnection(datasetIRI, repository.getRepositoryID(), false);
        updateDatasetTimestamp(conn);
        return conn;
    }

    protected void updateDatasetTimestamp(Resource datasetIRI) {
        DatasetConnection conn = getDatasetConnection(datasetIRI, false);
        updateDatasetTimestamp(conn);
    }

    protected void updateDatasetTimestamp(DatasetConnection conn) {
        IRI pred = vf.createIRI(OntologyDatasets.TIMESTAMP_IRI_STRING);
        Literal timestamp = vf.createLiteral(OffsetDateTime.now());

        Resource dataset = conn.getDataset();
        LOG.debug("Updating cache dataset last accessed property for " + dataset);
        conn.remove(dataset, pred, null, dataset);
        conn.add(dataset, pred, timestamp, dataset);
    }

    protected void requireNotClosed() {
        if (isClosed()) {
            LOG.error("Cache is closed. Cannot perform operation");
            throw new IllegalStateException("Cache is closed. Cannot perform operation.");
        }
    }
}
