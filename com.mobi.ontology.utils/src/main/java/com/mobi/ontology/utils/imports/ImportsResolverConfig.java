package com.mobi.ontology.utils.imports;

/*-
 * #%L
 * com.mobi.ontology.utils
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

@ObjectClassDefinition
public @interface ImportsResolverConfig {

    /**
     * The user agent used to make requests to resolve imports.
     *
     * @return The user agent string
     */
    @AttributeDefinition(required = false)
    String userAgent();

    /**
     * The connection timeout in milliseconds.
     *
     * @return The connection timeout
     */
    @AttributeDefinition(required = false, defaultValue = "3000")
    int connectionTimeout() default 3000;

    /**
     * The read timeout in milliseconds.
     *
     * @return The read timeout
     */
    @AttributeDefinition(required = false, defaultValue = "10000")
    int readTimeout() default 10000;
}
