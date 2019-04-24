package com.mobi.ontology.impl.repository;

import com.mobi.exception.MobiException;
import com.mobi.ontology.core.api.Annotation;
import com.mobi.ontology.core.api.AnnotationProperty;
import com.mobi.ontology.core.api.DataProperty;
import com.mobi.ontology.core.api.Datatype;
import com.mobi.ontology.core.api.Hierarchy;
import com.mobi.ontology.core.api.Individual;
import com.mobi.ontology.core.api.OClass;
import com.mobi.ontology.core.api.ObjectProperty;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.utils.MobiOntologyException;
import com.mobi.persistence.utils.QueryResults;
import com.mobi.query.TupleQueryResult;
import com.mobi.query.api.GraphQuery;
import com.mobi.query.api.TupleQuery;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import javax.annotation.Nullable;

public class SimpleOntology implements Ontology {

    private static final Logger LOG = LoggerFactory.getLogger(SimpleOntology.class);

    private static final String GET_SUB_CLASSES_OF;
    private static final String GET_CLASSES_FOR;
    private static final String GET_PROPERTIES_FOR;
    private static final String GET_SUB_DATATYPE_PROPERTIES_OF;
    private static final String GET_SUB_OBJECT_PROPERTIES_OF;
    private static final String GET_CLASSES_WITH_INDIVIDUALS;
    private static final String SELECT_ENTITY_USAGES;
    private static final String CONSTRUCT_ENTITY_USAGES;
    private static final String GET_CONCEPT_RELATIONSHIPS;
    private static final String GET_CONCEPT_SCHEME_RELATIONSHIPS;
    private static final String GET_SEARCH_RESULTS;
    private static final String GET_SUB_ANNOTATION_PROPERTIES_OF;
    private static final String FIND_ONTOLOGY;
    private static final String ENTITY_BINDING = "entity";
    private static final String SEARCH_TEXT = "searchText";
    private static final String ONTOLOGY_IRI = "ontologyIRI";
    private static final String CATALOG = "catalog";
    private static final String RECORD = "record";

