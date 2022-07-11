package com.mobi.dataset.impl;

/*-
 * #%L
 * com.mobi.dataset.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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

import com.mobi.persistence.utils.ConnectionUtils;
import com.mobi.repository.api.OsgiRepository;
import org.eclipse.rdf4j.model.BNode;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.SimpleValueFactory;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryResult;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Deactivate;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.component.annotations.Reference;
import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.dataset.api.builder.DatasetRecordConfig;
import com.mobi.dataset.api.DatasetConnection;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.dataset.ontology.dataset.Dataset;
import com.mobi.dataset.ontology.dataset.DatasetFactory;
import com.mobi.dataset.ontology.dataset.DatasetRecord;
import com.mobi.dataset.ontology.dataset.DatasetRecordFactory;
import com.mobi.dataset.pagination.DatasetPaginatedSearchParams;
import com.mobi.dataset.pagination.DatasetRecordSearchResults;
import com.mobi.exception.MobiException;
import com.mobi.persistence.utils.Bindings;
import com.mobi.repository.api.RepositoryManager;
import org.apache.commons.io.IOUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Component(immediate = true)
public class SimpleDatasetManager implements DatasetManager {

    private static final String FIND_DATASETS_QUERY;
    private static final String CATALOG_BINDING = "catalog";
    private static final String REPOSITORY_BINDING = "repository";
    private static final String SYSTEM_DEFAULT_NG_SUFFIX = "_system_dng";

    static {
        try {
            FIND_DATASETS_QUERY = IOUtils.toString(
                    SimpleDatasetManager.class.getResourceAsStream("/find-datasets.rq"),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    final ValueFactory vf = SimpleValueFactory.getInstance();

    @Reference
    CatalogConfigProvider configProvider;

    @Reference
    CatalogManager catalogManager;

    @Reference
    DatasetRecordFactory dsRecFactory;

    @Reference
    DatasetFactory dsFactory;

    @Reference
    RepositoryManager repoManager;

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
        OsgiRepository dsRepo = repoManager.getRepository(config.getRepositoryId()).orElseThrow(() ->
                new IllegalArgumentException("Dataset target repository does not exist."));

        IRI datasetIRI = vf.createIRI(config.getDataset());
        IRI sdgIRI = vf.createIRI(config.getDataset() + SYSTEM_DEFAULT_NG_SUFFIX);

        try (RepositoryConnection conn = dsRepo.getConnection()) {
            if (ConnectionUtils.contains(conn, datasetIRI, null, null)) {
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
    public boolean createDataset(String dataset, String repositoryId) {
        OsgiRepository dsRepo = repoManager.getRepository(repositoryId).orElseThrow(() ->
                new IllegalArgumentException("Dataset target repository does not exist."));

        IRI datasetIRI = vf.createIRI(dataset);
        IRI sdgIRI = vf.createIRI(dataset + SYSTEM_DEFAULT_NG_SUFFIX);

        try (RepositoryConnection conn = dsRepo.getConnection()) {
            if (ConnectionUtils.contains(conn, null, null, null, datasetIRI)) {
                throw new IllegalArgumentException("The dataset already exists in the specified repository.");
            }

            Dataset newDataset = dsFactory.createNew(datasetIRI);
            newDataset.setSystemDefaultNamedGraph(sdgIRI);
            conn.add(newDataset.getModel(), datasetIRI);
        }

        return true;
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

        OsgiRepository dsRepo = getDatasetRepo(datasetRecord);
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
    public void safeDeleteDataset(Resource dataset, String repositoryId, boolean datasetRecord) {
        if (datasetRecord) {
            safeDeleteDataset(dataset, repositoryId);
        }
        OsgiRepository dsRepo = getDatasetRepo(repositoryId);
        safeDeleteDataset(dataset, dsRepo);
    }

    @Override
    public DatasetRecord safeDeleteDataset(Resource record) {
        DatasetRecord datasetRecord = catalogManager.removeRecord(configProvider.getLocalCatalogIRI(), record,
                dsRecFactory);

        OsgiRepository dsRepo = getDatasetRepo(datasetRecord);
        Resource dataset = datasetRecord.getDataset_resource().orElseThrow(()
                -> new IllegalStateException("Could not retrieve the Dataset IRI from the DatasetRecord."));

        safeDeleteDataset(dataset, dsRepo);
        return datasetRecord;
    }

    private void safeDeleteDataset(Resource dataset, OsgiRepository dsRepo) {
        try (RepositoryConnection conn = dsRepo.getConnection()) {
            safeDeleteGraphs(conn, dataset);
            conn.remove(dataset, null, null);
        }
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

        OsgiRepository dsRepo = getDatasetRepo(datasetRecord);

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

        OsgiRepository dsRepo = getDatasetRepo(datasetRecord);

        try (RepositoryConnection conn = dsRepo.getConnection()) {
            safeDeleteGraphs(conn, dataset);
            deleteGraphLinks(conn, dataset);
        }
    }

    @Override
    public DatasetConnection getConnection(Resource dataset, String repositoryId) {
        if (!getRecordResource(dataset, repositoryId).isPresent()) {
            throw new IllegalArgumentException("Could not find the required DatasetRecord in the Catalog with this "
                    + "dataset/repository combination.");
        }
        OsgiRepository dsRepo = getDatasetRepo(repositoryId);

        return new SimpleDatasetRepositoryConnection(dsRepo.getConnection(), dataset, repositoryId, vf);
    }

    @Override
    public DatasetConnection getConnection(Resource dataset, String repositoryId, boolean datasetRecord) {
        if (datasetRecord) {
            return getConnection(dataset, repositoryId);
        }
        OsgiRepository dsRepo = getDatasetRepo(repositoryId);
        return getConnection(dataset, repositoryId, dsRepo);
    }

    @Override
    public DatasetConnection getConnection(Resource record) {
        DatasetRecord datasetRecord = getDatasetRecord(record).orElseThrow(() ->
                new IllegalArgumentException("Could not find the required DatasetRecord in the Catalog."));
        Resource dataset = datasetRecord.getDataset_resource().orElseThrow(() ->
                new IllegalStateException("Could not retrieve the Dataset IRI from the DatasetRecord."));
        String repositoryId = datasetRecord.getRepository().orElseThrow(() ->
                new IllegalStateException("Could not retrieve the Repository ID from the DatasetRecord."));

        OsgiRepository dsRepo = getDatasetRepo(datasetRecord);
        return getConnection(dataset, repositoryId, dsRepo);
    }

    private DatasetConnection getConnection(Resource dataset, String repoId, OsgiRepository dsRepo) {
        return new SimpleDatasetRepositoryConnection(dsRepo.getConnection(), dataset, repoId, vf);
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
                if (ConnectionUtils.contains(conn, record, vf.createIRI(DatasetRecord.repository_IRI),
                        vf.createLiteral(repositoryId))) {
                    recordStmts.close();
                    return Optional.of(record);
                }
            }

            return Optional.empty();
        }
    }

    private OsgiRepository getDatasetRepo(DatasetRecord datasetRecord) {
        String dsRepoID = datasetRecord.getRepository().orElseThrow(() ->
                new IllegalStateException("DatasetRecord does not specify a dataset repository."));
        return getDatasetRepo(dsRepoID);
    }

    private OsgiRepository getDatasetRepo(String repositoryId) {
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
                ngStmts.close();
                return false;
            }
        }
        ngStmts.close();

        RepositoryResult<Statement> dngStmts = conn.getStatements(null, dngPred, graph);
        while (dngStmts.hasNext()) {
            if (!dngStmts.next().getSubject().equals(dataset)) {
                dngStmts.close();
                return false;
            }
        }
        dngStmts.close();

        return true;
    }

    private void deleteGraphLinks(RepositoryConnection conn, Resource dataset) {
        IRI ngPred = vf.createIRI(Dataset.namedGraph_IRI);
        IRI dngPred = vf.createIRI(Dataset.defaultNamedGraph_IRI);
        conn.remove(dataset, ngPred, null);
        conn.remove(dataset, dngPred, null);
    }
}
