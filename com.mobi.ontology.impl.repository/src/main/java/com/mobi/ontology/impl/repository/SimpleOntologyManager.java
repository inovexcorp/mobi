package com.mobi.ontology.impl.repository;

/*-
 * #%L
 * com.mobi.ontology.impl.repository
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.CompiledResourceManager;
import com.mobi.catalog.api.DifferenceManager;
import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.namespace.api.NamespaceService;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyCreationService;
import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecordFactory;
import com.mobi.ontology.utils.cache.OntologyCache;
import com.mobi.persistence.utils.Bindings;
import com.mobi.setting.api.SettingService;
import com.mobi.setting.api.ontologies.setting.ApplicationSetting;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.ConfigurationPolicy;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Objects;
import java.util.Optional;
import javax.annotation.Nonnull;

@Component(
        service = { SimpleOntologyManager.class, OntologyManager.class },
        name = SimpleOntologyManager.COMPONENT_NAME,
        configurationPolicy = ConfigurationPolicy.REQUIRE
)
public class SimpleOntologyManager implements OntologyManager {
    protected Logger log;
    protected final ValueFactory valueFactory = new ValidatingValueFactory();
    static final String COMPONENT_NAME = "com.mobi.ontology.impl.repository.OntologyManager";

    protected static final String FIND_ONTOLOGY;
    protected static final String ONTOLOGY_IRI = "ontologyIRI";
    protected static final String CATALOG = "catalog";
    protected static final String RECORD = "record";

    static {
        try {
            FIND_ONTOLOGY = IOUtils.toString(
                    Objects.requireNonNull(SimpleOntologyManager.class.getResourceAsStream("/find-ontology.rq")),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Reference
    public OntologyRecordFactory ontologyRecordFactory;

    @Reference
    public BranchFactory branchFactory;

    @Reference
    public OntologyCache ontologyCache;

    @Reference
    public CatalogConfigProvider configProvider;

    @Reference
    public CatalogManager catalogManager;

    @Reference
    public RecordManager recordManager;

    @Reference
    public BranchManager branchManager;

    @Reference
    public CommitManager commitManager;

    @Reference
    public DifferenceManager differenceManager;

    @Reference
    public CompiledResourceManager compiledResourceManager;

    @Reference(target = "(settingType=Application)")
    protected SettingService<ApplicationSetting> settingService;

    @Reference
    protected NamespaceService namespaceService;

    @Reference
    protected OntologyCreationService ontologyCreationService;


    public SimpleOntologyManager() {
    }

    /**
     * Activate method required in order to have config file service.ranking property used.
     */
    @Activate
    public void activate() {
        log = LoggerFactory.getLogger(SimpleOntologyManager.class);
        log.trace("Repository based SimpleOntologyManager started.");
    }

    @Modified
    public void modified() {
        log = LoggerFactory.getLogger(SimpleOntologyManager.class);
        log.trace("Repository based SimpleOntologyManager restarted.");
    }

    @Override
    public Ontology applyChanges(Ontology ontology, Difference difference) {
        if (ontology instanceof SimpleOntology) {
            SimpleOntology simpleOntology = (SimpleOntology) ontology;
            simpleOntology.setDifference(difference);
            return simpleOntology;
        } else {
            throw new MobiException("Ontology must be a " + SimpleOntology.class.toString());
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
        Difference difference = differenceManager.getCommitDifference(inProgressCommit.getResource(), conn);
        return applyChanges(ontology, difference);
    }

    @Override
    public boolean ontologyIriExists(Resource ontologyIRI) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            TupleQuery query = conn.prepareTupleQuery(FIND_ONTOLOGY);
            query.setBinding(ONTOLOGY_IRI, ontologyIRI);
            query.setBinding(CATALOG, configProvider.getLocalCatalogIRI());
            TupleQueryResult result = query.evaluate();
            boolean exists = result.hasNext();
            result.close();
            return exists;
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
            Optional<Resource> ontologyResourceOpt = Optional.of(Bindings.requiredResource(result.next(), RECORD));
            result.close();
            return ontologyResourceOpt;
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
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            long start = getStartTime();
            Optional<Ontology> result = branchManager.getBranchOpt(configProvider.getLocalCatalogIRI(), recordId, branchId,
                    branchFactory, conn).flatMap(branch -> getOntology(recordId, getHeadOfBranch(branch)));
            logTrace("retrieveOntology(recordId, branchId)", start);
            return result;
        }
    }

    @Override
    public Optional<Ontology> retrieveOntology(@Nonnull Resource recordId, @Nonnull Resource branchId,
                                               @Nonnull Resource commitId) {
        long start = getStartTime();

        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Optional<Ontology> result = commitManager.getCommit(configProvider.getLocalCatalogIRI(), recordId, branchId,
                    commitId, conn).flatMap(commit -> getOntology(recordId, commitId));

            logTrace("retrieveOntology(recordId, branchId, commitId)", start);
            return result;
        }
    }

    @Override
    public Optional<Ontology> retrieveOntologyByCommit(@Nonnull Resource recordId, @Nonnull Resource commitId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            recordManager.validateRecord(configProvider.getLocalCatalogIRI(), recordId,
                    ontologyRecordFactory.getTypeIRI(), conn);
            if (commitManager.commitInRecord(recordId, commitId, conn)) {
                return getOntology(recordId, commitId);
            }
            return Optional.empty();
        }
    }

    @Override
    public Model getOntologyModel(Resource recordId, Resource branchId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Branch branch = branchManager.getBranch(configProvider.getLocalCatalogIRI(), recordId, branchId,
                    branchFactory, conn);
            return compiledResourceManager.getCompiledResource(recordId, branchId, getHeadOfBranch(branch), conn);
        }
    }

    @Override
    public OntologyId createOntologyId() {
        return new SimpleOntologyId.Builder(settingService, namespaceService).build();
    }

    @Override
    public OntologyId createOntologyId(Resource resource) {
        return new SimpleOntologyId.Builder(settingService, namespaceService).id(resource).build();
    }

    @Override
    public OntologyId createOntologyId(IRI ontologyIRI) {
        return new SimpleOntologyId.Builder(settingService, namespaceService).ontologyIRI(ontologyIRI).build();
    }

    @Override
    public OntologyId createOntologyId(IRI ontologyIRI, IRI versionIRI) {
        return new SimpleOntologyId.Builder(settingService, namespaceService).ontologyIRI(ontologyIRI).versionIRI(versionIRI).build();
    }

    @Override
    public OntologyId createOntologyId(Model model) {
        return new SimpleOntologyId.Builder(settingService, namespaceService).model(model).build();
    }

    protected Optional<Ontology> getOntology(@Nonnull Resource recordId, @Nonnull Resource commitId) {
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


    private Optional<Ontology> retrieveOntologyWithRecordId(Resource recordId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Branch masterBranch = branchManager.getMasterBranch(configProvider.getLocalCatalogIRI(), recordId, conn);
            return getOntology(recordId, getHeadOfBranch(masterBranch));
        }
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
