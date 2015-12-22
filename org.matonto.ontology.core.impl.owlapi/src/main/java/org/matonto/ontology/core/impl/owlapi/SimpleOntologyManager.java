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
import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.rdf.api.*;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.api.RepositoryManager;
import org.matonto.repository.base.RepositoryResult;
import org.matonto.repository.exception.RepositoryException;
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


@Component (immediate=true, provide = OntologyManager.class)
public class SimpleOntologyManager implements OntologyManager {
	
    private RepositoryManager repositoryManager;
	private static Repository repository;
    private static ValueFactory factory;
	private static Map<OntologyId, String> ontologyRegistry = new HashMap<>();
	private static final Logger LOG = LoggerFactory.getLogger(SimpleOntologyManager.class);
    private SesameTransformer transformer;
    private ModelFactory modelFactory;
	
	public SimpleOntologyManager() {}
	
    @Activate
    public void activate() {
        LOG.info("Activating the SimpleOntologyManager");
        getRepository("ontology-repo");
        initOntologyRegistry();
    }
 
    @Deactivate
    public void deactivate() {
        LOG.info("Deactivating the SimpleOntologyManger");
    }

    @Reference
    public void setRepositoryManager(RepositoryManager repositoryManager) {
        this.repositoryManager = repositoryManager;
    }

    protected void getRepository(String repositoryId) {
        if(repositoryManager == null)
            throw new IllegalStateException("Repository Manager is null");
        
        Optional<Repository> optRepo = repositoryManager.getRepository(repositoryId);
        if(optRepo.isPresent())
            setRepo(optRepo.get());
        else
            throw new IllegalStateException("Repository does not exist");
    }
    
    protected void setRepo(Repository repo) {
        this.repository = repo;
    }

    @Reference
    protected void setValueFactory(final ValueFactory vf) {
        factory = vf;
    }

    @Reference
    protected void setTransformer(final SesameTransformer transformer) {
        this.transformer = transformer;
    }

    @Reference
    protected void setModelFactory(final ModelFactory modelFactory) {
        this.modelFactory = modelFactory;
    }
	
	@Override
	public Map<OntologyId, String> getOntologyRegistry() {
		return ontologyRegistry;
	}

	@Override
	public Ontology createOntology(OntologyId ontologyId) throws MatontoOntologyException
	{
		return new SimpleOntology(ontologyId, transformer);
	}


	@Override
	public Ontology createOntology(File file, OntologyId ontologyId) throws MatontoOntologyException, FileNotFoundException {
		return new SimpleOntology(file, ontologyId, transformer);
	}


	@Override
	public Ontology createOntology(IRI iri, OntologyId ontologyId) throws MatontoOntologyException {
		return new SimpleOntology(iri, ontologyId, transformer);
	}


	@Override
	public Ontology createOntology(InputStream inputStream, OntologyId ontologyId) throws MatontoOntologyException {
		return new SimpleOntology(inputStream, ontologyId, transformer);
	}
	
	/**
	 * Checks if given context id exists in the repository, and returns true if it does.
	 * 
	 * @return True if given context id exists in the repository, or else false.
	 * @throws IllegalStateException - if the repository is null
	 */
	public boolean ontologyExists(@Nonnull OntologyId ontologyId) {
        return ontologyRegistry.containsKey(ontologyId);
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
            RepositoryResult<Statement> stmts = conn.getStatements(null, null, null, ontologyId.getOntologyIdentifier());

            org.openrdf.model.Model sesameModel = new org.openrdf.model.impl.LinkedHashModel();
            stmts.forEach(stmt -> sesameModel.add(transformer.sesameStatement(stmt)));

	    	RioParserImpl parser = new RioParserImpl(new RioRDFXMLDocumentFormatFactory());
	    	onto = mgr.createOntology();
	    	parser.parse(new RioMemoryTripleSource(sesameModel), onto, new OWLOntologyLoaderConfiguration());
		} catch (OWLOntologyCreationException | IOException e) {
			throw new MatontoOntologyException("Unable to create an ontology object", e);
		} catch (RepositoryException e) {
			throw new MatontoOntologyException("Error in repository connection", e);
        } finally {
			closeConnection(conn);
		}

		return Optional.of(SimpleOntologyValues.matontoOntology(onto));
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
			Model model = ontology.asModel(modelFactory);

            conn = repository.getConnection();
            conn.add(model, ontologyId.getOntologyIdentifier());

			ontologyRegistry.put(ontologyId, repository.getConfig().id());
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
			ontologyRegistry.remove(ontologyId, repository.getConfig().id());
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
		
		RepositoryConnection conn = null;
		RepositoryResult<Resource> contextIds = null;
		
		Map<OntologyId, String> ontologyMap = new HashMap<>();
		
		try {
			conn = repository.getConnection();
			contextIds = conn.getContextIDs();
			
			while (contextIds.hasNext()) {
				Resource contextId = contextIds.next();
			    ontologyMap.put(createOntologyId(factory.createIRI(contextId.stringValue())), repository.getConfig().id());
			}
			
			ontologyRegistry = ontologyMap;
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
        return new SimpleOntologyId(factory);
    }

	@Override
    public OntologyId createOntologyId(IRI ontologyIRI) {
        return new SimpleOntologyId(factory, ontologyIRI);
    }

	@Override
    public OntologyId createOntologyId(IRI ontologyIRI, IRI versionIRI) {
        return new SimpleOntologyId(factory, ontologyIRI, versionIRI);
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
