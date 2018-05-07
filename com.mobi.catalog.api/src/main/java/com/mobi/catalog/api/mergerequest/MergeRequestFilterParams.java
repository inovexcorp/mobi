package com.mobi.catalog.api.mergerequest;

/*-
 * #%L
 * com.mobi.catalog.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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

import com.mobi.rdf.api.Resource;

import java.util.Optional;

// TODO: THIS DOCUMENTATION AGAIN...... UGHHHHHHH
public class MergeRequestFilterParams {
    private Resource assignee;
    private Resource onRecord;
    private Resource sourceBranch;
    private Resource targetBranch;
    private Resource sourceCommit;
    private Resource targetCommit;
    private Resource sortBy;
    private boolean ascending;
    private boolean accepted;
    private boolean filters;

    public MergeRequestFilterParams(Builder builder) {
        this.assignee = builder.assignee;
        this.onRecord = builder.onRecord;
        this.sourceBranch = builder.sourceBranch;
        this.targetBranch = builder.targetBranch;
        this.sourceCommit = builder.sourceCommit;
        this.targetCommit = builder.targetCommit;
        this.sortBy = builder.sortBy;
        this.ascending = builder.ascending;
        this.accepted = builder.accepted;
        this.filters = builder.filters;
    }

    public Optional<Resource> getAssignee() {
        return Optional.ofNullable(assignee);
    }

    public Optional<Resource> getOnRecord() {
        return Optional.ofNullable(onRecord);
    }

    public Optional<Resource> getSourceBranch() {
        return Optional.ofNullable(sourceBranch);
    }

    public Optional<Resource> getTargetBranch() {
        return Optional.ofNullable(targetBranch);
    }

    public Optional<Resource> getSourceCommit() {
        return Optional.ofNullable(sourceCommit);
    }

    public Optional<Resource> getTargetCommit() {
        return Optional.ofNullable(targetCommit);
    }

    public Optional<Resource> getSortBy() {
        return Optional.ofNullable(sortBy);
    }

    public boolean sortAscending() {
        return ascending;
    }

    public boolean getAccepted() {
        return accepted;
    }

    public boolean hasFilters() {
        return filters;
    }

    public static class Builder {
        private Resource assignee = null;
        private Resource onRecord = null;
        private Resource sourceBranch = null;
        private Resource targetBranch = null;
        private Resource sourceCommit = null;
        private Resource targetCommit = null;
        private Resource sortBy = null;
        private boolean ascending = false;
        private boolean accepted = false;
        private boolean filters = false;

        public Builder() {}

        public Builder setAssignee(Resource assignee) {
            this.assignee = assignee;
            filters = true;
            return this;
        }

        public Builder setOnRecord(Resource onRecord) {
            this.onRecord = onRecord;
            filters = true;
            return this;
        }

        public Builder setSourceBranch(Resource sourceBranch) {
            this.sourceBranch = sourceBranch;
            filters = true;
            return this;
        }

        public Builder setTargetBranch(Resource targetBranch) {
            this.targetBranch = targetBranch;
            filters = true;
            return this;
        }

        public Builder setSourceCommit(Resource sourceCommit) {
            this.sourceCommit = sourceCommit;
            filters = true;
            return this;
        }

        public Builder setTargetCommit(Resource targetCommit) {
            this.targetCommit = targetCommit;
            filters = true;
            return this;
        }

        public Builder setSortBy(Resource sortBy) {
            this.sortBy = sortBy;
            return this;
        }

        public Builder setAscending(boolean ascending) {
            this.ascending = ascending;
            return this;
        }

        public Builder setAccepted(boolean accepted) {
            this.accepted = accepted;
            return this;
        }

        public MergeRequestFilterParams build() {
            return new MergeRequestFilterParams(this);
        }
    }
}
