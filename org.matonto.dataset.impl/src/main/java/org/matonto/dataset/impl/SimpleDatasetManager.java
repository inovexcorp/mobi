package org.matonto.dataset.impl;

/*-
 * #%L
 * org.matonto.dataset.impl
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
import aQute.bnd.annotation.component.Modified;
import aQute.bnd.annotation.component.Reference;
import org.matonto.catalog.api.CatalogManager;
import org.matonto.dataset.api.DatasetManager;
import org.matonto.dataset.api.builder.DatasetRecordConfig;
import org.matonto.dataset.ontology.dataset.DatasetRecord;
import org.matonto.dataset.ontology.dataset.DatasetRecordFactory;
import org.matonto.exception.MatOntoException;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Statement;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.base.RepositoryResult;

import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Component
public class SimpleDatasetManager implements DatasetManager {

    private CatalogManager catalogManager;
    private Repository systemRepository;
    private ValueFactory vf;
    private DatasetRecordFactory dsRecFactory;

    @Reference
    void setCatalogManager(CatalogManager catalogManager) {
        this.catalogManager = catalogManager;
    }

    @Reference(target = "(id=system)")
    void setRepository(Repository repository) {
        this.systemRepository = repository;
    }

    @Reference
    void setValueFactory(ValueFactory valueFactory) {
        this.vf = valueFactory;
    }

    @Reference
    void setDatasetRecordFactory(DatasetRecordFactory factory) {
        this.dsRecFactory = factory;
    }

    @Activate
    private void start(Map<String, Object> props) {

    }

    @Modified
    protected void modified(Map<String, Object> props) {
        //start(props);
    }

    @Override
    public Set<Resource> listDatasets() {
        return null;
    }

    @Override
    public Optional<DatasetRecord> getDatasetRecord(Resource dataset) {
        RepositoryConnection conn = systemRepository.getConnection();
        RepositoryResult<Statement> recordStmts =
                conn.getStatements(null, vf.createIRI(DatasetRecord.dataset_IRI), dataset);

        if (!recordStmts.hasNext()) {
            conn.close();
            return Optional.empty();
        }

        Resource recordResource = recordStmts.next().getSubject();

        Optional<DatasetRecord> datasetRecord = catalogManager.getRecord(catalogManager.getLocalCatalogIRI(), recordResource, dsRecFactory);

        if (!datasetRecord.isPresent()) {
            throw new MatOntoException("Could not find the required DatasetRecord in the Catalog.");
        }

        return datasetRecord;
    }

    @Override
    public DatasetRecord createDataset(DatasetRecordConfig config) {
        return null;
    }

    @Override
    public void deleteDataset(Resource dataset) {

    }

    @Override
    public void safeDeleteDataset(Resource dataset) {

    }

    @Override
    public void clearDataset(Resource dataset) {

    }

    @Override
    public void safeClearDataset(Resource dataset) {

    }
}
