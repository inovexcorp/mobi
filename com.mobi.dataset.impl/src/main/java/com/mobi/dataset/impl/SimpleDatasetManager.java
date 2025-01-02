package com.mobi.dataset.impl;

/*-
 * #%L
 * com.mobi.dataset.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.dataset.api.DatasetConnection;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.dataset.api.DatasetUtilsService;
import com.mobi.dataset.ontology.dataset.DatasetRecord;
import com.mobi.dataset.ontology.dataset.DatasetRecordFactory;
import com.mobi.dataset.pagination.DatasetPaginatedSearchParams;
import com.mobi.dataset.pagination.DatasetRecordSearchResults;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.Bindings;
import com.mobi.persistence.utils.ConnectionUtils;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryResult;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

@Component(immediate = true)
public class SimpleDatasetManager implements DatasetManager {

    private static final String FIND_DATASETS_QUERY;
    private static final String CATALOG_BINDING = "catalog";
    private static final String REPOSITORY_BINDING = "repository";

    static {
        try {
            FIND_DATASETS_QUERY = IOUtils.toString(
                    Objects.requireNonNull(SimpleDatasetManager.class.getResourceAsStream("/find-datasets.rq")),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    final ValueFactory vf = new ValidatingValueFactory();

    @Reference
    CatalogConfigProvider configProvider;

    @Reference
    RecordManager recordManager;

    @Reference
    DatasetRecordFactory dsRecFactory;

    @Reference
    DatasetUtilsService dsUtilsService;

    @Override
    public Set<Resource> getDatasets(String repositoryId) {
        Set<Resource> datasets = new HashSet<>();
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            TupleQuery query = conn.prepareTupleQuery(FIND_DATASETS_QUERY);
            query.setBinding(CATALOG_BINDING, configProvider.getLocalCatalogIRI());
            query.setBinding(REPOSITORY_BINDING, vf.createLiteral(repositoryId));
            try (TupleQueryResult result = query.evaluate()) {
                result.forEach(bindingSet -> datasets.add(Bindings.requiredResource(bindingSet, "dataset")));
            }
        }
        return datasets;
    }

    @Override
    public PaginatedSearchResults<DatasetRecord> getDatasetRecords(DatasetPaginatedSearchParams searchParams) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            PaginatedSearchResults<Record> results = recordManager.findRecord(configProvider.getLocalCatalogIRI(),
                    searchParams.build(), conn);
            return new DatasetRecordSearchResults(results, dsRecFactory);
        }
    }

    @Override
    public Optional<DatasetRecord> getDatasetRecord(Resource dataset, String repositoryId) {
        return getRecordResource(dataset, repositoryId).flatMap(this::getDatasetRecord);
    }

    @Override
    public Optional<DatasetRecord> getDatasetRecord(Resource record) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            return recordManager.getRecordOpt(configProvider.getLocalCatalogIRI(), record, dsRecFactory, conn);
        }
    }

    @Override
    public DatasetRecord deleteDataset(Resource dataset, String repositoryId, User user) {
        Resource record = getRequiredRecordResource(dataset, repositoryId);
        return deleteDataset(record, user);
    }

    @Override
    public DatasetRecord deleteDataset(Resource record, User user) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            DatasetRecord datasetRecord = recordManager.removeRecord(configProvider.getLocalCatalogIRI(), record, user,
                    DatasetRecord.class, conn);

            Resource dataset = getDatasetId(datasetRecord);
            String dsRepoID = getRepositoryId(datasetRecord);

            dsUtilsService.deleteDataset(dataset, dsRepoID);
            return datasetRecord;
        }
    }

    @Override
    public DatasetRecord safeDeleteDataset(Resource dataset, String repositoryId, User user) {
        Resource record = getRequiredRecordResource(dataset, repositoryId);
        return safeDeleteDataset(record, user);
    }

    @Override
    public DatasetRecord safeDeleteDataset(Resource record, User user) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            DatasetRecord datasetRecord = recordManager.removeRecord(configProvider.getLocalCatalogIRI(), record, user,
                    DatasetRecord.class, conn);

            Resource dataset = getDatasetId(datasetRecord);
            String dsRepoID = getRepositoryId(datasetRecord);

            dsUtilsService.safeDeleteDataset(dataset, dsRepoID);
            return datasetRecord;
        }
    }

    @Override
    public void clearDataset(Resource record) {
        DatasetRecord datasetRecord = getRequiredDatasetRecord(record);
        Resource dataset = getDatasetId(datasetRecord);
        String dsRepoID = getRepositoryId(datasetRecord);

        dsUtilsService.clearDataset(dataset, dsRepoID);
    }

    @Override
    public void safeClearDataset(Resource record) {
        DatasetRecord datasetRecord = getRequiredDatasetRecord(record);
        Resource dataset = getDatasetId(datasetRecord);
        String dsRepoID = getRepositoryId(datasetRecord);

        dsUtilsService.safeClearDataset(dataset, dsRepoID);
    }

    @Override
    public DatasetConnection getConnection(Resource record) {
        DatasetRecord datasetRecord = getRequiredDatasetRecord(record);
        Resource dataset = getDatasetId(datasetRecord);
        String repositoryId = getRepositoryId(datasetRecord);

        return dsUtilsService.getConnection(dataset, repositoryId);
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

    private Resource getRequiredRecordResource(Resource dataset, String repositoryId) {
        return getRecordResource(dataset, repositoryId).orElseThrow(() ->
                new IllegalArgumentException("Could not find the required DatasetRecord in the Catalog."));
    }

    private DatasetRecord getRequiredDatasetRecord(Resource record) {
        return getDatasetRecord(record).orElseThrow(() ->
                new IllegalArgumentException("Could not find the required DatasetRecord in the Catalog."));
    }

    private Resource getDatasetId(DatasetRecord datasetRecord) {
        return datasetRecord.getDataset_resource().orElseThrow(() ->
                new IllegalStateException("Could not retrieve the Dataset IRI from the DatasetRecord."));
    }

    private String getRepositoryId(DatasetRecord datasetRecord) {
        return datasetRecord.getRepository().orElseThrow(() ->
                new IllegalStateException("DatasetRecord does not specify a dataset repository."));
    }
}
