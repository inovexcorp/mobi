package com.mobi.cache.impl.core;

/*-
 * #%L
 * com.mobi.cache.impl.core
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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

import com.mobi.cache.api.CacheManager;
import com.mobi.cache.config.CacheConfiguration;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Deactivate;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ReferenceCardinality;
import org.osgi.service.component.annotations.ReferencePolicy;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.Semaphore;
import javax.cache.Cache;
import javax.cache.Caching;
import javax.cache.configuration.Configuration;
import javax.cache.spi.CachingProvider;

@Component(immediate = true)
public class SimpleCacheManager implements CacheManager {

    private CachingProvider provider;
    private javax.cache.CacheManager cacheManager;
    private Map<String, CacheConfiguration<?, ?>> cacheConfigurations = new HashMap<>();
    private final Semaphore mutex = new Semaphore(1);

    @Reference(cardinality = ReferenceCardinality.MULTIPLE, policy = ReferencePolicy.DYNAMIC)
    private <K, V> void addCache(CacheConfiguration<K, V> configuration) throws InterruptedException {
        cacheConfigurations.put(configuration.getCacheId(), configuration);
        if (cacheManager != null) {
            cacheManager.createCache(configuration.getCacheId(), configuration.getCacheConfiguration());
        }
    }

    private <K, V> void removeCache(CacheConfiguration<K, V> configuration) {
        cacheConfigurations.remove(configuration.getCacheId());
        if (cacheManager != null && !cacheManager.isClosed()) {
            cacheManager.destroyCache(configuration.getCacheId());
        }
    }

    @Activate
    public void start() throws InterruptedException {
        checkCacheManager();
        cacheConfigurations.forEach((cacheId, configuration) -> {
            Configuration jCacheConfig = configuration.getCacheConfiguration();
            if (cacheManager.getCache(cacheId) == null) {
                cacheManager.createCache(cacheId, jCacheConfig);
            }
        });
    }

    @Deactivate
    public void stop() {
        if (cacheManager != null) {
            cacheManager.close();
        }
        if (provider != null) {
            provider.close();
        }
    }

    @Override
    public <K, V> Optional<Cache<K, V>> getCache(String cacheName, Class<K> keyType, Class<V> valueType) {
        return Optional.ofNullable(cacheManager.getCache(cacheName, keyType, valueType));
    }

    private void checkCacheManager() throws InterruptedException {
        mutex.acquire();
        if (cacheManager == null) {
            provider = Caching.getCachingProvider("org.ehcache.jsr107.EhcacheCachingProvider",
                    this.getClass().getClassLoader());
            cacheManager = provider.getCacheManager();
        }
        mutex.release();
    }
}
