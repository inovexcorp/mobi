package org.matonto.catalog.impl;

/*-
 * #%L
 * org.matonto.catalog.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

import org.matonto.catalog.api.Conflict;
import org.matonto.rdf.api.Model;

public class SimpleConflict implements Conflict {
    private Model original;
    private Model leftAdditions;
    private Model leftDeletions;
    private Model rightAdditions;
    private Model rightDeletions;

    @Override
    public Model getOriginal() {
        return original;
    }

    @Override
    public Model getLeftAdditions() {
        return leftAdditions;
    }

    @Override
    public Model getLeftDeletions() {
        return leftDeletions;
    }

    @Override
    public Model getRightAdditions() {
        return rightAdditions;
    }

    @Override
    public Model getRightDeletions() {
        return rightDeletions;
    }

    public static class Builder {
        private final Model original;
        private Model leftAdditions;
        private Model leftDeletions;
        private Model rightAdditions;
        private Model rightDeletions;

        /**
         * The builder for a SimpleConflict which takes the subject IRI string, original model, the first model being
         * compared (left), and the second model being compared (right).
         *
         * @param original The Model identifying the original state for this conflict.
         */
        public Builder(Model original) {
            this.original = original;
        }

        public Builder leftAdditions(Model leftAdditions) {
            this.leftAdditions = leftAdditions;
            return this;
        }

        public Builder leftDeletions(Model leftDeletions) {
            this.leftDeletions = leftDeletions;
            return this;
        }

        public Builder rightAdditions(Model rightAdditions) {
            this.rightAdditions = rightAdditions;
            return this;
        }

        public Builder rightDeletions(Model rightDeletions) {
            this.rightDeletions = rightDeletions;
            return this;
        }

        public SimpleConflict build() {
            return new SimpleConflict(this);
        }
    }

    private SimpleConflict(Builder builder) {
        this.original = builder.original;
        this.leftAdditions = builder.leftAdditions;
        this.leftDeletions = builder.leftDeletions;
        this.rightAdditions = builder.rightAdditions;
        this.rightDeletions = builder.rightDeletions;
    }
}
