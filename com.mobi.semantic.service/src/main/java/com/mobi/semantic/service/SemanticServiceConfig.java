package com.mobi.semantic.service;

/*-
 * #%L
 * com.mobi.semantic.service
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

import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;

public interface SemanticServiceConfig {

    /**
     * Gets the subject Resource that identifies this configuration.
     *
     * @return the subject Resource that identifies this configuration.
     */
    Resource getResource();

    /**
     * Export this configuration to its RDF representation.
     *
     * @return the Model containing the RDF representation of this configuration identified by its subject Resource.
     */
    Model export();

    /**
     * Reads the properties of this configuration from the supplied Model and sets them accordingly.
     *
     * @param model - a Model containing repository configuration data.
     * @param resource - the subject Resource that identifies the configuration in the Model.
     * @throws SemanticServiceConfigException - if the configuration data could not be read from the supplied Model.
     */
    void parse(Model model, Resource resource) throws SemanticServiceConfigException;

    /**
     * Validates this configuration. A RepositoryConfigException is thrown when either of the configurations
     * are invalid. The exception should contain an error message that indicates why the configuration is invalid.
     *
     * @throws SemanticServiceConfigException - if the configuration is invalid.
     */
    void validate() throws SemanticServiceConfigException;
}
