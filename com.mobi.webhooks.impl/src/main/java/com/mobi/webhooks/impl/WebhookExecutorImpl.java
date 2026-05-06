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

import com.mobi.sse.SSETopics;
import com.mobi.webhooks.api.WebhookConfigurationService;
import com.mobi.webhooks.api.WebhookExecutor;
import com.mobi.webhooks.api.ontology.webhooks.WebhookConfiguration;

import org.eclipse.rdf4j.model.Resource;
import org.osgi.framework.Filter;
import org.osgi.framework.FrameworkUtil;
import org.osgi.framework.InvalidSyntaxException;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.event.Event;
import org.osgi.service.event.EventConstants;
import org.osgi.service.event.EventHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Arrays;
import java.util.Hashtable;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Simple implementation of WebhookExecutor for executing webhook HTTP requests.
 */
@Component(immediate = true,
        service = { WebhookExecutor.class, EventHandler.class },
        property = EventConstants.EVENT_TOPIC + "=com/mobi/*"
)
public class WebhookExecutorImpl implements WebhookExecutor, EventHandler {

    private static final Logger LOG = LoggerFactory.getLogger(WebhookExecutorImpl.class);
    private static final String PLACEHOLDER = "Method not implemented yet";

    @Reference
    WebhookConfigurationService webhookConfigurationService;

    @Override
    public void executeWebhook(WebhookConfiguration configuration) {
        LOG.info(PLACEHOLDER);
    }

    @Override
    public void handleEvent(Event event) {
        if (!event.getTopic().startsWith(SSETopics.TOPIC_NAME)) {
            Map<Resource, String> filters = webhookConfigurationService.retrieveEventFilters();
            Hashtable<String, Object> data = new Hashtable<>(Arrays.stream(event.getPropertyNames())
                    .collect(Collectors.toMap(k -> k, name -> String.valueOf(event.getProperty(name)))));

            List<Resource> matchedRecordIRIs = filters.entrySet().stream()
                    .filter(entry -> {
                        try {
                            Filter filter = FrameworkUtil.createFilter(entry.getValue());
                            return filter.match(data);
                        } catch (InvalidSyntaxException e) {
                            LOG.error("Filter string for record: {}, has invalid syntax", entry.getKey());
                            return false;
                        }
                    }).map(Map.Entry::getKey)
                    .toList();

            if (!matchedRecordIRIs.isEmpty()) {
                // MP-3549 not yet merged — log instead of executing
                LOG.info("Execution Logic not complete. {} webhook record(s) with IRI(s): {} Should be executed",
                        matchedRecordIRIs.size(), matchedRecordIRIs);
            } else {
                LOG.info("No matching Webhook records found for event:");
            }
        }
    }
}
