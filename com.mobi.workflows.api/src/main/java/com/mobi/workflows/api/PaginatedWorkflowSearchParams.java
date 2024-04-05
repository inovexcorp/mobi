package com.mobi.workflows.api;
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

import java.time.ZonedDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Search parameters. Allows paging with the limit and offset parameters. Enforcing sorting with the required sortBy and
 * optional ascending parameters.
 */
public class PaginatedWorkflowSearchParams {
    public static class Status {
        static final String FAILURE = "failure"; // Workflow failed
        static final String STARTED = "started"; // Workflow Started and is running
        static final String SUCCESS = "success"; // Workflow succeeded
        static final String NEVER_RUN = "never_run"; // Workflow NEVER_RUN
        static final Set<String> ALL_STATES = Stream.of(FAILURE, STARTED, SUCCESS, NEVER_RUN)
                .collect(Collectors.toUnmodifiableSet());
    }

    // String to be used to filter the returned list by the record title (case-insensitive)
    private final String searchText;
    // String to be used to sort the results by the specified field. Options are sortByOptions
    private final String sortBy;
    // boolean of which direction the sort should be performed
    private final Boolean ascending;
    // Limit Integer
    private final Integer limit;
    // Offset
    private final int offset;
    // String from a static list and filters the returned records appropriately.
    private final String status;
    // Datetime string and filters the records down to those whose latest execution activity started at or
    // after the provided value
    private final String startingAfter;
    // Datetime string and filters the records down to those whose latest execution activity ended at or
    // before the provided value
    private final String endingBefore;

    private PaginatedWorkflowSearchParams(Builder builder) {
        this.searchText = builder.searchText;
        this.status = builder.status;
        this.startingAfter = builder.startingAfter;
        this.endingBefore = builder.endingBefore;
        this.sortBy = builder.sortBy;
        this.ascending = builder.ascending;
        this.limit = builder.limit;
        this.offset = builder.offset;
    }

    public Optional<String> getSearchText() {
        return Optional.ofNullable(searchText);
    }

    public Optional<String> getStatus() {
        return Optional.ofNullable(status);
    }

    public Optional<String> getStartingAfter() {
        return Optional.ofNullable(startingAfter);
    }

    public Optional<String> getEndingBefore() {
        return Optional.ofNullable(endingBefore);
    }

    public Optional<String> getSortBy() {
        return Optional.ofNullable(sortBy);
    }

    public Optional<Boolean> getAscending() {
        return Optional.ofNullable(ascending);
    }

    public Optional<Integer> getLimit() {
        return Optional.ofNullable(limit);
    }

    public int getOffset() {
        return offset;
    }

    /**
     * Checks all search parameters to ensure they are valid for their individual purposes.
     *
     * @return Fields that are invalid with reason
     */
    public List<String> validate() {
        List<String> invalidFields = new ArrayList<>();
        if (offset < 0) {
            invalidFields.add("Offset cannot be negative.");
        }
        if (limit != null && limit < 0) {
            invalidFields.add("Limit cannot be negative.");
        }
        getStatus().ifPresent(userInput -> {
            if (!Status.ALL_STATES.contains(userInput)) {
                invalidFields.add(String.format("State does not have a valid state. %s", Status.ALL_STATES));
            }
        });
        getStartingAfter().ifPresent(userInput -> {
            try {
                ZonedDateTime.parse(userInput);
            } catch (DateTimeParseException err) {
                invalidFields.add("startingAfter datetime can't be parsed.");
            }
        });
        getEndingBefore().ifPresent(userInput -> {
            try {
                ZonedDateTime.parse(userInput);
            } catch (DateTimeParseException err) {
                invalidFields.add("endingBefore datetime can't be parsed.");
            }
        });
        return invalidFields;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (other == null || getClass() != other.getClass()) {
            return false;
        }
        PaginatedWorkflowSearchParams otherObject = (PaginatedWorkflowSearchParams) other;
        return offset == otherObject.offset
                && Objects.equals(searchText, otherObject.searchText)
                && Objects.equals(startingAfter, otherObject.startingAfter)
                && Objects.equals(endingBefore, otherObject.endingBefore)
                && Objects.equals(status, otherObject.status)
                && Objects.equals(sortBy, otherObject.sortBy)
                && Objects.equals(ascending, otherObject.ascending)
                && Objects.equals(limit, otherObject.limit);
    }

    @Override
    public int hashCode() {
        return Objects.hash(searchText, status, startingAfter, endingBefore, sortBy, ascending, limit, offset);
    }

    @Override
    public String toString() {
        return "com.mobi.workflows.api.PaginatedSearchParams{"
                + "searchText='" + searchText + '\''
                + ", status='" + status + '\''
                + ", startingAfter='" + startingAfter + '\''
                + ", endingBefore='" + endingBefore + '\''
                + ", sortBy=" + sortBy
                + ", ascending=" + ascending
                + ", limit=" + limit
                + ", offset=" + offset
                + "}";
    }

    public static class Builder {
        private String searchText = null;
        private String status = null;
        private String startingAfter = null;
        private String endingBefore = null;
        private Integer limit = null;
        private int offset = 0;
        private String sortBy = null;
        private Boolean ascending = null;

        public Builder() {}

        public Builder searchText(String searchText) {
            this.searchText = searchText;
            return this;
        }

        public Builder status(String status) {
            if (status != null) {
                this.status = status.toLowerCase();
            }
            return this;
        }

        public Builder startingAfter(String startingAfter) {
            this.startingAfter = startingAfter;
            return this;
        }

        public Builder endingBefore(String endingBefore) {
            this.endingBefore = endingBefore;
            return this;
        }

        public Builder limit(Integer limit) {
            if (limit != null && (limit != 0)) {
                this.limit = limit;
            }
            return this;
        }

        public Builder offset(int offset) {
            this.offset = offset;
            return this;
        }

        public Builder sortBy(String sortBy) {
            if (sortBy != null) {
                this.sortBy = sortBy;
            }
            return this;
        }

        public Builder ascending(boolean val) {
            this.ascending = val;
            return this;
        }

        public PaginatedWorkflowSearchParams build() {
            return new PaginatedWorkflowSearchParams(this);
        }

    }
}
