package com.mobi.catalog.api.versioning;

/*-
 * #%L
 * com.mobi.catalog.api
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


import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.CatalogTopics;
import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.CommitFactory;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.event.Event;
import org.osgi.service.event.EventAdmin;

import java.util.HashMap;
import java.util.Map;
import javax.annotation.Nullable;

public abstract class BaseVersioningService<T extends VersionedRDFRecord> implements VersioningService<T> {
    protected BranchFactory branchFactory;
    protected CommitFactory commitFactory;
    protected CatalogManager catalogManager;
    protected CatalogUtilsService catalogUtils;
    protected EventAdmin eventAdmin;

    @Override
    public Branch getBranch(T record, Resource branchId, RepositoryConnection conn) {
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
    public Resource addCommit(VersionedRDFRecord record, Branch branch, User user, String message, Model additions,
                              Model deletions, @Nullable Commit baseCommit, @Nullable Commit auxCommit,
                              RepositoryConnection conn) {
        Commit newCommit = createCommit(catalogManager.createInProgressCommit(user), message, baseCommit, auxCommit);
        catalogUtils.updateCommit(newCommit, additions, deletions, conn);
        catalogUtils.addCommit(branch, newCommit, conn);
        sendCommitEvent(record.getResource(), branch.getResource(), user.getResource(), newCommit.getResource());
        return newCommit.getResource();
    }

    @Override
    public void addCommit(VersionedRDFRecord record, Branch branch, Commit commit, RepositoryConnection conn) {
        catalogUtils.addCommit(branch, commit, conn);
        commit.getWasAssociatedWith_resource().stream().findFirst()
                .ifPresent(userIri -> sendCommitEvent(record.getResource(), branch.getResource(), userIri,
                        commit.getResource()));
    }

    protected void sendCommitEvent(Resource record, Resource branch, Resource user, Resource newCommit) {
        if (eventAdmin != null) {
            Map<String, Object> eventProps = new HashMap<>();
            eventProps.put(CatalogTopics.PROPERTY_COMMIT, newCommit);
            eventProps.put(CatalogTopics.PROPERTY_USER, user);
            eventProps.put(CatalogTopics.PROPERTY_BRANCH, branch);
            eventProps.put(CatalogTopics.PROPERTY_RECORD, record);
            Event event = new Event(CatalogTopics.TOPIC_NAME, eventProps);
            eventAdmin.postEvent(event);
        }
    }
}
