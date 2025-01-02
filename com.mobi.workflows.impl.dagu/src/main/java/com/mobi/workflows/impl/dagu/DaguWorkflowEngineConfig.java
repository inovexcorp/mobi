package com.mobi.workflows.impl.dagu;

/*-
 * #%L
 * com.mobi.workflows.impl.dagu
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

@ObjectClassDefinition
public @interface DaguWorkflowEngineConfig {

    /**
     * The base URL of the desired dagu server
     *
     * @return String representation of the URL of the dagu server
     */
    @AttributeDefinition
    String daguHost();

    /**
     * The directory on the local system where Dagu logs will be stored if running locally, and copied to if running
     * remotely.
     *
     * @return A string representation of the path to the directory where logs will be stored.
     */
    @AttributeDefinition
    String logDir();

    /**
     * Whether the Dagu server exists on the same server as the running mobi installation.
     *
     * @return true value if it's running on the same server, false if it is not.
     */
    @AttributeDefinition(defaultValue = "true")
    boolean local() default true;

    /**
     * The frequency (in seconds) that the Dagu server is polled for the status of a particular workflow.
     *
     * @return The number of seconds to wait before polling the Dagu server.
     */
    @AttributeDefinition(defaultValue = "10")
    long pollInterval() default 10;

    /**
     *  The max amount of time (in seconds) to allow polling of a Dagu server.
     *
     * @return The number of seconds the system will poll the Dagu server before failing the workflow if a satisfactory
     * response is not returned.
     */
    @AttributeDefinition(defaultValue = "300")
    long pollTimeout() default 300;

    /**
     *  The username of the optional basic auth account configured on the DAGU server.
     *
     * @return A string representing the username to be used for basic auth on the DAGU server
     */
    @AttributeDefinition(name = "username", required = false)
    String username();

    /**
     *  The password of the optional basic auth account configured on the DAGU server.
     *
     * @return A string representing the password to be used for basic auth on the DAGU server
     */
    @AttributeDefinition(name = "password", required = false)
    String password();

    /**
     *  The number of workflows that can be run simultaneously.
     *
     * @return An integer corresponding to how many workflows can be run concurrently
     */
    @AttributeDefinition(required = false, defaultValue = "100")
    int concurrencyLimit() default 100;
}
