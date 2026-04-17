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

import static org.mockito.Mockito.when;

import com.mobi.webhooks.api.WebhookConfigurationService;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.osgi.service.event.Event;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

public class WebhookExecutorImplTest {

    private static final ValueFactory VF = new ValidatingValueFactory();
    private static final IRI RECORD_IRI = VF.createIRI("https://mobi.com/records#test-webhook");
    private static final String MATCHING_TOPIC = "com/mobi/catalog/ontology/changed";
    private static final String NON_MATCHING_TOPIC = "com/mobi/catalog/data/changed";

    @Mock
    WebhookConfigurationService webhookConfigurationService;

    private AutoCloseable closeable;
    private WebhookExecutorImpl executor;

    @Before
    public void setUp() {
        closeable = MockitoAnnotations.openMocks(this);
        executor = new WebhookExecutorImpl();
        executor.webhookConfigurationService = webhookConfigurationService;
    }

    @After
    public void tearDown() throws Exception {
        closeable.close();
    }

    /* handleEvent() */

    @Test
    public void handleEventWithNoFiltersRegisteredDoesNothing() {
        when(webhookConfigurationService.retrieveEventFilters()).thenReturn(Collections.emptyMap());
        Event event = new Event(MATCHING_TOPIC, (Map<String, ?>) null);

        // Should complete without error and take no further action
        executor.handleEvent(event);
    }

    @Test
    public void handleEventWithMatchingFilterLogsExecution() {
        Map<Resource, String> filters = new HashMap<>();
        filters.put(RECORD_IRI, MATCHING_TOPIC);
        when(webhookConfigurationService.retrieveEventFilters()).thenReturn(filters);
        Event event = new Event(MATCHING_TOPIC, (Map<String, ?>) null);

        // Should complete without error; logs "Execution Logic not complete" with the matched IRI
        executor.handleEvent(event);
    }

    @Test
    public void handleEventWithNonMatchingFilterDoesNothing() {
        Map<Resource, String> filters = new HashMap<>();
        filters.put(RECORD_IRI, NON_MATCHING_TOPIC);
        when(webhookConfigurationService.retrieveEventFilters()).thenReturn(filters);
        Event event = new Event(MATCHING_TOPIC, (Map<String, ?>) null);

        // Topic does not match filter — should return early without logging execution
        executor.handleEvent(event);
    }

    @Test
    public void handleEventOnlyMatchesRecordsWhoseFilterEqualsTheTopic() {
        IRI recordA = VF.createIRI("https://mobi.com/records#record-a");
        IRI recordB = VF.createIRI("https://mobi.com/records#record-b");

        Map<Resource, String> filters = new HashMap<>();
        filters.put(recordA, MATCHING_TOPIC);
        filters.put(recordB, NON_MATCHING_TOPIC);
        when(webhookConfigurationService.retrieveEventFilters()).thenReturn(filters);
        Event event = new Event(MATCHING_TOPIC, (Map<String, ?>) null);

        // Only recordA matches; should complete without error
        executor.handleEvent(event);
    }
}