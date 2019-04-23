package com.mobi.cache.impl.core;

/*-
 * #%L
 * com.mobi.cache.impl.core
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

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Deactivate;
import aQute.bnd.annotation.component.Reference;
import com.mobi.cache.api.CacheManager;
import com.mobi.cache.api.repository.jcache.config.RepositoryConfiguration;
import com.mobi.cache.config.CacheConfiguration;

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
    private CachingProvider repoProvider;
    private javax.cache.CacheManager cacheManager;
    private javax.cache.CacheManager repoCacheManager;
    private Map<String, CacheConfiguration<?, ?>> cacheConfigurations = new HashMap<>();
    private final Semaphore mutex = new Semaphore(1);

    @Reference(type = '*', dynamic = true, optional = true)
    private <K, V> void addCache(CacheConfiguration<K, V> configuration) throws InterruptedException {
        cacheConfigurations.put(configuration.getCacheId(), configuration);
        if (cacheManager != null && repoCacheManager != null) {
            if (configuration.getCacheConfiguration() instanceof RepositoryConfiguration && repoCacheManager != null) {
                repoCacheManager.createCache(configuration.getCacheId(), configuration.getCacheConfiguration());
            } else {
                cacheManager.createCache(configuration.getCacheId(), configuration.getCacheConfiguration());
            }
        }
    }

    private <K, V> void removeCache(CacheConfiguration<K, V> configuration) {
        cacheConfigurations.remove(configuration.getCacheId());
        if (configuration instanceof RepositoryConfiguration && repoCacheManager != null
                && !repoCacheManager.isClosed()) {
            repoCacheManager.destroyCache(configuration.getCacheId());
        } else if (cacheManager != null && !cacheManager.isClosed()) {
            cacheManager.destroyCache(configuration.getCacheId());
        }
    }

    @Reference(target = "(provider=RepositoryCachingProvider)")
    public void setCachingProvider(CachingProvider cachingProvider)  {
        repoProvider = cachingProvider;
    }

    @Activate
    public void start() throws InterruptedException {
        checkCacheManager();
        cacheConfigurations.forEach((cacheId, configuration) -> {
            Configuration jCacheConfig = configuration.getCacheConfiguration();
            if (jCacheConfig instanceof RepositoryConfiguration && repoCacheManager != null && repoCacheManager.getCache(cacheId) == null) {
                repoCacheManager.createCache(cacheId, jCacheConfig);
            } else if (cacheManager.getCache(cacheId) == null) {
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
        if (repoCacheManager != null) {
            repoCacheManager.close();
        }
        if (repoProvider != null) {
            repoProvider.close();
        }
    }

    @Override
    public <K, V> Optional<Cache<K, V>> getCache(String cacheName, Class<K> keyType, Class<V> valueType) {
        Optional<Cache<K, V>> repoCacheOpt = Optional.ofNullable(repoCacheManager.getCache(cacheName, keyType,
                valueType));
        if (repoCacheOpt.isPresent()) {
            return repoCacheOpt;
        }
        return Optional.ofNullable(cacheManager.getCache(cacheName, keyType, valueType));
    }

    private void checkCacheManager() throws InterruptedException {
        mutex.acquire();
        if (cacheManager == null) {
            provider = Caching.getCachingProvider("org.ehcache.jsr107.EhcacheCachingProvider",
                    this.getClass().getClassLoader());
            cacheManager = provider.getCacheManager();
        }
        if (repoCacheManager == null && repoProvider != null) {
            repoCacheManager = repoProvider.getCacheManager();
        }
        mutex.release();
    }
}
