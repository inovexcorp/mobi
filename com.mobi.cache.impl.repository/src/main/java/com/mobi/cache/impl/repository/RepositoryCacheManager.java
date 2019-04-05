package com.mobi.cache.impl.repository;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.cache.api.CacheFactory;
import com.mobi.repository.api.RepositoryManager;

import java.net.URI;
import java.util.Map;
import java.util.Properties;
import java.util.concurrent.ConcurrentMap;
import javax.cache.Cache;
import javax.cache.CacheManager;
import javax.cache.configuration.Configuration;
import javax.cache.spi.CachingProvider;

@Component
public class RepositoryCacheManager implements CacheManager {

    private Map<String, CacheFactory> cacheFactoryMap;
    private RepositoryManager repositoryManager;
    private ConcurrentMap<String, Cache> caches;

    @Reference(type = '*', dynamic = true, optional = true)
    public void addCacheFactory(CacheFactory cacheFactory)  {
        cacheFactoryMap.put(cacheFactory.getValueType().toString(), cacheFactory);
    }

    public void removeCacheFactory(CacheFactory cacheFactory) {
        cacheFactoryMap.remove(cacheFactory.getValueType().toString());
    }

    @Reference
    void setRepositoryManager(RepositoryManager repositoryManager) {
        this.repositoryManager = repositoryManager;
    }

    @Override
    public CachingProvider getCachingProvider() {
        return null;
    }

    @Override
    public URI getURI() {
        return null;
    }

    @Override
    public ClassLoader getClassLoader() {
        return null;
    }

    @Override
    public Properties getProperties() {
        return null;
    }

    @Override
    public <K, V, C extends Configuration<K, V>> Cache<K, V> createCache(String cacheName, C configuration) throws IllegalArgumentException {
        return null;
    }

    @Override
    public <K, V> Cache<K, V> getCache(String cacheName, Class<K> aClass, Class<V> aClass1) {
        return null;
    }

    @Override
    public <K, V> Cache<K, V> getCache(String cacheName) {
        return null;
    }

    @Override
    public Iterable<String> getCacheNames() {
        return null;
    }

    @Override
    public void destroyCache(String cacheName) {

    }

    @Override
    public void enableManagement(String s, boolean b) {

    }

    @Override
    public void enableStatistics(String s, boolean b) {

    }

    @Override
    public void close() {

    }

    @Override
    public boolean isClosed() {
        return false;
    }

    @Override
    public <T> T unwrap(Class<T> clazz) {
        return null;
    }
}
