package com.mobi.webhooks.impl;

/*-
 * #%L
 * com.mobi.webhooks.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertThrows;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.OsgiRepository;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.repository.impl.core.SimpleRepositoryManager;
import com.mobi.rest.util.MobiNotFoundException;
import com.mobi.webhooks.api.ontology.webhooks.WebhookConfiguration;
import com.mobi.webhooks.api.ontology.webhooks.WebhookConfigurationFactory;
import com.mobi.webhooks.api.ontology.webhooks.WebhookRecord;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryResult;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import javax.ws.rs.NotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.util.Map;

public class WebhookConfigurationServiceImplTest extends OrmEnabledTestCase {
    private static final IRI TEST_RECORD_IRI = VALUE_FACTORY.createIRI("http://mobi.com/records#test");
    private static final IRI TEST_CONFIG_IRI = VALUE_FACTORY.createIRI("http://mobi.solutions/webhooks/configurations/test");
    private static final IRI FILTERED_CONFIG_IRI = VALUE_FACTORY.createIRI("http://mobi.solutions/webhooks/configurations/test-config");
    private static final IRI FILTERED_RECORD_IRI = VALUE_FACTORY.createIRI("https://mobi.com/records#test-record");
    private static final IRI SECOND_FILTERED_CONFIG_IRI = VALUE_FACTORY.createIRI("http://mobi.solutions/webhooks/configurations/second-config");
    private static final IRI SECOND_FILTERED_RECORD_IRI = VALUE_FACTORY.createIRI("https://mobi.com/records#second-test");
    private static final String TEST_EVENT_FILTER = "(event.topics=com/mobi/catalog/version)";

    private final OrmFactory<WebhookRecord> webhookRecordFactory = getRequiredOrmFactory(WebhookRecord.class);
    private final OrmFactory<WebhookConfiguration> webhookConfigurationFactory = getRequiredOrmFactory(WebhookConfiguration.class);
    private final RepositoryManager repoManager = new SimpleRepositoryManager();

    @Mock
    CatalogConfigProvider configProvider;

    private AutoCloseable closeable;
    private WebhookConfigurationServiceImpl service;
    private Model testRecord;
    private Model testConfig;
    private OsgiRepository repo;

    @Before
    public void setUp() {
        closeable = MockitoAnnotations.openMocks(this);
        repo = repoManager.createMemoryRepository();

        try (InputStream stream = getClass().getResourceAsStream("/webhook_record.trig")) {
            testRecord = Rio.parse(stream, "", RDFFormat.TRIG);
        } catch (IOException e) {
            fail("Could not load test record model: " + e.getMessage());
        }
        testConfig = createTestConfigModel(TEST_CONFIG_IRI);

        when(configProvider.getRepository()).thenReturn(repo);

        service = new WebhookConfigurationServiceImpl();
        service.webhookConfigurationFactory = (WebhookConfigurationFactory) webhookConfigurationFactory;
        service.configProvider = configProvider;
    }

    @After
    public void tearDown() throws Exception {
        closeable.close();
    }

    /* createConfiguration() */

    @Test
    public void createConfigurationTest() {
        WebhookRecord record = webhookRecordFactory.createNew(TEST_RECORD_IRI);
        int initialSize = record.getModel().size();

        service.createConfiguration(record, testConfig);
        WebhookConfiguration config = webhookConfigurationFactory.getExisting(TEST_CONFIG_IRI, testConfig).get();

        assertTrue("Record model should grow after config is added", record.getModel().size() > initialSize);
        assertEquals(11, record.getModel().size());
        assertEquals(record.getHasWebhookConfiguration_resource().get(), config.getResource());
    }

    @Test
    public void createConfigurationGeneratesUniqueIRIs() {
        WebhookRecord record1 = webhookRecordFactory.createNew(TEST_RECORD_IRI);
        WebhookRecord record2 = webhookRecordFactory.createNew(VALUE_FACTORY.createIRI("urn:record:2"));

        service.createConfiguration(record1, testConfig);
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(record1.getModel(), record1.getResource());
        }
        assertThrows(IllegalArgumentException.class, () -> service.createConfiguration(record2, testConfig));
    }

    /* createConfiguration() — cache updates */

    @Test
    public void createConfigurationAddsToFilterCacheWhenFilterPresent() {
        WebhookRecord record = webhookRecordFactory.createNew(TEST_RECORD_IRI);

        assertTrue(service.retrieveEventFilters().isEmpty());
        service.createConfiguration(record, testConfig);
        assertTrue(service.retrieveEventFilters().containsKey(TEST_RECORD_IRI));
    }

    @Test
    public void createConfigurationThrowsErrorWhenNoFilter() {
        WebhookRecord record = webhookRecordFactory.createNew(TEST_RECORD_IRI);
        WebhookConfiguration config = webhookConfigurationFactory.getExisting(TEST_CONFIG_IRI, testConfig)
                .orElseThrow(() -> new IllegalArgumentException("WebhookConfiguration not found for IRI: " + TEST_CONFIG_IRI));

        config.clearEventFilter();
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.createConfiguration(record,
                config.getModel()));

        assertFalse(service.retrieveEventFilters().containsKey(TEST_RECORD_IRI));
        assertEquals("WebhookConfiguration is missing required eventFilter", ex.getMessage());
    }

    /* Retrieve Configurations  */

    @Test
    public void retrieveConfigurationTest() {
        loadTrigData();
        WebhookConfiguration config = service.getWebhookConfig(FILTERED_RECORD_IRI);

        assertEquals(FILTERED_CONFIG_IRI, config.getResource());
        assertEquals("https://www.example.com", config.getUrl().get());
        assertEquals("GET", config.getHttpMethod().get());
        assertEquals("ACTIVE", config.getActive().get());
        assertEquals("(event.topics=com/mobi/catalog/version)", config.getEventFilter().get());
    }

    @Test
    public void retrieveConfigurationFromStringTest() {
        loadTrigData();
        WebhookConfiguration config = service.getWebhookConfig(SECOND_FILTERED_RECORD_IRI.stringValue());

        assertEquals(SECOND_FILTERED_CONFIG_IRI, config.getResource());
        assertEquals("https://www.example.com", config.getUrl().get());
        assertEquals("POST", config.getHttpMethod().get());
        assertEquals("INACTIVE", config.getActive().get());
        assertEquals("(event.topics=com/mobi/catalog/version)", config.getEventFilter().get());
    }

    @Test
    public void retrieveConfigurationNotFoundErrorTest() {
        String notFoundIRI = "https://mobi.com/records#invalid";
        loadTrigData();

        MobiNotFoundException ex = assertThrows(MobiNotFoundException.class,
                () -> service.getWebhookConfig(notFoundIRI));

        assertEquals("Webhook configuration not found for record: " + notFoundIRI, ex.getMessage());
    }

    /* deleteConfiguration() */

    @Test
    public void deleteConfigurationRemovesConfigTriplesFromRepo() {
        IRI newRecordIRI = VALUE_FACTORY.createIRI("https://mobi.com/records#test-record");
        loadTrigData();

        try (RepositoryConnection conn = repo.getConnection()) {
            WebhookRecord record = webhookRecordFactory.getExisting(newRecordIRI, testRecord).orElseThrow(
                    () -> new RuntimeException("Could not retrieve existing record")
            );

            //initial check to make sure the statements and config is present
            RepositoryResult<Statement> recordStatements = conn.getStatements(null, null, null, newRecordIRI);
            RepositoryResult<Statement> configStatements = conn.getStatements(FILTERED_CONFIG_IRI, null, null, newRecordIRI);
            assertEquals(19, QueryResults.asList(recordStatements).size());
            assertEquals(6, QueryResults.asList(configStatements).size());

            RepositoryConnection connSpy = spy(conn);
            service.deleteConfiguration(record, connSpy);

            //secondary check to make sure the config has been removed
            verify(connSpy).remove(eq(FILTERED_CONFIG_IRI), any(), any(), eq(newRecordIRI));
            recordStatements = conn.getStatements(null, null, null, newRecordIRI);
            configStatements = conn.getStatements(FILTERED_CONFIG_IRI, null, null, newRecordIRI);

            assertEquals(13, QueryResults.asList(recordStatements).size());
            assertEquals(0, QueryResults.asList(configStatements).size());
        } catch (Exception e) {
            fail("Should not have thrown exception:");
        }
    }

    @Test
    public void deleteConfigurationWhenNoConfigPresent() {
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(testRecord);

            WebhookRecord record = webhookRecordFactory.getExisting(SECOND_FILTERED_RECORD_IRI, testRecord).orElseThrow(
                    () -> new RuntimeException("Could not retrieve existing record")
            );

            RepositoryConnection connSpy = spy(conn);
            service.deleteConfiguration(record, connSpy);

            verify(spy(conn), never()).remove(any(Resource.class), any(), any(), any(Resource.class));
        } catch (Exception e) {
            fail("Should not have thrown exception:");
        }
    }

    /* deleteConfiguration() — cache updates */

    @Test
    public void deleteConfigurationRemovesEntryFromCache() {
        loadTrigData();
        service.start();

        assertTrue("Pre-condition: cache should contain the filtered record",
                service.retrieveEventFilters().containsKey(FILTERED_RECORD_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            WebhookRecord record = webhookRecordFactory.getExisting(FILTERED_RECORD_IRI, testRecord).orElseThrow();
            service.deleteConfiguration(record, conn);
        }

        assertFalse("Cache should no longer contain the deleted record",
                service.retrieveEventFilters().containsKey(FILTERED_RECORD_IRI));
    }

    /* start() */

    @Test
    public void startPopulatesEventFiltersFromRepository() {
        loadTrigData();
        service.start();

        Map<Resource, String> filters = service.retrieveEventFilters();
        assertEquals(2, filters.size());
        assertTrue(filters.containsKey(FILTERED_RECORD_IRI));
        assertEquals(TEST_EVENT_FILTER, filters.get(FILTERED_RECORD_IRI));
    }

    @Test
    public void startClearsPreviousCacheBeforeRepopulating() {
        loadTrigData();
        try (RepositoryConnection conn = repo.getConnection()) {
            service.start();
            conn.clear();
            service.start();
            assertEquals(0, service.retrieveEventFilters().size());
        }
    }

    @Test
    public void startWithNoFilteredRecordsProducesEmptyCache() {
        service.start();
        assertTrue(service.retrieveEventFilters().isEmpty());
    }

    /* retrieveEventFilters() */

    @Test
    public void retrieveEventFiltersReturnsUnmodifiableMap() {
        Map<Resource, String> filters = service.retrieveEventFilters();
        UnsupportedOperationException ex = assertThrows(UnsupportedOperationException.class, () -> filters.put(TEST_RECORD_IRI, TEST_EVENT_FILTER));
        assertNotNull(ex);
    }

    /* SHACL validation */
    @Test
    public void noWebhookConfigValidationTest() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                service.validateConfiguration(MODEL_FACTORY.createEmptyModel()));

        assertEquals("Model must contain exactly one WebhookConfiguration, found: 0", ex.getMessage());
    }

    @Test
    public void multipleWebhookConfigValidationTest() {
        Model configs = MODEL_FACTORY.createEmptyModel();
        configs.add(VALUE_FACTORY.createIRI("https://www.example.com/test/config1"), RDF.TYPE, VALUE_FACTORY.createIRI(WebhookConfiguration.TYPE));
        configs.add(VALUE_FACTORY.createIRI("https://www.example.com/test/config2"), RDF.TYPE, VALUE_FACTORY.createIRI(WebhookConfiguration.TYPE));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                service.validateConfiguration(configs));

        assertEquals("Model must contain exactly one WebhookConfiguration, found: 2", ex.getMessage());
    }

    @Test
    public void webhookConfigEventFilterValidationTest() {
        Model model = createTestConfigModel(TEST_CONFIG_IRI);
        WebhookConfiguration config =  webhookConfigurationFactory.getExisting(TEST_CONFIG_IRI, model).get();
        config.clearEventFilter();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                service.validateConfiguration(config.getModel()));

        assertTrue(ex.getMessage().startsWith("WebhookConfiguration failed SHACL validation"));
    }

    @Test
    public void webhookConfigMissingURLValidationTest() {
        Model model = createTestConfigModel(TEST_CONFIG_IRI);
        WebhookConfiguration config =  webhookConfigurationFactory.getExisting(TEST_CONFIG_IRI, model).get();
        config.clearUrl();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                service.validateConfiguration(config.getModel()));

        assertTrue(ex.getMessage().startsWith("WebhookConfiguration failed SHACL validation"));
    }

    /* updateConfiguration() */

    @Test
    public void updateConfigurationUpdatesRepoTriplesTest() {
        loadTrigData();
        service.start();

        String newFilter = "(&(event.topics=com/mobi/catalog/commit))";
        Model newConfigModel = createTestConfigModel(TEST_CONFIG_IRI);
        WebhookConfiguration newConfig = webhookConfigurationFactory.getExisting(TEST_CONFIG_IRI, newConfigModel).get();
        newConfig.setEventFilter(newFilter);
        newConfig.setUrl("https://updated.example.com");

        try (RepositoryConnection conn = repo.getConnection()) {
            WebhookRecord record = webhookRecordFactory.getExisting(FILTERED_RECORD_IRI, testRecord).orElseThrow();
            service.updateConfiguration(record, newConfig.getModel());

            // New config IRI should now have triples in the record named graph
            assertTrue(conn.hasStatement(TEST_CONFIG_IRI, null, null, false, FILTERED_RECORD_IRI));
        }
    }

    @Test
    public void updateConfigurationUpdatesEventFilterCacheTest() {
        loadTrigData();
        service.start();

        assertTrue(service.retrieveEventFilters().containsKey(FILTERED_RECORD_IRI));
        assertEquals(TEST_EVENT_FILTER, service.retrieveEventFilters().get(FILTERED_RECORD_IRI));

        String newFilter = "(&(event.topics=com/mobi/catalog/commit))";
        Model newConfigModel = createTestConfigModel(TEST_CONFIG_IRI);
        WebhookConfiguration newConfig = webhookConfigurationFactory.getExisting(TEST_CONFIG_IRI, newConfigModel).get();
        newConfig.setEventFilter(newFilter);

        WebhookRecord record = webhookRecordFactory.getExisting(FILTERED_RECORD_IRI, testRecord).orElseThrow();
        service.updateConfiguration(record, newConfig.getModel());

        assertEquals(newFilter, service.retrieveEventFilters().get(FILTERED_RECORD_IRI));
    }

    @Test
    public void updateConfigurationCacheUnchangedWhenSameFilterTest() {
        loadTrigData();
        service.start();

        assertEquals(TEST_EVENT_FILTER, service.retrieveEventFilters().get(FILTERED_RECORD_IRI));

        // Use the same filter string as the existing config
        Model newConfigModel = createTestConfigModel(TEST_CONFIG_IRI);

        WebhookRecord record = webhookRecordFactory.getExisting(FILTERED_RECORD_IRI, testRecord).orElseThrow();
        service.updateConfiguration(record, newConfigModel);

        assertEquals(TEST_EVENT_FILTER, service.retrieveEventFilters().get(FILTERED_RECORD_IRI));
    }

    @Test
    public void updateConfigurationThrowsWhenNoLinkedConfigTest() {
        loadTrigData();
        IRI noConfigRecordIRI = VALUE_FACTORY.createIRI("https://mobi.com/records#81c30bf3-3e31-42d6-861b-8877b71c242a");
        WebhookRecord record = webhookRecordFactory.createNew(noConfigRecordIRI);

        Model newConfigModel = createTestConfigModel(TEST_CONFIG_IRI);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                service.updateConfiguration(record, newConfigModel));

        assertTrue(ex.getMessage().contains("does not have a linked configuration"));
    }

    @Test
    public void updateConfigurationThrowsOnShaclFailureTest() {
        loadTrigData();
        service.start();

        Model invalidConfigModel = createTestConfigModel(TEST_CONFIG_IRI);
        WebhookConfiguration config = webhookConfigurationFactory.getExisting(TEST_CONFIG_IRI, invalidConfigModel).get();
        config.clearUrl();

        WebhookRecord record = webhookRecordFactory.getExisting(FILTERED_RECORD_IRI, testRecord).orElseThrow();
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                service.updateConfiguration(record, config.getModel()));
        assertTrue(ex.getMessage().startsWith("WebhookConfiguration failed SHACL validation"));
    }

    /* Helper Methods */

    private void loadTrigData(){
        try (RepositoryConnection conn = repo.getConnection()) {
//            conn.clear();
            conn.add(getClass().getResourceAsStream("/webhook_record.trig"), RDFFormat.TRIG);
        } catch (IOException e) {
            fail("Could not load test data: " + e.getMessage());
        }
    }

    private Model createTestConfigModel(Resource iri) {
        WebhookConfiguration config = webhookConfigurationFactory.createNew(iri);
        config.setActive("ACTIVE");
        config.setUrl("https://www.example.com");
        config.setHttpMethod("GET");
        config.setEventFilter(TEST_EVENT_FILTER);
        return config.getModel();
    }

}
