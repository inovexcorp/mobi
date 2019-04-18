package com.mobi.cache.impl.repository.jcache;

/*-
 * #%L
 * com.mobi.cache.impl.repository
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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.cache.api.repository.CacheFactory;
import com.mobi.cache.api.repository.jcache.config.RepositoryConfiguration;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryManager;
import org.apache.commons.lang3.StringUtils;

import java.lang.ref.WeakReference;
import java.net.URI;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Properties;
import java.util.concurrent.ConcurrentHashMap;
import javax.cache.Cache;
import javax.cache.CacheException;
import javax.cache.CacheManager;
import javax.cache.configuration.CompleteConfiguration;
import javax.cache.configuration.Configuration;
import javax.cache.spi.CachingProvider;

@Component
public class RepositoryCacheManager implements CacheManager {

    private final Map<String, CacheFactory<?, ?>> cacheFactoryMap = new HashMap<>();
    private final Map<String, Cache<?, ?>> caches = new ConcurrentHashMap<>();

    private RepositoryManager repositoryManager;
    private CachingProvider cachingProvider;
    private WeakReference<ClassLoader> classLoaderReference;
    private Properties properties;
    private URI uri;

    private volatile boolean closed;

    @Reference(optional = true)
    public void setCachingProvider(CachingProvider cachingProvider) {
        if (cachingProvider == null) {
            throw new IllegalArgumentException("CachingProvider must not be null");
        } else if (cachingProvider.getDefaultClassLoader() == null) {
            throw new IllegalArgumentException("CachingProvider default ClassLoader must not be null");
        } else if (cachingProvider.getDefaultProperties() == null) {
            throw new IllegalArgumentException("CachingProvider default Properties must not be null");
        } else if (cachingProvider.getDefaultURI() == null) {
            throw new IllegalArgumentException("CachingProvider default URI must not be null");
        }

        this.cachingProvider = cachingProvider;
        this.classLoaderReference = new WeakReference<>(cachingProvider.getDefaultClassLoader());
        this.properties = cachingProvider.getDefaultProperties();
        this.uri = cachingProvider.getDefaultURI();
    }

    @Reference(type = '*', dynamic = true, optional = true)
    public void addCacheFactory(CacheFactory cacheFactory)  {
        cacheFactoryMap.put(cacheFactory.getValueType().getName(), cacheFactory);
    }

    public void removeCacheFactory(CacheFactory cacheFactory) {
        cacheFactoryMap.remove(cacheFactory.getValueType().getName());
    }

    @Reference
    void setRepositoryManager(RepositoryManager repositoryManager) {
        this.repositoryManager = repositoryManager;
    }

    @Override
    public CachingProvider getCachingProvider() {
        return cachingProvider;
    }

    @Override
    public URI getURI() {
        return uri;
    }

    @Override
    public ClassLoader getClassLoader() {
        return classLoaderReference.get();
    }

    @Override
    public Properties getProperties() {
        return properties;
    }

    @Override
    public <K, V, C extends Configuration<K, V>> Cache<K, V> createCache(String cacheName, C configuration)
            throws IllegalArgumentException {
        requireNotClosed();
        if (configuration == null) {
            throw new IllegalArgumentException("Configuration must not be null");
        }

        RepositoryConfiguration<K, V> repoConfig;
        if (configuration instanceof RepositoryConfiguration<?, ?>) {
            repoConfig = (RepositoryConfiguration<K, V>) configuration;
            if (StringUtils.isEmpty(repoConfig.getRepoId())) {
                throw new CacheException("Configuration must specify a repoId");
            }
        } else {
            throw new CacheException("Configuration must be a RepositoryConfiguration");
        }

        Cache<?, ?> cache = caches.compute(cacheName, (name, existing) -> {
            if ((existing != null) && !existing.isClosed()) {
                throw new CacheException("Cache " + cacheName + " already exists");
            }
            Repository repo = repositoryManager.getRepository(repoConfig.getRepoId()).orElseThrow(
                    () -> new CacheException("Repository " + repoConfig.getRepoId() + " must exist for " + cacheName));
            Optional<CacheFactory> cacheFactoryOpt = Optional.of(cacheFactoryMap.get(
                    repoConfig.getValueType().getName()));
            @SuppressWarnings("unchecked")
            CacheFactory<K, V> cacheFactory = cacheFactoryOpt.orElseThrow(
                    () -> new CacheException("CacheFactory does not exist for " + repoConfig.getValueType().getName()));
            return cacheFactory.createCache(repoConfig, repo);
        });

        @SuppressWarnings("unchecked")
        Cache<K, V> castedCache = (Cache<K, V>) cache;
        return castedCache;
    }

    @Override
    public <K, V> Cache<K, V> getCache(String cacheName, Class<K> keyType, Class<V> valueType) {
        if (cacheName == null) {
            throw new IllegalArgumentException("CacheName must not be null");
        }
        if (keyType == null) {
            throw new IllegalArgumentException("KeyType must not be null");
        }
        if (valueType == null) {
            throw new IllegalArgumentException("KeyType must not be null");
        }

        Cache<K, V> cache = getCache(cacheName);
        if (cache == null) {
            return null;
        }

        Configuration<?, ?> config = cache.getConfiguration(CompleteConfiguration.class);
        if (keyType != config.getKeyType()) {
            throw new ClassCastException("Incompatible cache key types specified, expected "
                    + config.getKeyType() + " but " + keyType + " was specified");
        } else if (valueType != config.getValueType()) {
            throw new ClassCastException("Incompatible cache value types specified, expected "
                    +  config.getValueType() + " but " + valueType + " was specified");
        }
        return cache;
    }

    @Override
    public <K, V> Cache<K, V> getCache(String cacheName) {
        if (cacheName == null) {
            throw new IllegalArgumentException("CacheName must not be null");
        }
        requireNotClosed();

        @SuppressWarnings("unchecked")
        Cache<K, V> cache = (Cache<K, V>) caches.get(cacheName);
        return cache;
    }

    @Override
    public Iterable<String> getCacheNames() {
        requireNotClosed();
        return Collections.unmodifiableCollection(new ArrayList<>(caches.keySet()));
    }

    @Override
    public void destroyCache(String cacheName) {
        requireNotClosed();

        Cache<?, ?> cache = caches.remove(cacheName);
        if (cache != null) {
            cache.close();
        }
    }

    @Override
    public void enableManagement(String cacheName, boolean enabled) {

    }

    @Override
    public void enableStatistics(String cacheName, boolean enabled) {

    }

    @Override
    public void close() {
        if (isClosed()) {
            return;
        }
        synchronized (cacheFactoryMap) {
            if (!isClosed()) {
                cachingProvider.close(uri, classLoaderReference.get());
                for (Cache<?, ?> cache : caches.values()) {
                    cache.close();
                }
                closed = true;
            }
        }
    }

    @Override
    public boolean isClosed() {
        return closed;
    }

    @Override
    public <T> T unwrap(Class<T> clazz) {
        if (clazz.isAssignableFrom(getClass())) {
            return clazz.cast(this);
        }
        throw new IllegalArgumentException("Unwrapping to " + clazz + " is not a supported by this implementation");
    }

    private void requireNotClosed() {
        if (isClosed()) {
            throw new IllegalStateException();
        }
    }
}
