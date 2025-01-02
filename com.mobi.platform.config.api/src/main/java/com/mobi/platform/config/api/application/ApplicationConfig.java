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

import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;

/**
 * Configuration for Application objects in the repository.
 */
@ObjectClassDefinition
public @interface ApplicationConfig {

    /**
     * The ID of the Application service. Used as the local name of the Application IRI.
     *
     * @return the id of the Application
     */
    @AttributeDefinition
    String id();

    /**
     * The title of the Application. Used as the dct:title of the Application object.
     *
     * @return the display title of the Application
     */
    @AttributeDefinition(required = false)
    String title();

    /**
     * The description of the Application. Used as the dct:description of the Application object.
     *
     * @return the description of the Application
     */
    @AttributeDefinition(required = false)
    String description();

    @AttributeDefinition(name = "repository.target")
    String repository_id();
}
