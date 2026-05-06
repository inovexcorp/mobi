package com.mobi.webhooks.api;

import com.mobi.catalog.api.PaginatedSearchParams;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.webhooks.api.ontology.webhooks.WebhookConfiguration;
import com.mobi.webhooks.api.ontology.webhooks.WebhookRecord;

import java.util.Map;

import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.repository.RepositoryConnection;


/*-
 * #%L
 * com.mobi.webhooks.api
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

/**
 * Service for managing webhook configurations.
 */
public interface WebhookConfigurationService {
    //TODO Both of these below variables should be removed by the time MVP is done
    String DEFAULT_WEBHOOK_URL = "https://www.example.com";
    String DEFAULT_HTTP_METHOD = "GET";

    /**
     * Validates the provided RDF4J Model against the WebhookConfiguration SHACL shapes defined in webhooks.ttl.
     * Ensures the model contains exactly one WebhookConfiguration and that it conforms to all constraints.
     *
     * @param configModel the {@link Model} containing the WebhookConfiguration to validate
     * @throws IllegalArgumentException if the model fails SHACL validation or does not contain exactly one WebhookConfiguration
     */
    void validateConfiguration(Model configModel);

    /**
     * Retrieves the webhook configuration associated with the given record IRI.
     *
     * @param recordIri the IRI of the record for which the configuration is to be retrieved
     * @return the webhook configuration corresponding to the specified record IRI
     */
    WebhookConfiguration getWebhookConfig(String recordIri);

    /**
     * Retrieves a map of all webhook configurations, where the key represents the unique identifier (record IRI)
     * and the value is the corresponding webhook configuration object.
     *
     * @return a HashMap containing all webhook configurations, keyed by their unique identifiers
     */
    PaginatedSearchResults<WebhookRecord> getWebhooks();

    /**
     * Retrieves a paginated map of webhook configurations based on the specified search parameters.
     * The key represents the unique identifier (record IRI), and the value is the corresponding webhook configuration object.
     *
     * @param params an instance of {@code PaginatedSearchParams} containing pagination and filtering criteria
     * @return a HashMap containing the webhook configurations that match the specified search parameters,
     *         keyed by their unique identifiers
     */
    PaginatedSearchResults<WebhookRecord> getWebhooks(PaginatedSearchParams params);
    //TODO may need to return to above and update this to be a more specific paginatedSearchParam once further implementation is done.

    /**
     * Creates a new webhook configuration from the provided RDF4J Model and links it to the specified record.
     * Populates the eventFilters cache if an eventFilter is present.
     *
     * @param webhookRecord The {@link WebhookRecord} to link the new configuration to
     * @param configModel   The {@link Model} containing the source WebhookConfiguration data
     */
    void createConfiguration(WebhookRecord webhookRecord, Model configModel);

    /**
     * Updates the webhook configuration associated with the given record IRI.
     *
     * @param webhookRecord The {@link WebhookRecord} for which the webhook configuration is to be updated
     */
    void updateConfiguration(WebhookRecord webhookRecord);

    /**
     * Deletes the webhook configuration associated with the specified record IRI.
     *
     * @param webhookRecord The {@link WebhookRecord} for which the webhook configuration is to be deleted
     * @param conn The {@link RepositoryConnection} in which the WebhookRecord artifacts are stored
     */
    void deleteConfiguration(WebhookRecord webhookRecord, RepositoryConnection conn);

    /**
     * Retrieves the cached map of event filters for all webhook records.
     *
     * @return an unmodifiable map where keys are {@link WebhookRecord} IRIs and values are
     *         the corresponding event filter strings from their linked {@link WebhookConfiguration}
     */
    Map<Resource, String> retrieveEventFilters();

}
