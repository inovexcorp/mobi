package org.matonto.ontology.core.impl.owlapi;

import org.junit.BeforeClass;
import org.junit.Rule;
import org.junit.Test;
import org.matonto.ontology.core.api.Ontology;
import org.matonto.ontology.core.api.OntologyId;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.openrdf.repository.Repository;
import org.openrdf.repository.RepositoryException;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.sail.memory.MemoryStore;
import java.net.URL;
import java.util.Optional;
import static org.junit.Assert.*;


public class SimpleOntologyManagerTest 
{
	static Repository repo;
	static SimpleOntologyManager manager = new SimpleOntologyManager();
	static Values values = new Values();
	static ValueFactory factory = SimpleValueFactory.getInstance();

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
		manager.setValueFactory(factory);
		values.setManager(manager);
		values.setValueFactory(factory);
		
	}
    
    @Test 
    public void testStoreOntology() throws Exception {
    	OntologyId id1 = manager.createOntologyId(manager.createOntologyIRI("http://protege.cim3.net/file/pub/ontologies/travel#travel"));
    	URL url = new URL("http://protege.cim3.net/file/pub/ontologies/travel/travel.owl");
    	SimpleOntology ontology1 = new SimpleOntology(url.openStream(), id1);
		manager.storeOntology(ontology1);

    	OntologyId id2 = manager.createOntologyId(manager.createOntologyIRI(ttlRes.getContextId()));
    	SimpleOntology ontology2 = new SimpleOntology(ttlRes.getFile(), id2);
		manager.storeOntology(ontology2);

    	assertNotNull(ontology1);
    	assertTrue(manager.ontologyExists(id1));
    	assertNotNull(ontology2);
    	assertTrue(manager.ontologyExists(id2));

		Optional<Ontology> ontology4 = manager.retrieveOntology(id1);
		Optional<Ontology> ontology5 = manager.retrieveOntology(id2);

		assertTrue(ontology4.isPresent());
        assertTrue(ontology5.isPresent());

        assertTrue(ontology4.get().asOwlXml() != null);
        assertTrue(ontology4.get().asRdfXml() != null);
        assertTrue(ontology4.get().asTurtle() != null);
        assertTrue(ontology4.get().asJsonLD() != null);

		boolean result1 = manager.deleteOntology(id1);
		Optional<Ontology> ontology = manager.retrieveOntology(id1);

		assertTrue(result1);
		assertFalse(manager.ontologyExists(id1));
		assertFalse(ontology.isPresent());
    }
}
