package org.matonto.ontology.core.impl.owlapi;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;

import org.matonto.ontology.core.api.Ontology;
import org.matonto.ontology.core.api.OntologyId;
import org.matonto.ontology.core.api.OntologyManager;
import org.openrdf.model.Model;
import org.openrdf.model.Resource;
import org.openrdf.model.impl.LinkedHashModel;
import org.openrdf.repository.Repository;
import org.openrdf.repository.RepositoryConnection;
import org.openrdf.repository.RepositoryException;
import org.openrdf.repository.RepositoryResult;
import org.openrdf.repository.http.HTTPRepository;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.sail.memory.MemoryStore;
import org.openrdf.model.URI;
import org.openrdf.model.impl.URIImpl;

import info.aduna.iteration.Iterations;
import org.semanticweb.owlapi.apibinding.OWLManager;
import org.semanticweb.owlapi.formats.OWLXMLDocumentFormat;
import org.semanticweb.owlapi.formats.RioRDFXMLDocumentFormatFactory;
import org.semanticweb.owlapi.model.IRI;
import org.semanticweb.owlapi.model.OWLDocumentFormat;
import org.semanticweb.owlapi.model.OWLOntology;
import org.semanticweb.owlapi.model.OWLOntologyCreationException;
import org.semanticweb.owlapi.model.OWLOntologyLoaderConfiguration;
import org.semanticweb.owlapi.model.OWLOntologyManager;
import org.semanticweb.owlapi.model.OWLOntologyStorageException;
import org.semanticweb.owlapi.rio.RioMemoryTripleSource;
import org.semanticweb.owlapi.rio.RioParserImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.common.base.Optional;

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Deactivate;
import aQute.bnd.annotation.component.Reference;



@Component (immediate=true)
public class SimpleOntologyManager implements OntologyManager {
	
	private static Repository repository;
	private static Optional<Map<OntologyId, String>> ontologyRegistry = Optional.fromNullable(new HashMap<>());
	private static String location;
	private static final Logger LOG = LoggerFactory.getLogger(SimpleOntologyManager.class);
	
	public SimpleOntologyManager() {}
	
    @Activate
    public void activate() 
    {
        LOG.info("Activating the SimpleOntologyManager");
        this.initOntologyRegistry();
    }
 
    @Deactivate
    public void deactivate() 
    {
        LOG.info("Deactivating the SimpleOntologyManger");
    }
    

	@Reference
	protected void setRepo(final Repository repo) 
	{
	    repository = repo;
	}
	
	protected void unsetRepo(final Repository repo) 
	{
	    repository = null;
	}
	
	
	
	@Override
	public Optional<Map<OntologyId, String>> getOntologyRegistry() 
	{
		return ontologyRegistry;
	}
	

	@Override
	public Ontology createOntology(OntologyId ontologyId) 
	{
		return new SimpleOntology(ontologyId);
	}


	@Override
	public Ontology createOntology(File file, OntologyId ontologyId) 
	{
		return new SimpleOntology(file, ontologyId);
	}


	@Override
	public Ontology createOntology(URL url, OntologyId ontologyId) 
	{
		return new SimpleOntology(url, ontologyId);
	}


