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
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;

import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.OsgiRepository;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.repository.impl.core.SimpleRepositoryManager;
import com.mobi.webhooks.api.WebhookConfigurationService;
import com.mobi.webhooks.api.ontology.webhooks.WebhookConfiguration;
import com.mobi.webhooks.api.ontology.webhooks.WebhookConfigurationFactory;
import com.mobi.webhooks.api.ontology.webhooks.WebhookRecord;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryResult;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.MockitoAnnotations;

import java.io.IOException;
import java.io.InputStream;
import java.util.Optional;

public class WebhookConfigurationServiceImplTest extends OrmEnabledTestCase {

    private static final IRI RECORD_IRI = VALUE_FACTORY.createIRI("http://mobi.com/records#test");
    private static final IRI CONFIG_IRI = VALUE_FACTORY.createIRI("http://mobi.solutions/webhooks/configurations/4068e6ce-808c-4a89-8946-137974593b7a");

    private final OrmFactory<WebhookRecord> webhookRecordFactory = getRequiredOrmFactory(WebhookRecord.class);
    private final OrmFactory<WebhookConfiguration> webhookConfigurationFactory = getRequiredOrmFactory(WebhookConfiguration.class);
    private final RepositoryManager repoManager = new SimpleRepositoryManager();

    private AutoCloseable closeable;
    private WebhookConfigurationServiceImpl service;
    private Model testModel;
    private OsgiRepository repo;

    @Before
    public void setUp() {
        closeable = MockitoAnnotations.openMocks(this);
        repo = repoManager.createMemoryRepository();

        try (InputStream stream = getClass().getResourceAsStream("/webhook_record.trig")) {
            testModel = Rio.parse(stream, "", RDFFormat.TRIG);
        } catch (IOException e) {
            fail("Could not load test model: " + e.getMessage());
        }

        service = new WebhookConfigurationServiceImpl();
        service.webhookConfigurationFactory = (WebhookConfigurationFactory) webhookConfigurationFactory;
    }

    @After
    public void tearDown() throws Exception {
        closeable.close();
    }

    /* createConfiguration() */

    @Test
    public void createConfigurationSetsDefaultUrl() {
        WebhookRecord record = webhookRecordFactory.createNew(RECORD_IRI);

        service.createConfiguration(record);

        Optional<WebhookConfiguration> config = record.getHasWebhookConfiguration();
        assertTrue("Expected WebhookConfiguration to be present on the record", config.isPresent());
        assertEquals(WebhookConfigurationService.DEFAULT_WEBHOOK_URL, config.get().getUrl().orElse(null));
        assertEquals(WebhookConfigurationService.DEFAULT_HTTP_METHOD, config.get().getHttpMethod().orElse(null));
    }

    @Test
    public void createConfigurationAddsConfigModelToRecord() {
        WebhookRecord record = webhookRecordFactory.createNew(RECORD_IRI);
        int initialSize = record.getModel().size();

        service.createConfiguration(record);

        assertTrue("Record model should grow after config is added", record.getModel().size() > initialSize);
    }

    @Test
    public void createConfigurationGeneratesUniqueIRIs() {
        WebhookRecord record1 = webhookRecordFactory.createNew(RECORD_IRI);
        WebhookRecord record2 = webhookRecordFactory.createNew(VALUE_FACTORY.createIRI("urn:record:2"));

        service.createConfiguration(record1);
        service.createConfiguration(record2);

        Resource iri1 = record1.getHasWebhookConfiguration_resource().orElseThrow();
        Resource iri2 = record2.getHasWebhookConfiguration_resource().orElseThrow();
        assertNotEquals("Each createConfiguration call should produce a unique config IRI", iri1, iri2);
    }

    /* deleteConfiguration() */

    @Test
    public void deleteConfigurationRemovesConfigTriplesFromRepo() {
        IRI newRecordIRI = VALUE_FACTORY.createIRI("https://mobi.com/records#69cd560d-d733-453a-bb9b-0b9e197d68e7");
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(getClass().getResourceAsStream("/webhook_record.trig"), RDFFormat.TRIG);
            WebhookRecord record = webhookRecordFactory.getExisting(newRecordIRI, testModel).orElseThrow(
                    () -> new RuntimeException("Could not retrieve existing record")
            );

            //initial check to make sure the statements and config is present
            RepositoryResult<Statement> recordStatements = conn.getStatements(null, null, null, newRecordIRI);
            RepositoryResult<Statement> configStatements = conn.getStatements(CONFIG_IRI, null, null, newRecordIRI);
            assertEquals(17, QueryResults.asList(recordStatements).size());
            assertEquals(4, QueryResults.asList(configStatements).size());

            RepositoryConnection connSpy = spy(conn);
            service.deleteConfiguration(record, connSpy);

            //secondary check to make sure the config has been removed
            verify(connSpy).remove(eq(CONFIG_IRI), any(), any(), eq(newRecordIRI));
            recordStatements = conn.getStatements(null, null, null, newRecordIRI);
            configStatements = conn.getStatements(CONFIG_IRI, null, null, newRecordIRI);

            assertEquals(13, QueryResults.asList(recordStatements).size());
            assertEquals(0, QueryResults.asList(configStatements).size());
        } catch (Exception e) {
            fail("Should not have thrown exception:");
        }
    }

    @Test
    public void deleteConfigurationWhenNoConfigPresent() {
        IRI secondRecordIRI = VALUE_FACTORY.createIRI("https://mobi.com/records#81c30bf3-3e31-42d6-861b-8877b71c242a");

        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(testModel);

            WebhookRecord record = webhookRecordFactory.getExisting(secondRecordIRI, testModel).orElseThrow(
                    () -> new RuntimeException("Could not retrieve existing record")
            );

            RepositoryConnection connSpy = spy(conn);
            service.deleteConfiguration(record, connSpy);

            verify(spy(conn), never()).remove(any(Resource.class), any(), any(), any(Resource.class));
        } catch (Exception e) {
            fail("Should not have thrown exception:");
        }
    }
}
