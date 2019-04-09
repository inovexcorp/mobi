package com.mobi.ontology.impl.owlapi;

/*-
 * #%L
 * com.mobi.ontology.impl.owlapi
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
import aQute.bnd.annotation.component.Modified;
import aQute.bnd.annotation.component.Reference;
import aQute.bnd.annotation.metatype.Configurable;
import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.core.api.config.OntologyManagerConfig;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecordFactory;
import com.mobi.ontology.utils.cache.OntologyCache;
import com.mobi.persistence.utils.Bindings;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.query.TupleQueryResult;
import com.mobi.query.api.TupleQuery;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.api.RepositoryManager;
import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ForkJoinPool;
import javax.annotation.Nonnull;
import javax.cache.Cache;

@Component(
        configurationPolicy = ConfigurationPolicy.optional,
        designateFactory = OntologyManagerConfig.class,
        name = SimpleOntologyManager.COMPONENT_NAME
)
public class SimpleOntologyManager implements OntologyManager {

    private ValueFactory valueFactory;
    private ModelFactory modelFactory;
    private SesameTransformer sesameTransformer;
    private OntologyRecordFactory ontologyRecordFactory;
    private CatalogConfigProvider configProvider;
    private CatalogManager catalogManager;
    private CatalogUtilsService utilsService;
    private RepositoryManager repositoryManager;
    private BranchFactory branchFactory;
    private OntologyCache ontologyCache;
    private BNodeService bNodeService;

    private ForkJoinPool threadPool;

    static final String COMPONENT_NAME = "com.mobi.ontology.core.api.OntologyManager";
    private final Logger log = LoggerFactory.getLogger(SimpleOntologyManager.class);

    private static final String FIND_ONTOLOGY;
    private static final String ONTOLOGY_IRI = "ontologyIRI";
    private static final String CATALOG = "catalog";
    private static final String RECORD = "record";

    static {
        try {
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
    void setOntologyRecordFactory(OntologyRecordFactory ontologyRecordFactory) {
        this.ontologyRecordFactory = ontologyRecordFactory;
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
    void setUtilsService(CatalogUtilsService utilsService) {
        this.utilsService = utilsService;
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

    @Activate
    protected void start(Map<String, Object> props) {
        OntologyManagerConfig config = Configurable.createConfigurable(OntologyManagerConfig.class, props);
        if (config.poolSize() == 0) {
            int cpus = Runtime.getRuntime().availableProcessors();
            log.debug("OntologyManager pool size: " + (cpus / 2));
            threadPool = new ForkJoinPool(cpus / 2);
        } else {
            log.debug("OntologyManager pool size: " + config.poolSize());
            threadPool = new ForkJoinPool(config.poolSize());
        }
    }

    @Modified
    protected void modified(Map<String, Object> props) {
        start(props);
    }

    @Override
    public Ontology createOntology(InputStream inputStream, boolean resolveImports) {
        return new SimpleOntology(inputStream, this, sesameTransformer, bNodeService, repositoryManager,
                resolveImports, threadPool);
    }

    @Override
    public Ontology createOntology(Model model) {
        return new SimpleOntology(model, this, sesameTransformer, bNodeService, repositoryManager, threadPool);
    }

    @Override
    public Ontology applyChanges(Ontology ontology, Difference difference) {
        Model changedOntologyModel = utilsService.applyDifference(ontology.asModel(modelFactory), difference);
        return createOntology(changedOntologyModel);
    }

    @Override
    public Ontology applyChanges(Ontology ontology, InProgressCommit inProgressCommit) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Difference difference = utilsService.getCommitDifference(inProgressCommit.getResource(), conn);
            return applyChanges(ontology, difference);
        }
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
                branchFactory).flatMap(branch -> getOntology(recordId, getHeadOfBranch(branch)));
        logTrace("retrieveOntology(recordId, branchId)", start);
        return result;
    }

    @Override
    public Optional<Ontology> retrieveOntology(@Nonnull Resource recordId, @Nonnull Resource branchId,
                                               @Nonnull Resource commitId) {
        Optional<Ontology> result;
        long start = getStartTime();

        Optional<Cache<String, Ontology>> optCache = ontologyCache.getOntologyCache();
        String key = ontologyCache.generateKey(recordId.stringValue(), commitId.stringValue());

        if (optCache.isPresent() && optCache.get().containsKey(key)) {
            if (log.isTraceEnabled()) {
                log.trace("cache hit");
            }
            result = Optional.ofNullable(optCache.get().get(key));
        } else {
            result = catalogManager.getCommit(configProvider.getLocalCatalogIRI(), recordId, branchId, commitId)
                    .flatMap(commit -> getOntology(recordId, commitId));
        }

        logTrace("retrieveOntology(recordId, branchId, commitId)", start);
        return result;
    }

    @Override
    public Optional<Ontology> retrieveOntologyByCommit(@Nonnull Resource recordId, @Nonnull Resource commitId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            utilsService.validateRecord(configProvider.getLocalCatalogIRI(), recordId,
                    ontologyRecordFactory.getTypeIRI(), conn);
            if (utilsService.commitInRecord(recordId, commitId, conn)) {
                return getOntology(recordId, commitId);
            }
            return Optional.empty();
        }
    }

    @Override
    public void deleteOntologyBranch(@Nonnull Resource recordId, @Nonnull Resource branchId) {
        long start = getStartTime();
        catalogManager.removeBranch(configProvider.getLocalCatalogIRI(), recordId, branchId).forEach(resource ->
                ontologyCache.removeFromCache(recordId.stringValue(), resource.stringValue()));
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
    public Model getOntologyModel(Resource recordId) {
        return catalogManager.getCompiledResource(getHeadOfBranch(getMasterBranch(recordId)));
    }

    @Override
    public Model getOntologyModel(Resource recordId, Resource branchId) {
        Branch branch = catalogManager.getBranch(configProvider.getLocalCatalogIRI(), recordId, branchId, branchFactory)
                .get();
        return catalogManager.getCompiledResource(recordId, branchId, getHeadOfBranch(branch));
    }

    private Optional<Ontology> getOntology(@Nonnull Resource recordId, @Nonnull Resource commitId) {
        Optional<Ontology> result;
        Optional<Cache<String, Ontology>> optCache = ontologyCache.getOntologyCache();
        String key = ontologyCache.generateKey(recordId.stringValue(), commitId.stringValue());

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

    private Optional<Ontology> retrieveOntologyWithRecordId(Resource recordId) {
        Branch masterBranch = getMasterBranch(recordId);
        return getOntology(recordId, getHeadOfBranch(masterBranch));
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
