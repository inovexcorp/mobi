package org.matonto.ontology.utils.cache.impl;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anySetOf;
import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.doCallRealMethod;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.Before;
import org.junit.Test;
import org.matonto.cache.api.CacheManager;
import org.matonto.ontology.core.api.Ontology;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
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
    private Resource branchId = vf.createIRI("http://test.com/branch");
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

        key = service.generateKey(recordId.stringValue(), branchId.stringValue(), null);
        when(cache.iterator()).thenReturn(it);
        when(it.hasNext()).thenReturn(true, false);
        when(it.next()).thenReturn(entry);
        when(entry.getKey()).thenReturn(key);
        when(entry.getValue()).thenReturn(ontology);
    }

    @Test
    public void generateKeyTest() throws Exception {
        assertEquals("test&test&test", service.generateKey("test", "test", "test"));
        assertEquals("test&test&null", service.generateKey("test", "test", null));
        assertEquals("test&null&null", service.generateKey("test", null, null));
        assertEquals("null&null&null", service.generateKey(null, null, null));
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
    public void clearCacheWithBothIdsAndHitTest() throws Exception {
        service.clearCache(recordId, branchId);
        verify(cache).remove(key);
    }

    @Test
    public void clearCacheWithBothIdsAndMissTest() throws Exception {
        service.clearCache(recordId, vf.createIRI("http://test.com/missing"));
        verify(cache, times(0)).remove(anyString());
    }

    /*@Test
    public void clearCacheWithOnlyRecordTest() throws Exception {
        service.clearCache(recordId, null);
        verify(cache).remove(key);
    }*/

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
}
