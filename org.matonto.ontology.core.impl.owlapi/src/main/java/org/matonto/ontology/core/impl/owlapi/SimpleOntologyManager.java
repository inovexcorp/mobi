package org.matonto.ontology.core.impl.owlapi;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import javax.annotation.Nonnull;
import javax.annotation.Nullable;

import org.matonto.ontology.core.api.Ontology;
import org.matonto.ontology.core.api.OntologyId;
import org.matonto.ontology.core.api.OntologyManager;
import org.matonto.ontology.core.utils.MatontoOntologyException;
import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.persistence.utils.Models;
import org.matonto.persistence.utils.Statements;
import org.matonto.rdf.api.*;
import org.matonto.rdf.api.IRI;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.api.RepositoryManager;
import org.matonto.repository.base.RepositoryResult;
import org.matonto.repository.exception.RepositoryException;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.semanticweb.owlapi.apibinding.OWLManager;
import org.semanticweb.owlapi.formats.RioRDFXMLDocumentFormatFactory;
import org.semanticweb.owlapi.model.*;
import org.semanticweb.owlapi.rio.RioMemoryTripleSource;
import org.semanticweb.owlapi.rio.RioParserImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import aQute.bnd.annotation.component.*;


@Component (immediate=true, 
            provide = OntologyManager.class,
            name = SimpleOntologyManager.COMPONENT_NAME,
            configurationPolicy = ConfigurationPolicy.require)
public class SimpleOntologyManager implements OntologyManager {
	
    protected static final String COMPONENT_NAME = "org.matonto.ontology.core.OntologyManager";
    private Resource registryContext;
    private Resource registrySubject;
    private IRI registryPredicate;
    private RepositoryManager repositoryManager;
	private static Repository repository;
    private static ValueFactory factory;
	private static final Logger LOG = LoggerFactory.getLogger(SimpleOntologyManager.class);
    private SesameTransformer transformer;
    private ModelFactory modelFactory;

	public SimpleOntologyManager() {}
	
    @Activate
    public void activate(final Map<String, Object> properties) {
        LOG.info("Activating " + COMPONENT_NAME);
        setPropertyValues(properties);
    }
 
    @Deactivate
    public void deactivate() {
        LOG.info("Deactivating " + COMPONENT_NAME);
    }
    
    @Modified
    public void modified(final Map<String, Object> properties) {
        LOG.info("Modifying the " + COMPONENT_NAME);
        setPropertyValues(properties);
    }
    
