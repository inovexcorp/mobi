package org.matonto.catalog.impl.versioning;

/*-
 * #%L
 * org.matonto.catalog.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
import org.matonto.catalog.api.CatalogManager;
import org.matonto.catalog.api.CatalogUtilsService;
import org.matonto.catalog.api.ontologies.mcat.Branch;
import org.matonto.catalog.api.ontologies.mcat.Commit;
import org.matonto.catalog.api.ontologies.mcat.InProgressCommit;
import org.matonto.catalog.api.ontologies.mcat.VersionedRDFRecord;
import org.matonto.catalog.api.versioning.VersioningManager;
import org.matonto.catalog.api.versioning.VersioningService;
import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.matonto.persistence.utils.RepositoryResults;
import org.matonto.persistence.utils.Statements;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.orm.OrmFactory;
import org.matonto.rdf.orm.OrmFactoryRegistry;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.api.RepositoryManager;
import org.openrdf.model.vocabulary.DCTERMS;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Component(
        name = SimpleVersioningManager.COMPONENT_NAME
)
public class SimpleVersioningManager implements VersioningManager {
    static final String COMPONENT_NAME = "org.matonto.catalog.api.versioning.VersioningManager";
    private RepositoryManager repositoryManager;
    private OrmFactoryRegistry factoryRegistry;
    private CatalogUtilsService catalogUtils;
    private CatalogManager catalogManager;
    private Map<String, VersioningService<VersionedRDFRecord>> versioningServices = new HashMap<>();
    private ValueFactory vf;

    @Reference
    void setRepositoryManager(RepositoryManager repositoryManager) {
        this.repositoryManager = repositoryManager;
    }

    @Reference(type = '*', dynamic = true)
    @SuppressWarnings("unchecked")
    void addVersioningService(VersioningService<? extends VersionedRDFRecord> versioningService) {
        versioningServices.put(versioningService.getTypeIRI(),
                (VersioningService<VersionedRDFRecord>) versioningService);
    }

    void removeVersioningService(VersioningService<? extends VersionedRDFRecord> versioningService) {
        versioningServices.remove(versioningService.getTypeIRI());
    }

    @Reference
    void setFactoryRegistry(OrmFactoryRegistry factoryRegistry) {
        this.factoryRegistry = factoryRegistry;
    }

    @Reference
    void setCatalogUtils(CatalogUtilsService catalogUtils) {
        this.catalogUtils = catalogUtils;
    }

    @Reference
    void setCatalogManager(CatalogManager catalogManager) {
        this.catalogManager = catalogManager;
    }

    @Reference
    void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    @Override
    public Resource commit(Resource catalogId, Resource recordId, Resource branchId, User user, String message) {
        try (RepositoryConnection conn = getCatalogRepoConnection()) {
            OrmFactory<? extends VersionedRDFRecord> correctFactory = getFactory(recordId, conn);
            VersionedRDFRecord record = catalogUtils.getRecord(catalogId, recordId, correctFactory, conn);
            VersioningService<VersionedRDFRecord> service =
                    versioningServices.get(correctFactory.getTypeIRI().stringValue());
            conn.begin();
            Branch branch = service.getTargetBranch(record, branchId, conn);
            Commit head = service.getBranchHeadCommit(branch, conn);
            InProgressCommit inProgressCommit = service.getInProgressCommit(recordId, user, conn);
            Commit newCommit = service.createCommit(inProgressCommit, message, head, null);
            service.addCommit(branch, newCommit, conn);
            service.removeInProgressCommit(inProgressCommit, conn);
            conn.commit();
            return newCommit.getResource();
        }
    }

    @Override
    public Resource commit(Resource catalogId, Resource recordId, Resource branchId, User user, String message,
                           Model additions, Model deletions) {
        try (RepositoryConnection conn = getCatalogRepoConnection()) {
            OrmFactory<? extends VersionedRDFRecord> correctFactory = getFactory(recordId, conn);
            VersionedRDFRecord record = catalogUtils.getRecord(catalogId, recordId, correctFactory, conn);
            VersioningService<VersionedRDFRecord> service =
                    versioningServices.get(correctFactory.getTypeIRI().stringValue());
            conn.begin();
            Branch branch = service.getTargetBranch(record, branchId, conn);
            Commit head = service.getBranchHeadCommit(branch, conn);
            Resource commitId = service.addCommit(branch, user, message, additions, deletions, head, null, conn);
            conn.commit();
            return commitId;
        }
    }

    @Override
    public Resource merge(Resource catalogId, Resource recordId, Resource sourceBranchId, Resource targetBranchId,
                          User user, Model additions, Model deletions) {
        try (RepositoryConnection conn = getCatalogRepoConnection()) {
            OrmFactory<? extends VersionedRDFRecord> correctFactory = getFactory(recordId, conn);
            VersionedRDFRecord record = catalogUtils.getRecord(catalogId, recordId, correctFactory, conn);
            VersioningService<VersionedRDFRecord> service =
                    versioningServices.get(correctFactory.getTypeIRI().stringValue());
            conn.begin();
            Branch source = service.getSourceBranch(record, sourceBranchId, conn);
            Branch target = service.getTargetBranch(record, targetBranchId, conn);
            Resource commitId = service.addCommit(target, user, getMergeMessage(source, target), additions, deletions,
                    service.getBranchHeadCommit(target, conn), service.getBranchHeadCommit(source, conn), conn);
            conn.commit();
            return commitId;
        }
    }

    /**
     * Creates a message for the Commit that occurs as a result of a merge between the provided Branches.
     *
     * @param sourceBranch The source Branch of the merge.
     * @param targetBranch The target Branch of the merge.
     * @return A string message to use for the merge Commit.
     */
    private String getMergeMessage(Branch sourceBranch, Branch targetBranch) {
        IRI titleIRI = vf.createIRI(DCTERMS.TITLE.stringValue());
        String sourceName = sourceBranch.getProperty(titleIRI).orElse(sourceBranch.getResource()).stringValue();
        String targetName = targetBranch.getProperty(titleIRI).orElse(targetBranch.getResource()).stringValue();
        return "Merge of " + sourceName + " into " + targetName;
    }

    /**
     * Retrieves the appropriate {@link OrmFactory} for the {@link VersionedRDFRecord} with the passed ID based on its
     * types in the repository, the ordered list of OrmFactories of VersionedRDFRecord subclasses, and the available
     * {@link VersioningService, VersioningServices}.
     *
     * @param recordId The Resource identifying the Record to retrieve the OrmFactory for
     * @param conn A RepositoryConnection for lookup.
     * @return The appropriate OrmFactory for the VersionedRDFRecord
     * @throws IllegalArgumentException if no appropriate OrmFactory is found.
     */
    private OrmFactory<? extends VersionedRDFRecord> getFactory(Resource recordId, RepositoryConnection conn) {
        List<Resource> types = RepositoryResults.asList(
                conn.getStatements(recordId, vf.createIRI(org.matonto.ontologies.rdfs.Resource.type_IRI), null))
                .stream()
                .map(Statements::objectResource)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toList());

        List<OrmFactory<? extends VersionedRDFRecord>> orderedFactories =
                factoryRegistry.getSortedFactoriesOfType(VersionedRDFRecord.class)
                .stream()
                .filter(ormFactory -> types.contains(ormFactory.getTypeIRI()))
                .collect(Collectors.toList());

        for (OrmFactory<? extends VersionedRDFRecord> factory : orderedFactories) {
            if (versioningServices.keySet().contains(factory.getTypeIRI().stringValue())) {
                return factory;
            }
        }

        throw new IllegalArgumentException("No known factories for this record type.");
    }

    private RepositoryConnection getCatalogRepoConnection() {
        return repositoryManager.getRepository(catalogManager.getRepositoryId()).orElseThrow(() ->
                new IllegalStateException("Catalog repository unavailable")).getConnection();
    }
}
