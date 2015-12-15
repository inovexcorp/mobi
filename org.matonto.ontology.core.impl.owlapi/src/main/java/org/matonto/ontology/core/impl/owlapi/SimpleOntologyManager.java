package org.matonto.ontology.core.impl.owlapi;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.Ontology;
import org.matonto.ontology.core.api.OntologyId;
import org.matonto.ontology.core.api.OntologyManager;
import org.matonto.ontology.core.utils.MatontoOntologyException;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.ValueFactory;
import org.openrdf.model.Model;
import org.openrdf.model.Resource;
import org.openrdf.model.impl.LinkedHashModel;
import org.openrdf.repository.Repository;
import org.openrdf.repository.RepositoryConnection;
import org.openrdf.repository.RepositoryException;
import org.openrdf.repository.RepositoryResult;
import org.openrdf.repository.http.HTTPRepository;
import info.aduna.iteration.Iterations;
import org.semanticweb.owlapi.apibinding.OWLManager;
import org.semanticweb.owlapi.formats.RioRDFXMLDocumentFormatFactory;
import org.semanticweb.owlapi.model.OWLOntology;
import org.semanticweb.owlapi.model.OWLOntologyCreationException;
import org.semanticweb.owlapi.model.OWLOntologyLoaderConfiguration;
import org.semanticweb.owlapi.model.OWLOntologyManager;
import org.semanticweb.owlapi.rio.RioMemoryTripleSource;
import org.semanticweb.owlapi.rio.RioParserImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Deactivate;
import aQute.bnd.annotation.component.Reference;


@Component (immediate=true)
public class SimpleOntologyManager implements OntologyManager {
	
	private static Repository repository;
    private static ValueFactory factory;
	private static Optional<Map<OntologyId, String>> ontologyRegistry = Optional.ofNullable(new HashMap<>());
	private static String location;
	private static final Logger LOG = LoggerFactory.getLogger(SimpleOntologyManager.class);
	
	public SimpleOntologyManager() {}
	
    @Activate
    public void activate() {
        LOG.info("Activating the SimpleOntologyManager");
        this.initOntologyRegistry();
    }
 
    @Deactivate
    public void deactivate() {
        LOG.info("Deactivating the SimpleOntologyManger");
    }

	@Reference
	protected void setRepo(final Repository repo) {
	    repository = repo;
	}
	
	protected void unsetRepo(final Repository repo) {
	    repository = null;
	}
	
    @Reference
    protected void setValueFactory(final ValueFactory vf)
    {
        factory = vf;
    }
    
    protected void unsetValueFactory(final ValueFactory vf)
    {
        factory = null;
    }
	
	@Override
	public Optional<Map<OntologyId, String>> getOntologyRegistry() {
		return ontologyRegistry;
	}

	@Override
	public Ontology createOntology(OntologyId ontologyId) throws MatontoOntologyException
	{
		return new SimpleOntology(ontologyId);
	}


	@Override
	public Ontology createOntology(File file, OntologyId ontologyId) throws MatontoOntologyException, FileNotFoundException {
		return new SimpleOntology(file, ontologyId);
	}


	@Override
	public Ontology createOntology(IRI iri, OntologyId ontologyId) throws MatontoOntologyException {
		return new SimpleOntology(iri, ontologyId);
	}


	@Override
	public Ontology createOntology(InputStream inputStream, OntologyId ontologyId) throws MatontoOntologyException {
		return new SimpleOntology(inputStream, ontologyId);
	}
	
