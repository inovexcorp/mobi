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
    private String subject;
    private Model original;
    private Model left;
    private Model right;

    @Override
    public String getSubject() {
        return subject;
    }

    @Override
    public Model getOriginal() {
        return original;
    }

    @Override
    public Model getLeft() {
        return left;
    }

    @Override
    public Model getRight() {
        return right;
    }

    public static class Builder {
        private final String subject;
        private final Model original;
        private final Model left;
        private final Model right;

        /**
         * The builder for a SimpleConflict which takes the subject IRI string, original model, the first model being
         * compared (left), and the second model being compared (right).
         *
         * @param subject The IRI String identifying the subject of the statements provided in the models.
         * @param original The Model which contains the original element you are comparing.
         * @param left The Model which contains the first model's version.
         * @param right The Model which contains the second model's version.
         */
        public Builder(String subject, Model original, Model left, Model right) {
            this.subject = subject;
            this.original = original;
            this.left = left;
            this.right = right;
        }

        public SimpleConflict build() {
            return new SimpleConflict(this);
        }
    }

    private SimpleConflict(Builder builder) {
        this.subject = builder.subject;
        this.original = builder.original;
        this.left = builder.left;
        this.right = builder.right;
    }
}
