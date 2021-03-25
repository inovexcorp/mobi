package com.mobi.platform.config.api.application;

/*-
 * #%L
 * com.mobi.platform.config.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

import com.mobi.platform.config.api.ontologies.platformconfig.Application;
import com.mobi.exception.MobiException;

import java.util.Map;

public interface ApplicationWrapper {
    /**
     * Validates a set of configurations for an application to ensure the correct
     * properties have been set.
     *
     * @param props a collection of key-value configurations for an Application
     * @throws IllegalArgumentException if configuration is invalid or missing properties
     * @throws MobiException if a connection to the Repository could not be made
     */
    void validateConfig(Map<String, Object> props) throws IllegalArgumentException;

    /**
     * Returns the ID of the application. The ID is the local name of the Application's IRI.
     *
     * @return String representing the ID of the application
     */
    String getId();

    /**
     * Returns the Application object for the application retrieved from the repository.
     *
     * @return an Application object representing the application
     * @throws MobiException if a connection to the Repository could not be made
     */
    Application getApplication();
}
