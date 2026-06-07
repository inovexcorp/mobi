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

import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;

/**
 * OSGi configuration for the WebhookExecutor service.
 */
@ObjectClassDefinition(name = "Webhook Executor Config",
        description = "Configuration details for how webhooks should be executed")
public @interface WebhookExecutorConfig {

    /**
     * Retrieves the connection timeout value in milliseconds. This value represents the maximum amount
     * of time to wait for a connection to be established before timing out.
     *
     * @return the connection timeout in milliseconds, defaulting to 60,000 milliseconds (1 minute) if
     *         not explicitly specified.
     */
    @AttributeDefinition(name = "connectionTimeout", defaultValue = "60000")
    int connectionTimeout() default 60000;

    /**
     * Retrieves the maximum number of retry attempts allowed when executing a webhook.
     * This value specifies how many times the system will attempt to retry the execution
     * of a webhook in case of failure before giving up.
     *
     * @return the retry limit as an integer, defaulting to 3 if not explicitly specified.
     */
    @AttributeDefinition(name = "retryLimit", defaultValue = "3")
    int retryLimit() default 3;
}
