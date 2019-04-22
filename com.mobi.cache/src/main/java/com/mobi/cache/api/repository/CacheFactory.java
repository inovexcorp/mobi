package com.mobi.cache.api.repository;

/*-
 * #%L
 * com.mobi.cache
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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

import com.mobi.cache.api.repository.jcache.config.RepositoryConfiguration;
import com.mobi.repository.api.Repository;

import javax.cache.Cache;

public interface CacheFactory<K, V> {

    /**
     * Retrieve the Value Type of the Cache.
     * @return the Class of the Value Type
     */
    Class<V> getValueType();

    /**
     * Create a Cache using the provided configuration
     * @param configuration the {@link RepositoryConfiguration} to create the cache from
     * @param repository the {@link Repository} backing the cache
     * @return A JSR-107 Cache object
     */
    Cache<K, V> createCache(RepositoryConfiguration<K, V> configuration, Repository repository);
}