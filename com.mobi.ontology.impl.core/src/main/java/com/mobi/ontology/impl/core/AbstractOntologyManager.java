package com.mobi.ontology.impl.core;

/*-
 * #%L
 * com.mobi.ontology.impl.core
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

import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyManager;
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

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import javax.annotation.Nonnull;
import javax.cache.Cache;

public abstract class AbstractOntologyManager implements OntologyManager  {
    protected Logger log;
    protected ValueFactory valueFactory;
    protected ModelFactory modelFactory;
    protected SesameTransformer sesameTransformer;
    protected OntologyRecordFactory ontologyRecordFactory;
    protected RepositoryManager repositoryManager;
    protected BranchFactory branchFactory;
    protected OntologyCache ontologyCache;
    protected CatalogConfigProvider configProvider;
    protected CatalogManager catalogManager;
    protected CatalogUtilsService utilsService;
    protected BNodeService bNodeService;

    protected static final String FIND_ONTOLOGY;
    protected static final String ONTOLOGY_IRI = "ontologyIRI";
    protected static final String CATALOG = "catalog";
    protected static final String RECORD = "record";

    static {
        try {
            FIND_ONTOLOGY = IOUtils.toString(
                    AbstractOntologyManager.class.getResourceAsStream("/find-ontology.rq"),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Override
    public Ontology applyChanges(Ontology ontology, Resource inProgressCommitId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Resource ontologyIRI = ontology.getOntologyId().getOntologyIRI()
                    .orElse((IRI) ontology.getOntologyId().getOntologyIdentifier());
            Resource recordId = getOntologyRecordResource(ontologyIRI).orElseThrow(
                    () -> new IllegalStateException("OntologyIRI " + ontologyIRI
                            + " is not associated with an OntologyRecord"));
            InProgressCommit inProgressCommit = catalogManager.getInProgressCommit(
                    configProvider.getLocalCatalogIRI(), recordId, inProgressCommitId).orElseThrow(
                        () -> new IllegalStateException("InProgressCommit for " + inProgressCommitId
                                + " could not be found"));
            return applyInProgressCommitChanges(ontology, inProgressCommit, conn);
        }
    }

    @Override
    public Ontology applyChanges(Ontology ontology, InProgressCommit inProgressCommit) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            return applyInProgressCommitChanges(ontology, inProgressCommit, conn);
        }
    }

    private Ontology applyInProgressCommitChanges(Ontology ontology, InProgressCommit inProgressCommit,
                                                  RepositoryConnection conn) {
        Difference difference = utilsService.getCommitDifference(inProgressCommit.getResource(), conn);
        return applyChanges(ontology, difference);
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
    public Model getOntologyModel(Resource recordId) {
        return catalogManager.getCompiledResource(getHeadOfBranch(getMasterBranch(recordId)));
    }

    @Override
    public Model getOntologyModel(Resource recordId, Resource branchId) {
        Branch branch = catalogManager.getBranch(configProvider.getLocalCatalogIRI(), recordId, branchId, branchFactory)
                .orElseThrow(() -> new IllegalArgumentException("Branch does not belong to OntologyRecord"));
        return catalogManager.getCompiledResource(recordId, branchId, getHeadOfBranch(branch));
    }

    protected abstract Optional<Ontology> getOntology(@Nonnull Resource recordId, @Nonnull Resource commitId);

    private Resource getHeadOfBranch(Branch branch) {
        return branch.getHead_resource().orElseThrow(() ->
                new IllegalStateException("Branch " + branch.getResource() + "has no head Commit set."));
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
