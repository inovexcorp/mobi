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

import com.mobi.webhooks.api.WebhookExecutor;
import com.mobi.webhooks.api.ontology.webhooks.WebhookConfiguration;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.event.Event;
import org.osgi.service.event.EventConstants;
import org.osgi.service.event.EventHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

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


    @Override
    public void executeWebhook(WebhookConfiguration configuration) {
        LOG.info(PLACEHOLDER);

    }

    @Override
    public void handleEvent(Event event) {
        LOG.info(PLACEHOLDER);
    }
}
