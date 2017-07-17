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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import org.apache.commons.io.IOUtils;
import org.matonto.cache.api.CacheManager;
import org.matonto.catalog.api.CatalogManager;
import org.matonto.catalog.api.ontologies.mcat.Branch;
import org.matonto.catalog.api.ontologies.mcat.BranchFactory;
import org.matonto.exception.MatOntoException;
import org.matonto.ontology.core.api.Ontology;
import org.matonto.ontology.core.api.OntologyId;
import org.matonto.ontology.core.api.OntologyManager;
import org.matonto.ontology.core.api.builder.OntologyRecordConfig;
import org.matonto.ontology.core.api.ontologies.ontologyeditor.OntologyRecord;
import org.matonto.ontology.core.api.ontologies.ontologyeditor.OntologyRecordFactory;
import org.matonto.ontology.core.utils.MatontoOntologyCreationException;
import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.ontology.utils.cache.OntologyCache;
import org.matonto.persistence.utils.Bindings;
import org.matonto.persistence.utils.QueryResults;
import org.matonto.query.TupleQueryResult;
import org.matonto.query.api.GraphQuery;
import org.matonto.query.api.TupleQuery;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.api.RepositoryManager;
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

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import javax.annotation.Nonnull;
import javax.annotation.Nullable;
import javax.cache.Cache;

@Component(
        provide = OntologyManager.class,
        name = SimpleOntologyManager.COMPONENT_NAME)
public class SimpleOntologyManager implements OntologyManager {

    protected static final String COMPONENT_NAME = "org.matonto.ontology.core.OntologyManager";
    private ValueFactory valueFactory;
    private SesameTransformer sesameTransformer;
    private ModelFactory modelFactory;
    private CatalogManager catalogManager;
    private OntologyRecordFactory ontologyRecordFactory;
    private RepositoryManager repositoryManager;
    private BranchFactory branchFactory;
    private CacheManager cacheManager;

    private final Logger log = LoggerFactory.getLogger(SimpleOntologyManager.class);

