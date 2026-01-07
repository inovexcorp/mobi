package com.mobi.shapes.impl;

/*-
 * #%L
 * com.mobi.shapes.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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

import com.mobi.catalog.api.BranchManager;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyCreationService;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.utils.cache.OntologyCache;
import com.mobi.ontology.utils.imports.ImportsResolver;
import com.mobi.shapes.api.ShapesGraph;
import com.mobi.shapes.api.ShapesGraphManager;
import com.mobi.shapes.api.ontologies.shapesgrapheditor.ShapesGraphRecord;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;
import javax.annotation.Nonnull;

@Component(
        service = { SimpleShapesGraphManager.class, ShapesGraphManager.class }
)
public class SimpleShapesGraphManager implements ShapesGraphManager {
    private static final Logger log = LoggerFactory.getLogger(SimpleShapesGraphManager.class);
    protected final ValueFactory vf = new ValidatingValueFactory();

    @Reference
    CatalogConfigProvider configProvider;

    @Reference
    RecordManager recordManager;

    @Reference
    BranchManager branchManager;

    @Reference
    CommitManager commitManager;

    @Reference
    ImportsResolver importsResolver;

    @Reference
    OntologyManager ontologyManager;

    @Reference
    OntologyCache ontologyCache;

    @Reference
    OntologyCreationService ontologyCreationService;

    @Override
    public boolean shapesGraphIriExists(Resource shapesGraphId) {
        return importsResolver.getRecordIRIFromOntologyIRI(shapesGraphId).isPresent();
    }

    @Override
    public Optional<ShapesGraph> retrieveShapesGraph(@Nonnull Resource recordId) {
        long start = getStartTime();
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            recordManager.validateRecord(configProvider.getLocalCatalogIRI(), recordId,
                    vf.createIRI(ShapesGraphRecord.TYPE), conn);
            Branch masterBranch = branchManager.getMasterBranch(configProvider.getLocalCatalogIRI(), recordId, conn);
            Optional<ShapesGraph> result = getShapesGraph(recordId, getHeadOfBranch(masterBranch));
            logTrace("retrieveShapesGraph(recordId)", start);
            return result;
        }
    }

    @Override
    public Optional<ShapesGraph> retrieveShapesGraph(@Nonnull Resource recordId, @Nonnull Resource branchId) {
        long start = getStartTime();
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            recordManager.validateRecord(configProvider.getLocalCatalogIRI(), recordId,
                    vf.createIRI(ShapesGraphRecord.TYPE), conn);
            Commit commit = commitManager.getHeadCommit(configProvider.getLocalCatalogIRI(), recordId, branchId, conn);
            Optional<ShapesGraph> result = getShapesGraph(recordId, commit.getResource());
            logTrace("retrieveShapesGraph(recordId, branchId)", start);
            return result;
        }
    }

    @Override
    public Optional<ShapesGraph> retrieveShapesGraph(@Nonnull Resource recordId, @Nonnull Resource branchId,
                                                     @Nonnull Resource commitId) {
        long start = getStartTime();
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            recordManager.validateRecord(configProvider.getLocalCatalogIRI(), recordId,
                    vf.createIRI(ShapesGraphRecord.TYPE), conn);
            commitManager.validateCommitPath(configProvider.getLocalCatalogIRI(), recordId, branchId, commitId, conn);
            Optional<ShapesGraph> result = getShapesGraph(recordId, commitId);
            logTrace("retrieveShapesGraph(recordId, branchId, commitId)", start);
            return result;
        }
    }

    @Override
    public Optional<ShapesGraph> retrieveShapesGraphByCommit(@Nonnull Resource recordId, @Nonnull Resource commitId) {
        long start = getStartTime();
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            recordManager.validateRecord(configProvider.getLocalCatalogIRI(), recordId,
                    vf.createIRI(ShapesGraphRecord.TYPE), conn);
            Optional<ShapesGraph> result = commitManager.commitInRecord(recordId, commitId, conn)
                    ? getShapesGraph(recordId, commitId)
                    : Optional.empty();
            logTrace("retrieveShapesGraphByCommit(recordId, commitId)", start);
            return result;
        }
    }

    @Override
    public ShapesGraph applyChanges(ShapesGraph shapesGraph, InProgressCommit inProgressCommit) {
        ontologyManager.applyChanges(((SimpleShapesGraph) shapesGraph).getOntology(), inProgressCommit);
        return shapesGraph;
    }

    private Optional<ShapesGraph> getShapesGraph(@Nonnull Resource recordId, @Nonnull Resource commitId) {
        return getOntology(recordId, commitId).map(this::getShapesGraphFromOntology);
    }

    private ShapesGraph getShapesGraphFromOntology(Ontology ontology) {
        return new SimpleShapesGraph(ontology);
    }

    private Optional<Ontology> getOntology(@Nonnull Resource recordId, @Nonnull Resource commitId) {
        Optional<Ontology> result;
        String key = ontologyCache.generateKey(recordId.stringValue(), commitId.stringValue());

        if (ontologyCache.containsKey(key)) {
            log.trace("cache hit");
            result = Optional.of(ontologyCreationService.createOntology(recordId, commitId));
        } else {
            log.trace("cache miss");
            // Operation puts the ontology in the cache on construction
            final Ontology ontology = ontologyCreationService.createOntologyFromCommit(recordId, commitId);
            result = Optional.of(ontology);
        }
        return result;
    }

    private Resource getHeadOfBranch(Branch branch) {
        return branch.getHead_resource().orElseThrow(() ->
                new IllegalStateException("Branch " + branch.getResource() + "has no head Commit set."));
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
