package org.matonto.catalog.impl;

import org.junit.Before;
import org.junit.Test;
import org.matonto.catalog.api.Ontology;
import org.matonto.catalog.api.PublishedResource;
import org.matonto.query.TupleQueryResult;
import org.matonto.query.api.BindingSet;
import org.matonto.query.api.TupleQuery;
import org.matonto.rdf.api.*;
import org.matonto.rdf.core.impl.sesame.LinkedHashNamedGraphFactory;
import org.matonto.rdf.core.impl.sesame.SimpleIRI;
import org.matonto.rdf.core.utils.Values;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.base.RepositoryResult;
import org.matonto.repository.impl.sesame.query.SesameBindingSet;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.openrdf.model.ValueFactory;
import org.openrdf.model.impl.SimpleValueFactory;
import org.openrdf.model.vocabulary.RDF;
import org.openrdf.query.impl.MapBindingSet;

import java.time.OffsetDateTime;
import java.util.*;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertTrue;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

public class SimpleCatalogManagerTest {

    @Mock
    Repository repo;

    @Mock
    RepositoryConnection conn;

    @Mock
    TupleQuery query;

    @Mock
    TupleQueryResult result;

    @Mock
    RepositoryResult<Statement> repositoryResult;

    private SimpleCatalogManager manager;

    @Before
    public void setUp() {
        MockitoAnnotations.initMocks(this);

        manager = new SimpleCatalogManager();
        manager.setRepo(repo);

        when(repo.getConnection()).thenReturn(conn);
        when(conn.prepareTupleQuery(anyString())).thenReturn(query);
        when(query.evaluate()).thenReturn(result);
    }

    @Test
    public void testMissingResource() throws Exception {
        // given
        // when
        Optional<PublishedResource> optional = manager.getResource(mock(IRI.class));

        // then
        assertEquals(Optional.empty(), optional);
    }

    @Test
    public void testExistingResourceWithNoOptionals() throws Exception {
        // given
        IRI existingResource = mock(IRI.class);
        GregorianCalendar issued = new GregorianCalendar(2016, 1, 1);
        GregorianCalendar modified = new GregorianCalendar(2016, 1, 2);

        ValueFactory valueFactory = SimpleValueFactory.getInstance();
        MapBindingSet sesameBindingSet = new MapBindingSet();
        sesameBindingSet.addBinding("title", valueFactory.createLiteral("Test Resource"));
        sesameBindingSet.addBinding("type", valueFactory.createIRI("http://matonto.org/ontologies/catalog#Ontology"));
        sesameBindingSet.addBinding("issued", valueFactory.createLiteral(issued.getTime()));
        sesameBindingSet.addBinding("modified", valueFactory.createLiteral(modified.getTime()));
        BindingSet bindingSet = new SesameBindingSet(sesameBindingSet);

        // when
        when(result.hasNext()).thenReturn(true);
        when(result.next()).thenReturn(bindingSet);

        Optional<PublishedResource> optional = manager.getResource(existingResource);

        // then
        assertNotEquals(Optional.empty(), optional);

        PublishedResource resource = optional.get();

        assertEquals("Test Resource", resource.getTitle());
        assertEquals("http://matonto.org/ontologies/catalog#Ontology", resource.getType().stringValue());
        assertEquals(issued.toZonedDateTime().toOffsetDateTime(), resource.getIssued());
        assertEquals(modified.toZonedDateTime().toOffsetDateTime(), resource.getModified());
    }

