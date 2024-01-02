package com.mobi.catalog.api.versioning;

/*-
 * #%L
 * com.mobi.catalog.api
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
import com.mobi.catalog.api.CatalogTopics;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.CompiledResourceManager;
import com.mobi.catalog.api.DifferenceManager;
import com.mobi.catalog.api.ThingManager;
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
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.event.Event;
import org.osgi.service.event.EventAdmin;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import javax.annotation.Nullable;

public abstract class BaseVersioningService<T extends VersionedRDFRecord> implements VersioningService<T> {
    @Reference
    public BranchFactory branchFactory;

    @Reference
    public CommitFactory commitFactory;

    @Reference
    public CommitManager commitManager;

    @Reference
    public ThingManager thingManager;

    @Reference
    public BranchManager branchManager;

    @Reference
    public CompiledResourceManager compiledResourceManager;

    @Reference
    public DifferenceManager differenceManager;

    public EventAdmin eventAdmin;

    @Override
    public void addCommit(VersionedRDFRecord record, Branch branch, Commit commit, RepositoryConnection conn) {
        commitManager.addCommit(branch, commit, conn);
        commit.getWasAssociatedWith_resource().stream().findFirst()
                .ifPresent(userIri -> sendCommitEvent(record.getResource(), branch.getResource(), userIri,
                        commit.getResource()));
    }

    @Override
    public Resource addCommit(VersionedRDFRecord record, Branch branch, User user, String message, Model additions,
                              Model deletions, @Nullable Commit baseCommit, @Nullable Commit auxCommit,
                              RepositoryConnection conn) {
        InProgressCommit inProgressCommit = commitManager.createInProgressCommit(user);
        Commit newCommit = commitManager.createCommit(inProgressCommit, message, baseCommit, auxCommit);
        commitManager.updateCommit(newCommit, additions, deletions, conn);
        commitManager.addCommit(branch, newCommit, conn);
        sendCommitEvent(record.getResource(), branch.getResource(), user.getResource(), newCommit.getResource());
        return newCommit.getResource();
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

    protected boolean isMasterBranch(VersionedRDFRecord record, Branch branch) {
        Optional<Resource> optMasterBranch = record.getMasterBranch_resource();
        return optMasterBranch.isPresent() && optMasterBranch.get().equals(branch.getResource());
    }
}
