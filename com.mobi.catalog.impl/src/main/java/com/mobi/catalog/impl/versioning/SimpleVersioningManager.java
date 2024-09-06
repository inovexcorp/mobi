package com.mobi.catalog.impl.versioning;

/*-
 * #%L
 * com.mobi.catalog.impl
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
import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.api.builder.Conflict;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
import com.mobi.catalog.api.ontologies.mcat.MasterBranch;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.versioning.VersioningManager;
import com.mobi.catalog.api.versioning.VersioningService;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.Statements;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ReferenceCardinality;
import org.osgi.service.component.annotations.ReferencePolicy;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
public class SimpleVersioningManager implements VersioningManager {
    private final Map<String, VersioningService<VersionedRDFRecord>> versioningServices = new HashMap<>();

    final ValueFactory vf = new ValidatingValueFactory();
    final ModelFactory mf = new DynamicModelFactory();

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
    RecordManager recordManager;

    @Reference
    BranchManager branchManager;

    @Reference
    BranchFactory branchFactory;

    @Override
    public Resource commit(Resource catalogId, Resource recordId, Resource branchId, User user, String message,
                           RepositoryConnection conn) {
        boolean isActive = conn.isActive();
        OrmFactory<? extends VersionedRDFRecord> correctFactory = getFactory(recordId, conn);
        VersionedRDFRecord record = recordManager.getRecord(catalogId, recordId, correctFactory, conn);
        VersioningService<VersionedRDFRecord> service =
                versioningServices.get(correctFactory.getTypeIRI().stringValue());
        if (!isActive) {
            conn.begin();
        }
        MasterBranch masterBranch = branchManager.getMasterBranch(catalogId, recordId, conn);
        Branch branch = branchManager.getBranch(record, branchId, branchFactory, conn);
        Resource commitResource;
        if (masterBranch.getResource().equals(branch.getResource())) {
            commitResource = service.addMasterCommit(record, masterBranch, user, message, conn);
        } else {
            commitResource = service.addBranchCommit(record, branch, user, message, conn);
        }

        if (!isActive) {
            conn.commit();
        }
        return commitResource;
    }

    @Override
    public Resource merge(Resource catalogId, Resource recordId, Resource sourceBranchId, Resource targetBranchId,
                          User user, Model additions, Model deletions, Map<Resource, Conflict> conflictMap,
                          RepositoryConnection conn) {
        if (sourceBranchId.equals(targetBranchId)) {
            throw new IllegalArgumentException("Cannot merge a branch into itself");
        }
        boolean isActive = conn.isActive();
        OrmFactory<? extends VersionedRDFRecord> correctFactory = getFactory(recordId, conn);
        VersionedRDFRecord record = recordManager.getRecord(catalogId, recordId, correctFactory, conn);
        VersioningService<VersionedRDFRecord> service =
                versioningServices.get(correctFactory.getTypeIRI().stringValue());
        if (!isActive) {
            conn.begin();
        }

        if (additions == null) {
            additions = mf.createEmptyModel();
        }
        if (deletions == null) {
            deletions = mf.createEmptyModel();
        }

        Branch source = branchManager.getBranch(record, sourceBranchId, branchFactory, conn);
        Branch target = branchManager.getBranch(record, targetBranchId, branchFactory, conn);
        MasterBranch masterBranch = branchManager.getMasterBranch(catalogId, recordId, conn);

        Resource commitId;
        if (masterBranch.getResource().equals(target.getResource())) {
            commitId = service.mergeIntoMaster(record, source, masterBranch, user, additions, deletions, conflictMap,
                    conn);
        } else {
            commitId = service.mergeIntoBranch(record, source, target, user, additions, deletions, conflictMap, conn);
        }

        if (!isActive) {
            conn.commit();
        }
        return commitId;
    }

    /**
     * Retrieves the appropriate {@link OrmFactory} for the {@link VersionedRDFRecord} with the passed ID based on its
     * types in the repository, the ordered list of OrmFactories of VersionedRDFRecord subclasses, and the available
     * {@link VersioningService VersioningServices}.
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
                .toList();

        List<OrmFactory<? extends VersionedRDFRecord>> orderedFactories =
                factoryRegistry.getSortedFactoriesOfType(VersionedRDFRecord.class)
                .stream()
                .filter(ormFactory -> types.contains(ormFactory.getTypeIRI()))
                .toList();

        for (OrmFactory<? extends VersionedRDFRecord> factory : orderedFactories) {
            if (versioningServices.containsKey(factory.getTypeIRI().stringValue())) {
                return factory;
            }
        }

        throw new IllegalArgumentException("No known factories for this record type.");
    }
}
