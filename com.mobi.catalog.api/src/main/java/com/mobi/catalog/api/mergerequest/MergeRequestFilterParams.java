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

/**
 * MergeRequestFilterParams class to help query getMergeRequests. Allows equality filtering on a particular Resource.
 * Equality filtering options include assignee, onRecord, sourceBranch, targetBranch, and removeSource.
 * AcceptedMergeRequests can additionally filter on sourceCommit and targetCommit. Also provides a way to sort
 * (ascending or descending) the getMergeRequest query results by a provided sortBy Resource.
 */
public class MergeRequestFilterParams {
    private Resource assignee;
    private Resource onRecord;
    private Resource sourceBranch;
    private Resource targetBranch;
    private Resource sourceCommit;
    private Resource targetCommit;
    private Resource sortBy;
    private Optional<Boolean> removeSource;
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
        this.removeSource = builder.removeSource;
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

    public Optional<Boolean> getRemoveSource() {
        return removeSource;
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
        private Optional<Boolean> removeSource = Optional.empty();
        private boolean ascending = false;
        private boolean accepted = false;
        private boolean filters = false;

        public Builder() {}

        /**
         * Set the filter on assignee of the MergeRequest.
         *
         * @param assignee The Resource of the assignee
         * @return MergeRequestFilterParams.Builder
         */
        public Builder setAssignee(Resource assignee) {
            this.assignee = assignee;
            filters = true;
            return this;
        }

        /**
         * Set the filter on onRecord associated with the MergeRequest.
         *
         * @param onRecord The Resource of the VersionedRDFRecord for the MergeRequest
         * @return MergeRequestFilterParams.Builder
         */
        public Builder setOnRecord(Resource onRecord) {
            this.onRecord = onRecord;
            filters = true;
            return this;
        }

        /**
         * Set the filter on sourceBranch of the MergeRequest.
         *
         * @param sourceBranch The Resource identifying the Branch that is being merged
         * @return MergeRequestFilterParams.Builder
         */
        public Builder setSourceBranch(Resource sourceBranch) {
            this.sourceBranch = sourceBranch;
            filters = true;
            return this;
        }

        /**
         * Set the filter on targetBranch of the MergeRequest.
         *
         * @param targetBranch The Resource identifying the Branch that is being merged into
         * @return MergeRequestFilterParams.Builder
         */
        public Builder setTargetBranch(Resource targetBranch) {
            this.targetBranch = targetBranch;
            filters = true;
            return this;
        }

        /**
         * Set the filter on removeSource of the MergeRequest.
         *
         * @param removeSource The boolean indicating whether or not to remove the source branch
         * @return MergeRequestFilterParams.Builder
         */
        public Builder setRemoveSource(boolean removeSource) {
            this.removeSource = Optional.of(removeSource);
            filters = true;
            return this;
        }

        /**
         * For AcceptedMergeRequests, set the filter on the sourceCommit associated with the MergeRequest.
         *
         * @param sourceCommit The Resource identifying the sourceCommit of the MergeRequest
         * @return MergeRequestFilterParams.Builder
         */
        public Builder setSourceCommit(Resource sourceCommit) {
            this.sourceCommit = sourceCommit;
            filters = true;
            return this;
        }

        /**
         * For AcceptedMergeRequests, set the filter on the targetCommit associated with the MergeRequest.
         *
         * @param targetCommit The Resource identifying the targetCommit of the MergeRequest
         * @return MergeRequestFilterParams.Builder
         */
        public Builder setTargetCommit(Resource targetCommit) {
            this.targetCommit = targetCommit;
            filters = true;
            return this;
        }

        /**
         * Set the Resource by which the results of the query should be sorted.
         *
         * @param sortBy The Resource to sort query results by
         * @return MergeRequestFilterParams.Builder
         */
        public Builder setSortBy(Resource sortBy) {
            this.sortBy = sortBy;
            return this;
        }

        /**
         * Set whether to sort the query results by ascending. Default is false (descending).
         *
         * @param ascending Boolean to sort ascending
         * @return MergeRequestFilterParams.Builder
         */
        public Builder setAscending(boolean ascending) {
            this.ascending = ascending;
            return this;
        }

        /**
         * Set whether to query only AcceptedMergeRequests. Default is false (MergeRequests only).
         *
         * @param accepted Boolean to only retrieve AcceptedMergeRequests
         * @return MergeRequestFilterParams.Builder
         */
        public Builder setAccepted(boolean accepted) {
            this.accepted = accepted;
            return this;
        }

        public MergeRequestFilterParams build() {
            return new MergeRequestFilterParams(this);
        }
    }
}
