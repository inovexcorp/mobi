package org.matonto.analytic.api.configuration;

/*-
 * #%L
 * org.matonto.analytic.api
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

import org.matonto.analytic.ontologies.analytic.Configuration;

public interface ConfigurationService<T extends Configuration> {
    /**
     * Retrieves the IRI of the type of {@link Configuration} this service creates.
     *
     * @return A IRI string of a subclass of Configuration
     */
    String getTypeIRI();

    /**
     * Creates a {@link Configuration} using the key value pairs from the provided JSON.
     *
     * @param json The JSON string which contains key value pairs that should be set on the Configuration.
     * @return The Configuration created using the provided JSON.
     */
    T create(String json);
}
