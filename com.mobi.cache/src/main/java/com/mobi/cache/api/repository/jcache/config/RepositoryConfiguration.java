package com.mobi.cache.api.repository.jcache.config;

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

import java.util.Objects;
import javax.cache.configuration.CacheEntryListenerConfiguration;
import javax.cache.configuration.CompleteConfiguration;
import javax.cache.configuration.Factory;
import javax.cache.configuration.MutableConfiguration;
import javax.cache.expiry.ExpiryPolicy;
import javax.cache.integration.CacheLoader;
import javax.cache.integration.CacheWriter;

public class RepositoryConfiguration<K, V> implements CompleteConfiguration<K, V> {

    private final MutableConfiguration<K, V> delegate;
    private String repoId;

    public RepositoryConfiguration(Class<K> keyType, Class<V> valueType, String repoId) {
        delegate = new MutableConfiguration<>();
        delegate.setTypes(keyType, valueType);
        this.repoId = repoId;
    }

    public RepositoryConfiguration(CompleteConfiguration<K, V> configuration) {
        delegate = new MutableConfiguration<>(configuration);
        if (configuration instanceof RepositoryConfiguration<?, ?>) {
            RepositoryConfiguration<K, V> config = (RepositoryConfiguration<K, V>) configuration;
            repoId = config.repoId;
        }
    }

    @Override
    public boolean isReadThrough() {
        return delegate.isReadThrough();
    }

    @Override
    public boolean isWriteThrough() {
        return delegate.isWriteThrough();
    }

    @Override
    public boolean isStatisticsEnabled() {
        return delegate.isStatisticsEnabled();
    }

    @Override
    public boolean isManagementEnabled() {
        return delegate.isManagementEnabled();
    }

    @Override
    public Iterable<CacheEntryListenerConfiguration<K, V>> getCacheEntryListenerConfigurations() {
        return delegate.getCacheEntryListenerConfigurations();
    }

    @Override
    public Factory<CacheLoader<K, V>> getCacheLoaderFactory() {
        return delegate.getCacheLoaderFactory();
    }

    @Override
    public Factory<CacheWriter<? super K, ? super V>> getCacheWriterFactory() {
        return delegate.getCacheWriterFactory();
    }

    @Override
    public Factory<ExpiryPolicy> getExpiryPolicyFactory() {
        return delegate.getExpiryPolicyFactory();
    }

    @Override
    public Class<K> getKeyType() {
        return delegate.getKeyType();
    }

    @Override
    public Class<V> getValueType() {
        return delegate.getValueType();
    }

    @Override
    public boolean isStoreByValue() {
        return delegate.isStoreByValue();
    }

    public String getRepoId() {
        return repoId;
    }

    public void setRepoId(String repoId) {
        this.repoId = repoId;
    }

    @Override
    public boolean equals(Object o) {
        if (o == this) {
            return true;
        } else if (!(o instanceof RepositoryConfiguration<?, ?>)) {
            return false;
        }
        RepositoryConfiguration<?, ?> config = (RepositoryConfiguration<?, ?>) o;
        return Objects.equals(repoId, config.repoId)
                && delegate.equals(config.delegate);
    }

    @Override
    public int hashCode() {
        return delegate.hashCode();
    }
}
