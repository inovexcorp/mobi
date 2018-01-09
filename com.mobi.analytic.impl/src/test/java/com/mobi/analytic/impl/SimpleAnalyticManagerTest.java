package com.mobi.analytic.impl;

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
import static junit.framework.TestCase.assertFalse;
import static junit.framework.TestCase.assertTrue;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.analytic.api.builder.AnalyticRecordConfig;
import com.mobi.analytic.api.configuration.ConfigurationService;
import com.mobi.analytic.ontologies.analytic.AnalyticRecord;
import com.mobi.analytic.ontologies.analytic.Configuration;
import com.mobi.analytic.pagination.AnalyticPaginatedSearchParams;
import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.PaginatedSearchParams;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Literal;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.core.utils.Values;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.openrdf.sail.memory.MemoryStore;

import java.io.InputStream;
import java.util.Collections;
import java.util.Optional;

public class SimpleAnalyticManagerTest extends OrmEnabledTestCase {

    private SimpleAnalyticManager manager;
    private Repository repository;
    private OrmFactory<AnalyticRecord> analyticRecordFactory = getRequiredOrmFactory(AnalyticRecord.class);
    private AnalyticRecord record;
    private OrmFactory<Configuration> configurationFactory = getRequiredOrmFactory(Configuration.class);
    private Configuration config;

    private final IRI CATALOG_IRI = VALUE_FACTORY.createIRI("https://mobi.com/test/catalogs#1");
    private final IRI RECORD_IRI = VALUE_FACTORY.createIRI("https://mobi.com/test/records#1");
    private final IRI CONFIG_IRI = VALUE_FACTORY.createIRI("https://mobi.com/test/configs#1");
    private final Literal NEW_LITERAL = VALUE_FACTORY.createLiteral("new");
    private final IRI TITLE_IRI = VALUE_FACTORY.createIRI(_Thing.title_IRI);

    @Mock
    private CatalogManager catalogManager;

    @Mock
    private CatalogUtilsService catalogUtils;

    @Mock
    private PaginatedSearchResults<Record> results;

    @Mock
    private ConfigurationService<Configuration> baseService;

    @Before
    public void setUp() throws Exception {
        repository = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repository.initialize();

        try (RepositoryConnection conn = repository.getConnection()) {
            InputStream data = getClass().getResourceAsStream("/testData.trig");
            conn.add(Values.mobiModel(Rio.parse(data, "", RDFFormat.TRIG)));
        }

        record = analyticRecordFactory.createNew(RECORD_IRI);
        config = configurationFactory.createNew(CONFIG_IRI);
        config.setProperty(NEW_LITERAL, TITLE_IRI);

        MockitoAnnotations.initMocks(this);
        when(catalogManager.getLocalCatalogIRI()).thenReturn(CATALOG_IRI);
        when(catalogManager.findRecord(eq(CATALOG_IRI), any(PaginatedSearchParams.class))).thenReturn(results);
        when(catalogManager.getRecord(any(IRI.class), any(Resource.class), eq(analyticRecordFactory))).thenReturn(Optional.of(record));
        when(catalogManager.createRecord(any(AnalyticRecordConfig.class), eq(analyticRecordFactory))).thenReturn(record);
        when(results.getPage()).thenReturn(Collections.singletonList(record));
        when(results.getPageNumber()).thenReturn(1);
        when(results.getTotalSize()).thenReturn(7);
        when(results.getPageSize()).thenReturn(10);
        when(baseService.create(anyString())).thenReturn(config);
        when(baseService.getTypeIRI()).thenReturn(Configuration.TYPE);

        manager = new SimpleAnalyticManager();
        injectOrmFactoryReferencesIntoService(manager);
        manager.setRepository(repository);
        manager.setCatalogManager(catalogManager);
        manager.setCatalogUtils(catalogUtils);
        manager.setValueFactory(VALUE_FACTORY);
        manager.addConfigurationService(baseService);
        manager.setModelFactory(MODEL_FACTORY);
    }

    @After
    public void tearDown() throws Exception {
        repository.shutDown();
    }

    @Test
    public void testGetAnalyticRecords() {
        PaginatedSearchResults<AnalyticRecord> results = manager.getAnalyticRecords(new AnalyticPaginatedSearchParams(VALUE_FACTORY));
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
        IRI configurationId = VALUE_FACTORY.createIRI("https://mobi.com/test/configs#2");
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
        verify(catalogUtils).removeObject(eq(record), any(RepositoryConnection.class));
    }

    @Test(expected = IllegalArgumentException.class)
    public void testDeleteAnalyticWithIllegalArgument() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(catalogManager).getRecord(any(IRI.class), any(Resource.class), eq(analyticRecordFactory));

        manager.deleteAnalytic(RECORD_IRI);
    }

    @Test
    public void testGetConfigurationByAnalyticRecord() {
        // Setup:
        record.setHasConfig(config);

        assertTrue(manager.getConfigurationByAnalyticRecord(RECORD_IRI, configurationFactory).isPresent());
        verify(catalogManager).getLocalCatalogIRI();
        verify(catalogManager).getRecord(CATALOG_IRI, RECORD_IRI, analyticRecordFactory);
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
        assertFalse(manager.getConfiguration(RECORD_IRI, configurationFactory).isPresent());
        assertTrue(manager.getConfiguration(CONFIG_IRI, configurationFactory).isPresent());
    }

    @Test
    public void testCreateConfiguration() {
        manager.createConfiguration("", configurationFactory);
        verify(baseService).create("");
    }

    @Test(expected = IllegalArgumentException.class)
    public void testCreateConfigurationWithIllegalArgumentException() {
        // Setup:
        manager.removeConfigurationService(baseService);

        manager.createConfiguration("", configurationFactory);
    }

    @Test
    public void testUpdateConfiguration() {
        manager.updateConfiguration(RECORD_IRI, config);
        try (RepositoryConnection conn = repository.getConnection()) {
            assertTrue(conn.getStatements(CONFIG_IRI, TITLE_IRI, NEW_LITERAL, RECORD_IRI).hasNext());
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateConfigurationWhenWrongConfiguration() {
        // Setup:
        Configuration wrong = configurationFactory.createNew(RECORD_IRI);

        manager.updateConfiguration(RECORD_IRI, wrong);
    }
}
