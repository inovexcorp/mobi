package com.mobi.catalog.api.versioning;

/*-
 * #%L
 * com.mobi.catalog.api
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


import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.CommitFactory;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.repository.api.RepositoryConnection;

import javax.annotation.Nullable;

public abstract class BaseVersioningService<T extends VersionedRDFRecord> implements VersioningService<T> {
    protected BranchFactory branchFactory;
    protected CommitFactory commitFactory;
    protected CatalogManager catalogManager;
    protected CatalogUtilsService catalogUtils;

    @Override
    public Branch getSourceBranch(T record, Resource branchId, RepositoryConnection conn) {
        return catalogUtils.getBranch(record, branchId, branchFactory, conn);
    }

    @Override
    public Branch getTargetBranch(T record, Resource branchId, RepositoryConnection conn) {
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
    public Commit createCommit(InProgressCommit commit, String message, @Nullable Commit baseCommit,
                               @Nullable Commit auxCommit) {
        return catalogManager.createCommit(commit, message, baseCommit, auxCommit);
    }

    @Override
    public Resource addCommit(Branch branch, User user, String message, Model additions, Model deletions,
                              @Nullable Commit baseCommit, @Nullable Commit auxCommit, RepositoryConnection conn) {
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
