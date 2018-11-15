package com.mobi.ontology.core.impl.owlapi;

/*-
 * #%L
 * com.mobi.ontology.core.impl.owlapi
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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.utils.cache.OntologyCache;
import com.mobi.persistence.utils.Bindings;
import com.mobi.persistence.utils.QueryResults;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.persistence.utils.api.SesameTransformer;
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
import com.mobi.repository.api.RepositoryManager;
import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import javax.annotation.Nonnull;
import javax.annotation.Nullable;
import javax.cache.Cache;

@Component
public class SimpleOntologyManager implements OntologyManager {

    private ValueFactory valueFactory;
    private SesameTransformer sesameTransformer;
    private ModelFactory modelFactory;
    private CatalogConfigProvider configProvider;
    private CatalogManager catalogManager;
    private RepositoryManager repositoryManager;
    private BranchFactory branchFactory;
    private OntologyCache ontologyCache;
    private BNodeService bNodeService;

    private final Logger log = LoggerFactory.getLogger(SimpleOntologyManager.class);

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

    public SimpleOntologyManager() {
    }

    @Reference
    public void setValueFactory(ValueFactory valueFactory) {
        this.valueFactory = valueFactory;
    }

    @Reference
    public void setModelFactory(ModelFactory modelFactory) {
        this.modelFactory = modelFactory;
    }

    @Reference
    public void setSesameTransformer(SesameTransformer sesameTransformer) {
        this.sesameTransformer = sesameTransformer;
    }

    @Reference
    void setConfigProvider(CatalogConfigProvider configProvider) {
        this.configProvider = configProvider;
    }

    @Reference
    public void setCatalogManager(CatalogManager catalogManager) {
        this.catalogManager = catalogManager;
    }

    @Reference
    public void setRepositoryManager(RepositoryManager repositoryManager) {
        this.repositoryManager = repositoryManager;
    }

    @Reference
    public void setBranchFactory(BranchFactory branchFactory) {
        this.branchFactory = branchFactory;
    }

    @Reference
    public void setOntologyCache(OntologyCache ontologyCache) {
        this.ontologyCache = ontologyCache;
    }

    @Reference
    public void setbNodeService(BNodeService bNodeService) {
        this.bNodeService = bNodeService;
    }

    @Override
    public Ontology createOntology(InputStream inputStream, boolean resolveImports) {
        return new SimpleOntology(inputStream, this, sesameTransformer, bNodeService, resolveImports);
    }

    @Override
    public Ontology createOntology(Model model) {
        return new SimpleOntology(model, this, sesameTransformer, bNodeService);
    }

    @Override
    public boolean ontologyIriExists(Resource ontologyIRI) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            TupleQuery query = conn.prepareTupleQuery(FIND_ONTOLOGY);
            query.setBinding(ONTOLOGY_IRI, ontologyIRI);
            query.setBinding(CATALOG, configProvider.getLocalCatalogIRI());
            TupleQueryResult result = query.evaluate();
            return result.hasNext();
        }
    }

    @Override
    public Optional<Resource> getOntologyRecordResource(@Nonnull Resource ontologyIRI) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            TupleQuery query = conn.prepareTupleQuery(FIND_ONTOLOGY);
            query.setBinding(ONTOLOGY_IRI, ontologyIRI);
            query.setBinding(CATALOG, configProvider.getLocalCatalogIRI());
            TupleQueryResult result = query.evaluate();
            if (!result.hasNext()) {
                return Optional.empty();
            }
            return Optional.of(Bindings.requiredResource(result.next(), RECORD));
        }
    }

    @Override
    public Optional<Ontology> retrieveOntologyByIRI(@Nonnull Resource ontologyIRI) {
        long start = getStartTime();
        Optional<Ontology> ontology = getOntologyRecordResource(ontologyIRI)
                .flatMap(this::retrieveOntologyWithRecordId);
        logTrace("retrieveOntology(ontologyIRI)", start);
        return ontology;
    }

    @Override
    public Optional<Ontology> retrieveOntology(@Nonnull Resource recordId) {
        long start = getStartTime();
        Optional<Ontology> result = retrieveOntologyWithRecordId(recordId);
        logTrace("retrieveOntology(recordId)", start);
        return result;
    }

    @Override
    public Optional<Ontology> retrieveOntology(@Nonnull Resource recordId, @Nonnull Resource branchId) {
        long start = getStartTime();
        Optional<Ontology> result = catalogManager.getBranch(configProvider.getLocalCatalogIRI(), recordId, branchId,
                branchFactory).flatMap(branch -> getOntology(recordId, branch.getResource(), getHeadOfBranch(branch)));
        logTrace("retrieveOntology(recordId, branchId)", start);
        return result;
    }

    @Override
    public Optional<Ontology> retrieveOntology(@Nonnull Resource recordId, @Nonnull Resource branchId,
                                               @Nonnull Resource commitId) {
        Optional<Ontology> result;
        long start = getStartTime();

        Optional<Cache<String, Ontology>> optCache = ontologyCache.getOntologyCache();
        String key = ontologyCache.generateKey(recordId.stringValue(), branchId.stringValue(), commitId.stringValue());

        if (optCache.isPresent() && optCache.get().containsKey(key)) {
            if (log.isTraceEnabled()) log.trace("cache hit");
            result = Optional.ofNullable(optCache.get().get(key));
        } else {
            result = catalogManager.getCommit(configProvider.getLocalCatalogIRI(), recordId, branchId, commitId)
                    .flatMap(commit -> getOntology(recordId, branchId, commitId));
        }

        logTrace("retrieveOntology(recordId, branchId, commitId)", start);
        return result;
    }

    @Override
    public void deleteOntologyBranch(@Nonnull Resource recordId, @Nonnull Resource branchId) {
        long start = getStartTime();
        catalogManager.removeBranch(configProvider.getLocalCatalogIRI(), recordId, branchId);
        ontologyCache.clearCache(recordId, branchId);
        logTrace("deleteOntologyBranch(recordId, branchId)", start);
    }

    @Override
    public OntologyId createOntologyId() {
        return new SimpleOntologyId.Builder(valueFactory).build();
    }

    @Override
    public OntologyId createOntologyId(Resource resource) {
        return new SimpleOntologyId.Builder(valueFactory).id(resource).build();
    }

    @Override
    public OntologyId createOntologyId(IRI ontologyIRI) {
        return new SimpleOntologyId.Builder(valueFactory).ontologyIRI(ontologyIRI).build();
    }

    @Override
    public OntologyId createOntologyId(IRI ontologyIRI, IRI versionIRI) {
        return new SimpleOntologyId.Builder(valueFactory).ontologyIRI(ontologyIRI).versionIRI(versionIRI).build();
    }

    @Override
    public TupleQueryResult getSubClassesOf(Ontology ontology) {
        return runQueryOnOntology(ontology, GET_SUB_CLASSES_OF, null, "getSubClassesOf(ontology)");
    }

    @Override
    public TupleQueryResult getSubClassesOf(RepositoryConnection conn) {
        return runQueryOnOntology(GET_SUB_CLASSES_OF, null, "getSubClassesOf(conn)", conn);
    }

    @Override
    public TupleQueryResult getSubClassesFor(Ontology ontology, IRI iri) {
        return runQueryOnOntology(ontology, String.format(GET_CLASSES_FOR, iri.stringValue()), null,
                "getSubClassesFor(ontology, iri)");
    }

    @Override
    public TupleQueryResult getSubClassesFor(IRI iri, RepositoryConnection conn) {
        return runQueryOnOntology(String.format(GET_CLASSES_FOR, iri.stringValue()), null,
                "getSubClassesFor(iri, conn)", conn);
    }

    @Override
    public TupleQueryResult getSubPropertiesFor(Ontology ontology, IRI iri) {
        return runQueryOnOntology(ontology, String.format(GET_PROPERTIES_FOR, iri.stringValue()), null,
                "getSubPropertiesFor(ontology, iri)");
    }

    @Override
    public TupleQueryResult getSubPropertiesFor(IRI iri, RepositoryConnection conn) {
        return runQueryOnOntology(String.format(GET_PROPERTIES_FOR, iri.stringValue()), null,
                "getSubPropertiesFor(iri, conn)", conn);
    }

    @Override
    public TupleQueryResult getSubDatatypePropertiesOf(Ontology ontology) {
        return runQueryOnOntology(ontology, GET_SUB_DATATYPE_PROPERTIES_OF, null,
                "getSubDatatypePropertiesOf(ontology)");
    }

    @Override
    public TupleQueryResult getSubDatatypePropertiesOf(RepositoryConnection conn) {
        return runQueryOnOntology(GET_SUB_DATATYPE_PROPERTIES_OF, null, "getSubDatatypePropertiesOf(conn)", conn);
    }

    @Override
    public TupleQueryResult getSubAnnotationPropertiesOf(Ontology ontology) {
        return runQueryOnOntology(ontology, GET_SUB_ANNOTATION_PROPERTIES_OF, null,
                "getSubAnnotationPropertiesOf(ontology)");
    }

    @Override
    public TupleQueryResult getSubAnnotationPropertiesOf(RepositoryConnection conn) {
        return runQueryOnOntology(GET_SUB_ANNOTATION_PROPERTIES_OF, null, "getSubAnnotationPropertiesOf(conn)", conn);
    }

    @Override
    public TupleQueryResult getSubObjectPropertiesOf(Ontology ontology) {
        return runQueryOnOntology(ontology, GET_SUB_OBJECT_PROPERTIES_OF, null, "getSubObjectPropertiesOf(ontology)");
    }

    @Override
    public TupleQueryResult getSubObjectPropertiesOf(RepositoryConnection conn) {
        return runQueryOnOntology(GET_SUB_OBJECT_PROPERTIES_OF, null, "getSubObjectPropertiesOf(conn)", conn);
    }

    @Override
    public TupleQueryResult getClassesWithIndividuals(Ontology ontology) {
        return runQueryOnOntology(ontology, GET_CLASSES_WITH_INDIVIDUALS, null, "getClassesWithIndividuals(ontology)");
    }

    @Override
    public TupleQueryResult getClassesWithIndividuals(RepositoryConnection conn) {
        return runQueryOnOntology(GET_CLASSES_WITH_INDIVIDUALS, null, "getClassesWithIndividuals(conn)", conn);
    }

    @Override
    public TupleQueryResult getEntityUsages(Ontology ontology, Resource entity) {
        return runQueryOnOntology(ontology, SELECT_ENTITY_USAGES, tupleQuery -> {
            tupleQuery.setBinding(ENTITY_BINDING, entity);
            return tupleQuery;
        }, "getEntityUsages(ontology, entity)");
    }

    @Override
    public TupleQueryResult getEntityUsages(Resource entity, RepositoryConnection conn) {
        return runQueryOnOntology(SELECT_ENTITY_USAGES, tupleQuery -> {
            tupleQuery.setBinding(ENTITY_BINDING, entity);
            return tupleQuery;
        }, "getEntityUsages(entity, conn)", conn);
    }

    @Override
    public Model constructEntityUsages(Ontology ontology, Resource entity) {
        long start = getStartTime();
        Repository repo = repositoryManager.createMemoryRepository();
        repo.initialize();
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(ontology.asModel(modelFactory));
            return constructEntityUsages(entity, conn);
        } finally {
            repo.shutDown();
            logTrace("constructEntityUsages(ontology, entity)", start);
        }
    }

    @Override
    public Model constructEntityUsages(Resource entity, RepositoryConnection conn) {
        long start = getStartTime();
        try {
            GraphQuery query = conn.prepareGraphQuery(CONSTRUCT_ENTITY_USAGES);
            query.setBinding(ENTITY_BINDING, entity);
            return QueryResults.asModel(query.evaluate(), modelFactory);
        } finally {
            logTrace("constructEntityUsages(entity, conn)", start);
        }
    }

    @Override
    public TupleQueryResult getConceptRelationships(Ontology ontology) {
        return runQueryOnOntology(ontology, GET_CONCEPT_RELATIONSHIPS, null, "getConceptRelationships(ontology)");
    }

    @Override
    public TupleQueryResult getConceptRelationships(RepositoryConnection conn) {
        return runQueryOnOntology(GET_CONCEPT_RELATIONSHIPS, null, "getConceptRelationships(ontology)", conn);
    }

    @Override
    public TupleQueryResult getConceptSchemeRelationships(Ontology ontology) {
        return runQueryOnOntology(ontology, GET_CONCEPT_SCHEME_RELATIONSHIPS, null,
                "getConceptSchemeRelationships(ontology)");
    }

    @Override
    public TupleQueryResult getConceptSchemeRelationships(RepositoryConnection conn) {
        return runQueryOnOntology(GET_CONCEPT_SCHEME_RELATIONSHIPS, null, "getConceptSchemeRelationships(ontology)",
                conn);
    }

    @Override
    public TupleQueryResult getSearchResults(Ontology ontology, String searchText) {
        return runQueryOnOntology(ontology, GET_SEARCH_RESULTS, tupleQuery -> {
            tupleQuery.setBinding(SEARCH_TEXT, valueFactory.createLiteral(searchText.toLowerCase()));
            return tupleQuery;
        }, "getSearchResults(ontology, searchText)");
    }

    @Override
    public TupleQueryResult getSearchResults(String searchText, RepositoryConnection conn) {
        return runQueryOnOntology(GET_SEARCH_RESULTS, tupleQuery -> {
            tupleQuery.setBinding(SEARCH_TEXT, valueFactory.createLiteral(searchText.toLowerCase()));
            return tupleQuery;
        }, "getSearchResults(ontology, searchText)", conn);
    }

    @Override
    public TupleQueryResult getTupleQueryResults(Ontology ontology, String queryString) {
        return runQueryOnOntology(ontology, queryString, null, "getTupleQueryResults(ontology, queryString)");
    }

    @Override
    public Model getGraphQueryResults(Ontology ontology, String queryString) {
        return runGraphQueryOnOntology(ontology, queryString, null, "getGraphQueryResults(ontology, queryString)");
    }

    @Override
    public Model getOntologyModel(Resource recordId) {
        return catalogManager.getCompiledResource(getHeadOfBranch(getMasterBranch(recordId)));
    }

    @Override
    public Model getOntologyModel(Resource recordId, Resource branchId) {
        Branch branch = catalogManager.getBranch(configProvider.getLocalCatalogIRI(), recordId, branchId, branchFactory).get();
        return catalogManager.getCompiledResource(recordId, branchId, getHeadOfBranch(branch));
    }

    private Optional<Ontology> getOntology(@Nonnull Resource recordId, @Nonnull Resource branchId,
                                           @Nonnull Resource commitId) {
        Optional<Ontology> result;
        Optional<Cache<String, Ontology>> optCache = ontologyCache.getOntologyCache();
        String key = ontologyCache.generateKey(recordId.stringValue(), branchId.stringValue(), commitId.stringValue());

        if (optCache.isPresent() && optCache.get().containsKey(key)) {
            log.trace("cache hit");
            result = Optional.ofNullable(optCache.get().get(key));
        } else {
            log.trace("cache miss");
            final Ontology ontology = createOntologyFromCommit(commitId);
            result = Optional.of(ontology);
            ontologyCache.getOntologyCache().ifPresent(cache -> cache.put(key, ontology));
        }
        return result;
    }

    private Resource getHeadOfBranch(Branch branch) {
        return branch.getHead_resource().orElseThrow(() ->
                new IllegalStateException("Branch " + branch.getResource() + "has no head Commit set."));
    }

    /**
     * Creates an Ontology using the provided Commit.
     *
     * @param commit the Commit identifying the version of the Ontology that you want to create.
     * @return an Ontology built at the time identified by the Commit.
     */
    private Ontology createOntologyFromCommit(Resource commit) {
        Model ontologyModel = catalogManager.getCompiledResource(commit);
        return createOntology(ontologyModel);
    }

    /**
     * Executes the provided query on the provided RepositoryConnection.
     *
     * @param ontology    the ontology to query on.
     * @param queryString the query string that you wish to run.
     * @param addBinding  the binding to add to the query, if needed.
     * @param methodName  the name of the method to provide more accurate logging messages.
     * @return the results of the query.
     */
    private TupleQueryResult runQueryOnOntology(Ontology ontology, String queryString,
                                                @Nullable Function<TupleQuery, TupleQuery> addBinding,
                                                String methodName) {
        Repository repo = repositoryManager.createMemoryRepository();
        repo.initialize();
        try (RepositoryConnection conn = repo.getConnection()) {
            Set<Ontology> importedOntologies = ontology.getImportsClosure();
            conn.begin();
            importedOntologies.forEach(ont -> conn.add(ont.asModel(modelFactory)));
            conn.commit();
            return runQueryOnOntology(queryString, addBinding, methodName, conn);
        } finally {
            repo.shutDown();
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

    /**
     * Executes the provided Graph query on the provided Ontology.
     *
     * @param ontology    the ontology to query on.
     * @param queryString the query string that you wish to run.
     * @param addBinding  the binding to add to the query, if needed.
     * @param methodName  the name of the method to provide more accurate logging messages.
     * @return the results of the query as a model.
     */
    private Model runGraphQueryOnOntology(Ontology ontology, String queryString,
                                          @Nullable Function<GraphQuery, GraphQuery> addBinding,
                                          String methodName) {
        Repository repo = repositoryManager.createMemoryRepository();
        repo.initialize();
        try (RepositoryConnection conn = repo.getConnection()) {
            Set<Ontology> importedOntologies = ontology.getImportsClosure();
            conn.begin();
            importedOntologies.forEach(ont -> conn.add(ont.asModel(modelFactory)));
            conn.commit();
            return runGraphQueryOnOntology(queryString, addBinding, methodName, conn);
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
    private Model runGraphQueryOnOntology(String queryString,
                                          @Nullable Function<GraphQuery, GraphQuery> addBinding,
                                          String methodName, RepositoryConnection conn) {
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

    private Optional<Ontology> retrieveOntologyWithRecordId(Resource recordId) {
        Branch masterBranch = getMasterBranch(recordId);
        return getOntology(recordId, masterBranch.getResource(), getHeadOfBranch(masterBranch));
    }

    private Branch getMasterBranch(Resource recordId) {
        return catalogManager.getMasterBranch(configProvider.getLocalCatalogIRI(), recordId);
    }

    private long getStartTime() {
        return log.isTraceEnabled() ? System.currentTimeMillis() : 0L;
    }

    private void logTrace(String methodName, Long start) {
        if (log.isTraceEnabled()) {
            log.trace(String.format(methodName + " complete in %d ms", System.currentTimeMillis() - start));
        }
    }
}
