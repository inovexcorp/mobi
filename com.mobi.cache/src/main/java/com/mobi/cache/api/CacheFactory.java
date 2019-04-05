package com.mobi.cache.api;

public interface CacheFactory<K, V> {
    Class<V> getValueType();
}
