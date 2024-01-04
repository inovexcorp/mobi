package com.mobi.catalog.impl;

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
import com.mobi.catalog.api.Catalogs;
import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.api.ThingManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecordFactory;
import com.mobi.catalog.api.record.RecordService;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.persistence.utils.ConnectionUtils;
import com.mobi.rdf.orm.OrmFactory;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import javax.annotation.Nonnull;

@Component
public class SimpleBranchManager implements BranchManager {

    final ValueFactory vf = new ValidatingValueFactory();

    @Reference
    RecordManager recordManager;

    @Reference
    ThingManager thingManager;

    @Reference
    BranchFactory branchFactory;

    @Reference
    VersionedRDFRecordFactory versionedRDFRecordFactory;

    @Override
    public <T extends Branch> void addBranch(Resource catalogId, Resource versionedRDFRecordId, T branch,
                                             RepositoryConnection conn) {
        VersionedRDFRecord record = recordManager.getRecord(catalogId, versionedRDFRecordId, versionedRDFRecordFactory,
                conn);
        if (ConnectionUtils.containsContext(conn, branch.getResource())) {
            throw thingManager.throwAlreadyExists(branch.getResource(), branchFactory);
        }
        Set<Branch> branches = record.getBranch_resource().stream()
                .map(branchFactory::createNew)
                .collect(Collectors.toSet());
        branches.add(branch);
        record.setBranch(branches);
        record.setProperty(vf.createLiteral(OffsetDateTime.now()), vf.createIRI(_Thing.modified_IRI));
        thingManager.updateObject(record, conn);
        thingManager.addObject(branch, conn);
    }


    @Override
    public <T extends Branch> T createBranch(@Nonnull String title, String description, OrmFactory<T> factory) {
        OffsetDateTime now = OffsetDateTime.now();

        T branch = factory.createNew(vf.createIRI(Catalogs.BRANCH_NAMESPACE + UUID.randomUUID()));
        branch.setProperty(vf.createLiteral(title), vf.createIRI(_Thing.title_IRI));
        branch.setProperty(vf.createLiteral(now), vf.createIRI(_Thing.issued_IRI));
        branch.setProperty(vf.createLiteral(now), vf.createIRI(_Thing.modified_IRI));
        if (description != null) {
            branch.setProperty(vf.createLiteral(description), vf.createIRI(_Thing.description_IRI));
        }

        return branch;
    }

    @Override
    public <T extends Branch> Optional<T> getBranchOpt(Resource catalogId, Resource versionedRDFRecordId,
                                                       Resource branchId, OrmFactory<T> factory,
                                                       RepositoryConnection conn) {
        VersionedRDFRecord record = recordManager.getRecord(catalogId, versionedRDFRecordId, versionedRDFRecordFactory,
                conn);
        if (!record.getBranch_resource().contains(branchId)) {
            return Optional.empty();
        }
        return Optional.of(thingManager.getExpectedObject(branchId, factory, conn));
    }

    @Override
    public <T extends Branch> T getBranch(Resource catalogId, Resource recordId, Resource branchId,
                                          OrmFactory<T> factory, RepositoryConnection conn) {
        validateBranch(catalogId, recordId, branchId, conn);
        return thingManager.getObject(branchId, factory, conn);
    }

    @Override
    public <T extends Branch> T getBranch(VersionedRDFRecord record, Resource branchId, OrmFactory<T> factory,
                                          RepositoryConnection conn) {
        testBranchPath(record, branchId);
        return thingManager.getObject(branchId, factory, conn);
    }

    @Override
    public Set<Branch> getBranches(Resource catalogId, Resource versionedRDFRecordId, RepositoryConnection conn) {
        VersionedRDFRecord record = recordManager.getRecord(catalogId, versionedRDFRecordId, versionedRDFRecordFactory,
                conn);
        return record.getBranch_resource().stream()
                .map(resource -> thingManager.getExpectedObject(resource, branchFactory, conn))
                .collect(Collectors.toSet());
    }

    @Override
    public Branch getMasterBranch(Resource catalogId, Resource versionedRDFRecordId, RepositoryConnection conn) {
        VersionedRDFRecord record = recordManager.getRecord(catalogId, versionedRDFRecordId, versionedRDFRecordFactory,
                conn);
        Resource branchId = record.getMasterBranch_resource().orElseThrow(() ->
                new IllegalStateException("Record " + versionedRDFRecordId
                        + " does not have a master Branch set."));
        return thingManager.getExpectedObject(branchId, branchFactory, conn);
    }

    @Override
    public List<Resource> removeBranch(Resource catalogId, Resource versionedRDFRecordId, Resource branchId,
                                       RepositoryConnection conn) {
        RecordService<?> recordService = recordManager.getRecordService(versionedRDFRecordId, conn);
        return recordService.deleteBranch(catalogId, versionedRDFRecordId, branchId, conn)
                .orElseThrow(() -> new IllegalArgumentException("Record does not support Delete Branch operation"));
    }

    @Override
    public <T extends Branch> void updateBranch(Resource catalogId, Resource versionedRDFRecordId, T newBranch,
                                                RepositoryConnection conn) {
        IRI masterBranchIRI = vf.createIRI(VersionedRDFRecord.masterBranch_IRI);
        validateBranch(catalogId, versionedRDFRecordId, newBranch.getResource(), conn);
        if (ConnectionUtils.contains(conn, null, masterBranchIRI, newBranch.getResource())) {
            throw new IllegalArgumentException("Branch " + newBranch.getResource()
                    + " is the master Branch and cannot be updated.");
        }
        newBranch.setProperty(vf.createLiteral(OffsetDateTime.now()), vf.createIRI(_Thing.modified_IRI));
        thingManager.updateObject(newBranch, conn);
    }

    @Override
    public void validateBranch(Resource catalogId, Resource recordId, Resource branchId, RepositoryConnection conn) {
        VersionedRDFRecord record = recordManager.getRecord(catalogId, recordId, versionedRDFRecordFactory, conn);
        testBranchPath(record, branchId);
    }

    private void testBranchPath(VersionedRDFRecord record, Resource branchId) {
        Set<Resource> branchIRIs = record.getBranch_resource();
        if (!branchIRIs.contains(branchId)) {
            throw thingManager.throwDoesNotBelong(branchId, branchFactory, record.getResource(),
                    versionedRDFRecordFactory);
        }
    }
}
