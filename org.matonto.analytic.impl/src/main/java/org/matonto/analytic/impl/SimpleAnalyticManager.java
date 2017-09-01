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
import org.matonto.analytic.api.builder.ConfigurationConfig;
import org.matonto.analytic.ontologies.analytic.AnalyticRecord;
import org.matonto.analytic.ontologies.analytic.AnalyticRecordFactory;
import org.matonto.analytic.ontologies.analytic.Configuration;
import org.matonto.analytic.pagination.AnalyticPaginatedSearchParams;
import org.matonto.analytic.pagination.AnalyticRecordSearchResults;
import org.matonto.catalog.api.CatalogManager;
import org.matonto.catalog.api.CatalogUtilsService;
import org.matonto.catalog.api.PaginatedSearchResults;
import org.matonto.catalog.api.ontologies.mcat.Record;
import org.matonto.ontologies.dcterms._Thing;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.orm.OrmFactory;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;

import java.util.Optional;
import java.util.UUID;

@Component(name = SimpleAnalyticManager.COMPONENT_NAME)
public class SimpleAnalyticManager implements AnalyticManager {

    static final String COMPONENT_NAME = "org.matonto.analytic.api.AnalyticManager";
    private static final String CONFIG_NAMESPACE = "https://matonto.org/configurations#";

    private CatalogManager catalogManager;
    private CatalogUtilsService catalogUtils;
    private Repository repository;
    private AnalyticRecordFactory analyticRecordFactory;
    private ValueFactory vf;

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
        catalogManager.addRecord(catalogManager.getLocalCatalogIRI(), record);
        return record;
    }

    @Override
    public void deleteAnalytic(Resource recordId) {
        AnalyticRecord record = getAnalyticRecord(recordId).orElseThrow(() ->
                new IllegalArgumentException("Could not find the required AnalyticRecord in the Catalog."));
        Resource configId = record.getHasConfig_resource().orElseThrow(() ->
                new IllegalStateException("Could not retrieve the Configuration IRI from the AnalyticRecord."));

        try (RepositoryConnection conn = repository.getConnection()) {
            conn.begin();
            catalogUtils.removeObject(record, conn);
            catalogUtils.remove(configId, conn);
            conn.commit();
        }
    }

    @Override
    public <T extends Configuration> Optional<T> getConfigurationByAnalyticRecord(Resource recordId, OrmFactory<T> factory) {
        AnalyticRecord record = getAnalyticRecord(recordId).orElseThrow(() ->
                new IllegalArgumentException("Could not find the required AnalyticRecord in the Catalog."));
        Resource configId = record.getHasConfig_resource().orElseThrow(() ->
                new IllegalStateException("Could not retrieve the Configuration IRI from the AnalyticRecord."));
        return getConfiguration(configId, factory);
    }

    @Override
    public <T extends Configuration> Optional<T> getConfiguration(Resource configId, OrmFactory<T> factory) {
        try (RepositoryConnection conn = repository.getConnection()) {
            return catalogUtils.optObject(configId, factory, conn);
        }
    }

    @Override
    public <T extends Configuration> T createConfiguration(ConfigurationConfig config, OrmFactory<T> factory) {
        T configuration = factory.createNew(vf.createIRI(CONFIG_NAMESPACE + UUID.randomUUID()));
        configuration.setProperty(vf.createLiteral(config.getTitle()), vf.createIRI(_Thing.title_IRI));
        return configuration;
    }

    @Override
    public <T extends Configuration> void updateConfiguration(T newConfiguration) {
        try (RepositoryConnection conn = repository.getConnection()) {
            catalogUtils.validateResource(newConfiguration.getResource(), vf.createIRI(Configuration.TYPE), conn);
            conn.begin();
            catalogUtils.updateObject(newConfiguration, conn);
            conn.commit();
        }
    }
}