	/**
	 * Checks if given context id exists in the repository, and returns true if it does.
	 * 
	 * @return True if given context id exists in the repository, or else false.
	 * @throws IllegalStateException - if the repository is null
	 */
	public boolean ontologyExists(@Nonnull OntologyId ontologyId) {
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
	 * @return an Optional with Ontology if ontology id is found, or an empty Optional instance if not found.
	 * @throws IllegalStateException - if the repository is null
	 */
	@Override
	public Optional<Ontology> retrieveOntology(@Nonnull OntologyId ontologyId) throws MatontoOntologyException {
		if(repository == null)
			throw new IllegalStateException("Repository is null");
   	 
		if(!ontologyExists(ontologyId))
			return Optional.empty();

		OWLOntologyManager mgr = OWLManager.createOWLOntologyManager();
		OWLOntology onto = null;

		RepositoryConnection conn = null;
		
		try {
			conn = repository.getConnection();
	    	Model model = Iterations.addAll(conn.getStatements(null, null, null, false, ontologyId.getOntologyIdentifier()), new LinkedHashModel());
				
	    	RioParserImpl parser = new RioParserImpl(new RioRDFXMLDocumentFormatFactory());
	    	onto = mgr.createOntology();
	    	parser.parse(new RioMemoryTripleSource(model), onto, new OWLOntologyLoaderConfiguration());

		} catch (OWLOntologyCreationException e) {
			throw new MatontoOntologyException("Unable to create an ontology object", e);
		} catch (IOException e) {
			throw new MatontoOntologyException("Unable to create an ontology object", e);
		} catch (RepositoryException e) {
			throw new MatontoOntologyException("Error in repository connection", e);
		} finally {
			closeConnection(conn);
		}

		return Optional.of(new SimpleOntology(onto));
	}
	
	@Override
	public boolean storeOntology(@Nonnull Ontology ontology) throws MatontoOntologyException {
		if(repository == null)
			throw new IllegalStateException("Repository is null");
   	 
		OntologyId ontologyId = ontology.getOntologyId();
		if(ontologyExists(ontologyId))
			throw new MatontoOntologyException("Ontology with the ontology ID already exists.");
		
		RepositoryConnection conn = null;
		
		try {
			conn = repository.getConnection();
			Model model = ontology.asModel();
			conn.add(model, ontologyId.getOntologyIdentifier());
			ontologyRegistry.get().put(ontologyId, location);
		} catch (RepositoryException e) {
			throw new MatontoOntologyException("Error in repository connection", e);
		} finally {
            closeConnection(conn);
		}
		
		return true;
	}
	
	@Override
	public boolean deleteOntology(@Nonnull OntologyId ontologyId) throws MatontoOntologyException {
		if(repository == null)
			throw new IllegalStateException("Repository is null");
		
		if(!ontologyExists(ontologyId))
			throw new MatontoOntologyException("Ontology ID does not exist.");
		
		RepositoryConnection conn = null;
		
		try {
			conn = repository.getConnection();
			conn.clear(ontologyId.getOntologyIdentifier());
			ontologyRegistry.get().remove(ontologyId, location);
		} catch (RepositoryException e) {
			throw new MatontoOntologyException("Error in repository connection", e);
		} finally {
            closeConnection(conn);
		}
		
		return true;
	}

	/**
	 * The ontology registry facilitates the list of the association of ontologies 
	 * stored in different repositories. When the registry is initialized (loaded) when
	 * an instance of SimpleOntologyManager is created.  
	 * 
	 * @throws IllegalStateException - if the repository is null
	 */
	private void initOntologyRegistry() throws MatontoOntologyException {
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
		
		try {
			conn = repository.getConnection();
			contextIds = conn.getContextIDs();
			
			while (contextIds.hasNext()) {
				Resource contextId = contextIds.next();
			    ontologyMap.put(createOntologyId(factory.createIRI(contextId.stringValue())), location);
			}
			
			ontologyRegistry = Optional.of(ontologyMap);
		} catch (RepositoryException e) {
			throw new MatontoOntologyException("Error in repository connection", e);
		} finally {
			try {
				if(contextIds != null) 
	            	contextIds.close();
			} catch (RepositoryException e) {
                LOG.warn("Could not close ResultSet." + e.toString());
			}
            closeConnection(conn);
		}
		
	}

	@Override
    public OntologyId createOntologyId() {
        return new SimpleOntologyId();
    }

	@Override
    public OntologyId createOntologyId(IRI ontologyIRI) {
        return new SimpleOntologyId(ontologyIRI);
    }

	@Override
    public OntologyId createOntologyId(IRI ontologyIRI, IRI versionIRI) {
        return new SimpleOntologyId(ontologyIRI, versionIRI);
    }

	@Override
	public IRI createOntologyIRI(String ns, String ln) {
		return factory.createIRI(ns, ln);
	}
	
	@Override
	public IRI createOntologyIRI(String iriString) {
		return factory.createIRI(iriString);
	}

    private void closeConnection(RepositoryConnection conn) {
        try {
            if(conn != null)
                conn.close();
        } catch (RepositoryException e) {
            LOG.warn("Could not close Repository." + e.toString());
        }
    }
}
