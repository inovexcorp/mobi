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

import static junit.framework.TestCase.assertEquals;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.Before;
import org.junit.Test;
import org.matonto.analytic.api.builder.AnalyticRecordConfig;
import org.matonto.analytic.api.builder.ConfigurationConfig;
import org.matonto.analytic.ontologies.analytic.AnalyticRecord;
import org.matonto.analytic.ontologies.analytic.AnalyticRecordFactory;
import org.matonto.analytic.ontologies.analytic.Configuration;
import org.matonto.analytic.ontologies.analytic.ConfigurationFactory;
import org.matonto.analytic.pagination.AnalyticPaginatedSearchParams;
import org.matonto.catalog.api.CatalogManager;
import org.matonto.catalog.api.CatalogUtilsService;
import org.matonto.catalog.api.PaginatedSearchParams;
import org.matonto.catalog.api.PaginatedSearchResults;
import org.matonto.catalog.api.ontologies.mcat.Record;
import org.matonto.ontologies.dcterms._Thing;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.matonto.rdf.orm.conversion.ValueConverterRegistry;
import org.matonto.rdf.orm.conversion.impl.DefaultValueConverterRegistry;
import org.matonto.rdf.orm.conversion.impl.DoubleValueConverter;
import org.matonto.rdf.orm.conversion.impl.FloatValueConverter;
import org.matonto.rdf.orm.conversion.impl.IRIValueConverter;
import org.matonto.rdf.orm.conversion.impl.IntegerValueConverter;
import org.matonto.rdf.orm.conversion.impl.LiteralValueConverter;
import org.matonto.rdf.orm.conversion.impl.ResourceValueConverter;
import org.matonto.rdf.orm.conversion.impl.ShortValueConverter;
import org.matonto.rdf.orm.conversion.impl.StringValueConverter;
import org.matonto.rdf.orm.conversion.impl.ValueValueConverter;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Collections;
import java.util.Optional;

public class SimpleAnalyticManagerTest {

    private SimpleAnalyticManager manager;
    private ValueFactory vf = SimpleValueFactory.getInstance();
    private ModelFactory mf = LinkedHashModelFactory.getInstance();
    private ValueConverterRegistry vcr = new DefaultValueConverterRegistry();
    private AnalyticRecordFactory analyticRecordFactory = new AnalyticRecordFactory();
    private AnalyticRecord record;
    private ConfigurationFactory configurationFactory = new ConfigurationFactory();
    private Configuration config;

    private final IRI CATALOG_IRI = vf.createIRI("http://matonto.org/test/catalogs#1");
    private final IRI RECORD_IRI = vf.createIRI("http://matonto.org/test/records#1");
    private final IRI CONFIG_IRI = vf.createIRI("http://matonto.org/test/configs#1");

    @Mock
    private CatalogManager catalogManager;

    @Mock
    private CatalogUtilsService catalogUtils;

    @Mock
    private PaginatedSearchResults<Record> results;

    @Mock
    private Repository repository;

    @Mock
    private RepositoryConnection conn;

    @Before
    public void setUp() throws Exception {
        analyticRecordFactory.setModelFactory(mf);
        analyticRecordFactory.setValueFactory(vf);
        analyticRecordFactory.setValueConverterRegistry(vcr);

        configurationFactory.setModelFactory(mf);
        configurationFactory.setValueFactory(vf);
        configurationFactory.setValueConverterRegistry(vcr);

        vcr.registerValueConverter(analyticRecordFactory);
        vcr.registerValueConverter(configurationFactory);
        vcr.registerValueConverter(new ResourceValueConverter());
        vcr.registerValueConverter(new IRIValueConverter());
        vcr.registerValueConverter(new DoubleValueConverter());
        vcr.registerValueConverter(new IntegerValueConverter());
        vcr.registerValueConverter(new FloatValueConverter());
        vcr.registerValueConverter(new ShortValueConverter());
        vcr.registerValueConverter(new StringValueConverter());
        vcr.registerValueConverter(new ValueValueConverter());
        vcr.registerValueConverter(new LiteralValueConverter());

        MockitoAnnotations.initMocks(this);
        manager = new SimpleAnalyticManager();
        manager.setRepository(repository);
        manager.setAnalyticRecordFactory(analyticRecordFactory);
        manager.setCatalogManager(catalogManager);
        manager.setCatalogUtils(catalogUtils);
        manager.setValueFactory(vf);

        record = analyticRecordFactory.createNew(RECORD_IRI);
        config = configurationFactory.createNew(CONFIG_IRI);

        when(repository.getConnection()).thenReturn(conn);
        when(catalogManager.getLocalCatalogIRI()).thenReturn(CATALOG_IRI);
        when(catalogManager.findRecord(eq(CATALOG_IRI), any(PaginatedSearchParams.class))).thenReturn(results);
        when(catalogManager.getRecord(any(IRI.class), any(Resource.class), eq(analyticRecordFactory))).thenReturn(Optional.of(record));
        when(catalogManager.createRecord(any(AnalyticRecordConfig.class), eq(analyticRecordFactory))).thenReturn(record);
        when(results.getPage()).thenReturn(Collections.singletonList(record));
        when(results.getPageNumber()).thenReturn(1);
        when(results.getTotalSize()).thenReturn(7);
        when(results.getPageSize()).thenReturn(10);
        when(catalogUtils.optObject(CONFIG_IRI, configurationFactory, conn)).thenReturn(Optional.of(config));
    }