    @Test
    public void testExistingResourceWithOptionals() throws Exception {
        // given
        IRI existingResource = mock(IRI.class);
        GregorianCalendar issued = new GregorianCalendar(2016, 1, 1);
        GregorianCalendar modified = new GregorianCalendar(2016, 1, 2);

        ValueFactory valueFactory = SimpleValueFactory.getInstance();
        MapBindingSet sesameBindingSet = new MapBindingSet();
        sesameBindingSet.addBinding("title", valueFactory.createLiteral("Test Resource"));
        sesameBindingSet.addBinding("type", valueFactory.createIRI("http://matonto.org/ontologies/catalog#Ontology"));
        sesameBindingSet.addBinding("issued", valueFactory.createLiteral(issued.getTime()));
        sesameBindingSet.addBinding("modified", valueFactory.createLiteral(modified.getTime()));
        sesameBindingSet.addBinding("description", valueFactory.createLiteral("Test Description"));
        sesameBindingSet.addBinding("identifier", valueFactory.createLiteral("Test Identifier"));
        sesameBindingSet.addBinding("keyword", valueFactory.createLiteral("Test,Keywords"));
        BindingSet bindingSet = new SesameBindingSet(sesameBindingSet);

        // when
        when(result.hasNext()).thenReturn(true);
        when(result.next()).thenReturn(bindingSet);

        Optional<PublishedResource> optional = manager.getResource(existingResource);

        // then
        assertTrue(optional.isPresent());
        PublishedResource resource = optional.get();

        assertEquals("Test Resource", resource.getTitle());
        assertEquals("http://matonto.org/ontologies/catalog#Ontology", resource.getType().stringValue());
        assertEquals(issued.toZonedDateTime().toOffsetDateTime(), resource.getIssued());
        assertEquals(modified.toZonedDateTime().toOffsetDateTime(), resource.getModified());
        assertEquals("Test Description", resource.getDescription());
        assertEquals("Test Identifier", resource.getIdentifier());

        Set<String> expectedKeywords = new HashSet<>();
        expectedKeywords.add("Test");
        expectedKeywords.add("Keywords");

        assertEquals(expectedKeywords, resource.getKeywords());
    }

    @Test
    public void testCreateOntologyWithoutDistribution() throws Exception {
        // given
        String dc = "http://purl.org/dc/elements/1.1/";
        Ontology ontology = mock(Ontology.class);
        IRI ontologyIri = new SimpleIRI("http://matonto.org/catalog/1");
        NamedGraphFactory ngf = LinkedHashNamedGraphFactory.getInstance();
        manager.setNamedGraphFactory(ngf);
        org.matonto.rdf.api.ValueFactory vf = org.matonto.rdf.core.impl.sesame.SimpleValueFactory.getInstance();
        manager.setValueFactory(vf);
        OffsetDateTime now = OffsetDateTime.now();

        // when
        when(conn.getStatements(any(), any(), any(), any())).thenReturn(repositoryResult);
        when(repositoryResult.hasNext()).thenReturn(false);

        when(ontology.getResource()).thenReturn(ontologyIri);
        when(ontology.getType()).thenReturn(new SimpleIRI("http://matonto.org/ontologies/catalog#Ontology"));
        when(ontology.getTitle()).thenReturn("MatOnto Catalog");
        when(ontology.getDescription()).thenReturn("Catalog of MatOnto Resources");
        when(ontology.getIssued()).thenReturn(now);
        when(ontology.getModified()).thenReturn(now);

        manager.createOntology(ontology);

        // then
        NamedGraph expectedGraph = ngf.createNamedGraph(ontologyIri);
        expectedGraph.add(ontologyIri, Values.matontoIRI(RDF.TYPE), vf.createIRI("http://matonto.org/ontologies/catalog#Ontology"));
        expectedGraph.add(ontologyIri, vf.createIRI(dc + "title"), vf.createLiteral("MatOnto Catalog"));
        expectedGraph.add(ontologyIri, vf.createIRI(dc + "description"), vf.createLiteral("Catalog of MatOnto Resources"));
        expectedGraph.add(ontologyIri, vf.createIRI(dc + "issued"), vf.createLiteral(now));
        expectedGraph.add(ontologyIri, vf.createIRI(dc + "modified"), vf.createLiteral(now));

        System.out.println(expectedGraph.toString());

        ArgumentCaptor<NamedGraph> argument = ArgumentCaptor.forClass(NamedGraph.class);
        verify(conn).add(argument.capture());

        NamedGraph actualGraph = argument.getValue();
        try {
            assertEquals(expectedGraph, actualGraph);
        } catch (AssertionError e) {
            // Print contents to aid in fix
            expectedGraph.forEach(System.out::println);
            actualGraph.forEach(System.out::println);
            throw e;
        }
    }
}
