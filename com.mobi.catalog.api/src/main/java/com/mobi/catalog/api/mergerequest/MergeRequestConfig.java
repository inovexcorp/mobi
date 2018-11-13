package com.mobi.catalog.api.mergerequest;

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

import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.rdf.api.Resource;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

public class MergeRequestConfig {
    private String title;
    private String description;
    private Resource recordId;
    private Resource sourceBranchId;
    private Resource targetBranchId;
    private User creator;
    private Set<User> assignees;
    private boolean removeSource;

    public MergeRequestConfig(Builder builder) {
        this.title = builder.title;
        this.description = builder.description;
        this.recordId = builder.recordId;
        this.sourceBranchId = builder.sourceBranchId;
        this.targetBranchId = builder.targetBranchId;
        this.creator = builder.creator;
        this.assignees = builder.assignees;
        this.removeSource = builder.removeSource;
    }

    public String getTitle() {
        return title;
    }

    public Optional<String> getDescription() {
        return Optional.ofNullable(description);
    }

    public Resource getRecordId() {
        return recordId;
    }

    public Resource getSourceBranchId() {
        return sourceBranchId;
    }

    public Resource getTargetBranchId() {
        return targetBranchId;
    }

    public User getCreator() {
        return creator;
    }

    public Set<User> getAssignees() {
        return assignees;
    }

    public boolean getRemoveSource() {
        return removeSource;
    }


    public static class Builder {
        private String title;
        private String description;
        private Resource recordId;
        private Resource sourceBranchId;
        private Resource targetBranchId;
        private User creator;
        private Set<User> assignees = new HashSet<>();
        private boolean removeSource;

        public Builder(String title, Resource recordId, Resource sourceBranchId, Resource targetBranchId,
                       User creator, boolean removeSource) {
            this.title = title;
            this.recordId = recordId;
            this.sourceBranchId = sourceBranchId;
            this.targetBranchId = targetBranchId;
            this.creator = creator;
            this.removeSource = removeSource;
        }

        public Builder description(String description) {
            this.description = description;
            return this;
        }

        public Builder addAssignee(User assignee) {
            this.assignees.add(assignee);
            return this;
        }

        public MergeRequestConfig build() {
            return new MergeRequestConfig(this);
        }
    }
}
