package org.matonto.catalog.impl;

/*-
 * #%L
 * org.matonto.catalog.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.matonto.catalog.api.Distribution;
import org.matonto.catalog.api.PaginatedSearchParams;
import org.matonto.catalog.api.PaginatedSearchResults;
import org.matonto.catalog.api.PublishedResource;
import org.matonto.rdf.api.IRI;
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
    private IRI ONT_TYPE;
    private IRI MAPPING_TYPE;

    private static final int TOTAL_SIZE = 3;

    private static final String DC = "http://purl.org/dc/terms/";

    @Before
    public void setUp() throws Exception {
        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();

        publishedResource = vf.createIRI("http://matonto.org/test/PublishedResource/1");
        dist1IRI = vf.createIRI("http://matonto.org/test/Distribution/1");
        dist2IRI = vf.createIRI("http://matonto.org/test/Distribution/2");
        ONT_TYPE = vf.createIRI("http://matonto.org/ontologies/catalog#Ontology");
        MAPPING_TYPE = vf.createIRI("http://matonto.org/ontologies/catalog#Mapping");

        manager = new SimpleCatalogManager();
        manager.setRepository(repo);
        manager.setNamedGraphFactory(ngf);
        manager.setValueFactory(vf);
        manager.setModelFactory(mf);

        InputStream testData = getClass().getResourceAsStream("/testCatalogData.trig");

        RepositoryConnection conn = repo.getConnection();
        conn.add(Values.matontoModel(Rio.parse(testData, "", RDFFormat.TURTLE)));
        conn.close();

        Map<String, Object> props = new HashMap<>();
        props.put("title", "MatOnto Test Catalog");
        props.put("description", "This is a test catalog");
        props.put("iri", "http://matonto.org/test/catalog");

        manager.start(props);
    }

    @After
    public void tearDown() throws Exception {
        repo.shutDown();
    }

    /* Test getResource() */

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
        assertTrue(resource.getTypes().contains(vf.createIRI("http://matonto.org/ontologies/catalog#Ontology")));
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
    public void testGetResourceWithNoEntries() throws Exception {
        // given
        Repository repo2 = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo2.initialize();
        manager.setRepository(repo2);

        // when
        Optional<PublishedResource> resource = manager.getResource(vf.createIRI("http://test.com/123"));

        // then
        assertThat(resource, equalTo(Optional.empty()));
    }

    /* Test findResource() */

    @Test
    public void testFindResourcesReturnsCorrectDataFirstPage() throws Exception {
        // given
        int limit = 1;
        int offset = 0;
        IRI modified = vf.createIRI(DC + "modified");
        PaginatedSearchParams searchParams = new SimpleSearchParams.Builder(limit, offset, modified).build();

        // when
        PaginatedSearchResults<PublishedResource> resources = manager.findResource(searchParams);

        // then
        Assert.assertThat(resources.getPage().size(), equalTo(1));
        Assert.assertThat(resources.getTotalSize(), equalTo(TOTAL_SIZE));
        Assert.assertThat(resources.getPageSize(), equalTo(1));
        Assert.assertThat(resources.getPageNumber(), equalTo(1));
    }

    @Test
    public void testFindResourcesReturnsCorrectDataLastPage() throws Exception {
        // given
        int limit = 1;
        int offset = 1;
        IRI modified = vf.createIRI(DC + "modified");
        PaginatedSearchParams searchParams = new SimpleSearchParams.Builder(limit, offset, modified).build();

        // when
        PaginatedSearchResults<PublishedResource> resources = manager.findResource(searchParams);

        // then
        Assert.assertThat(resources.getPage().size(), equalTo(1));
        Assert.assertThat(resources.getTotalSize(), equalTo(TOTAL_SIZE));
        Assert.assertThat(resources.getPageSize(), equalTo(1));
        Assert.assertThat(resources.getPageNumber(), equalTo(2));
    }

    @Test
    public void testFindResourcesReturnsCorrectDataOnePage() throws Exception {
        // given
        int limit = 1000;
        int offset = 0;
        IRI modified = vf.createIRI(DC + "modified");
        PaginatedSearchParams searchParams = new SimpleSearchParams.Builder(limit, offset, modified).build();

        // when
        PaginatedSearchResults<PublishedResource> resources = manager.findResource(searchParams);

        // then
        Assert.assertThat(resources.getPage().size(), equalTo(TOTAL_SIZE));
        Assert.assertThat(resources.getTotalSize(), equalTo(TOTAL_SIZE));
        Assert.assertThat(resources.getPageSize(), equalTo(1000));
        Assert.assertThat(resources.getPageNumber(), equalTo(1));
    }

    @Test
    public void testFindResourcesOrdering() throws Exception {
        // given
        IRI modified = vf.createIRI(DC + "modified");
        IRI issued = vf.createIRI(DC + "issued");
        IRI title = vf.createIRI(DC + "title");

        int limit = 1;
        int offset = 0;
        PaginatedSearchParams searchParams1 = new SimpleSearchParams.Builder(limit, offset, modified).ascending(true).build();
        PaginatedSearchParams searchParams2 = new SimpleSearchParams.Builder(limit, offset, modified).ascending(false).build();
        PaginatedSearchParams searchParams3 = new SimpleSearchParams.Builder(limit, offset, issued).ascending(true).build();
        PaginatedSearchParams searchParams4 = new SimpleSearchParams.Builder(limit, offset, issued).ascending(false).build();
        PaginatedSearchParams searchParams5 = new SimpleSearchParams.Builder(limit, offset, title).ascending(true).build();
        PaginatedSearchParams searchParams6 = new SimpleSearchParams.Builder(limit, offset, title).ascending(false).build();

        // when
        PaginatedSearchResults<PublishedResource> resources1 = manager.findResource(searchParams1);
        PaginatedSearchResults<PublishedResource> resources2 = manager.findResource(searchParams2);
        PaginatedSearchResults<PublishedResource> resources3 = manager.findResource(searchParams3);
        PaginatedSearchResults<PublishedResource> resources4 = manager.findResource(searchParams4);
        PaginatedSearchResults<PublishedResource> resources5 = manager.findResource(searchParams5);
        PaginatedSearchResults<PublishedResource> resources6 = manager.findResource(searchParams6);

        // then
        Assert.assertThat(resources1.getPage().iterator().next().getResource().stringValue(), equalTo("http://matonto.org/test/PublishedResource/1"));
        Assert.assertThat(resources2.getPage().iterator().next().getResource().stringValue(), equalTo("http://matonto.org/test/PublishedResource/2"));
        Assert.assertThat(resources3.getPage().iterator().next().getResource().stringValue(), equalTo("http://matonto.org/test/PublishedResource/1"));
        Assert.assertThat(resources4.getPage().iterator().next().getResource().stringValue(), equalTo("http://matonto.org/test/PublishedResource/2"));
        Assert.assertThat(resources5.getPage().iterator().next().getResource().stringValue(), equalTo("http://matonto.org/test/PublishedResource/1"));
        Assert.assertThat(resources6.getPage().iterator().next().getResource().stringValue(), equalTo("http://matonto.org/test/PublishedResource/3"));
    }

    @Test
    public void testFindResourceWithNoEntries() throws Exception {
        // given
        Repository repo2 = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo2.initialize();
        manager.setRepository(repo2);

        int limit = 1;
        int offset = 0;
        IRI modified = vf.createIRI(DC + "modified");
        PaginatedSearchParams searchParams = new SimpleSearchParams.Builder(limit, offset, modified).build();

        // when
        PaginatedSearchResults<PublishedResource> resources = manager.findResource(searchParams);

        // then
        assertThat(resources.getPage().size(), equalTo(0));
        assertThat(resources.getTotalSize(), equalTo(0));
    }

    @Test
    public void testFindResourcesWithTypeFilter() throws Exception {
        // given
        int limit = 1000;
        int offset = 0;
        IRI modified = vf.createIRI(DC + "modified");
        PaginatedSearchParams ontSearchParams = new SimpleSearchParams.Builder(limit, offset, modified).typeFilter(ONT_TYPE).build();
        PaginatedSearchParams mappingSearchParams = new SimpleSearchParams.Builder(limit, offset, modified).typeFilter(MAPPING_TYPE).build();
        PaginatedSearchParams fullSearchParams = new SimpleSearchParams.Builder(limit, offset, modified).build();

        // when
        PaginatedSearchResults<PublishedResource> ontResources = manager.findResource(ontSearchParams);
        PaginatedSearchResults<PublishedResource> mappingResources = manager.findResource(mappingSearchParams);
        PaginatedSearchResults<PublishedResource> fullResources = manager.findResource(fullSearchParams);

        // then
        Assert.assertThat(ontResources.getPage().size(), equalTo(2));
        Assert.assertThat(ontResources.getTotalSize(), equalTo(2));

        Assert.assertThat(mappingResources.getPage().size(), equalTo(1));
        Assert.assertThat(mappingResources.getTotalSize(), equalTo(1));

        Assert.assertThat(fullResources.getPage().size(), equalTo(3));
        Assert.assertThat(fullResources.getTotalSize(), equalTo(3));
    }
}
