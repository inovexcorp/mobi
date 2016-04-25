package org.matonto.catalog.impl;

import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.matonto.catalog.api.Distribution;
import org.matonto.catalog.api.PublishedResource;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.NamedGraphFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory;
import org.matonto.rdf.core.impl.sesame.LinkedHashNamedGraphFactory;
import org.matonto.rdf.core.utils.Values;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.impl.sesame.SesameRepositoryWrapper;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.openrdf.sail.memory.MemoryStore;

import java.io.InputStream;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.*;

import static junit.framework.TestCase.assertEquals;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.equalTo;
import static org.junit.Assert.assertTrue;

public class SimpleCatalogManagerFullTest {

    private Repository repo;
    private SimpleCatalogManager manager;
    private NamedGraphFactory ngf = LinkedHashNamedGraphFactory.getInstance();
    private org.matonto.rdf.api.ValueFactory vf = org.matonto.rdf.core.impl.sesame.SimpleValueFactory.getInstance();
    private ModelFactory mf = LinkedHashModelFactory.getInstance();

    private Resource publishedResource;
    private Resource dist1IRI;
    private Resource dist2IRI;

    @Before
    public void setUp() throws Exception {
        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();

        publishedResource = vf.createIRI("http://matonto.org/test/PublishedResource/1");
        dist1IRI = vf.createIRI("http://matonto.org/test/Distribution/1");
        dist2IRI = vf.createIRI("http://matonto.org/test/Distribution/2");

        manager = new SimpleCatalogManager();
        manager.setRepo(repo);
        manager.setNamedGraphFactory(ngf);
        manager.setValueFactory(vf);
        manager.setModelFactory(mf);

        InputStream testData = getClass().getResourceAsStream("/testCatalogData.trig");

        RepositoryConnection conn = repo.getConnection();
        conn.add(Values.matontoModel(Rio.parse(testData, "", RDFFormat.TURTLE)));
        conn.close();
    }

    @After
    public void tearDown() throws Exception {
        repo.shutDown();
    }

    @Test
    public void testGetExistingResourceWithOptionals() throws Exception {
        // given
        OffsetDateTime issued = OffsetDateTime.of(2016, 1, 1, 0, 0, 0, 0, ZoneOffset.UTC);
        OffsetDateTime modified = OffsetDateTime.of(2016, 1, 2, 0, 0, 0, 0, ZoneOffset.UTC);

        // when
        Optional<PublishedResource> optional = manager.getResource(publishedResource);

        // then
        assertTrue(optional.isPresent());
        PublishedResource resource = optional.get();

        assertEquals("Test Resource 1", resource.getTitle());
        assertEquals("http://matonto.org/ontologies/catalog#Ontology", resource.getType().stringValue());
        assertEquals(issued, resource.getIssued());
        assertEquals(modified, resource.getModified());
        assertEquals("Test Description", resource.getDescription());
        assertEquals("Test Identifier", resource.getIdentifier());

        Set<String> expectedKeywords = new HashSet<>();
        expectedKeywords.add("Test");
        expectedKeywords.add("Keywords");

        assertEquals(expectedKeywords, resource.getKeywords());

        Distribution expectedDist1 = new SimpleDistribution.Builder(dist1IRI, "Test Distribution 1")
                .issued(issued)
                .modified(modified)
                .build();
        Distribution expectedDist2 = new SimpleDistribution.Builder(dist2IRI, "Test Distribution 2")
                .issued(issued)
                .modified(modified)
                .build();

        Set<Distribution> actualDistributions = resource.getDistributions();

        assertEquals(2, actualDistributions.size());
        assertThat(actualDistributions, containsInAnyOrder(expectedDist1, expectedDist2));
    }

    @Test
    public void testFindResourcesReturnsCorrectSize() throws Exception {
        // given
        // when
        Set<PublishedResource> resources = manager.findResource("", 1, 0);

        // then
        Assert.assertThat(resources.size(), equalTo(1));
    }
}
