package org.matonto.ontology.core.impl.owlapi;

import static org.junit.Assert.*;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Optional;

import org.junit.BeforeClass;
import org.junit.Rule;
import org.junit.Test;
import org.matonto.ontology.core.api.Ontology;
import org.matonto.ontology.core.api.OntologyId;
import org.matonto.ontology.core.utils.MatontoOntologyException;
import org.matonto.ontology.core.impl.owlapi.ResourceFile;
import org.openrdf.repository.Repository;
import org.openrdf.repository.RepositoryException;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.sail.memory.MemoryStore;


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
    public void testStoreOntology() throws MatontoOntologyException, IOException 
    {
    	OntologyId id1 = manager.createOntologyId(manager.createOntologyIRI("http://protege.cim3.net/file/pub/ontologies/travel#travel"));
    	URL url = new URL("http://protege.cim3.net/file/pub/ontologies/travel/travel.owl");
    	SimpleOntology ontology1 = null;
    	boolean stored1 = false;
    	try {
			ontology1 = new SimpleOntology(url.openStream(), id1);
			stored1 = manager.storeOntology(ontology1);
    	} catch (MalformedURLException e) {
    		System.out.println("Malformed URL Exception caught");
		}
    	
    	
    	OntologyId id2 = manager.createOntologyId(manager.createOntologyIRI(ttlRes.getContextId()));
    	SimpleOntology ontology2 = null;
    	boolean stored2 = false;
    	try {
			ontology2 = new SimpleOntology(ttlRes.getFile(), id2);
			stored2 = manager.storeOntology(ontology2);
		} catch (IOException e) {
			e.printStackTrace();
		} 
  
    	assertNotNull(ontology1);
    	assertTrue(manager.ontologyExists(id1));
    	assertNotNull(ontology2);
    	assertTrue(manager.ontologyExists(id2));

    	
		Optional<Ontology> ontology4 = manager.retrieveOntology(id1);
		Optional<Ontology> ontology5 = manager.retrieveOntology(id2);
		if(!ontology4.isPresent())
			System.out.println("ontology is empty");
		else {
			System.out.println(ontology4.get().asOwlXml());
			System.out.println("-------------------------------------------------------------------------------------------------------");
			System.out.println("-------------------------------------------------------------------------------------------------------");
			System.out.println("-------------------------------------------------------------------------------------------------------");
			System.out.println(ontology4.get().asRdfXml());
			System.out.println("-------------------------------------------------------------------------------------------------------");
			System.out.println("-------------------------------------------------------------------------------------------------------");
			System.out.println("-------------------------------------------------------------------------------------------------------");
			System.out.println(ontology4.get().asTurtle());
			System.out.println("-------------------------------------------------------------------------------------------------------");
			System.out.println("-------------------------------------------------------------------------------------------------------");
			System.out.println("-------------------------------------------------------------------------------------------------------");
			System.out.println(ontology4.get().asJsonLD());
		}


		assertNotEquals(Optional.empty(), ontology4);
		assertNotEquals(Optional.empty(), ontology5);

		boolean result1 = manager.deleteOntology(id1);
		Optional<Ontology> ontology = manager.retrieveOntology(id1);

		assertTrue(result1);
		assertFalse(manager.ontologyExists(id1));
		assertEquals(Optional.empty(), ontology);
    }
}
