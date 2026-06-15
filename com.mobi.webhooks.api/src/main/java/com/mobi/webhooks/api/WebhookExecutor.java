package com.mobi.webhooks.api;

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

import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.webhooks.api.ontology.webhooks.WebhookConfiguration;
import org.eclipse.rdf4j.model.Resource;
import org.osgi.service.event.Event;
import com.mobi.webhooks.api.ontology.webhooks.WebhookExecutionActivity;

import java.util.Optional;

/**
 * Service for executing webhook HTTP requests.
 */
public interface WebhookExecutor {

    /**
     * Executes an HTTP request based on the provided webhook configuration.
     *
     * @param recordIri     the IRI of the WebhookRecord that triggered this execution
     * @param configuration the settings and details required to perform the webhook execution,
     *                      including endpoint URL, HTTP method, headers, and payload
     * @param event         the OSGi Event that triggered this webhook execution, used to build the request payload
     */
    void executeWebhook(Resource recordIri, WebhookConfiguration configuration, Event event);

    /**
     * Retrieves a paginated, sorted list of the {@link WebhookExecutionActivity WebhookExecutionActivities}
     * associated with the provided WebhookRecord. Each returned activity's {@code getModel()} includes the
     * activity's linked {@code ConnectionAttempt}s (and their headers) so it can be serialized in full.
     *
     * @param recordIri the IRI of the WebhookRecord to retrieve executions for
     * @param offset    the offset for the page of results
     * @param limit     the maximum number of executions to return in one page (0 for no limit)
     * @param sort      the IRI of the property to sort by. Currently only {@code prov:startedAtTime} is supported
     * @param ascending whether the results should be sorted ascending (true) or descending (false) by start time
     * @return a {@link PaginatedSearchResults} of WebhookExecutionActivities for the record
     */
    PaginatedSearchResults<WebhookExecutionActivity> getExecutions(Resource recordIri, int offset, int limit,
                                                                   String sort, boolean ascending);

    /**
     * Retrieves the latest {@link WebhookExecutionActivity WebhookExecutionActivity} associated with the provided
     * WebhookRecord.
     *
     * @param recordIri the IRI of the WebhookRecord to retrieve the latest execution for
     * @return the latest WebhookExecutionActivity for the record, if any
     */
    Optional<WebhookExecutionActivity> getLatestExecution(Resource recordIri);

}
