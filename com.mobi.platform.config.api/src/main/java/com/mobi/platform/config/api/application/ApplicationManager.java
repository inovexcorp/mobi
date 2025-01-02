package com.mobi.platform.config.api.application;

/*-
 * #%L
 * com.mobi.platform.config.api
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

import com.mobi.platform.config.api.ontologies.platformconfig.Application;
import com.mobi.platform.config.api.ontologies.platformconfig.Application;

import java.util.Optional;

public interface ApplicationManager {

    /**
     * Tests whether an Application with the passed ID exists as a service.
     *
     * @param applicationId The ID to search for an Application that matches
     * @return true if an Application exists with the passed ID; false otherwise
     */
    boolean applicationExists(String applicationId);

    /**
     * Returns an Optional with the Application object for the Application service with the passed ID if
     * found; return an empty Optional otherwise.
     *
     * @param applicationId The ID of the Application to retrieve
     * @return the Application specified by the passed ID if found; empty otherwise
     */
    Optional<Application> getApplication(String applicationId);
}
