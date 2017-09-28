package org.matonto.analytic.impl;

/*-
 * #%L
 * analytic.impl
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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import org.matonto.analytic.api.AnalyticManager;
import org.matonto.analytic.api.builder.AnalyticRecordConfig;
import org.matonto.analytic.api.configuration.ConfigurationService;
import org.matonto.analytic.ontologies.analytic.AnalyticRecord;
import org.matonto.analytic.ontologies.analytic.AnalyticRecordFactory;
import org.matonto.analytic.ontologies.analytic.Configuration;
import org.matonto.analytic.pagination.AnalyticPaginatedSearchParams;
import org.matonto.analytic.pagination.AnalyticRecordSearchResults;
import org.matonto.catalog.api.CatalogManager;
import org.matonto.catalog.api.CatalogUtilsService;
import org.matonto.catalog.api.PaginatedSearchResults;
import org.matonto.catalog.api.ontologies.mcat.Record;
import org.matonto.persistence.utils.RepositoryResults;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.orm.OrmFactory;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Component(name = SimpleAnalyticManager.COMPONENT_NAME)
public class SimpleAnalyticManager implements AnalyticManager {

    static final String COMPONENT_NAME = "org.matonto.analytic.api.AnalyticManager";

    private CatalogManager catalogManager;
    private CatalogUtilsService catalogUtils;
    private Repository repository;
    private AnalyticRecordFactory analyticRecordFactory;
    private ValueFactory vf;
    private ModelFactory mf;
    private Map<String, ConfigurationService<? extends Configuration>> configurationServices = new HashMap<>();

    @Reference(type = '*', dynamic = true)
    void addConfigurationService(ConfigurationService<? extends Configuration> configurationService) {
        configurationServices.put(configurationService.getTypeIRI(), configurationService);
    }

    void removeConfigurationService(ConfigurationService<? extends Configuration> configurationService) {
        configurationServices.remove(configurationService.getTypeIRI());
    }

    @Reference
    void setCatalogManager(CatalogManager catalogManager) {
        this.catalogManager = catalogManager;
    }

    @Reference
    void setCatalogUtils(CatalogUtilsService catalogUtils) {
        this.catalogUtils = catalogUtils;
    }

    @Reference(target = "(id=system)")
    void setRepository(Repository repository) {
        this.repository = repository;
    }

    @Reference
    void setAnalyticRecordFactory(AnalyticRecordFactory analyticRecordFactory) {
        this.analyticRecordFactory = analyticRecordFactory;
    }

    @Reference
    void setValueFactory(ValueFactory vf) {
        this.vf = vf;
    }

    @Reference
    void setModelFactory(ModelFactory mf) {
        this.mf = mf;
    }

    @Override
    public PaginatedSearchResults<AnalyticRecord> getAnalyticRecords(AnalyticPaginatedSearchParams searchParams) {
        PaginatedSearchResults<Record> results = catalogManager.findRecord(catalogManager.getLocalCatalogIRI(),
                searchParams.build());
        return new AnalyticRecordSearchResults(results, analyticRecordFactory);
    }

    @Override
    public Optional<AnalyticRecord> getAnalyticRecord(Resource recordId) {
        return catalogManager.getRecord(catalogManager.getLocalCatalogIRI(), recordId, analyticRecordFactory);
    }

    @Override
    public AnalyticRecord createAnalytic(AnalyticRecordConfig config) {
        AnalyticRecord record = catalogManager.createRecord(config, analyticRecordFactory);
        record.setHasConfig(config.getConfiguration());
        record.getModel().addAll(config.getConfiguration().getModel());
        catalogManager.addRecord(catalogManager.getLocalCatalogIRI(), record);
        return record;
    }

    @Override
    public void deleteAnalytic(Resource recordId) {
        AnalyticRecord record = getAnalyticRecord(recordId).orElseThrow(() ->
                new IllegalArgumentException("Could not find the required AnalyticRecord in the Catalog."));

        try (RepositoryConnection conn = repository.getConnection()) {
            conn.begin();
            catalogUtils.removeObject(record, conn);
            conn.commit();
        }
    }

    @Override
    public <T extends Configuration> Optional<T> getConfigurationByAnalyticRecord(Resource recordId,
                                                                                  OrmFactory<T> factory) {
        AnalyticRecord record = getAnalyticRecord(recordId).orElseThrow(() ->
                new IllegalArgumentException("Could not find the required AnalyticRecord in the Catalog."));
        Resource configId = record.getHasConfig_resource().orElseThrow(() ->
                new IllegalStateException("Could not retrieve the Configuration IRI from the AnalyticRecord."));
        return getConfiguration(configId, factory);
    }

    @Override
    public <T extends Configuration> Optional<T> getConfiguration(Resource configId, OrmFactory<T> factory) {
        try (RepositoryConnection conn = repository.getConnection()) {
            Model model = RepositoryResults.asModel(conn.getStatements(configId, null, null), mf);
            return factory.getExisting(configId, model);
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T extends Configuration> T createConfiguration(String json, OrmFactory<T> factory) {
        String typeIRI = factory.getTypeIRI().stringValue();
        if (configurationServices.keySet().contains(typeIRI)) {
            return (T) configurationServices.get(typeIRI).create(json);
        } else {
            throw new IllegalArgumentException("The provided typeIRI is not supported.");
        }
    }

    @Override
    public <T extends Configuration> void updateConfiguration(Resource recordId, T newConfiguration) {
        try (RepositoryConnection conn = repository.getConnection()) {
            Resource configId = newConfiguration.getResource();
            if (!conn.getStatements(recordId, vf.createIRI(AnalyticRecord.hasConfig_IRI), configId).hasNext()) {
                throw new IllegalArgumentException(String.format("Configuration %s does not belong to AnalyticRecord " +
                        "%s", configId, recordId));
            }
            conn.begin();
            conn.remove(configId, null, null);
            conn.add(newConfiguration.getModel(), recordId);
            conn.commit();
        }
    }
}
