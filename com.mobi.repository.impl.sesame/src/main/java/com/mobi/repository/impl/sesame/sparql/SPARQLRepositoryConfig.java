package com.mobi.repository.impl.sesame.sparql;

/*-
 * #%L
 * com.mobi.repository.impl.sesame
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

import aQute.bnd.annotation.metatype.Meta;
import com.mobi.repository.config.RepositoryConfig;

/**
 * Configuration for Repository objects accessed through a SPARQL 1.1 compliant endpoint. The instance must be
 * initialized prior to using it.
 */
public interface SPARQLRepositoryConfig extends RepositoryConfig {

    /**
     * The SPARQL endpoint URL.
     *
     * @return The String representing the SPARQL endpoint URL.
     */
    @Meta.AD
    String endpointUrl();

    /**
     * The optional SPARQL update endpoint URL.
     *
     * @return The String representing the SPARQL update endpoint URL.
     */
    @Meta.AD(required = false)
    String updateEndpointUrl();
}
