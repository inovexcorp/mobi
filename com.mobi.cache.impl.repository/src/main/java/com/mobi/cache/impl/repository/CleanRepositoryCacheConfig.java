package com.mobi.cache.impl.repository;

/*-
 * #%L
 * com.mobi.cache.impl.repository
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
 * Base configuration for CleanRepositoryCache service. Requires a "scheduler.expression" property to be set in the
 * configuration file.
 */
@ObjectClassDefinition
public @interface CleanRepositoryCacheConfig {

    /**
     * The Cache Repository ID to clean. If not present, defaults to "ontologyCache".
     *
     * @return String representing the Repository ID
     */
    @AttributeDefinition
    String repoId();

    /**
     * The expiry (in seconds) of a cache item. When a cleanup is run, any cache item that has not been used in a
     * duration longer than the expiry period is removed from the cache.
     *
     * @return The number of seconds a cache item can stay in the cache before being marked as expired
     */
    @AttributeDefinition(defaultValue = "1800")
    long expiry() default 1800;
}

