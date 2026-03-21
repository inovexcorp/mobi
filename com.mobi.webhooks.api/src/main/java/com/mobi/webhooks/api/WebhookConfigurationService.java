package com.mobi.webhooks.api;

import com.mobi.catalog.api.PaginatedSearchParams;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.webhooks.api.ontology.webhooks.WebhookConfiguration;
import com.mobi.webhooks.api.ontology.webhooks.WebhookRecord;

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

    /**
     * Validates the webhook configuration via SHACL to ensure all properties are properly set.
     */
    void validateConfiguration(WebhookConfiguration configuration);

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
     * Updates the webhook configuration associated with the given record IRI.
     *
     * @param recordIri the IRI of the record for which the webhook configuration is to be updated
     */
    void updateConfiguration(String recordIri);

    /**
     * Deletes the webhook configuration associated with the specified record IRI.
     *
     * @param recordIri the IRI of the record for which the webhook configuration is to be deleted
     */
    void deleteConfiguration(String recordIri);

}
