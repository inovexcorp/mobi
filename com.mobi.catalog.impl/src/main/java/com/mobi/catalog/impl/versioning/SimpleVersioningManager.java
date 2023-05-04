package com.mobi.catalog.impl.versioning;

/*-
 * #%L
 * com.mobi.catalog.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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


import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.versioning.VersioningManager;
import com.mobi.catalog.api.versioning.VersioningService;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.Statements;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.osgi.service.component.annotations.ReferenceCardinality;
import org.osgi.service.component.annotations.ReferencePolicy;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class SimpleVersioningManager implements VersioningManager {
    private Map<String, VersioningService<VersionedRDFRecord>> versioningServices = new HashMap<>();

    final ValueFactory vf = new ValidatingValueFactory();

    @Reference(cardinality = ReferenceCardinality.MULTIPLE, policy = ReferencePolicy.DYNAMIC)
    @SuppressWarnings("unchecked")
    void addVersioningService(VersioningService<? extends VersionedRDFRecord> versioningService) {
        versioningServices.put(versioningService.getTypeIRI(),
                (VersioningService<VersionedRDFRecord>) versioningService);
    }

    void removeVersioningService(VersioningService<? extends VersionedRDFRecord> versioningService) {
        versioningServices.remove(versioningService.getTypeIRI());
    }

    @Reference
    OrmFactoryRegistry factoryRegistry;

    @Reference
    CatalogUtilsService catalogUtils;

    @Reference
    CatalogConfigProvider config;

    @Override
    public Resource commit(Resource catalogId, Resource recordId, Resource branchId, User user, String message,
                           RepositoryConnection conn) {
        boolean isActive = conn.isActive();
        OrmFactory<? extends VersionedRDFRecord> correctFactory = getFactory(recordId, conn);
        VersionedRDFRecord record = catalogUtils.getRecord(catalogId, recordId, correctFactory, conn);
        VersioningService<VersionedRDFRecord> service =
                versioningServices.get(correctFactory.getTypeIRI().stringValue());
        if (!isActive) {
            conn.begin();
        }
        Resource commitResource = commitToBranch(record, service, branchId, user, message, conn);
        if (!isActive) {
            conn.commit();
        }
        return commitResource;
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
            Resource commitId = mergeBranches(record, service, sourceBranchId, targetBranchId, user, additions,
                    deletions, conn);
            conn.commit();
            return commitId;
        }
    }

    /**
     * Creates and adds a new Commit to Branch with the specified branchId. Uses the provided VersioningService to
     * perform operations.
     *
     * @param record A VersionedRDFRecord to commit changes to.
     * @param service The VersioningService to perform operations.
     * @param branchId The target Branch of the commit.
     * @param user The User performing the operation.
     * @param message The commit message.
     * @param conn A RepositoryConnection used by the VersioningService.
     * @return The Resource of the new Commit.
     */
    private Resource commitToBranch(VersionedRDFRecord record, VersioningService<VersionedRDFRecord> service,
                                    Resource branchId, User user, String message, RepositoryConnection conn) {
        Branch branch = service.getBranch(record, branchId, conn);
        Commit head = service.getBranchHeadCommit(branch, conn);
        InProgressCommit inProgressCommit = service.getInProgressCommit(record.getResource(), user, conn);
        Commit newCommit = service.createCommit(inProgressCommit, message, head, null);
        service.addCommit(branch, newCommit, conn);
        service.removeInProgressCommit(inProgressCommit, conn);

        return newCommit.getResource();
    }

    /**
     * Adds a new Commit to Branch with the specified branchId. Uses the provided VersioningService to perform
     * the operation.
     *
     * @param record A VersionedRDFRecord to commit changes to.
     * @param service The VersioningService to perform the operation.
     * @param branchId The target Branch of the commit.
     * @param user The User performing the operation.
     * @param message The commit message.
     * @param additions The Model of additions to commit.
     * @param deletions The Model of deletions to commit.
     * @param conn A RepositoryConnection used by the VersioningService.
     * @return The Resource of the new Commit.
     */
    private Resource commitToBranch(VersionedRDFRecord record, VersioningService<VersionedRDFRecord> service,
                                    Resource branchId, User user, String message, Model additions, Model deletions,
                                    RepositoryConnection conn) {
        Branch branch = service.getBranch(record, branchId, conn);
        Commit head = service.getBranchHeadCommit(branch, conn);

        return service.addCommit(branch, user, message, additions, deletions, head, null, conn);
    }

    /**
     * Adds a Commit representing the merge of the Branch associated with the sourceBranchId into the Branch associated
     * with the targetBranchId on the target Branch.
     *
     * @param record A VersionedRDFRecord to commit changes to.
     * @param service The VersioningService to perform the operation.
     * @param sourceBranchId The Resource of the source Branch.
     * @param targetBranchId The Resource of the target Branch.
     * @param user The User performing the operation.
     * @param additions The Model of additions to commit.
     * @param deletions The Model of deletions to commit.
     * @param conn A RepositoryConnection used by the VersioningService.
     * @return The Resource of the new Commit.
     */
    private Resource mergeBranches(VersionedRDFRecord record, VersioningService<VersionedRDFRecord> service,
                                   Resource sourceBranchId, Resource targetBranchId, User user, Model additions,
                                   Model deletions, RepositoryConnection conn) {
        Branch source = service.getBranch(record, sourceBranchId, conn);
        Branch target = service.getBranch(record, targetBranchId, conn);

        return service.addCommit(target, user, getMergeMessage(source, target), additions, deletions,
                service.getBranchHeadCommit(target, conn), service.getBranchHeadCommit(source, conn), conn);
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
     * @param recordId The Resource identifying the Record to retrieve the OrmFactory for.
     * @param conn A RepositoryConnection for lookup.
     * @return The appropriate OrmFactory for the VersionedRDFRecord.
     * @throws IllegalArgumentException if no appropriate OrmFactory is found.
     */
    private OrmFactory<? extends VersionedRDFRecord> getFactory(Resource recordId, RepositoryConnection conn) {
        List<Resource> types = QueryResults.asList(
                conn.getStatements(recordId, vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI), null))
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
        return config.getRepository().getConnection();
    }
}
