package org.matonto.etl.service.delimited;

/*-
 * #%L
 * org.matonto.etl.csv
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

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.ConfigurationPolicy;
import aQute.bnd.annotation.component.Deactivate;
import aQute.bnd.annotation.component.Modified;
import aQute.bnd.annotation.component.Reference;
import org.matonto.etl.api.delimited.MappingId;
import org.matonto.etl.api.delimited.MappingManager;
import org.matonto.etl.api.delimited.MappingWrapper;
import org.matonto.etl.api.ontologies.delimited.Mapping;
import org.matonto.etl.api.ontologies.delimited.MappingFactory;
import org.matonto.exception.MatOntoException;
import org.matonto.persistence.utils.Statements;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Statement;
import org.matonto.rdf.api.ValueFactory;
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

import javax.annotation.Nonnull;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

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
    private static final String DEFAULT_MAPPING_PREFIX = "http://matonto.org/mappings/";
    private ValueFactory factory;
    private ModelFactory modelFactory;
    private Repository repository;
    private MappingFactory mappingFactory;

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

    @Reference
    protected void setMappingFactory(MappingFactory mappingFactory) {
        this.mappingFactory = mappingFactory;
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
    public IRI createMappingIRI() {
        String localName = generateUuid();
        return factory.createIRI(DEFAULT_MAPPING_PREFIX + localName.trim());
    }

    @Override
    public IRI createMappingIRI(String localName) {
            return factory.createIRI(DEFAULT_MAPPING_PREFIX + localName.trim());
    }

    @Override
    public String getMappingLocalName(IRI iri) {
        if (iri.getNamespace().equals(Delimited.MAPPINGS.stringValue() + "/")) {
            return iri.getLocalName();
        }
        return iri.getNamespace().replace(Delimited.MAPPINGS.stringValue() + "/", "");
    }

    @Override
    public MappingId createMappingId(Resource id) {
        return new SimpleMappingId.Builder(factory).id(id).build();
    }

    @Override
    public MappingId createMappingId(IRI mappingIRI) {
        return new SimpleMappingId.Builder(factory).mappingIRI(mappingIRI).build();
    }

    @Override
    public MappingId createMappingId(IRI mappingIRI, IRI versionIRI) {
        return new SimpleMappingId.Builder(factory).mappingIRI(mappingIRI).versionIRI(versionIRI).build();
    }

    @Override
    public MappingWrapper createMapping(MappingId id) {
        Resource mappingResource = id.getMappingIRI().isPresent() ? id.getMappingIRI().get() : id.getMappingIdentifier();
        Mapping mapping = mappingFactory.createNew(mappingResource);

        if (id.getVersionIRI().isPresent()) {
            mapping.setVersionIRI(mappingFactory.createNew(id.getVersionIRI().get(), mapping.getModel()));
        }

        return new SimpleMappingWrapper(id, mapping);
    }

    @Override
    public MappingWrapper createMapping(File mapping) throws IOException, MatOntoException {
        return new SimpleMapping(mapping, factory, modelFactory);
    }

    @Override
    public MappingWrapper createMapping(String jsonld) throws IOException, MatOntoException {
        return new SimpleMapping(jsonld, factory, modelFactory);
    }

    @Override
    public MappingWrapper createMapping(InputStream in, RDFFormat format) throws IOException, MatOntoException {
        Model model = Values.matontoModel(Rio.parse(in, "", format));
        mappingFactory.getExisting()

        return new SimpleMapping(in, format, factory, modelFactory);
    }

    @Override
    public boolean storeMapping(@Nonnull Mapping mapping) throws MatOntoException {
        if (mappingExists(mapping.getId().getMappingIdentifier())) {
            throw new MatOntoException("Mapping with mapping ID already exists");
        }

        RepositoryConnection conn = null;
        try {
            conn = repository.getConnection();
            conn.add(mapping.asModel(), mapping.getId().getMappingIdentifier());
            conn.add(registrySubject, registryPredicate, mapping.getId().getMappingIdentifier(), registryContext);
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection", e);
        } finally {
            closeConnection(conn);
        }

        return true;
    }

    @Override
    public Optional<Mapping> retrieveMapping(@Nonnull Resource mappingId) {
        if (!mappingExists(mappingId)) {
            return Optional.empty();
        }
        RepositoryConnection conn = null;
        Model mappingModel = modelFactory.createModel();
        try {
            conn = repository.getConnection();
            RepositoryResult<Statement> statements = conn.getStatements(null, null, null, mappingId);
            statements.forEach(mappingModel::add);
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection", e);
        } finally {
            closeConnection(conn);
        }
        return Optional.of(new SimpleMapping(mappingModel, factory, modelFactory));
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
        registryContext = factory.createIRI("https://matonto.org/registry/mappings");
        registrySubject = factory.createIRI("https://matonto.org/registry/mappings");
        registryPredicate = factory.createIRI("https://matonto.org/registry#hasItem");
    }
}
