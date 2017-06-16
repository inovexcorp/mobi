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
import org.apache.commons.io.IOUtils;
import org.matonto.catalog.api.CatalogUtilsService;
import org.matonto.catalog.api.ontologies.mcat.Branch;
import org.matonto.catalog.api.ontologies.mcat.Commit;
import org.matonto.catalog.api.ontologies.mcat.InProgressCommit;
import org.matonto.catalog.api.ontologies.mcat.VersionedRDFRecord;
import org.matonto.catalog.api.versioning.VersioningManager;
import org.matonto.catalog.api.versioning.VersioningService;
import org.matonto.exception.MatOntoException;
import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.matonto.persistence.utils.Bindings;
import org.matonto.persistence.utils.RepositoryResults;
import org.matonto.query.TupleQueryResult;
import org.matonto.query.api.TupleQuery;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.orm.OrmFactory;
import org.matonto.rdf.orm.OrmFactoryRegistry;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.openrdf.model.vocabulary.DCTERMS;
import org.openrdf.model.vocabulary.RDF;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component(
        immediate = true,
        name = SimpleVersioningManager.COMPONENT_NAME
)
public class SimpleVersioningManager implements VersioningManager {
    static final String COMPONENT_NAME = "org.matonto.catalog.api.versioning.VersioningManager";
    private Repository repository;
    private OrmFactoryRegistry factoryRegistry;
    private CatalogUtilsService catalogUtils;
    private Map<String, VersioningService> versioningServices = new HashMap<>();
    private ValueFactory vf;

    @Reference(name = "repository")
    protected void setRepository(Repository repository) {
        this.repository = repository;
    }

    @Reference(type = '*', dynamic = true)
    protected <T extends VersionedRDFRecord> void addVersioningService(VersioningService<T> versioningService) {
        versioningServices.put(versioningService.getTypeIRI(), versioningService);
    }

    protected <T extends VersionedRDFRecord> void removeVersioningService(VersioningService<T> versioningService) {
        versioningServices.remove(versioningService.getTypeIRI());
    }

    @Reference
    protected void setFactoryRegistry(OrmFactoryRegistry factoryRegistry) {
        this.factoryRegistry = factoryRegistry;
    }

    @Reference
    protected void setCatalogUtils(CatalogUtilsService catalogUtils) {
        this.catalogUtils = catalogUtils;
    }

    @Reference
    protected void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    @Override
    public <T extends VersionedRDFRecord> Resource commit(Resource catalogId, Resource recordId, Resource branchId, User user, String message) {
        try (RepositoryConnection conn = repository.getConnection()) {
            OrmFactory<T> correctFactory = getFactory(recordId, conn);
            T record = catalogUtils.getRecord(catalogId, recordId, correctFactory, conn);
            VersioningService<T> service = versioningServices.get(correctFactory.getTypeIRI().stringValue());
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
    public <T extends VersionedRDFRecord> Resource commit(Resource catalogId, Resource recordId, Resource branchId,
                                                          User user, String message, Model additions, Model deletions) {
        try (RepositoryConnection conn = repository.getConnection()) {
            OrmFactory<T> correctFactory = getFactory(recordId, conn);
            T record = catalogUtils.getRecord(catalogId, recordId, correctFactory, conn);
            VersioningService<T> service = versioningServices.get(correctFactory.getTypeIRI().stringValue());
            conn.begin();
            Branch branch = service.getTargetBranch(record, branchId, conn);
            Commit head = service.getBranchHeadCommit(branch, conn);
            Resource commitId = service.addCommit(branch, user, message, additions, deletions, head, null, conn);
            conn.commit();
            return commitId;
        }
    }

    @Override
    public <T extends VersionedRDFRecord>Resource merge(Resource catalogId, Resource recordId, Resource sourceBranchId,
                                                        Resource targetBranchId, User user, Model additions,
                                                        Model deletions) {
        try (RepositoryConnection conn = repository.getConnection()) {
            OrmFactory<T> correctFactory = getFactory(recordId, conn);
            T record = catalogUtils.getRecord(catalogId, recordId, correctFactory, conn);
            VersioningService<T> service = versioningServices.get(correctFactory.getTypeIRI().stringValue());
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
     * @param <T> A class that extends VersionedRDFRecord
     * @return The appropriate OrmFactory for the VersionedRDFRecord
     */
    private <T extends VersionedRDFRecord> OrmFactory<T> getFactory(Resource recordId, RepositoryConnection conn) {
        List<Resource> types = RepositoryResults.asList(conn.getStatements(recordId,
                vf.createIRI(RDF.TYPE.stringValue()), null)).stream()
                .map(statement -> vf.createIRI(statement.getObject().stringValue()))
                .collect(Collectors.toList());
        List<OrmFactory> order = factoryRegistry.getSortedFactoriesOfType(VersionedRDFRecord.class).stream()
                .filter(ormFactory -> types.contains(ormFactory.getTypeIRI()))
                .collect(Collectors.toList());
        OrmFactory<T> factory = null;
        for (OrmFactory fact : order) {
            if (versioningServices.keySet().contains(fact.getTypeIRI().stringValue())) {
                factory = (OrmFactory<T>) fact;
                break;
            }
        }
        return factory;
    }
}