    private static final String GET_SUB_CLASSES_OF;
    private static final String GET_CLASSES_FOR;
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
            throw new MatOntoException(e);
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
    public void setOntologyRecordFactory(OntologyRecordFactory ontologyRecordFactory) {
        this.ontologyRecordFactory = ontologyRecordFactory;
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
    public void setCacheManager(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    @Override
    public OntologyRecord createOntologyRecord(OntologyRecordConfig config) {
        OntologyRecord record = catalogManager.createRecord(config, ontologyRecordFactory);
        config.getOntologyIRI().ifPresent(record::setOntologyIRI);
        return record;
    }

    @Override
    public Ontology createOntology(OntologyId ontologyId) {
        return new SimpleOntology(ontologyId, this, sesameTransformer);
    }

    @Override
    public Ontology createOntology(File file) throws FileNotFoundException {
        return new SimpleOntology(file, this, sesameTransformer);
    }

    @Override
    public Ontology createOntology(IRI iri) {
        return new SimpleOntology(iri, this, sesameTransformer);
    }

    @Override
    public Ontology createOntology(InputStream inputStream) {
        return new SimpleOntology(inputStream, this, sesameTransformer);
    }

    @Override
    public Ontology createOntology(String json) {
        return new SimpleOntology(json, this, sesameTransformer);
    }

    @Override
    public Ontology createOntology(Model model) {
        try {
            OWLOntologyManager manager = OWLManager.createOWLOntologyManager();
            OWLOntology ontology = manager.createOntology();
            org.openrdf.model.Model sesameModel = sesameTransformer.sesameModel(model);
            OWLOntologyLoaderConfiguration config = new OWLOntologyLoaderConfiguration()
                    .setMissingImportHandlingStrategy(MissingImportHandlingStrategy.SILENT);
            RioParserImpl parser = new RioParserImpl(new RioRDFXMLDocumentFormatFactory());
            parser.parse(new RioMemoryTripleSource(sesameModel), ontology, config);
            return SimpleOntologyValues.matontoOntology(ontology);
        } catch (OWLOntologyCreationException e) {
            throw new MatontoOntologyCreationException("Unable to create an ontology object.", e);
        }
    }

    @Override
    public boolean ontologyIriExists(Resource ontologyIRI) {
        Repository system = repositoryManager.getRepository("system").orElseThrow(() ->
                new IllegalStateException("System Repository unavailable"));
        try (RepositoryConnection conn = system.getConnection()) {
            TupleQuery query = conn.prepareTupleQuery(FIND_ONTOLOGY);
            query.setBinding(ONTOLOGY_IRI, ontologyIRI);
            query.setBinding(CATALOG, catalogManager.getLocalCatalogIRI());
            TupleQueryResult result = query.evaluate();
            return result.hasNext();
        }
    }

    @Override
    public Optional<Resource> getOntologyRecordResource(@Nonnull Resource ontologyIRI) {
        Repository system = repositoryManager.getRepository("system").orElseThrow(() ->
                new IllegalStateException("System Repository unavailable"));
        try (RepositoryConnection conn = system.getConnection()) {
            TupleQuery query = conn.prepareTupleQuery(FIND_ONTOLOGY);
            query.setBinding(ONTOLOGY_IRI, ontologyIRI);
            query.setBinding(CATALOG, catalogManager.getLocalCatalogIRI());
            TupleQueryResult result = query.evaluate();
            if (!result.hasNext()) {
                return Optional.empty();
            }
            return Optional.of(Bindings.requiredResource(result.next(), RECORD));
        }
    }

    @Override
    public Optional<Ontology> retrieveOntologyByIRI(@Nonnull Resource ontologyIRI) {
        long start = log.isTraceEnabled() ? System.currentTimeMillis() : 0L;
        Optional<Ontology> ontology = getOntologyRecordResource(ontologyIRI)
                .flatMap(this::retrieveOntologyWithRecordId);

        if (log.isTraceEnabled()) {
            log.trace(String.format("retrieveOntology(record) complete in %d ms",
                    System.currentTimeMillis() - start));
        }

        return ontology;
    }

    @Override
    public Optional<Ontology> retrieveOntology(@Nonnull Resource recordId) {
        long start = log.isTraceEnabled() ? System.currentTimeMillis() : 0L;
        Optional<Ontology> result = retrieveOntologyWithRecordId(recordId);

        if (log.isTraceEnabled()) {
            log.trace(String.format("retrieveOntology(record) complete in %d ms", System.currentTimeMillis() - start));
        }

        return result;
    }

    @Override
    public Optional<Ontology> retrieveOntology(@Nonnull Resource recordId, @Nonnull Resource branchId) {
        long start = log.isTraceEnabled() ? System.currentTimeMillis() : 0L;
        Optional<Ontology> result = catalogManager.getBranch(catalogManager.getLocalCatalogIRI(), recordId, branchId,
                branchFactory).flatMap(branch -> getOntology(recordId, branch.getResource(), getHeadOfBranch(branch)));

        if (log.isTraceEnabled()) {
            log.trace(String.format("retrieveOntology(record, branch) complete in %d ms",
                    System.currentTimeMillis() - start));
        }

        return result;
    }

    @Override
    public Optional<Ontology> retrieveOntology(@Nonnull Resource recordId, @Nonnull Resource branchId,
                                               @Nonnull Resource commitId) {
        Optional<Ontology> result;
        long start = log.isTraceEnabled() ? System.currentTimeMillis() : 0L;

        Optional<Cache<String, Ontology>> optCache = getOntologyCache();
        String key = OntologyCache.generateKey(recordId.stringValue(), branchId.stringValue(), commitId.stringValue());

        if (optCache.isPresent() && optCache.get().containsKey(key)) {
            log.trace("cache hit");
            result = Optional.ofNullable(optCache.get().get(key));
        } else {
            result = catalogManager.getCommit(catalogManager.getLocalCatalogIRI(), recordId, branchId, commitId)
                    .flatMap(commit -> getOntology(recordId, branchId, commitId));
        }

        if (log.isTraceEnabled()) {
            log.trace(String.format("retrieveOntology(record, branch, commit) complete in %d ms",
                    System.currentTimeMillis() - start));
        }

        return result;
    }

    @Override
    public void deleteOntology(@Nonnull Resource recordId) {
        Resource catalogId = catalogManager.getLocalCatalog().getResource();
        OntologyRecord record = catalogManager.getRecord(catalogId, recordId, ontologyRecordFactory).orElseThrow(() ->
                new IllegalArgumentException("Ontology Record " + recordId + " not found"));
        catalogManager.removeRecord(catalogManager.getLocalCatalog().getResource(), recordId);
        clearCache(recordId, null);
        record.getOntologyIRI().ifPresent(this::cleanUpCache);
    }

    @Override
    public void deleteOntologyBranch(@Nonnull Resource recordId, @Nonnull Resource branchId) {
        catalogManager.removeBranch(catalogManager.getLocalCatalogIRI(), recordId, branchId);
        clearCache(recordId, branchId);
    }

    private void clearCache(@Nonnull Resource recordId, Resource branchId) {
        String key = OntologyCache.generateKey(recordId.stringValue(), branchId == null ? null : branchId.stringValue(),
                null);
        getOntologyCache().ifPresent(cache -> cache.forEach(entry -> {
            if (entry.getKey().startsWith(key)) {
                cache.remove(entry.getKey());
            }
        }));
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
        return runQueryOnOntology(ontology, GET_SUB_CLASSES_OF, null);
    }

    @Override
    public TupleQueryResult getSubClassesFor(Ontology ontology, IRI iri) {
        return runQueryOnOntology(ontology, String.format(GET_CLASSES_FOR, iri.stringValue()), null);
    }

    @Override
    public TupleQueryResult getSubDatatypePropertiesOf(Ontology ontology) {
        return runQueryOnOntology(ontology, GET_SUB_DATATYPE_PROPERTIES_OF, null);
    }

    @Override
    public TupleQueryResult getSubAnnotationPropertiesOf(Ontology ontology) {
        return runQueryOnOntology(ontology, GET_SUB_ANNOTATION_PROPERTIES_OF, null);
    }

    @Override
    public TupleQueryResult getSubObjectPropertiesOf(Ontology ontology) {
        return runQueryOnOntology(ontology, GET_SUB_OBJECT_PROPERTIES_OF, null);
    }

    @Override
    public TupleQueryResult getClassesWithIndividuals(Ontology ontology) {
        return runQueryOnOntology(ontology, GET_CLASSES_WITH_INDIVIDUALS, null);
    }

    @Override
    public TupleQueryResult getEntityUsages(Ontology ontology, Resource entity) {
        return runQueryOnOntology(ontology, SELECT_ENTITY_USAGES, tupleQuery -> {
            tupleQuery.setBinding(ENTITY_BINDING, entity);
            return tupleQuery;
        });
    }

    @Override
    public Model constructEntityUsages(Ontology ontology, Resource entity) {
        Repository repo = repositoryManager.createMemoryRepository();
        repo.initialize();
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(ontology.asModel(modelFactory));
            GraphQuery query = conn.prepareGraphQuery(CONSTRUCT_ENTITY_USAGES);
            query.setBinding(ENTITY_BINDING, entity);
            return QueryResults.asModel(query.evaluate(), modelFactory);
        } finally {
            repo.shutDown();
        }
    }

    @Override
    public TupleQueryResult getConceptRelationships(Ontology ontology) {
        return runQueryOnOntology(ontology, GET_CONCEPT_RELATIONSHIPS, null);
    }

    @Override
    public TupleQueryResult getConceptSchemeRelationships(Ontology ontology) {
        return runQueryOnOntology(ontology, GET_CONCEPT_SCHEME_RELATIONSHIPS, null);
    }

    @Override
    public TupleQueryResult getSearchResults(Ontology ontology, String searchText) {
        return runQueryOnOntology(ontology, GET_SEARCH_RESULTS, tupleQuery -> {
            tupleQuery.setBinding(SEARCH_TEXT, valueFactory.createLiteral(searchText.toLowerCase()));
            return tupleQuery;
        });
    }

    @Override
    public void cleanUpCache(Resource removedOntologyIRI) {
        Optional<Cache<String, Ontology>> optCache = getOntologyCache();
        optCache.ifPresent(cache -> {
            Set<String> cachesToRemove = new HashSet<>();
            cache.forEach(entry -> {
                Set<? extends Resource> importedIRIs = entry.getValue().getImportedOntologyIRIs();
                if (importedIRIs.contains(removedOntologyIRI)) {
                    cachesToRemove.add(entry.getKey());
                }
            });
            cache.removeAll(cachesToRemove);
        });
    }

    private Optional<Ontology> getOntology(@Nonnull Resource recordId, @Nonnull Resource branchId,
                                           @Nonnull Resource commitId) {
        Optional<Ontology> result;
        Optional<Cache<String, Ontology>> optCache = getOntologyCache();
        String key = OntologyCache.generateKey(recordId.stringValue(), branchId.stringValue(), commitId.stringValue());

        if (optCache.isPresent() && optCache.get().containsKey(key)) {
            log.trace("cache hit");
            result = Optional.ofNullable(optCache.get().get(key));
        } else {
            log.trace("cache miss");
            final Ontology ontology = createOntologyFromCommit(commitId);
            result = Optional.of(ontology);
            getOntologyCache().ifPresent(cache -> cache.put(key, ontology));
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
     * Executes the provided query on the provided Ontology.
     *
     * @param ontology    the ontology to query on.
     * @param queryString the query string that you wish to run.
     * @return the results of the query.
     */
    private TupleQueryResult runQueryOnOntology(Ontology ontology, String queryString,
                                                @Nullable Function<TupleQuery, TupleQuery> addBinding) {
        Repository repo = repositoryManager.createMemoryRepository();
        repo.initialize();
        try (RepositoryConnection conn = repo.getConnection()) {
            Set<Ontology> importedOntologies = ontology.getImportsClosure();
            conn.begin();
            conn.add(ontology.asModel(modelFactory));
            importedOntologies.forEach(ont -> conn.add(ont.asModel(modelFactory)));
            conn.commit();
            TupleQuery query = conn.prepareTupleQuery(queryString);
            if (addBinding != null) {
                query = addBinding.apply(query);
            }
            return query.evaluateAndReturn();
        } finally {
            repo.shutDown();
        }
    }

    private Optional<javax.cache.Cache<String, Ontology>> getOntologyCache() {
        Optional<Cache<String, Ontology>> cache = Optional.empty();
        if (cacheManager != null) {
            cache = cacheManager.getCache(OntologyCache.CACHE_NAME, String.class, Ontology.class);
        }
        return cache;
    }

    private Optional<Ontology> retrieveOntologyWithRecordId(Resource recordId) {
        Branch masterBranch = catalogManager.getMasterBranch(catalogManager.getLocalCatalogIRI(), recordId);
        return getOntology(recordId, masterBranch.getResource(), getHeadOfBranch(masterBranch));
    }
}