	@Override
	public Ontology createOntology(InputStream inputStream, OntologyId ontologyId) 
	{	
		return new SimpleOntology(inputStream, ontologyId);
	}
	
	
	/**
	 * Checks if given context id exists in the repository, and returns true if it does.
	 * 
	 * @param Ontology id (Type: org.openrdf.model.Resource)
	 * @return True if given context id exists in the repository, or else false.
	 * @throws IllegalStateException - if the repository is null
	 */
	public boolean ontologyExists(OntologyId ontologyId)
	{
	   	if(repository == null)
	   		throw new IllegalStateException("Repository is null");
	   	
	   	else
	   		return ontologyRegistry.get().containsKey(ontologyId);
	}
	
	
	/**
	 * Retrieves Ontology object by ontology id from the repository, and returns an Optional with Ontology 
	 * object or an empty Optional instance if the ontology id is not found or any owlapi exception or sesame 
	 * exception is caught.   
	 * 
	 * @param ontology id (Type: org.openrdf.model.Resource) 
	 * @return an Optional with Ontology if ontology id is found, or an empty Optional instance if not found.
	 * @throws IllegalStateException - if the repository is null
	 */
	@Override
	public Optional<Ontology> retrieveOntology(OntologyId ontologyId) 
	{	
		if(repository == null)
			throw new IllegalStateException("Repository is null");
   	 
		if(!ontologyExists(ontologyId))
			return Optional.absent();

		SimpleOntology ontology = new SimpleOntology();
		OWLOntologyManager mgr = OWLManager.createOWLOntologyManager();
		OWLOntology onto = null;
		IRI iri = null;
		
		RepositoryConnection conn = null;
		
		try
		{		
			conn = repository.getConnection();
	    	Model model = Iterations.addAll(conn.getStatements(null, null, null, false, ontologyId.getContextId()), new LinkedHashModel());
				
	    	RioParserImpl parser = new RioParserImpl(new RioRDFXMLDocumentFormatFactory());
	    	onto = mgr.createOntology();
	    	parser.parse(new RioMemoryTripleSource(model), onto, new OWLOntologyLoaderConfiguration());
			    
	    	OWLDocumentFormat format = mgr.getOntologyFormat(onto);
	    	OWLXMLDocumentFormat owlxmlFormat = new OWLXMLDocumentFormat();
	    		 
	    	if (format.isPrefixOWLOntologyFormat())  
	    		owlxmlFormat.copyPrefixesFrom(format.asPrefixOWLOntologyFormat()); 
	    		 
	    	File tempFile = File.createTempFile("tempfile", ".owl");
			tempFile.deleteOnExit();
			iri = IRI.create(tempFile.toURI());

	    	mgr.saveOntology(onto, owlxmlFormat, iri);

		} catch (OWLOntologyStorageException e) {
			e.printStackTrace();
			return Optional.absent();
		} catch (OWLOntologyCreationException e) {
			e.printStackTrace();
			return Optional.absent();
		} catch (IOException e) {
			e.printStackTrace();
			return Optional.absent();
		} catch (RepositoryException e) {
			e.printStackTrace();
			return Optional.absent();
		} finally {
			try {
				if(conn != null)
	    			conn.close();
			} catch (RepositoryException e) {
				e.printStackTrace();
			}
		}
		
		ontology.setOntologyId(ontologyId);
		ontology.setOntology(onto);
		ontology.setOwlapiOntologyManager(mgr);
		ontology.setIRI(SimpleIRI.matontoIRI(iri));
		ontology.setAnnotations();
		ontology.setDirectImportsDocuments();
		ontology.setAxioms();
		return Optional.of(ontology);
	}

	
	
	/**
	 * Persists Ontology object in the repository, and returns true if successfully persisted
	 * 
	 * @param Ontology object
	 * @return True if successfully persisted, or false if ontology Id already exists in the repository or
	 * if an owlapi exception or sesame exception is caught.
	 * @throws IllegalStateException - if the repository is null
	 */
	@Override
	public boolean storeOntology(Ontology ontology) 
	{
		if(repository == null)
			throw new IllegalStateException("Repository is null");
   	 
		OntologyId ontologyId = ontology.getOntologyId();
		if(ontologyExists(ontologyId))
			return false;
		
		boolean persisted = false;
		RepositoryConnection conn = null;
		
		try
		{		
			conn = repository.getConnection();
			Model model = ontology.asModel();
			conn.add(model, ontologyId.getContextId());
			ontologyRegistry.get().put(ontologyId, location);
			persisted = true;
			
		} catch (RepositoryException e) {
			e.printStackTrace();
			return persisted;
		} finally {
			try {
				if(conn != null)
	    			conn.close();
			} catch (RepositoryException e) {
				e.printStackTrace();
				return persisted;
			}
		}
		
		return persisted;
	}

	
	
