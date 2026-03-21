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

import com.mobi.catalog.api.PaginatedSearchParams;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.webhooks.api.WebhookConfigurationService;
import com.mobi.webhooks.api.ontology.webhooks.WebhookConfiguration;
import com.mobi.webhooks.api.ontology.webhooks.WebhookRecord;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * implementation of WebhookConfigurationService for managing webhook configurations.
 */
@Component(immediate = true, service = { WebhookConfigurationService.class })
public class WebhookConfigurationServiceImpl implements WebhookConfigurationService {

    private static final Logger LOG = LoggerFactory.getLogger(WebhookConfigurationServiceImpl.class);
    private static final String PLACEHOLDER = "Method not implemented yet";

    @Override
    public void validateConfiguration(WebhookConfiguration configuration) {
        LOG.info(PLACEHOLDER);
    }

    @Override
    public WebhookConfiguration getWebhookConfig(String recordIri) {
        LOG.info(PLACEHOLDER);
        return null;
    }

    @Override
    public PaginatedSearchResults<WebhookRecord> getWebhooks() {
        LOG.info(PLACEHOLDER);
        return null;
    }

    @Override
    public PaginatedSearchResults<WebhookRecord> getWebhooks(PaginatedSearchParams params) {
        LOG.info(PLACEHOLDER);
        return null;
    }

    @Override
    public void updateConfiguration(String recordIri) {
        LOG.info(PLACEHOLDER);
    }

    @Override
    public void deleteConfiguration(String recordIri) {
        LOG.info(PLACEHOLDER);
    }
}