    @Test
    public void testGetAnalyticRecords() {
        PaginatedSearchResults<AnalyticRecord> results = manager.getAnalyticRecords(new AnalyticPaginatedSearchParams(vf));
        verify(catalogManager).findRecord(eq(CATALOG_IRI), any(PaginatedSearchParams.class));
        assertEquals(results.getPage().size(), 1);
        assertEquals(results.getPageNumber(), 1);
        assertEquals(results.getTotalSize(), 7);
        assertEquals(results.getPageSize(), 10);
    }

    @Test
    public void testGetAnalyticRecord() {
        assertEquals(manager.getAnalyticRecord(RECORD_IRI), Optional.of(record));
        verify(catalogManager).getLocalCatalogIRI();
        verify(catalogManager).getRecord(CATALOG_IRI, RECORD_IRI, analyticRecordFactory);
    }

    @Test
    public void testCreateAnalytic() {
        // Setup:
        IRI configurationId = vf.createIRI("http://matonto.org/test/configurations#1");
        Configuration configuration = configurationFactory.createNew(configurationId);
        AnalyticRecordConfig config = new AnalyticRecordConfig.AnalyticRecordBuilder("title", Collections.emptySet(), configuration).build();

        assertEquals(manager.createAnalytic(config), record);
        verify(catalogManager).createRecord(config, analyticRecordFactory);
        verify(catalogManager).getLocalCatalogIRI();
        verify(catalogManager).addRecord(CATALOG_IRI, record);
    }

    @Test
    public void testDeleteAnalytic() {
        // Setup:
        record.setHasConfig(config);

        manager.deleteAnalytic(RECORD_IRI);
        verify(conn).begin();
        verify(catalogUtils).removeObject(record, conn);
        verify(catalogUtils).remove(CONFIG_IRI, conn);
        verify(conn).commit();
    }

    @Test(expected = IllegalArgumentException.class)
    public void testDeleteAnalyticWithIllegalArgument() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(catalogManager).getRecord(any(IRI.class), any(Resource.class), eq(analyticRecordFactory));

        manager.deleteAnalytic(RECORD_IRI);
    }

    @Test(expected = IllegalStateException.class)
    public void testDeleteAnalyticWithIllegalState() {
        manager.deleteAnalytic(RECORD_IRI);
    }

    @Test
    public void testGetConfigurationByAnalyticRecord() {
        // Setup:
        record.setHasConfig(config);

        assertEquals(manager.getConfigurationByAnalyticRecord(RECORD_IRI, configurationFactory), Optional.of(config));
        verify(catalogManager).getLocalCatalogIRI();
        verify(catalogManager).getRecord(CATALOG_IRI, RECORD_IRI, analyticRecordFactory);
        verify(catalogUtils).optObject(CONFIG_IRI, configurationFactory, conn);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetConfigurationByAnalyticRecordWithIllegalArgument() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(catalogManager).getRecord(any(IRI.class), any(Resource.class), eq(analyticRecordFactory));

        manager.getConfigurationByAnalyticRecord(RECORD_IRI, configurationFactory);
    }

    @Test(expected = IllegalStateException.class)
    public void testGetConfigurationByAnalyticRecordWithIllegalState() {
        manager.getConfigurationByAnalyticRecord(RECORD_IRI, configurationFactory);
    }

    @Test
    public void testGetConfiguration() {
        assertEquals(manager.getConfiguration(CONFIG_IRI, configurationFactory), Optional.of(config));
        verify(catalogUtils).optObject(CONFIG_IRI, configurationFactory, conn);
    }

    @Test
    public void testCreateConfiguration() {
        // Setup:
        ConfigurationConfig config = new ConfigurationConfig.Builder("title").build();

        Configuration result = manager.createConfiguration(config, configurationFactory);
        assertEquals(result.getProperty(vf.createIRI(_Thing.title_IRI)).get().stringValue(), "title");
    }

    @Test
    public void testUpdateConfiguration() {
        manager.updateConfiguration(config);
        verify(catalogUtils).validateResource(CONFIG_IRI, vf.createIRI(Configuration.TYPE), conn);
        verify(conn).begin();
        verify(catalogUtils).updateObject(config, conn);
        verify(conn).commit();
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateConfigurationWhenInvalid() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(catalogUtils).validateResource(CONFIG_IRI, vf.createIRI(Configuration.TYPE), conn);

        manager.updateConfiguration(config);
        verify(catalogUtils).validateResource(CONFIG_IRI, vf.createIRI(Configuration.TYPE), conn);
    }
}
