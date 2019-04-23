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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.cache.api.repository.CacheFactory;
import com.mobi.cache.api.repository.jcache.config.RepositoryConfiguration;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryManager;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.net.URI;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Optional;
import java.util.Properties;
import javax.cache.Cache;
import javax.cache.CacheManager;
import javax.cache.configuration.CompleteConfiguration;
import javax.cache.spi.CachingProvider;

public class RespositoryCacheManagerTest {
    private static final String REPO_ID = "repoId";
    private static final String CACHE_NAME = "TestCache";

    private RepositoryCacheManager repositoryCacheManager;
    private RepositoryConfiguration<String, String> repositoryConfiguration;
    private URI providerURI;
    private Properties providerProperties;
    private ClassLoader providerClassLoader;

    @Mock
    private RepositoryCachingProvider repositoryCachingProvider;

    @Mock
    private CacheFactory<String, String> cacheFactory;

    @Mock
    private Cache<String, String> repoCache;

    @Mock
    private RepositoryManager repositoryManager;

    @Mock
    private Repository repository;

    @Before
    public void setUp() throws Exception {
        repositoryCacheManager = new RepositoryCacheManager();
        repositoryConfiguration = new RepositoryConfiguration<>(String.class, String.class, REPO_ID);
        providerURI = new URI(RepositoryCachingProvider.class.getName());
        providerProperties = new Properties();
        providerClassLoader = RepositoryCachingProvider.class.getClassLoader();

        MockitoAnnotations.initMocks(this);
        when(repositoryCachingProvider.getDefaultURI()).thenReturn(providerURI);
        when(repositoryCachingProvider.getDefaultProperties()).thenReturn(new Properties());
        when(repositoryCachingProvider.getDefaultClassLoader()).thenReturn(providerClassLoader);
        when(cacheFactory.getValueType()).thenReturn(String.class);
        when(cacheFactory.createCache(any(RepositoryConfiguration.class), any(CacheManager.class), any(Repository.class))).thenReturn(repoCache);
        when(repoCache.getConfiguration(eq(CompleteConfiguration.class))).thenReturn(repositoryConfiguration);
        when(repositoryManager.getRepository(eq(REPO_ID))).thenReturn(Optional.of(repository));

        repositoryCacheManager.setCachingProvider(repositoryCachingProvider);
        repositoryCacheManager.setRepositoryManager(repositoryManager);
        repositoryCacheManager.addCacheFactory(cacheFactory);
    }

    @Test
    public void getCachingProviderTest() {
        CachingProvider cachingProvider = repositoryCacheManager.getCachingProvider();
        assertTrue(cachingProvider instanceof RepositoryCachingProvider);
        assertEquals(repositoryCachingProvider, cachingProvider);
    }

    @Test
    public void getURITest() {
        URI uri = repositoryCacheManager.getURI();
        assertEquals(providerURI, uri);
    }

    @Test
    public void getClassLoaderTest() {
        ClassLoader classLoader = repositoryCacheManager.getClassLoader();
        assertEquals(providerClassLoader, classLoader);
    }

    @Test
    public void getPropertiesTest() {
        Properties properties = repositoryCacheManager.getProperties();
        assertEquals(providerProperties, properties);
    }

    @Test
    public void createCacheTest() {
        Cache<String, String> cache = repositoryCacheManager.createCache(CACHE_NAME, repositoryConfiguration);
        assertEquals(repoCache, cache);
    }

    @Test(expected = IllegalArgumentException.class)
    public void createCacheNullConfigTest() {
        Cache<String, String> cache = repositoryCacheManager.createCache(CACHE_NAME, null);
    }

    @Test
    public void getCacheWithCacheNameAndTypesTest() {
        repositoryCacheManager.createCache(CACHE_NAME, repositoryConfiguration);
        Cache<String, String> cache = repositoryCacheManager.getCache(CACHE_NAME, String.class, String.class);
        assertEquals(repoCache, cache);
    }

    @Test(expected = IllegalArgumentException.class)
    public void getCacheWithCacheNameNullAndTypesTest() {
        Cache<String, String> cache = repositoryCacheManager.getCache(null, String.class, String.class);
    }

    @Test(expected = IllegalArgumentException.class)
    public void getCacheWithCacheNameAndTypesKeyNullTest() {
        Cache<String, String> cache = repositoryCacheManager.getCache(CACHE_NAME, null, String.class);
    }

    @Test(expected = IllegalArgumentException.class)
    public void getCacheWithCacheNameAndTypesValueNullTest() {
        Cache<String, String> cache = repositoryCacheManager.getCache(CACHE_NAME, String.class, null);
    }

