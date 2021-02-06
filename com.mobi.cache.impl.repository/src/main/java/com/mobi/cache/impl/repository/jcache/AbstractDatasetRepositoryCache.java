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
import com.mobi.dataset.ontology.dataset.DatasetFactory;
import com.mobi.exception.MobiException;
import com.mobi.ontology.utils.cache.repository.OntologyDatasets;
import com.mobi.query.api.Update;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Literal;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import javax.cache.Cache;

public abstract class AbstractDatasetRepositoryCache<K, V> implements Cache<K, V> {

    private final Logger LOG = LoggerFactory.getLogger(AbstractDatasetRepositoryCache.class);

    protected ValueFactory vf;
    protected ModelFactory mf;
    protected Repository repository;
    protected DatasetFactory datasetFactory;
    protected DatasetManager datasetManager;

    protected static final String UPDATE_TIMESTAMP_QUERY;

    static {
        try {
            UPDATE_TIMESTAMP_QUERY = IOUtils.toString(
                    AbstractDatasetRepositoryCache.class.getResourceAsStream("/update-timestamp.rq"),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    protected DatasetConnection getDatasetConnection(Resource datasetIRI, boolean createNotExists) {
        LOG.debug("Retrieving cache dataset connection for " + datasetIRI.stringValue());
        try (RepositoryConnection conn = repository.getConnection()) {
            if (!conn.getStatements(datasetIRI, null, null, datasetIRI).hasNext()) {
                if (createNotExists) {
                    LOG.debug("Creating cache dataset " + datasetIRI.stringValue());
                    datasetManager.createDataset(datasetIRI.stringValue(), conn);
                } else {
                    LOG.trace("The dataset " + datasetIRI + " does not exist in the specified repository.");
                    throw new IllegalArgumentException("The dataset " + datasetIRI
                            + " does not exist in the specified repository.");
                }
            }
        }
        DatasetConnection conn = datasetManager.getConnection(datasetIRI, repository.getConfig().id(), false, false);
        updateDatasetTimestamp(conn);
        return conn;
    }

    protected void updateDatasetTimestamp(DatasetConnection conn) {
//        Literal timestamp = vf.createLiteral(OffsetDateTime.now());
//
//        Resource dataset = conn.getDataset();
//        LOG.debug("Updating cache dataset last accessed property for " + dataset);
//        Update update = conn.prepareUpdate(UPDATE_TIMESTAMP_QUERY);
//        update.setBinding("dataset", dataset);
//        update.setBinding("now", timestamp);
//        update.execute();
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