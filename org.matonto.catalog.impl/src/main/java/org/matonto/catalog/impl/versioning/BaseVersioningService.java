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
import org.matonto.catalog.api.ontologies.mcat.BranchFactory;
import org.matonto.catalog.api.ontologies.mcat.Commit;
import org.matonto.catalog.api.ontologies.mcat.CommitFactory;
import org.matonto.catalog.api.ontologies.mcat.InProgressCommit;
import org.matonto.catalog.api.ontologies.mcat.VersionedRDFRecord;
import org.matonto.catalog.api.versioning.VersioningService;
import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.Resource;
import org.matonto.repository.api.RepositoryConnection;

@Component(immediate = true)
public class BaseVersioningService implements VersioningService<VersionedRDFRecord> {
    private BranchFactory branchFactory;
    private CommitFactory commitFactory;
    private CatalogManager catalogManager;
    private CatalogUtilsService catalogUtils;

    @Reference
    protected void setBranchFactory(BranchFactory branchFactory) {
        this.branchFactory = branchFactory;
    }

    @Reference
    protected void setCommitFactory(CommitFactory commitFactory) {
        this.commitFactory = commitFactory;
    }

    @Reference
    protected void setCatalogManager(CatalogManager catalogManager) {
        this.catalogManager = catalogManager;
    }

    @Reference
    protected void setCatalogUtils(CatalogUtilsService catalogUtils) {
        this.catalogUtils = catalogUtils;
    }

    @Override
    public String getTypeIRI() {
        return VersionedRDFRecord.TYPE;
    }

    @Override
    public Branch getSourceBranch(VersionedRDFRecord record, Resource branchId, RepositoryConnection conn) {
        return catalogUtils.getBranch(record, branchId, branchFactory, conn);
    }

    @Override
    public Branch getTargetBranch(VersionedRDFRecord record, Resource branchId, RepositoryConnection conn) {
        return catalogUtils.getBranch(record, branchId, branchFactory, conn);
    }

    @Override
    public InProgressCommit getInProgressCommit(Resource recordId, User user, RepositoryConnection conn) {
        return catalogUtils.getInProgressCommit(recordId, user.getResource(), conn);
    }

    @Override
    public Commit getBranchHeadCommit(Branch branch, RepositoryConnection conn) {
        return branch.getHead_resource().map(resource -> catalogUtils.getObject(resource, commitFactory, conn))
                .orElse(null);
    }

    @Override
    public void removeInProgressCommit(InProgressCommit commit, RepositoryConnection conn) {
        catalogUtils.removeInProgressCommit(commit, conn);
    }

    @Override
    public Commit createCommit(InProgressCommit commit, String message, Commit baseCommit, Commit auxCommit) {
        return catalogManager.createCommit(commit, message, baseCommit, auxCommit);
    }

    @Override
    public Resource addCommit(Branch branch, User user, String message, Model additions, Model deletions,
                            Commit baseCommit, Commit auxCommit, RepositoryConnection conn) {
        Commit newCommit = createCommit(catalogManager.createInProgressCommit(user), message, baseCommit, auxCommit);
        catalogUtils.updateCommit(newCommit, additions, deletions, conn);
        catalogUtils.addCommit(branch, newCommit, conn);
        return newCommit.getResource();
    }

    @Override
    public void addCommit(Branch branch, Commit commit, RepositoryConnection conn) {
        catalogUtils.addCommit(branch, commit, conn);
    }
}
