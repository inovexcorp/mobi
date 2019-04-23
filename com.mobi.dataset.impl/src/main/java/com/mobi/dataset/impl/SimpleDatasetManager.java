package com.mobi.dataset.impl;

/*-
 * #%L
 * com.mobi.dataset.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Deactivate;
import aQute.bnd.annotation.component.Modified;
import aQute.bnd.annotation.component.Reference;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.dataset.api.DatasetConnection;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.dataset.ontology.dataset.Dataset;
import org.apache.commons.io.IOUtils;
import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.dataset.api.builder.DatasetRecordConfig;
import com.mobi.dataset.ontology.dataset.DatasetFactory;
import com.mobi.dataset.ontology.dataset.DatasetRecord;
import com.mobi.dataset.ontology.dataset.DatasetRecordFactory;
import com.mobi.dataset.pagination.DatasetPaginatedSearchParams;
import com.mobi.dataset.pagination.DatasetRecordSearchResults;
import com.mobi.exception.MobiException;
import com.mobi.persistence.utils.Bindings;
import com.mobi.query.TupleQueryResult;
import com.mobi.query.api.TupleQuery;
import com.mobi.rdf.api.BNode;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.repository.base.RepositoryResult;

import java.io.IOException;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Component(immediate = true)
public class SimpleDatasetManager implements DatasetManager {

    private CatalogConfigProvider configProvider;
    private CatalogManager catalogManager;
    private ValueFactory vf;
    private DatasetRecordFactory dsRecFactory;
    private DatasetFactory dsFactory;
    private RepositoryManager repoManager;

    private static final String FIND_DATASETS_QUERY;
    private static final String FIND_DATASET_RECORDS_QUERY;
    private static final String CATALOG_BINDING = "catalog";
    private static final String REPOSITORY_BINDING = "repository";
    private static final String SYSTEM_DEFAULT_NG_SUFFIX = "_system_dng";

    static {
        try {
            FIND_DATASETS_QUERY = IOUtils.toString(
                    SimpleDatasetManager.class.getResourceAsStream("/find-datasets.rq"),
                    "UTF-8"
            );
            FIND_DATASET_RECORDS_QUERY = IOUtils.toString(
                    SimpleDatasetManager.class.getResourceAsStream("/find-dataset-records.rq"),
                    "UTF-8"
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Reference
    void setConfigProvider(CatalogConfigProvider configProvider) {
        this.configProvider = configProvider;
    }

    @Reference
    void setCatalogManager(CatalogManager catalogManager) {
        this.catalogManager = catalogManager;
    }

    @Reference
    void setValueFactory(ValueFactory valueFactory) {
        this.vf = valueFactory;
    }

    @Reference
    void setDatasetRecordFactory(DatasetRecordFactory factory) {
        this.dsRecFactory = factory;
    }

    @Reference
    void setDatasetFactory(DatasetFactory datasetFactory) {
        this.dsFactory = datasetFactory;
    }

    @Reference
    void setRepoManager(RepositoryManager repoManager) {
        this.repoManager = repoManager;
    }

    @Activate
    private void start(Map<String, Object> props) {
    }

    @Modified
    protected void modified(Map<String, Object> props) {
    }

    @Deactivate
    private void stop() {
    }

    @Override
    public Set<Resource> getDatasets(String repositoryId) {
        Set<Resource> datasets = new HashSet<>();
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            TupleQuery query = conn.prepareTupleQuery(FIND_DATASETS_QUERY);
            query.setBinding(CATALOG_BINDING, configProvider.getLocalCatalogIRI());
            query.setBinding(REPOSITORY_BINDING, vf.createLiteral(repositoryId));
            TupleQueryResult result = query.evaluate();
            result.forEach(bindingSet -> datasets.add(Bindings.requiredResource(bindingSet, "dataset")));
        }
        return datasets;
    }

    @Override
    public PaginatedSearchResults<DatasetRecord> getDatasetRecords(DatasetPaginatedSearchParams searchParams) {
        PaginatedSearchResults<Record> results = catalogManager.findRecord(configProvider.getLocalCatalogIRI(),
                searchParams.build());
        return new DatasetRecordSearchResults(results, dsRecFactory);
    }

    @Override
    public Optional<DatasetRecord> getDatasetRecord(Resource dataset, String repositoryId) {
        return getRecordResource(dataset, repositoryId).flatMap(this::getDatasetRecord);
    }

    @Override
    public Optional<DatasetRecord> getDatasetRecord(Resource record) {
        return catalogManager.getRecord(configProvider.getLocalCatalogIRI(), record, dsRecFactory);
    }

    @Override
    public DatasetRecord createDataset(DatasetRecordConfig config) {
        Repository dsRepo = repoManager.getRepository(config.getRepositoryId()).orElseThrow(() ->
                new IllegalArgumentException("Dataset target repository does not exist."));

        IRI datasetIRI = vf.createIRI(config.getDataset());
        IRI sdgIRI = vf.createIRI(config.getDataset() + SYSTEM_DEFAULT_NG_SUFFIX);

        try (RepositoryConnection conn = dsRepo.getConnection()) {
            if (conn.getStatements(datasetIRI, null, null).hasNext()) {
                throw new IllegalArgumentException("The dataset already exists in the specified repository.");
            }
        }
        DatasetRecord datasetRecord = catalogManager.createRecord(config, dsRecFactory);

        Dataset dataset = dsFactory.createNew(datasetIRI);
        dataset.setSystemDefaultNamedGraph(sdgIRI);

        datasetRecord.setDataset(dataset);
        datasetRecord.setRepository(config.getRepositoryId());
        Set<Value> ontologies = new HashSet<>();
        config.getOntologies().forEach(identifier -> {
            ontologies.add(identifier.getNode());
            datasetRecord.getModel().addAll(identifier.getStatements());
        });
        datasetRecord.setOntology(ontologies);
        catalogManager.addRecord(configProvider.getLocalCatalogIRI(), datasetRecord);

        try (RepositoryConnection conn = dsRepo.getConnection()) {
            conn.add(dataset.getModel(), datasetIRI);
        }

        return datasetRecord;
    }

    @Override
    public DatasetRecord deleteDataset(Resource dataset, String repositoryId) {
        Resource record = getRecordResource(dataset, repositoryId).orElseThrow(() ->
                new IllegalArgumentException("Could not find the required DatasetRecord in the Catalog."));
        return deleteDataset(record);
    }

    @Override
    public DatasetRecord deleteDataset(Resource record) {
        DatasetRecord datasetRecord = catalogManager.removeRecord(configProvider.getLocalCatalogIRI(), record,
                dsRecFactory);

        Repository dsRepo = getDatasetRepo(datasetRecord);
        Resource dataset = datasetRecord.getDataset_resource().orElseThrow(()
                -> new IllegalStateException("Could not retrieve the Dataset IRI from the DatasetRecord."));

        try (RepositoryConnection conn = dsRepo.getConnection()) {
            deleteGraphs(conn, dataset);
            conn.remove(dataset, null, null);
        }
        return datasetRecord;
    }

    @Override
    public DatasetRecord safeDeleteDataset(Resource dataset, String repositoryId) {
        Resource record = getRecordResource(dataset, repositoryId).orElseThrow(() ->
                new IllegalArgumentException("Could not find the required DatasetRecord in the Catalog."));
        return safeDeleteDataset(record);
    }

    @Override
    public DatasetRecord safeDeleteDataset(Resource record) {
        DatasetRecord datasetRecord = catalogManager.removeRecord(configProvider.getLocalCatalogIRI(), record,
                dsRecFactory);

        Repository dsRepo = getDatasetRepo(datasetRecord);
        Resource dataset = datasetRecord.getDataset_resource().orElseThrow(()
                -> new IllegalStateException("Could not retrieve the Dataset IRI from the DatasetRecord."));

        try (RepositoryConnection conn = dsRepo.getConnection()) {
            safeDeleteGraphs(conn, dataset);
            conn.remove(dataset, null, null);
        }
        return datasetRecord;
    }

    @Override
    public void clearDataset(Resource dataset, String repositoryId) {
        Resource record = getRecordResource(dataset, repositoryId).orElseThrow(() ->
                new IllegalArgumentException("Could not find the required DatasetRecord in the Catalog."));
        clearDataset(record);
    }

    @Override
    public void clearDataset(Resource record) {
        DatasetRecord datasetRecord = getDatasetRecord(record).orElseThrow(() ->
                new IllegalArgumentException("Could not find the required DatasetRecord in the Catalog."));
        Resource dataset = datasetRecord.getDataset_resource().orElseThrow(() ->
                new IllegalStateException("Could not retrieve the Dataset IRI from the DatasetRecord."));

        Repository dsRepo = getDatasetRepo(datasetRecord);

        try (RepositoryConnection conn = dsRepo.getConnection()) {
            deleteGraphs(conn, dataset);
            deleteGraphLinks(conn, dataset);
        }
    }

    @Override
    public void safeClearDataset(Resource dataset, String repositoryId) {
        Resource record = getRecordResource(dataset, repositoryId).orElseThrow(() ->
                new IllegalArgumentException("Could not find the required DatasetRecord in the Catalog."));
        safeClearDataset(record);
    }

    @Override
    public void safeClearDataset(Resource record) {
        DatasetRecord datasetRecord = getDatasetRecord(record).orElseThrow(() ->
                new IllegalArgumentException("Could not find the required DatasetRecord in the Catalog."));
        Resource dataset = datasetRecord.getDataset_resource().orElseThrow(() ->
                new IllegalStateException("Could not retrieve the Dataset IRI from the DatasetRecord."));

        Repository dsRepo = getDatasetRepo(datasetRecord);

        try (RepositoryConnection conn = dsRepo.getConnection()) {
            safeDeleteGraphs(conn, dataset);
            deleteGraphLinks(conn, dataset);
        }
    }

    @Override
    public DatasetConnection getConnection(Resource dataset, String repositoryId) {
        Repository dsRepo = getDatasetRepo(repositoryId);

        return new SimpleDatasetRepositoryConnection(dsRepo.getConnection(), dataset, repositoryId, vf);
    }

    @Override
    public DatasetConnection getConnection(Resource record) {
        DatasetRecord datasetRecord = getDatasetRecord(record).orElseThrow(() ->
                new IllegalArgumentException("Could not find the required DatasetRecord in the Catalog."));
        Resource dataset = datasetRecord.getDataset_resource().orElseThrow(() ->
                new IllegalStateException("Could not retrieve the Dataset IRI from the DatasetRecord."));
        String repositoryId = datasetRecord.getRepository().orElseThrow(() ->
                new IllegalStateException("Could not retrieve the Repository ID from the DatasetRecord."));

        Repository dsRepo = getDatasetRepo(datasetRecord);
        return new SimpleDatasetRepositoryConnection(dsRepo.getConnection(), dataset, repositoryId, vf);
    }

    /**
     * Returns the DatasetRecord Resource associated with this dataset/repository combination if it exists.
     *
     * @param dataset The Dataset to search for
     * @param repositoryId The Repository in which to search
     * @return Optional of the DatasetRecord Resource if it exists, links to the specified dataset, and is associated
     *      with the correct dataset repository; otherwise, Optional.empty().
     */
    private Optional<Resource> getRecordResource(Resource dataset, String repositoryId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            RepositoryResult<Statement> recordStmts =
                    conn.getStatements(null, vf.createIRI(DatasetRecord.dataset_IRI), dataset);

            while (recordStmts.hasNext()) {
                Resource record = recordStmts.next().getSubject();
                if (conn.getStatements(record, vf.createIRI(DatasetRecord.repository_IRI),
                        vf.createLiteral(repositoryId)).hasNext()) {
                    return Optional.of(record);
                }
            }

            return Optional.empty();
        }
    }

    private Repository getDatasetRepo(DatasetRecord datasetRecord) {
        String dsRepoID = datasetRecord.getRepository().orElseThrow(() ->
                new IllegalStateException("DatasetRecord does not specify a dataset repository."));
        return getDatasetRepo(dsRepoID);
    }

    private Repository getDatasetRepo(String repositoryId) {
        return repoManager.getRepository(repositoryId).orElseThrow(() ->
                new MobiException("Dataset target repository does not exist."));
    }

    private void deleteGraphs(RepositoryConnection conn, Resource dataset) {
        IRI ngPred = vf.createIRI(Dataset.namedGraph_IRI);
        IRI dngPred = vf.createIRI(Dataset.defaultNamedGraph_IRI);
        IRI sdngPred = vf.createIRI(Dataset.systemDefaultNamedGraph_IRI);
        conn.getStatements(dataset, ngPred, null).forEach(stmt -> clearGraph(conn, stmt.getObject()));
        conn.getStatements(dataset, dngPred, null).forEach(stmt -> clearGraph(conn, stmt.getObject()));
        conn.getStatements(dataset, sdngPred, null).forEach(stmt -> clearGraph(conn, stmt.getObject()));
    }

    private void safeDeleteGraphs(RepositoryConnection conn, Resource dataset) {
        IRI ngPred = vf.createIRI(Dataset.namedGraph_IRI);
        IRI dngPred = vf.createIRI(Dataset.defaultNamedGraph_IRI);
        IRI sdngPred = vf.createIRI(Dataset.systemDefaultNamedGraph_IRI);
        conn.getStatements(dataset, ngPred, null).forEach(stmt -> {
            Value graph = stmt.getObject();
            if (safeToDelete(conn, dataset, graph)) {
                clearGraph(conn, graph);
            }
        });
        conn.getStatements(dataset, dngPred, null).forEach(stmt -> {
            Value graph = stmt.getObject();
            if (safeToDelete(conn, dataset, graph)) {
                clearGraph(conn, graph);
            }
        });
        conn.getStatements(dataset, sdngPred, null).forEach(stmt -> {
            Value graph = stmt.getObject();
            if (safeToDelete(conn, dataset, graph)) {
                clearGraph(conn, graph);
            }
        });
    }

    private void clearGraph(RepositoryConnection conn, Value graph) {
        if (graph instanceof IRI) {
            conn.clear(vf.createIRI(graph.stringValue()));
        } else if (graph instanceof BNode) {
            conn.clear(vf.createBNode(graph.stringValue()));
        }
    }

    private boolean safeToDelete(RepositoryConnection conn, Resource dataset, Value graph) {
        IRI ngPred = vf.createIRI(Dataset.namedGraph_IRI);
        IRI dngPred = vf.createIRI(Dataset.defaultNamedGraph_IRI);

        RepositoryResult<Statement> ngStmts = conn.getStatements(null, ngPred, graph);
        while (ngStmts.hasNext()) {
            if (!ngStmts.next().getSubject().equals(dataset)) {
                return false;
            }
        }

        RepositoryResult<Statement> dngStmts = conn.getStatements(null, dngPred, graph);
        while (dngStmts.hasNext()) {
            if (!dngStmts.next().getSubject().equals(dataset)) {
                return false;
            }
        }

        return true;
    }

    private void deleteGraphLinks(RepositoryConnection conn, Resource dataset) {
        IRI ngPred = vf.createIRI(Dataset.namedGraph_IRI);
        IRI dngPred = vf.createIRI(Dataset.defaultNamedGraph_IRI);
        conn.remove(dataset, ngPred, null);
        conn.remove(dataset, dngPred, null);
    }
}
