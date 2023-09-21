package com.mobi.catalog.config;

/*-
 * #%L
 * com.mobi.catalog.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import org.osgi.service.metatype.annotations.AttributeType;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;

/**
 * Configuration for Catalog objects in the repository.
 */
@ObjectClassDefinition
public @interface CatalogConfig {

    /**
     * The title of the Catalog. Used as the dct:title of the Catalog object.
     *
     * @return the display title of the Catalog
     */
    @AttributeDefinition
    String title();

    /**
     * The description of the Catalog. Used as the dct:description of the Catalog object.
     *
     * @return the description of the Catalog
     */
    @AttributeDefinition
    String description();

    /**
     * Used as the local name of the Catalog IRI.
     *
     * @return the local name of the Catalog IRI
     */
    @AttributeDefinition
    String iri();

    /**
     * The id of the repository for the Catalog.
     *
     * @return the id of the repository for the Catalog
     */
    @AttributeDefinition(name = "repository.target")
    String repository_id();

    /**
     * Integer used for limit for limited-results endpoint
     * @return Integer used for limit for limited-results endpoint
     */
    @AttributeDefinition(name = "limitedSize", description = "Integer used for limit for limited-results endpoint", required = true, type = AttributeType.INTEGER, defaultValue = "500")
    int limit() default 500;
}
