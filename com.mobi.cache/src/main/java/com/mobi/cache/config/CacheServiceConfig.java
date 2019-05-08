package com.mobi.cache.config;

/*-
 * #%L
 * com.mobi.cache
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

/**
 * Base configuration for Repository Objects.
 */
@Meta.OCD
public interface CacheServiceConfig {

    /**
     * The Cache ID.
     *
     * @return The String representing the Cache ID.
     */
    String id();

    /**
     * The Repository ID.
     *
     * @return The String representing the Repository ID.
     */
    String repoId();

    /**
     * The number of entries to track in the cache. NOTE: This is an optional property.
     *
     * @return The String representing the number of entries to track in the cache.
     */
    @Meta.AD(required = false)
    int numEntries();
}
