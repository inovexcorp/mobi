package org.matonto.ontology.core.impl.owlapi;

/*-
 * #%L
 * org.matonto.ontology.core.impl.owlapi
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
import org.apache.commons.io.IOUtils;
import org.matonto.exception.MatOntoException;
import org.matonto.ontology.core.api.Ontology;
import org.matonto.ontology.core.api.OntologyId;
import org.matonto.ontology.core.api.OntologyManager;
import org.matonto.ontology.core.utils.MatontoOntologyException;
import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.persistence.utils.Models;
import org.matonto.persistence.utils.Statements;
import org.matonto.query.TupleQueryResult;
import org.matonto.query.api.TupleQuery;
import org.matonto.rdf.api.BNode;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Statement;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.base.RepositoryResult;
import org.matonto.repository.config.RepositoryConsumerConfig;
import org.matonto.repository.exception.RepositoryException;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.RDFParseException;
import org.openrdf.rio.Rio;
import org.semanticweb.owlapi.apibinding.OWLManager;
import org.semanticweb.owlapi.formats.RioRDFXMLDocumentFormatFactory;
import org.semanticweb.owlapi.model.MissingImportHandlingStrategy;
import org.semanticweb.owlapi.model.OWLOntology;
import org.semanticweb.owlapi.model.OWLOntologyCreationException;
import org.semanticweb.owlapi.model.OWLOntologyLoaderConfiguration;
import org.semanticweb.owlapi.model.OWLOntologyManager;
import org.semanticweb.owlapi.rio.RioMemoryTripleSource;
import org.semanticweb.owlapi.rio.RioParserImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.Nonnull;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;


@Component (provide = OntologyManager.class,
            name = SimpleOntologyManager.COMPONENT_NAME,
            designateFactory = RepositoryConsumerConfig.class,
            configurationPolicy = ConfigurationPolicy.require)
public class SimpleOntologyManager implements OntologyManager {

    protected static final String COMPONENT_NAME =
            "org.matonto.ontology.core.OntologyManager";
    private Resource registryContext;
    private Resource registrySubject;
    private IRI registryPredicate;
    private Repository repository;
    private ValueFactory factory;
    private static final Logger LOG = LoggerFactory.getLogger(SimpleOntologyManager.class);
    private SesameTransformer transformer;
    private ModelFactory modelFactory;
    private static final String GET_SUB_CLASSES_OF;
    private static final String GET_SUB_DATATYPE_PROPERTIES_OF;
    private static final String GET_SUB_OBJECT_PROPERTIES_OF;
    private static final String GET_CLASSES_WITH_INDIVIDUALS;
    private static final String GET_ENTITY_USAGES;
    private static final String GET_CONCEPT_RELATIONSHIPS;
    private static final String GRAPH_BINDING = "graph";
    private static final String ENTITY_BINDING = "entity";

    static {
        try {
            GET_SUB_CLASSES_OF = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-sub-classes-of.rq"),
                    "UTF-8"
            );
        } catch (IOException e) {
            throw new MatOntoException(e);
        }
        try {
            GET_SUB_DATATYPE_PROPERTIES_OF = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-sub-datatype-properties-of.rq"),
                    "UTF-8"
            );
        } catch (IOException e) {
            throw new MatOntoException(e);
        }
        try {
            GET_SUB_OBJECT_PROPERTIES_OF = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-sub-object-properties-of.rq"),
                    "UTF-8"
            );
        } catch (IOException e) {
            throw new MatOntoException(e);
        }
        try {
            GET_CLASSES_WITH_INDIVIDUALS = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-classes-with-individuals.rq"),
                    "UTF-8"
            );
        } catch (IOException e) {
            throw new MatOntoException(e);
        }
        try {
            GET_ENTITY_USAGES = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-entity-usages.rq"),
                    "UTF-8"
            );
        } catch (IOException e) {
            throw new MatOntoException(e);
        }
        try {
            GET_CONCEPT_RELATIONSHIPS = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-concept-relationships.rq"),
                    "UTF-8"
            );
        } catch (IOException e) {
            throw new MatOntoException(e);
        }
    }

    @Reference(name = "repository")
    protected void setRepository(Repository repository) {
        this.repository = repository;
    }

    @Activate
    public void activate(final Map<String, Object> properties) {
        LOG.info("Activating " + COMPONENT_NAME);
        initOntologyRegistryResources();
    }
 
    @Deactivate
    public void deactivate() {
        LOG.info("Deactivating " + COMPONENT_NAME);
    }
    
    @Modified
    public void modified(final Map<String, Object> properties) {
        LOG.info("Modifying the " + COMPONENT_NAME);
        initOntologyRegistryResources();
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
        RepositoryConnection conn = null;
        boolean exists = false;
        try {
            conn = repository.getConnection();
            RepositoryResult<Statement> statements =
                    conn.getStatements(registrySubject, registryPredicate, resource, registryContext);
            if (statements.hasNext()) {
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
        if (!ontologyExists(resource)) {
            return Optional.empty();
        }

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
            OWLOntologyLoaderConfiguration config = new OWLOntologyLoaderConfiguration()
                    .setMissingImportHandlingStrategy(MissingImportHandlingStrategy.SILENT);
            parser.parse(new RioMemoryTripleSource(sesameModel), onto, config);
        } catch (OWLOntologyCreationException e) {
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
        Resource resource = ontology.getOntologyId().getOntologyIdentifier();
        if (ontologyExists(resource)) {
            throw new MatontoOntologyException("Ontology with the ontology ID already exists.");
        }

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
        if (!ontologyExists(ontologyResource)) {
            throw new MatontoOntologyException("Ontology ID does not exist.");
        }
    }

    private Model getModelFromJson(String json) {
        try {
            InputStream in = new ByteArrayInputStream(json.getBytes(StandardCharsets.UTF_8));
            return transformer.matontoModel(Rio.parse(in, "", RDFFormat.JSONLD));
        } catch (IOException | RDFParseException e) {
            throw new MatontoOntologyException("Error in parsing JSON", e);
        }
    }

    @Override
    public String saveChangesToOntology(Resource ontologyResource, Resource originalResource,
                                         String resourceJson) throws MatontoOntologyException {
        checkRepositoryAndOntology(ontologyResource);

        try {
            final RepositoryConnection conn = repository.getConnection();

            try {
                Model changedModel = getModelFromJson(resourceJson);

                Resource newSubject = Models.subject(changedModel).orElseThrow(() ->
                        new MatontoOntologyException("No subject was available in the resourceJson"));

                boolean hasNewOntologyIRI = originalResource.equals(ontologyResource)
                        && !ontologyResource.equals(newSubject);

                Resource context = hasNewOntologyIRI
                        ? (new SimpleOntology(resourceJson, this)).getOntologyId().getOntologyIdentifier() :
                        ontologyResource;

                conn.begin();

                // Ontology IRI has changed, so update the context of all statements
                if (hasNewOntologyIRI) {
                    conn.getStatements(null, null, null, ontologyResource).forEach(stmt -> {
                        conn.remove(stmt);
                        if (!stmt.getSubject().equals(newSubject)) {
                            conn.add(stmt, context);
                        }
                    });
                    conn.remove(registrySubject, registryPredicate, ontologyResource, registryContext);
                    conn.add(factory.createStatement(registrySubject, registryPredicate, context,
                            registryContext));
                }

                // Remove all original statements if the object is not a blank node. Replace subject with new
                // subject if the IRI is changed and it is a blank node
                conn.getStatements(originalResource, null, null, context).forEach(stmt -> {
                    if (!(stmt.getObject() instanceof BNode)) {
                        conn.remove(stmt);
                    } else if (!newSubject.equals(originalResource)) {
                        conn.remove(stmt);
                        conn.add(factory.createStatement(newSubject, stmt.getPredicate(), stmt.getObject(),
                                context));
                    }
                });

                // Updates statements that reference the changed entity if needed
                conn.getStatements(null, null, originalResource, context).forEach(stmt -> {
                    conn.remove(stmt);
                    conn.add(factory.createStatement(stmt.getSubject(), stmt.getPredicate(), newSubject,
                            context));
                });

                // Add all new statements if the object is not a blank node
                changedModel.forEach(stmt -> {
                    if (!(stmt.getObject() instanceof BNode)) {
                        conn.add(stmt, context);
                    }
                });

                conn.commit();

                return context.stringValue();

            } finally {
                closeConnection(conn);
            }
        } catch (RepositoryException e) {
            throw new MatontoOntologyException("Error in repository connection", e);
        }
    }

    @Override
    public boolean addEntityToOntology(Resource ontologyResource, String resourceJson) throws MatontoOntologyException {

        try {
            final RepositoryConnection conn = repository.getConnection();

            try {
                Model changedModel = getModelFromJson(resourceJson);
                conn.begin();
                changedModel.forEach(stmt -> conn.add(stmt, ontologyResource));
                conn.commit();

            } finally {
                closeConnection(conn);
            }
        } catch (RepositoryException e) {
            throw new MatontoOntologyException("Error in repository connection", e);
        }

        return true;
    }

    @Override
    public boolean deleteOntology(@Nonnull Resource resource) throws MatontoOntologyException {
        if (!ontologyExists(resource)) {
            throw new MatontoOntologyException("Ontology ID does not exist.");
        }

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
    public Map<String, Set> deleteEntityFromOntology(@Nonnull Resource ontologyResource,
                                                     @Nonnull Resource entityResource) throws MatontoOntologyException {
        checkRepositoryAndOntology(ontologyResource);

        RepositoryConnection conn = null;
        Map<String, Set> changedEntities = new HashMap<>();
        try {
            conn = repository.getConnection();
            RepositoryResult<Statement> entitySubjectStatements =
                    conn.getStatements(entityResource, null, null, ontologyResource);
            RepositoryResult<Statement> entityObjectStatements =
                    conn.getStatements(null, null, entityResource, ontologyResource);
            RepositoryResult<Statement> entityPredicateStatements =
                    conn.getStatements(null, factory.createIRI(entityResource.stringValue()), null, ontologyResource);

            Set<Statement> cachedObjectStatements = new HashSet<>();
            Set<Statement> cachedPredicateStatements = new HashSet<>();
            Set<String> changedIriStrings = new HashSet<>();
            Set<org.openrdf.model.Model> changedModels = new HashSet<>();

            for (Statement stmt : entityObjectStatements) {
                if (!(stmt.getSubject() instanceof BNode)) {
                    changedIriStrings.add(stmt.getSubject().stringValue());
                }
                cachedObjectStatements.add(stmt);
            }
            for (Statement stmt : entityPredicateStatements) {
                if (!(stmt.getSubject() instanceof BNode)) {
                    changedIriStrings.add(stmt.getSubject().stringValue());
                }
                cachedPredicateStatements.add(stmt);
            }
            changedEntities.put("iris", changedIriStrings);

            conn.remove(entitySubjectStatements, ontologyResource);
            conn.remove(cachedObjectStatements, ontologyResource);
            conn.remove(cachedPredicateStatements, ontologyResource);

            for (String iriString : changedIriStrings) {
                RepositoryResult<Statement> changedEntity =
                        conn.getStatements(factory.createIRI(iriString), null, null, ontologyResource);
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
        registryPredicate = factory.createIRI("https://matonto.org/registry#hasItem");
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
            if (conn != null) {
                conn.close();
            }
        } catch (RepositoryException e) {
            LOG.warn("Could not close Repository." + e.toString());
        }
    }

    @Override
    public SesameTransformer getTransformer() {
        return transformer;
    }

    @Override
    public TupleQueryResult getSubClassesOf(String ontologyIdStr) {
        RepositoryConnection conn = repository.getConnection();
        TupleQuery query = conn.prepareTupleQuery(GET_SUB_CLASSES_OF);
        query.setBinding(GRAPH_BINDING, factory.createIRI(ontologyIdStr));
        return query.evaluate();
    }

    @Override
    public TupleQueryResult getSubObjectPropertiesOf(String ontologyIdStr) {
        RepositoryConnection conn = repository.getConnection();
        TupleQuery query = conn.prepareTupleQuery(GET_SUB_OBJECT_PROPERTIES_OF);
        query.setBinding(GRAPH_BINDING, factory.createIRI(ontologyIdStr));
        return query.evaluate();
    }

    @Override
    public TupleQueryResult getSubDatatypePropertiesOf(String ontologyIdStr) {
        RepositoryConnection conn = repository.getConnection();
        TupleQuery query = conn.prepareTupleQuery(GET_SUB_DATATYPE_PROPERTIES_OF);
        query.setBinding(GRAPH_BINDING, factory.createIRI(ontologyIdStr));
        return query.evaluate();
    }

    @Override
    public TupleQueryResult getClassesWithIndividuals(String ontologyIdStr) {
        RepositoryConnection conn = repository.getConnection();
        TupleQuery query = conn.prepareTupleQuery(GET_CLASSES_WITH_INDIVIDUALS);
        query.setBinding(GRAPH_BINDING, factory.createIRI(ontologyIdStr));
        return query.evaluate();
    }

    @Override
    public TupleQueryResult getEntityUsages(String ontologyIdStr, String entityIRIStr) {
        RepositoryConnection conn = repository.getConnection();
        TupleQuery query = conn.prepareTupleQuery(GET_ENTITY_USAGES);
        query.setBinding(GRAPH_BINDING, factory.createIRI(ontologyIdStr));
        query.setBinding(ENTITY_BINDING, factory.createIRI(entityIRIStr));
        return query.evaluate();
    }

    @Override
    public TupleQueryResult getConceptRelationships(String ontologyIdStr) {
        RepositoryConnection conn = repository.getConnection();
        TupleQuery query = conn.prepareTupleQuery(GET_CONCEPT_RELATIONSHIPS);
        query.setBinding(GRAPH_BINDING, factory.createIRI(ontologyIdStr));
        return query.evaluate();
    }
}