    static {
        try {
            GET_SUB_CLASSES_OF = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-sub-classes-of.rq"),
                    "UTF-8"
            );
            GET_CLASSES_FOR = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-sub-classes-for.rq"),
                    "UTF-8"
            );
            GET_PROPERTIES_FOR = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-sub-properties-for.rq"),
                    "UTF-8"
            );
            GET_SUB_DATATYPE_PROPERTIES_OF = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-sub-datatype-properties-of.rq"),
                    "UTF-8"
            );
            GET_SUB_OBJECT_PROPERTIES_OF = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-sub-object-properties-of.rq"),
                    "UTF-8"
            );
            GET_CLASSES_WITH_INDIVIDUALS = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-classes-with-individuals.rq"),
                    "UTF-8"
            );
            SELECT_ENTITY_USAGES = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-entity-usages.rq"),
                    "UTF-8"
            );
            CONSTRUCT_ENTITY_USAGES = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/construct-entity-usages.rq"),
                    "UTF-8"
            );
            GET_CONCEPT_RELATIONSHIPS = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-concept-relationships.rq"),
                    "UTF-8"
            );
            GET_CONCEPT_SCHEME_RELATIONSHIPS = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-concept-scheme-relationships.rq"),
                    "UTF-8"
            );
            GET_SEARCH_RESULTS = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-search-results.rq"),
                    "UTF-8"
            );
            GET_SUB_ANNOTATION_PROPERTIES_OF = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-sub-annotation-properties-of.rq"),
                    "UTF-8"
            );
            FIND_ONTOLOGY = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/find-ontology.rq"),
                    "UTF-8"
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    SimpleOntology(InputStream inputStream, Repository repository) {

    }

    SimpleOntology(Model model, Repository repository) {

    }

    SimpleOntology(String recordCommitKey, Repository repository) {

    }

    @Override
    public Model asModel(ModelFactory factory) throws MobiOntologyException {
        Model model = factory.createModel();
        return model;
    }

    @Override
    public OutputStream asTurtle() throws MobiOntologyException {
        return null;
    }

    @Override
    public OutputStream asRdfXml() throws MobiOntologyException {
        return null;
    }

    @Override
    public OutputStream asOwlXml() throws MobiOntologyException {
        return null;
    }

    @Override
    public OutputStream asJsonLD(boolean skolemize) throws MobiOntologyException {
        return null;
    }

    @Override
    public OntologyId getOntologyId() {
        return null;
    }

    @Override
    public Set<IRI> getUnloadableImportIRIs() {
        return null;
    }

    @Override
    public Set<Ontology> getImportsClosure() {
        return null;
    }

    @Override
    public Set<IRI> getImportedOntologyIRIs() {
        return null;
    }

    @Override
    public Set<Annotation> getOntologyAnnotations() {
        return null;
    }

    @Override
    public Set<Annotation> getAllAnnotations() {
        return null;
    }

    @Override
    public Set<AnnotationProperty> getAllAnnotationProperties() {
        return null;
    }

    @Override
    public boolean containsClass(IRI iri) {
        return false;
    }

    @Override
    public Set<OClass> getAllClasses() {
        return null;
    }

    @Override
    public Set<ObjectProperty> getAllClassObjectProperties(IRI iri) {
        return null;
    }

    @Override
    public Set<ObjectProperty> getAllNoDomainObjectProperties() {
        return null;
    }

    @Override
    public Set<DataProperty> getAllClassDataProperties(IRI iri) {
        return null;
    }

    @Override
    public Set<DataProperty> getAllNoDomainDataProperties() {
        return null;
    }

    @Override
    public Set<Datatype> getAllDatatypes() {
        return null;
    }

    @Override
    public Set<ObjectProperty> getAllObjectProperties() {
        return null;
    }

    @Override
    public Optional<ObjectProperty> getObjectProperty(IRI iri) {
        return Optional.empty();
    }

    @Override
    public Set<Resource> getObjectPropertyRange(ObjectProperty objectProperty) {
        return null;
    }

    @Override
    public Set<DataProperty> getAllDataProperties() {
        return null;
    }

    @Override
    public Optional<DataProperty> getDataProperty(IRI iri) {
        return Optional.empty();
    }

    @Override
    public Set<Resource> getDataPropertyRange(DataProperty dataProperty) {
        return null;
    }

    @Override
    public Set<Individual> getAllIndividuals() {
        return null;
    }

    @Override
    public Set<Individual> getIndividualsOfType(IRI classIRI) {
        return null;
    }

    @Override
    public Set<Individual> getIndividualsOfType(OClass clazz) {
        return null;
    }

    @Override
    public Hierarchy getSubClassesOf(ValueFactory vf, ModelFactory mf) {
        return null;
    }

    @Override
    public Set<IRI> getSubClassesFor(IRI iri) {
        return null;
    }

    @Override
    public Set<IRI> getSubPropertiesFor(IRI iri) {
        return null;
    }

    @Override
    public Hierarchy getSubDatatypePropertiesOf(ValueFactory vf, ModelFactory mf) {
        return null;
    }

    @Override
    public Hierarchy getSubAnnotationPropertiesOf(ValueFactory vf, ModelFactory mf) {
        return null;
    }

    @Override
    public Hierarchy getSubObjectPropertiesOf(ValueFactory vf, ModelFactory mf) {
        return null;
    }

    @Override
    public Hierarchy getClassesWithIndividuals(ValueFactory vf, ModelFactory mf) {
        return null;
    }

    @Override
    public TupleQueryResult getEntityUsages(Resource entity) {
        return null;
    }

    @Override
    public Model constructEntityUsages(Resource entity, ModelFactory modelFactory) {
        return null;
    }

    @Override
    public Hierarchy getConceptRelationships(ValueFactory vf, ModelFactory mf) {
        return null;
    }

    @Override
    public Hierarchy getConceptSchemeRelationships(ValueFactory vf, ModelFactory mf) {
        return null;
    }

    @Override
    public TupleQueryResult getSearchResults(String searchText, ValueFactory valueFactory) {
        return null;
    }

    @Override
    public TupleQueryResult getTupleQueryResults(String queryString, boolean includeImports) {
        return null;
    }

    @Override
    public Model getGraphQueryResults(String queryString, boolean includeImports, ModelFactory modelFactory) {
        return null;
    }

    @Override
    public boolean equals(Object obj) {
//        if (this == obj) {
//            return true;
//        }
//
//        if (obj instanceof SimpleOntology) {
//            SimpleOntology simpleOntology = (SimpleOntology) obj;
//            OntologyId ontologyId = simpleOntology.getOntologyId();
//            if (this.ontologyId.equals(ontologyId)) {
//                org.eclipse.rdf4j.model.Model thisSesameModel = this.asSesameModel();
//                org.eclipse.rdf4j.model.Model otherSesameModel = simpleOntology.asSesameModel();
//                return Models.isomorphic(thisSesameModel, otherSesameModel);
//            }
//        }
//
//        return false;
    }

    @Override
    public int hashCode() {
//        // TODO: This looks like an expensive operation
//        org.eclipse.rdf4j.model.Model sesameModel = this.asSesameModel();
//        return this.ontologyId.hashCode() + sesameModel.hashCode();
    }




    /**
     * Executes the provided Graph query on the provided Ontology.
     *
     * @param queryString the query string that you wish to run.
     * @param addBinding  the binding to add to the query, if needed.
     * @param methodName  the name of the method to provide more accurate logging messages.
     * @return the results of the query as a model.
     */
    private Model runGraphQueryOnOntology(String queryString,
                                          @Nullable Function<GraphQuery, GraphQuery> addBinding,
                                          String methodName, boolean includeImports, ModelFactory modelFactory) {
        Repository repo = repoManager.createMemoryRepository();
        repo.initialize();
        try (RepositoryConnection conn = repo.getConnection()) {
            addOntologyData(conn, includeImports);
            return runGraphQueryOnOntology(queryString, addBinding, methodName, conn, modelFactory);
        } finally {
            repo.shutDown();
        }
    }

    /**
     * Executes the provided Graph query on the provided RepositoryConnection.
     *
     * @param queryString the query string that you wish to run.
     * @param addBinding  the binding to add to the query, if needed.
     * @param methodName  the name of the method to provide more accurate logging messages.
     * @param conn        the {@link RepositoryConnection} to run the query against.
     * @return the results of the query as a model.
     */
    private Model runGraphQueryOnOntology(String queryString, @Nullable Function<GraphQuery, GraphQuery> addBinding,
                                          String methodName, RepositoryConnection conn, ModelFactory modelFactory) {
        long start = getStartTime();
        try {
            GraphQuery query = conn.prepareGraphQuery(queryString);
            if (addBinding != null) {
                query = addBinding.apply(query);
            }
            return QueryResults.asModel(query.evaluate(), modelFactory);
        } finally {
            logTrace(methodName, start);
        }
    }

    /**
     * Executes the provided query on the provided RepositoryConnection.
     *
     * @param queryString the query string that you wish to run.
     * @param addBinding  the binding to add to the query, if needed.
     * @param methodName  the name of the method to provide more accurate logging messages.
     * @param conn        the {@link RepositoryConnection} to run the query against.
     * @return the results of the query.
     */
    private TupleQueryResult runQueryOnOntology(String queryString,
                                                @Nullable Function<TupleQuery, TupleQuery> addBinding,
                                                String methodName, RepositoryConnection conn) {
        long start = getStartTime();
        try {
            TupleQuery query = conn.prepareTupleQuery(queryString);
            if (addBinding != null) {
                query = addBinding.apply(query);
            }
            return query.evaluateAndReturn();
        } finally {
            logTrace(methodName, start);
        }
    }

    private long getStartTime() {
        return LOG.isTraceEnabled() ? System.currentTimeMillis() : 0L;
    }

    private void logTrace(String methodName, Long start) {
        if (LOG.isTraceEnabled()) {
            LOG.trace(String.format(methodName + " complete in %d ms", System.currentTimeMillis() - start));
        }
    }
}
