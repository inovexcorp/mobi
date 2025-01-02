package com.mobi.repository.impl.sesame.http;

/*-
 * #%L
 * com.mobi.repository.impl.sesame
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

/**
 * Configuration for Repository objects accessed through an HTTP endpoint. The instance must be
 * initialized prior to using it.
 */
@ObjectClassDefinition(name = "HTTPRepositoryConfig", description = "Configuration for an HTTP Repository")
public @interface HTTPRepositoryConfig {

    /**
     * The Repository ID.
     *
     * @return String representing the Repository ID.
     */
    @AttributeDefinition(name = "id", description = "The ID of the Repository")
    String id();

    /**
     * The Repository Title.
     *
     * @return String representing the Repository Title.
     */
    @AttributeDefinition(name = "title", description = "The Title of the Repository")
    String title();

    /**
     * The HTTP server URL.
     *
     * @return String representing the HTTP server URL.
     */
    @AttributeDefinition(name = "serverUrl", description = "The URL of the HTTP Server")
    String serverUrl();
}
