package org.matonto.cache.api;

/*-
 * #%L
 * cache
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

import java.util.Optional;
import javax.cache.Cache;

public interface CacheManager {

    /**
     * Retrieves a cache defined by the cacheName, keyType, and valueType.
     *
     * @param cacheName The alias for the cache.
     * @param keyType The Class representing the cache key.
     * @param valueType The Class representing the cache value.
     * @return An Optional.of(Cache) if it exists with the provided cacheName, keyType, and valueType; otherwise
     * Optional.empty().
     */
    <K, V> Optional<Cache<K, V>> getCache(String cacheName, Class<K> keyType, Class<V> valueType);
}
