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
import com.mobi.webhooks.api.ontology.webhooks.WebhookConfigurationFactory;
import com.mobi.webhooks.api.ontology.webhooks.WebhookRecord;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.UUID;

/**
 * implementation of WebhookConfigurationService for managing webhook configurations.
 */
@Component(immediate = true, service = { WebhookConfigurationService.class })
public class WebhookConfigurationServiceImpl implements WebhookConfigurationService {

    private static final Logger LOG = LoggerFactory.getLogger(WebhookConfigurationServiceImpl.class);
    //TODO ensure removal of PLACEHOLDER method by MVP completion.
    private static final String PLACEHOLDER = "Method not implemented yet";

    protected final ValueFactory vf = new ValidatingValueFactory();

    @Reference
    WebhookConfigurationFactory webhookConfigurationFactory;

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
    public void createConfiguration(WebhookRecord webhookRecord) {
        IRI configIRI = vf.createIRI("http://mobi.solutions/webhooks/configurations/" + UUID.randomUUID());
        WebhookConfiguration webhookConfig = webhookConfigurationFactory.createNew(configIRI);
        webhookConfig.setUrl(DEFAULT_WEBHOOK_URL);
        webhookConfig.setHttpMethod(DEFAULT_HTTP_METHOD);
        webhookRecord.setHasWebhookConfiguration(webhookConfig);
        webhookRecord.getModel().addAll(webhookConfig.getModel());
    }

    @Override
    public void updateConfiguration(WebhookRecord webhookRecord) {
        LOG.info(PLACEHOLDER);
    }

    @Override
    public void deleteConfiguration(WebhookRecord webhookRecord, RepositoryConnection conn) {
        final long startTime = System.currentTimeMillis();
        LOG.debug("Deleting WebhookConfiguration linked to WebhookRecord: {}", webhookRecord.getResource());
        webhookRecord.getHasWebhookConfiguration_resource()
                .ifPresent(configIRI -> {
                    LOG.debug("Removing WebhookConfiguration: {}", configIRI);
                    conn.remove(configIRI, null, null, webhookRecord.getResource());
                    LOG.debug("WebhookConfiguration deletion for record: {} complete in {}ms", webhookRecord.getResource(),
                            System.currentTimeMillis() - startTime);
                });

    }
}