    private void setPropertyValues(Map<String, Object> properties) {
        if (properties.containsKey("repositoryId") && !properties.get("repositoryId").equals("")) {
            getRepository((String)properties.get("repositoryId"));
            LOG.info("repositoryId - " + properties.get("repositoryId"));
            initOntologyRegistryResources();
        } else {
            LOG.error("Unable to activate Ontology Manager: Unable to set repositoryId");
            throw new IllegalStateException("Unable to set repositoryId");
        }
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
        repository = repo;
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
	public Set<Resource> getOntologyRegistry() {
        if(repository == null)
            throw new IllegalStateException("Repository is null");

        RepositoryConnection conn = null;
        Set<Resource> registry = new HashSet<>();
        try {
            conn = repository.getConnection();
            conn.getStatements(registrySubject, registryPredicate, null, registryContext)
                    .forEach(stmt -> Statements.objectResource(stmt).ifPresent(registry::add));
        } catch (RepositoryException e) {
            throw new MatontoOntologyException("Error in repository connection", e);
        } finally {
            closeConnection(conn);
        }

		return registry;
	}

	@Override
	public Ontology createOntology(OntologyId ontologyId) throws MatontoOntologyException {
		return new SimpleOntology(ontologyId, this);
	}

	@Override
	public Ontology createOntology(File file) throws MatontoOntologyException, FileNotFoundException {
		return new SimpleOntology(file, this);
	}

	@Override
	public Ontology createOntology(IRI iri) throws MatontoOntologyException {
		return new SimpleOntology(iri, this);
	}

	@Override
	public Ontology createOntology(InputStream inputStream) throws MatontoOntologyException {
		return new SimpleOntology(inputStream, this);
	}

    @Override
    public Ontology createOntology(String json) throws MatontoOntologyException {
        return new SimpleOntology(json, this);
    }
	
	/**
	 * Checks if given context id exists in the local ontology registry.
	 * 
	 * @return True if given context id exists in the local ontology registry, or else false.
	 * @throws IllegalStateException - if the repository is null
	 */
	public boolean ontologyExists(@Nonnull Resource resource) {
        if(repository == null)
            throw new IllegalStateException("Repository is null");

        RepositoryConnection conn = null;
        boolean exists = false;
        try {
            conn = repository.getConnection();
            RepositoryResult<Statement> statements = conn.getStatements(registrySubject, registryPredicate, resource, registryContext);
            if(statements.hasNext()) {
                exists = true;
            }
        } catch (RepositoryException e) {
            throw new MatontoOntologyException("Error in repository connection", e);
        } finally {
            closeConnection(conn);
        }

        return exists;
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
	public Optional<Ontology> retrieveOntology(@Nonnull Resource resource) throws MatontoOntologyException {
		if(repository == null)
			throw new IllegalStateException("Repository is null");
   	 
		if(!ontologyExists(resource))
			return Optional.empty();

		OWLOntologyManager mgr = OWLManager.createOWLOntologyManager();
		OWLOntology onto = null;
		RepositoryConnection conn = null;
		
		try {
			conn = repository.getConnection();
            RepositoryResult<Statement> stmts = conn.getStatements(null, null, null, resource);
            org.openrdf.model.Model sesameModel = new org.openrdf.model.impl.LinkedHashModel();
            stmts.forEach(stmt -> sesameModel.add(transformer.sesameStatement(stmt)));
	    	RioParserImpl parser = new RioParserImpl(new RioRDFXMLDocumentFormatFactory());
	    	onto = mgr.createOntology();
	    	OWLOntologyLoaderConfiguration config = new OWLOntologyLoaderConfiguration().setMissingImportHandlingStrategy(MissingImportHandlingStrategy.SILENT);
	    	parser.parse(new RioMemoryTripleSource(sesameModel), onto, config);
	    	
		} catch (OWLOntologyCreationException | IOException e) {
			throw new MatontoOntologyException("Unable to create an ontology object", e);
		} catch (RepositoryException e) {
			throw new MatontoOntologyException("Error in repository connection", e);
        } finally {
			closeConnection(conn);
		}

		Ontology matontoOntology = SimpleOntologyValues.matontoOntology(onto, resource);
		
		return Optional.of(matontoOntology);
	}
	
	@Override
	public boolean storeOntology(@Nonnull Ontology ontology) throws MatontoOntologyException {
        if(repository == null)
            throw new IllegalStateException("Repository is null");

        Resource resource = ontology.getOntologyId().getOntologyIdentifier();
        if(ontologyExists(resource))
            throw new MatontoOntologyException("Ontology with the ontology ID already exists.");

        RepositoryConnection conn = null;

        try {
            Model model = ontology.asModel(modelFactory);
            conn = repository.getConnection();
            conn.add(model, resource);
            conn.add(registrySubject, registryPredicate, resource, registryContext);
        } catch (RepositoryException e) {
            throw new MatontoOntologyException("Error in repository connection", e);
        } finally {
            closeConnection(conn);
        }

        return true;
	}

    private void checkRepositoryAndOntology(Resource ontologyResource) {
        if (repository == null)
            throw new IllegalStateException("Repository is null");

        if(!ontologyExists(ontologyResource))
            throw new MatontoOntologyException("Ontology ID does not exist.");
    }

    private boolean updateOntology(Resource ontologyResource, @Nullable Resource originalResource, String resourceJson)
            throws MatontoOntologyException {
        checkRepositoryAndOntology(ontologyResource);
        boolean updated = false;

        try {
            final RepositoryConnection conn = repository.getConnection();

            try {
                InputStream in = new ByteArrayInputStream(resourceJson.getBytes(StandardCharsets.UTF_8));
                Model changedModel = transformer.matontoModel(Rio.parse(in, "", RDFFormat.JSONLD));

                if(ontologyResource != null && changedModel.size() > 0) {
                    conn.begin();
                    Resource newSubject = Models.subject(changedModel).get();
                    Resource newContext = (originalResource != null && originalResource.equals(ontologyResource) &&
                            !ontologyResource.equals(newSubject)) ?
                            (new SimpleOntology(resourceJson, this)).getOntologyId().getOntologyIdentifier() :
                            ontologyResource;

                    // Ontology IRI has changed, so update the context of all statements
                    if(newContext.equals(newSubject)) {
                        conn.getStatements(null, null, null, ontologyResource).forEach(stmt -> {
                            conn.remove(stmt);
                            if(!stmt.getSubject().equals(newSubject)) {
                                conn.add(stmt, newContext);
                            }
                        });
                        conn.remove(registrySubject, registryPredicate, ontologyResource, registryContext);
                        conn.add(factory.createStatement(registrySubject, registryPredicate, newContext,
                                registryContext));
                    }

                    // Remove all original statements if the object is not a blank node. Replace subject with new
                    // subject if the IRI is changed and it is a blank node
                    if(originalResource != null) {
                        conn.getStatements(originalResource, null, null, newContext).forEach(stmt -> {
                            if (!(stmt.getObject() instanceof BNode)) {
                                conn.remove(stmt);
                            } else if (!newSubject.equals(originalResource)) {
                                conn.remove(stmt);
                                conn.add(factory.createStatement(newSubject, stmt.getPredicate(), stmt.getObject(),
                                        newContext));
                            }
                        });

                        // Updates statements that reference the changed entity if needed
                        conn.getStatements(null, null, originalResource, newContext).forEach(stmt -> {
                            conn.remove(stmt);
                            conn.add(factory.createStatement(stmt.getSubject(), stmt.getPredicate(), newSubject,
                                    newContext));
                        });
                    }

                    // Add all new statements if the object is not a blank node
                    changedModel.forEach(stmt -> {
                        if (!(stmt.getObject() instanceof BNode)) {
                            conn.add(stmt, newContext);
                        }
                    });
                    conn.commit();
                    updated = true;
                }

            } catch (IOException | org.openrdf.rio.RDFParseException e) {
                throw new MatontoOntologyException("Error in parsing resourceJson", e);
            } finally {
                closeConnection(conn);
            }

        } catch (RepositoryException e) {
            throw new MatontoOntologyException("Error in repository connection", e);
        }

        return updated;
    }

    @Override
    public boolean saveChangesToOntology(Resource ontologyResource, Resource originalChangedResource,
                                         String resourceJson) throws MatontoOntologyException {
        return updateOntology(ontologyResource, originalChangedResource, resourceJson);
    }

    @Override
    public boolean addEntityToOntology(Resource ontologyResource, String resourceJson) throws MatontoOntologyException {
        return updateOntology(ontologyResource, null, resourceJson);
    }
	
	@Override
	public boolean deleteOntology(@Nonnull Resource resource) throws MatontoOntologyException {
		if(repository == null)
			throw new IllegalStateException("Repository is null");
		
		if(!ontologyExists(resource))
			throw new MatontoOntologyException("Ontology ID does not exist.");
		
		RepositoryConnection conn = null;
		
		try {
			conn = repository.getConnection();
            conn.clear(resource);
            conn.remove(registrySubject, registryPredicate, resource, registryContext);
		} catch (RepositoryException e) {
			throw new MatontoOntologyException("Error in repository connection", e);
		} finally {
            closeConnection(conn);
		}
		
		return true;
	}

    @Override
    public Map<String, Set> deleteEntityFromOntology(@Nonnull Resource ontologyResource, @Nonnull Resource entityResource) throws MatontoOntologyException {
        checkRepositoryAndOntology(ontologyResource);

        RepositoryConnection conn = null;
        Map<String, Set> changedEntities = new HashMap<>();
        try {
            conn = repository.getConnection();
            RepositoryResult<Statement> entitySubjectStatements = conn.getStatements(entityResource, null, null, ontologyResource);
            RepositoryResult<Statement> entityObjectStatements = conn.getStatements(null, null, entityResource, ontologyResource);

            Set<Statement> cachedObjectStatements = new HashSet<>();
            Set<String> changedIriStrings = new HashSet<>();
            Set<org.openrdf.model.Model> changedModels = new HashSet<>();

            for(Statement stmt : entityObjectStatements) {
                changedIriStrings.add(stmt.getSubject().stringValue());
                cachedObjectStatements.add(stmt);
            }
            changedEntities.put("iris", changedIriStrings);

            conn.remove(entitySubjectStatements, ontologyResource);
            conn.remove(cachedObjectStatements, ontologyResource);

            for(String iriString : changedIriStrings) {
                RepositoryResult<Statement> changedEntity = conn.getStatements(factory.createIRI(iriString), null, null, ontologyResource);
                Model model = modelFactory.createModel();

                changedEntity.forEach(model::add);
                changedModels.add(transformer.sesameModel(model));
            }
            changedEntities.put("models", changedModels);
        } catch (RepositoryException e) {
            throw new MatontoOntologyException("Error in repository connection", e);
        } finally {
            closeConnection(conn);
        }

        return changedEntities;
    }

	/**
     * Initializes the resources used to store the ontology registry statements in
     * the repository. These values are initialized whenever the SimpleOntologyManager
     * is created.
	 * 
	 * @throws IllegalStateException - if the repository is null
	 */
	private void initOntologyRegistryResources() throws MatontoOntologyException {
        registryContext = factory.createIRI("https://matonto.org/registry/ontologies");
        registrySubject = factory.createIRI("https://matonto.org/registry/ontologies");
        registryPredicate = factory.createIRI("https://matonto.org/Ontology/registry#hasItem");
	}

	@Override
    public OntologyId createOntologyId() {
        return new SimpleOntologyId.Builder(factory).build();
    }
	
	@Override
	public OntologyId createOntologyId(Resource resource) {
	    return new SimpleOntologyId.Builder(factory).id(resource).build();
	}

	@Override
    public OntologyId createOntologyId(IRI ontologyIRI) {
        return new SimpleOntologyId.Builder(factory).ontologyIRI(ontologyIRI).build();
    }

	@Override
    public OntologyId createOntologyId(IRI ontologyIRI, IRI versionIRI) {
        return new SimpleOntologyId.Builder(factory).ontologyIRI(ontologyIRI).versionIRI(versionIRI).build();
    }

    private void closeConnection(RepositoryConnection conn) {
        try {
            if(conn != null)
                conn.close();
        } catch (RepositoryException e) {
            LOG.warn("Could not close Repository." + e.toString());
        }
    }

    @Override
	public SesameTransformer getTransformer() {
        return transformer;
    }
}
