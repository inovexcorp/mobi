package com.mobi.namespace.api;

/*-
 * #%L
 * com.mobi.namespace.api
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

public interface NamespaceService {

    /**
     * Sets the default ontology namespace to be used by the Application. Must be a valid IRI prefix.
     *
     * @param namespace The default ontology to be used by the application.
     */
    void setDefaultOntologyNamespace(String namespace);

    /**
     * Retrieves the default ontology namespace.
     *
     * @return String The default ontology namespace.
     */
    String getDefaultOntologyNamespace();
}
