package org.matonto.catalog.api.builder;

/*-
 * #%L
 * org.matonto.catalog.api
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


import org.matonto.rdf.api.Model;

public class Difference {
    private Model additions;
    private Model deletions;

    private Difference(Builder builder) {
        this.additions = builder.additions;
        this.deletions = builder.deletions;
    }

    public Model getAdditions() {
        return additions;
    }

    public Model getDeletions() {
        return deletions;
    }

    public static class Builder {
        private Model additions;
        private Model deletions;

        public Builder additions(Model additions) {
            this.additions = additions;
            return this;
        }

        public Builder deletions(Model deletions) {
            this.deletions = deletions;
            return this;
        }

        public Difference build() {
            return new Difference(this);
        }
    }
}
