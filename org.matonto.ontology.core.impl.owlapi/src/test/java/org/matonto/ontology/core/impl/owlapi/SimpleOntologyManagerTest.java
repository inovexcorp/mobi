package org.matonto.ontology.core.impl.owlapi;

import static org.junit.Assert.*;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;

import org.junit.BeforeClass;
import org.junit.Rule;
import org.junit.Test;
import org.matonto.ontology.core.api.Ontology;
import org.matonto.ontology.core.api.OntologyId;
import org.openrdf.model.Resource;
import org.openrdf.model.URI;
import org.openrdf.model.impl.URIImpl;
import org.openrdf.repository.Repository;
import org.openrdf.repository.RepositoryException;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.sail.memory.MemoryStore;

import com.google.common.base.Optional;

public class SimpleOntologyManagerTest 
{
	static Repository repo;
	static SimpleOntologyManager manager = new SimpleOntologyManager();

	@Rule
    public ResourceFile bookRes = new ResourceFile("/Book.owl");
	
	@Rule
    public ResourceFile travelRes = new ResourceFile("/travel.owl");
	
	@Rule
    public ResourceFile ttlRes = new ResourceFile("/matonto-release-2014.ttl");

	@BeforeClass
	public static void beforeAll() {
		try {
			repo = new SailRepository(new MemoryStore());
			repo.initialize();

		} catch (RepositoryException e) {
			e.printStackTrace();
		}
		manager.setRepo(repo);
	}
    
    @Test 
    public void testStoreOntology() 
    {
    	URI contextId = new URIImpl("http://protege.cim3.net/file/pub/ontologies/travel#travel");
    	SimpleOntology ontology1 = null;
    	boolean stored1 = false;
    	try {
			ontology1 = new SimpleOntology(new URL("http://protege.cim3.net/file/pub/ontologies/travel/travel.owl"), manager.createOntologyId(contextId));
			stored1 = manager.storeOntology(ontology1);
    	} catch (MalformedURLException e) {
    		System.out.println("Malformed URL Exception caught");
		}
    	OntologyId ontologyId1 = ontology1.getOntologyId();
    	
    	
    	SimpleOntology ontology2 = null;
    	boolean stored2 = false;
    	try {
			ontology2 = new SimpleOntology(ttlRes.getFile(), manager.createOntologyId(ttlRes.getContextId()));
			stored2 = manager.storeOntology(ontology2);
		} catch (IOException e) {
			e.printStackTrace();
		} 
    	OntologyId ontologyId2 = ontology2.getOntologyId();
    	
    	
//    	SimpleOntology ontology3 = null;
//    	boolean stored3 = false;
//    	try {
//			ontology3 = new SimpleOntology(bookRes.getFile(), SimpleOntologyManager.createOntologyId(bookRes.getOntologyIdentifier()));
//			stored3 = manager.storeOntology(ontology3);
//		} catch (IOException e) {
//			e.printStackTrace();
//		} 
//    	SimpleOntologyId ontologyId3 = ontology3.getOntologyId();
    	
    	
    	assertNotNull(ontology1);
    	assertTrue(manager.ontologyExists(ontologyId1));
    	assertNotNull(ontology2);
    	assertTrue(manager.ontologyExists(ontologyId2));
//    	assertNotNull(ontology3);
//    	assertTrue(manager.ontologyExists(ontologyId3));

		URI contextId2 = new URIImpl("http://protege.cim3.net/file/pub/ontologies/travel#travel");

		Optional<Ontology> ontology4 = manager.retrieveOntology(manager.createOntologyId(contextId2));

		Optional<Ontology> ontology5 = manager.retrieveOntology(manager.createOntologyId(ttlRes.getContextId()));

//		Optional<Ontology> ontology6 = manager.retrieveOntology(SimpleOntologyManager.createOntologyId(bookRes.getOntologyIdentifier()));

		assertNotEquals(Optional.absent(), ontology4);
		assertNotEquals(Optional.absent(), ontology5);
//		assertNotEquals(Optional.absent(), ontology6);

		URI uri = new URIImpl("http://protege.cim3.net/file/pub/ontologies/travel#travel");
		OntologyId contextId1 = manager.createOntologyId(uri);
		boolean result1 = manager.deleteOntology(contextId1);
		Optional<Ontology> ontology = manager.retrieveOntology(contextId1);

		assertTrue(result1);
		assertFalse(manager.ontologyExists(contextId1));
		assertEquals(Optional.absent(), ontology);
    }
}
