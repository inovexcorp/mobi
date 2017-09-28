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
import static junit.framework.TestCase.assertFalse;
import static junit.framework.TestCase.assertTrue;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import net.sf.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.matonto.analytic.api.builder.AnalyticRecordConfig;
import org.matonto.analytic.api.configuration.ConfigurationService;
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
import org.matonto.rdf.api.Literal;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.matonto.rdf.core.utils.Values;
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
import org.matonto.repository.impl.sesame.SesameRepositoryWrapper;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.openrdf.sail.memory.MemoryStore;

import java.io.InputStream;
import java.util.Collections;
import java.util.Optional;

public class SimpleAnalyticManagerTest {

    private SimpleAnalyticManager manager;
    private Repository repository;
    private ValueFactory vf = SimpleValueFactory.getInstance();
    private ModelFactory mf = LinkedHashModelFactory.getInstance();
    private ValueConverterRegistry vcr = new DefaultValueConverterRegistry();
    private AnalyticRecordFactory analyticRecordFactory = new AnalyticRecordFactory();
    private AnalyticRecord record;
    private ConfigurationFactory configurationFactory = new ConfigurationFactory();
    private Configuration config;

    private final IRI CATALOG_IRI = vf.createIRI("https://matonto.org/test/catalogs#1");
    private final IRI RECORD_IRI = vf.createIRI("https://matonto.org/test/records#1");
    private final IRI CONFIG_IRI = vf.createIRI("https://matonto.org/test/configs#1");
    private final Literal NEW_LITERAL = vf.createLiteral("new");
    private final IRI TITLE_IRI = vf.createIRI(_Thing.title_IRI);

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
            conn.add(Values.matontoModel(Rio.parse(data, "", RDFFormat.TRIG)));
        }

        analyticRecordFactory.setModelFactory(mf);
        analyticRecordFactory.setValueFactory(vf);
        analyticRecordFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(analyticRecordFactory);

        configurationFactory.setModelFactory(mf);
        configurationFactory.setValueFactory(vf);
        configurationFactory.setValueConverterRegistry(vcr);
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
        manager.setRepository(repository);
        manager.setAnalyticRecordFactory(analyticRecordFactory);
        manager.setCatalogManager(catalogManager);
        manager.setCatalogUtils(catalogUtils);
        manager.setValueFactory(vf);
        manager.addConfigurationService(baseService);
        manager.setModelFactory(mf);
    }

    @After
    public void tearDown() throws Exception {
        repository.shutDown();
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
        IRI configurationId = vf.createIRI("https://matonto.org/test/configs#2");
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