	/**
	 * Deletes named graph in the repository with given context id, and returns true if successfully removed.
	 * 
	 * @param Ontology id (Type: org.openrdf.model.Resource)
	 * @return True if the name graph with given context id is successfully deleted, or false if ontology Id 
	 * does not exist in the repository or if an owlapi exception or sesame exception is caught.
	 * @throws IllegalStateException - if the repository is null
	 */
	@Override
	public boolean deleteOntology(OntologyId ontologyId)
	{
		if(repository == null)
			throw new IllegalStateException("Repository is null");
		
		boolean deleted = false;
		if(!ontologyExists(ontologyId))
			return false;
		
		RepositoryConnection conn = null;
		
		try
		{		
			conn = repository.getConnection();
			//Execute Update query 
			conn.clear(ontologyId.getContextId());
			ontologyRegistry.get().remove(ontologyId, location);
			deleted = true;
			
		} catch (RepositoryException e) {
			e.printStackTrace();
			return deleted;
		} finally {
			try {
				if(conn != null)
	    			conn.close();
			} catch (RepositoryException e) {
				e.printStackTrace();
				return deleted;
			}
		}
		
		return deleted;
	}
	

	/**
	 * The ontology registry facilitates the list of the association of ontologies 
	 * stored in different repositories. When the registry is initialized (loaded) when
	 * an instance of SimpleOntologyManager is created.  
	 * 
	 * @throws IllegalStateException - if the repository is null
	 */
	private void initOntologyRegistry()
	{
		LOG.info("Initiating the ontology registry");
		
		if(repository == null)
			throw new IllegalStateException("Repository is null");
		
		if(repository instanceof HTTPRepository)
			location = ((HTTPRepository) repository).getRepositoryURL();
		else {
			if(repository.getDataDir() != null)
				location = repository.getDataDir().getAbsolutePath();
			else
				location = "default in-memory store";
		}
		
		RepositoryConnection conn = null;
		RepositoryResult<Resource> contextIds = null;
		
		Map<OntologyId, String> ontologyMap = new HashMap<>();
		
		try
		{		
			conn = repository.getConnection();
			contextIds = conn.getContextIDs();
			
			while (contextIds.hasNext()) {
				Resource contextId = contextIds.next();
			    ontologyMap.put(createOntologyId(contextId), location);
			}
			
			ontologyRegistry = Optional.of(ontologyMap);
				
		} catch (RepositoryException e) {
			e.printStackTrace();

		} finally {
			try {
				if(contextIds != null) 
	            	contextIds.close();
	    		if(conn != null)
	    			conn.close();
			} catch (RepositoryException e) {
				e.printStackTrace();
			}
		}
		
	}
	
	
	public OntologyId createOntologyId(Resource contextId)
	{
		return new SimpleOntologyId(contextId);
	}
	
	
	public static void main(String [] args)
	{
		SimpleOntologyManager manager = new SimpleOntologyManager();
		Repository repo = null;
		try {
			repo = new SailRepository(new MemoryStore());
			repo.initialize();

		} catch (RepositoryException e) {
			e.printStackTrace();
		}
		manager.setRepo(repo);
		
		URI fileId = new URIImpl("http://www.matonto.org/samples#Travel");
		OntologyId ontologyId = manager.createOntologyId(fileId);
		Ontology onto = new SimpleOntology();
//		File file = new File("/Users/joyas/workspace/MatOnto/matonto/org.matonto.ontology.core/src/test/resources/travel.owl");
		File file = new File("/Users/joyas/Documents/travel.owl");
		onto.importOntology(file, ontologyId);
		boolean stored = manager.storeOntology(onto);
		System.out.println(stored);
	}

	
}
