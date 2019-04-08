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

import static javax.cache.configuration.OptionalFeature.STORE_BY_REFERENCE;

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;

import java.net.URI;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;
import java.util.WeakHashMap;
import javax.cache.CacheManager;
import javax.cache.configuration.OptionalFeature;
import javax.cache.spi.CachingProvider;

@Component
public class RepositoryCachingProvider implements CachingProvider {

    private Map<ClassLoader, Map<URI, CacheManager>> cacheManagers;
    private RepositoryCacheManager repositoryCacheManager;

//    @Reference
//    void setRepositoryCacheManager(RepositoryCacheManager repositoryCacheManager) {
//        this.repositoryCacheManager = repositoryCacheManager;
//    }

    @Activate
    public void activate() {
        this.cacheManagers = new WeakHashMap<>(1);
    }

    @Override
    public ClassLoader getDefaultClassLoader() {
        return getClass().getClassLoader();
    }

    @Override
    public URI getDefaultURI() {
        return URI.create(getClass().getName());
    }

    @Override
    public Properties getDefaultProperties() {
        return new Properties();
    }

    @Override
    public CacheManager getCacheManager() {
        return getCacheManager(getDefaultURI(), getDefaultClassLoader());
    }

    @Override
    public CacheManager getCacheManager(URI uri, ClassLoader classLoader) {
        return getCacheManager(uri, classLoader, getDefaultProperties());
    }

    @Override
    public CacheManager getCacheManager(URI uri, ClassLoader classLoader, Properties properties) {
        URI managerURI = getManagerUri(uri);
        ClassLoader managerClassLoader = getManagerClassLoader(classLoader);

        synchronized (cacheManagers) {
            Map<URI, CacheManager> cacheManagersByURI = cacheManagers.computeIfAbsent(
                    managerClassLoader, any -> new HashMap<>());
            return cacheManagersByURI.computeIfAbsent(managerURI, any -> {
                Properties managerProperties = (properties == null) ? getDefaultProperties() : properties;
                return new RepositoryCacheManager(this, managerURI, managerClassLoader, managerProperties);
            });
        }
    }

    @Override
    public void close() {
        synchronized (cacheManagers) {
            for (ClassLoader classLoader : new ArrayList<>(cacheManagers.keySet())) {
                close(classLoader);
            }
        }
    }

    @Override
    public void close(ClassLoader classLoader) {
        synchronized (cacheManagers) {
            ClassLoader managerClassLoader = getManagerClassLoader(classLoader);
            Map<URI, CacheManager> cacheManagersByURI = cacheManagers.remove(managerClassLoader);
            if (cacheManagersByURI != null) {
                for (CacheManager cacheManager : cacheManagersByURI.values()) {
                    cacheManager.close();
                }
            }
        }
    }

    @Override
    public void close(URI uri, ClassLoader classLoader) {
        synchronized (cacheManagers) {
            ClassLoader managerClassLoader = getManagerClassLoader(classLoader);
            Map<URI, CacheManager> cacheManagersByURI = cacheManagers.get(managerClassLoader);

            if (cacheManagersByURI != null) {
                CacheManager cacheManager = cacheManagersByURI.remove(getManagerUri(uri));
                if (cacheManager != null) {
                    cacheManager.close();
                }
                if (cacheManagersByURI.isEmpty()) {
                    cacheManagers.remove(managerClassLoader);
                }
            }
        }
    }

    @Override
    public boolean isSupported(OptionalFeature optionalFeature) {
        return (optionalFeature == STORE_BY_REFERENCE);
    }

    private URI getManagerUri(URI uri) {
        return (uri == null) ? getDefaultURI() : uri;
    }

    private ClassLoader getManagerClassLoader(ClassLoader classLoader) {
        return (classLoader == null) ? getDefaultClassLoader() : classLoader;
    }
}
