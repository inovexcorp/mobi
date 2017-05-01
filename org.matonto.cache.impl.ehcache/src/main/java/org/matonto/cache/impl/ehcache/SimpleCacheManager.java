package org.matonto.cache.impl.ehcache;

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Deactivate;
import org.ehcache.config.CacheConfiguration;
import org.ehcache.config.builders.CacheConfigurationBuilder;
import org.ehcache.config.builders.ResourcePoolsBuilder;
import org.ehcache.jsr107.Eh107Configuration;
import org.matonto.cache.api.CacheManager;

import java.util.Optional;
import javax.cache.Cache;
import javax.cache.Caching;
import javax.cache.spi.CachingProvider;

@Component(immediate = true)
public class SimpleCacheManager implements CacheManager {

    private CachingProvider provider;
    private javax.cache.CacheManager cacheManager;

    @Activate
    public void start() {
        provider = Caching.getCachingProvider("org.ehcache.jsr107.EhcacheCachingProvider");
        cacheManager = provider.getCacheManager();

        CacheConfiguration<Long, String> cacheConfiguration = CacheConfigurationBuilder
                .newCacheConfigurationBuilder(Long.class, String.class, ResourcePoolsBuilder.heap(10))
                .build();

        cacheManager.createCache("ontologyCache",
                Eh107Configuration.fromEhcacheCacheConfiguration(cacheConfiguration));
    }

    @Deactivate
    public void stop() {
        cacheManager.close();
        provider.close();
    }

    // TODO: Modified?

    @Override
    public <K, V> Optional<Cache<K, V>> getCache(String cacheName, Class<K> keyType, Class<V> valueType) {
        return Optional.ofNullable(cacheManager.getCache(cacheName, keyType, valueType));
    }
}
