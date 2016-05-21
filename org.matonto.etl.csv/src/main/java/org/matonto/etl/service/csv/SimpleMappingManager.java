package org.matonto.etl.service.csv;

import aQute.bnd.annotation.component.*;
import org.matonto.etl.api.csv.MappingManager;
import org.matonto.exception.MatOntoException;
import org.matonto.persistence.utils.Statements;
import org.matonto.rdf.api.*;
import org.matonto.rdf.core.utils.Values;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.base.RepositoryResult;
import org.matonto.repository.config.RepositoryConsumerConfig;
import org.matonto.repository.exception.RepositoryException;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import javax.annotation.Nonnull;

@Component(
        name = SimpleMappingManager.COMPONENT_NAME,
        designateFactory = RepositoryConsumerConfig.class,
        configurationPolicy = ConfigurationPolicy.require)
public class SimpleMappingManager implements MappingManager {
    static final String COMPONENT_NAME = "org.matonto.etl.api.MappingManager";
    private Resource registryContext;
    private Resource registrySubject;
    private IRI registryPredicate;
    private static final Logger logger = LoggerFactory.getLogger(SimpleMappingManager.class);
    private ValueFactory factory;
    private ModelFactory modelFactory;
    private Repository repository;

    public SimpleMappingManager() {}

    @Activate
    public void activate() {
        logger.info("Activating " + COMPONENT_NAME);
        initMappingRegistryResources();
    }

    @Deactivate
    public void deactivate() {
        logger.info("Deactivating " + COMPONENT_NAME);
    }

    @Modified
    public void modified() {
        logger.info("Modifying the " + COMPONENT_NAME);
        initMappingRegistryResources();
    }

    @Reference
    protected void setValueFactory(final ValueFactory vf) {
        factory = vf;
    }

    @Reference
    protected void setModelFactory(final ModelFactory mf) {
        modelFactory = mf;
    }

    @Reference(name = "repository")
    protected void setRepository(Repository repository) {
        this.repository = repository;
    }

    @Override
    public Set<Resource> getMappingRegistry() {
        RepositoryConnection conn = null;
        Set<Resource> registry = new HashSet<>();
        try {
            conn = repository.getConnection();
            conn.getStatements(registrySubject, registryPredicate, null, registryContext)
                    .forEach(statement -> Statements.objectResource(statement).ifPresent(registry::add));
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection", e);
        } finally {
            closeConnection(conn);
        }

        return registry;
    }

    @Override
    public Resource createMappingIRI() {
        String localName = generateUuid();
        return factory.createIRI(Delimited.MAPPING.stringValue() + "/" + localName.trim());
    }

    @Override
    public Resource createMappingIRI(String localName) {
        return factory.createIRI(Delimited.MAPPING.stringValue() + "/" + localName.trim());
    }

    @Override
    public Model createMapping(File mapping) throws IOException {
        RDFFormat mapFormat;
        mapFormat = Rio.getParserFormatForFileName(mapping.getName()).orElseThrow(IllegalArgumentException::new);
        FileReader reader = new FileReader(mapping);
        return Values.matontoModel(Rio.parse(reader, "", mapFormat));
    }

    @Override
    public Model createMapping(String jsonld) throws IOException {
        InputStream in = new ByteArrayInputStream(jsonld.getBytes(StandardCharsets.UTF_8));
        return Values.matontoModel(Rio.parse(in, "", RDFFormat.JSONLD));
    }

    @Override
    public Model createMapping(InputStream in, RDFFormat format) throws IOException {
        return Values.matontoModel(Rio.parse(in, "", format));
    }

    @Override
    public boolean storeMapping(Model mappingModel, @Nonnull Resource mappingIRI) throws MatOntoException {
        if (mappingExists(mappingIRI)) {
            throw new MatOntoException("Mapping with mapping ID already exists");
        }

        RepositoryConnection conn = null;
        try {
            conn = repository.getConnection();
            conn.add(mappingModel, mappingIRI);
            conn.add(registrySubject, registryPredicate, mappingIRI, registryContext);
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection", e);
        } finally {
            closeConnection(conn);
        }

        return true;
    }

    @Override
    public Optional<Model> retrieveMapping(@Nonnull Resource mappingIRI) {
        if (!mappingExists(mappingIRI)) {
            return Optional.empty();
        }
        RepositoryConnection conn = null;
        Model mappingModel = modelFactory.createModel();
        try {
            conn = repository.getConnection();
            RepositoryResult<Statement> statements = conn.getStatements(null, null, null, mappingIRI);
            statements.forEach(mappingModel::add);
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection", e);
        } finally {
            closeConnection(conn);
        }
        return Optional.of(mappingModel);
    }

    @Override
    public boolean deleteMapping(@Nonnull Resource mappingIRI) {
        if (!mappingExists(mappingIRI)) {
            throw new MatOntoException("Mapping with mapping ID does not exist");
        }

        RepositoryConnection conn = null;
        try {
            conn = repository.getConnection();
            conn.clear(mappingIRI);
            conn.remove(registrySubject, registryPredicate, mappingIRI, registryContext);
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection", e);
        } finally {
            closeConnection(conn);
        }

        return true;
    }

    @Override
    public boolean mappingExists(@Nonnull Resource mappingIRI) {
        RepositoryConnection conn = null;
        boolean exists = false;
        try {
            conn = repository.getConnection();
            RepositoryResult<Statement> statements = conn.getStatements(registrySubject, registryPredicate,
                    mappingIRI, registryContext);
            if (statements.hasNext()) {
                exists = true;
            }
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection", e);
        } finally {
            closeConnection(conn);
        }
        return exists;
    }

    /**
     * Generates a UUID.
     * 
     * @return a UUID string
     */
    private String generateUuid() {
        return UUID.randomUUID().toString();
    }

    /**
     * Closes the passed connection to the repository.
     * 
     * @param conn a connection to the repository for mappings
     */
    private void closeConnection(RepositoryConnection conn) {
        try {
            if (conn != null) {
                conn.close();
            }
        } catch (RepositoryException e) {
            logger.warn("Could not close Repository." + e.toString());
        }
    }

    /**
     * Initializes resources used to store the mapping registry statements in
     * the repository.
     */
    private void initMappingRegistryResources() {
        registryContext = factory.createIRI("https://matonto.org/registries/mappings");
        registrySubject = factory.createIRI("https://matonto.org/registries/mappings");
        registryPredicate = factory.createIRI("https://matonto.org/registries#hasItem");
    }
}