    @Test
    public void getCacheDoesNotExistWithCacheNameAndTypesTest() {
        Cache<String, String> cache = repositoryCacheManager.getCache(CACHE_NAME, String.class, String.class);
        assertNull(cache);
    }

    @Test(expected = ClassCastException.class)
    public void getCacheWithCacheNameAndTypesConfigurationKeyDoesNotMatchTest() {
        RepositoryConfiguration<Object, String> otherConfig = new RepositoryConfiguration<>(Object.class, String.class, REPO_ID);
        when(repoCache.getConfiguration(eq(CompleteConfiguration.class))).thenReturn(otherConfig);
        repositoryCacheManager.createCache(CACHE_NAME, repositoryConfiguration);

        Cache<String, String> cache = repositoryCacheManager.getCache(CACHE_NAME, String.class, String.class);
    }

    @Test(expected = ClassCastException.class)
    public void getCacheWithCacheNameAndTypesConfigurationValueDoesNotMatchTest() {
        RepositoryConfiguration<String, Object> otherConfig = new RepositoryConfiguration<>(String.class, Object.class, REPO_ID);
        when(repoCache.getConfiguration(eq(CompleteConfiguration.class))).thenReturn(otherConfig);
        repositoryCacheManager.createCache(CACHE_NAME, repositoryConfiguration);

        Cache<String, String> cache = repositoryCacheManager.getCache(CACHE_NAME, String.class, String.class);
    }

    @Test
    public void getCacheWithCacheNameTest() {
        repositoryCacheManager.createCache(CACHE_NAME, repositoryConfiguration);
        Cache<String, String> cache = repositoryCacheManager.getCache(CACHE_NAME);
        assertEquals(repoCache, cache);
    }

    @Test(expected = IllegalArgumentException.class)
    public void getCacheWithCacheNameNullTest() {
        Cache<String, String> cache = repositoryCacheManager.getCache(null);
    }

    @Test
    public void getCacheNamesEmptyTest() {
        Iterable<String> cacheNames = repositoryCacheManager.getCacheNames();
        assertFalse(cacheNames.iterator().hasNext());
    }

    @Test
    public void getCacheNamesOneTest() {
        repositoryCacheManager.createCache(CACHE_NAME, repositoryConfiguration);
        Iterable<String> cacheNames = repositoryCacheManager.getCacheNames();
        Iterator<String> it = cacheNames.iterator();
        assertTrue(it.hasNext());
        assertEquals(CACHE_NAME, it.next());
        assertFalse(it.hasNext());
    }

    @Test
    public void getCacheNamesMultipleTest() {
        repositoryCacheManager.createCache(CACHE_NAME, repositoryConfiguration);
        repositoryCacheManager.createCache("TestCache2", repositoryConfiguration);

        List<String> cacheNamesList = new ArrayList<>();
        for (String name : repositoryCacheManager.getCacheNames()) {
            cacheNamesList.add(name);
        }
        assertEquals(2, cacheNamesList.size());
        assertTrue(cacheNamesList.contains(CACHE_NAME));
        assertTrue(cacheNamesList.contains("TestCache2"));
    }

    @Test
    public void destroyCacheTest() {
        repositoryCacheManager.createCache(CACHE_NAME, repositoryConfiguration);
        repositoryCacheManager.destroyCache(CACHE_NAME);
        verify(repoCache).close();
    }

    @Test
    public void destroyCacheDoesNotExistTest() {
        repositoryCacheManager.destroyCache(CACHE_NAME);
        verify(repoCache, times(0)).close();
    }

    @Test
    public void closeTest() {
        repositoryCacheManager.createCache(CACHE_NAME, repositoryConfiguration);
        repositoryCacheManager.createCache("TestCache2", repositoryConfiguration);

        repositoryCacheManager.close();
        verify(repositoryCachingProvider).close(providerURI, providerClassLoader);
        verify(repoCache, times(2)).close();
    }

    @Test
    public void closeNoCachesTest() {
        repositoryCacheManager.close();
        verify(repositoryCachingProvider).close(providerURI, providerClassLoader);
        verify(repoCache, times(0)).close();
    }

    @Test
    public void closeAlreadyClosedTest() {
        repositoryCacheManager.close();
        repositoryCacheManager.close();
        verify(repositoryCachingProvider).close(providerURI, providerClassLoader);
    }

    @Test
    public void isClosedTest() {
        assertFalse(repositoryCacheManager.isClosed());
        repositoryCacheManager.close();
        assertTrue(repositoryCacheManager.isClosed());
    }
}
