package com.mobi.ontology.utils.cache.impl;

/*-
 * #%L
 * com.mobi.ontology.utils
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.cache.api.CacheManager;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.impl.sesame.SimpleValueFactory;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Collections;
import java.util.Iterator;
import java.util.Optional;
import javax.cache.Cache;

public class OntologyCacheImplTest {
    private OntologyCacheImpl service;
    private ValueFactory vf = SimpleValueFactory.getInstance();

    private Resource recordId = vf.createIRI("http://test.com/record");
    private IRI ontologyIRI = vf.createIRI("http://test.com/ontology");
    private String key;

    @Mock
    private CacheManager cacheManager;

    @Mock
    private Cache<String, Ontology> cache;

    @Mock
    private Iterator<Cache.Entry<String, Ontology>> it;

    @Mock
    private Cache.Entry<String, Ontology> entry;

    @Mock
    private Ontology ontology;

    @Before
    public void setUp() throws Exception {
        MockitoAnnotations.initMocks(this);
        when(cacheManager.getCache(anyString(), eq(String.class), eq(Ontology.class))).thenReturn(Optional.of(cache));
        when(ontology.getImportedOntologyIRIs()).thenReturn(Collections.singleton(ontologyIRI));

        service = new OntologyCacheImpl();
        service.setCacheManager(cacheManager);

        key = service.generateKey(recordId.stringValue(), null);
        when(cache.iterator()).thenReturn(it);
        when(it.hasNext()).thenReturn(true, false);
        when(it.next()).thenReturn(entry);
        when(entry.getKey()).thenReturn(key);
        when(entry.getValue()).thenReturn(ontology);
    }

    @Test
    public void generateKeyTest() throws Exception {
        assertEquals("test&test", service.generateKey("test", "test"));
        assertEquals("test&null", service.generateKey("test", null));
        assertEquals("null&null", service.generateKey(null, null));
    }

    @Test
    public void getOntologyCacheTest() throws Exception {
        Optional<Cache<String, Ontology>> result = service.getOntologyCache();
        assertTrue(result.isPresent());
        assertEquals(cache, result.get());

        service.setCacheManager(null);
        result = service.getOntologyCache();
        assertFalse(result.isPresent());
    }

    @Test
    public void clearCacheAndHitTest() throws Exception {
        service.clearCache(recordId);
        verify(cache).remove(key);
    }

    @Test
    public void clearCacheAndMissTest() throws Exception {
        service.clearCache(vf.createIRI("http://test.com/missing"));
        verify(cache, times(0)).remove(anyString());
    }

    @Test
    public void clearCacheImportsWithHitTest() throws Exception {
        service.clearCacheImports(ontologyIRI);
        verify(cache).removeAll(Collections.singleton(key));
    }

    @Test
    public void clearCacheImportsWithMissTest() throws Exception {
        service.clearCacheImports(vf.createIRI("http://test.com/missing"));
        verify(cache).removeAll(Collections.emptySet());
    }

    @Test
    public void removeFromCacheTest() throws Exception {
        when(cache.containsKey(anyString())).thenReturn(true);
        service.removeFromCache("test", "test");
        verify(cache).containsKey("test&test");
        verify(cache).remove("test&test");
    }

    @Test
    public void removeFromCacheWhenNotContained() throws Exception {
        when(cache.containsKey(anyString())).thenReturn(false);
        service.removeFromCache("test", "test");
        verify(cache).containsKey("test&test");
        verify(cache, times(0)).remove("test&test");
    }
}
