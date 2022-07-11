package com.mobi.repository.impl.sesame.sparql;

/*-
 * #%L
 * com.mobi.repository.impl.sesame
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
 * Configuration for Repository objects accessed through a SPARQL 1.1 compliant endpoint. The instance must be
 * initialized prior to using it.
 */
@ObjectClassDefinition(name = "SPARQLRepositoryConfig", description = "Configuration for a SPARQL Repository")
public @interface SPARQLRepositoryConfig {

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
     * The SPARQL endpoint URL.
     *
     * @return String representing the SPARQL endpoint URL.
     */
    @AttributeDefinition(name = "endpointUrl", description = "The SPARQL Endpoint URL")
    String endpointUrl();

    /**
     * The optional SPARQL update endpoint URL.
     *
     * @return String representing the SPARQL update endpoint URL.
     */
    @AttributeDefinition(required = false, name = "updateEndpointUrl", description = "The SPARQL UPDATE Endpoint URL")
    String updateEndpointUrl();
}
