package com.mobi.catalog.api.mergerequest;

/*-
 * #%L
 * com.mobi.catalog.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import org.eclipse.rdf4j.model.Resource;

import java.util.List;
import java.util.Optional;

/**
 * MergeRequestFilterParams class to help query getMergeRequests. Allows equality filtering on a particular Resource.
 * Equality filtering options include assignees, onRecord, sourceBranch, targetBranch, removeSource, and creators.
 * AcceptedMergeRequests can additionally filter on sourceCommit and targetCommit. Also provides a way to sort
 * (ascending or descending) the getMergeRequest query results by a provided sortBy Resource. Also provides ability to
 * filter based on search text.
 */
public class MergeRequestFilterParams {

    private final User requestingUser;
    private final List<Resource> onRecords;
    private final Resource sourceBranch;
    private final Resource targetBranch;
    private final Resource sourceCommit;
    private final Resource targetCommit;
    private final Resource sortBy;
    private final Optional<Boolean> removeSource;
    private final boolean ascending;
    private final String requestStatus;
    private final String searchText;
    private final List<Resource> creators;
    private final List<Resource> assignees;
    private final boolean filters;

    protected MergeRequestFilterParams(Builder builder) {
        this.requestingUser =  builder.requestingUser;
        this.onRecords = builder.onRecords;
        this.sourceBranch = builder.sourceBranch;
        this.targetBranch = builder.targetBranch;
        this.sourceCommit = builder.sourceCommit;
        this.targetCommit = builder.targetCommit;
        this.removeSource = builder.removeSource;
        this.sortBy = builder.sortBy;
        this.ascending = builder.ascending;
        this.requestStatus = builder.requestStatus;
        this.searchText = builder.searchText;
        this.creators = builder.creators;
        this.assignees = builder.assignees;
        this.filters = builder.filters;
    }

    public Optional<User> getRequestingUser() {
        return Optional.ofNullable(requestingUser);
    }

    public Optional<List<Resource>> getOnRecords() {
        return Optional.ofNullable(onRecords);
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

    public String getRequestStatus() {
        return requestStatus;
    }

    public Optional<String> getSearchText() {
        return Optional.ofNullable(searchText);
    }

    public Optional<List<Resource>> getCreators() {
        return Optional.ofNullable(creators);
    }

    public Optional<List<Resource>> getAssignees() {
        return Optional.ofNullable(assignees);
    }

    public boolean hasFilters() {
        return filters;
    }

    public static class Builder {
        private User requestingUser = null;
        private List<Resource> onRecords = null;
        private Resource sourceBranch = null;
        private Resource targetBranch = null;
        private Resource sourceCommit = null;
        private Resource targetCommit = null;
        private Resource sortBy = null;
        private Optional<Boolean> removeSource = Optional.empty();
        private boolean ascending = false;
        private String requestStatus = "open";
        private String searchText = null;
        private List<Resource> creators = null;
        private List<Resource> assignees = null;
        private boolean filters = false;

        public Builder() {}

        /**
         * Set the User requesting the list of MergeRequests.
         *
         * @param requestingUser The User requesting the list of Merge Requests
         * @return MergeRequestFilterParams.Builder
         */
        public Builder setRequestingUser(User requestingUser) {
            this.requestingUser = requestingUser;
            return this;
        }

        /**
         * Set the filter on onRecord associated with the MergeRequest.
         *
         * @param onRecords The Resource of the VersionedRDFRecord for the MergeRequest
         * @return MergeRequestFilterParams.Builder
         */
        public Builder setOnRecords(List<Resource> onRecords) {
            this.onRecords = onRecords;
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
         * Set whether to query for Accepted, Closed, or Open MergeRequests. Default is open (MergeRequests only).
         *
         * @param requestStatus String representing the current status of the merge request
         * @return MergeRequestFilterParams.Builder
         */
        public Builder setRequestStatus(String requestStatus) {
            this.requestStatus = requestStatus;
            return this;
        }

        /**
         * Set the text to search across the titles and descriptions of the MergeRequests in the list.
         * @param searchText Text to search for (case-insensitive)
         * @return MergeRequestFilterParams.Builder
         */
        public Builder setSearchText(String searchText) {
            this.searchText = searchText;
            filters = true;
            return this;
        }

        /**
         * Set the Resource IRIs of the creators of the MergeRequests in the list.
         * @param creators The IRIs of the creators of Merge Requests
         * @return MergeRequestFilterParams.Builder
         */
        public Builder setCreators(List<Resource> creators) {
            this.creators = creators;
            filters = true;
            return this;
        }

        /**
         * Set the Resource IRIs of the assignees of the MergeRequests in the list.
         * @param assignees The IRIs of the assignees of the Merge Requests
         * @return MergeRequestFilterParams.Builder
         */
        public Builder setAssignees(List<Resource> assignees) {
            this.assignees = assignees;
            filters = true;
            return this;
        }

        public MergeRequestFilterParams build() {
            return new MergeRequestFilterParams(this);
        }
    }
}
