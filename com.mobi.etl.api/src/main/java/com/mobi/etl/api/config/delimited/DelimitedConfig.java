package com.mobi.etl.api.config.delimited;

/*-
 * #%L
 * com.mobi.etl.api
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


import com.mobi.ontology.core.api.Ontology;
import com.mobi.rdf.api.Model;

import java.io.InputStream;
import java.util.Collections;
import java.util.Optional;
import java.util.Set;

public class DelimitedConfig {
    private InputStream data;
    private Model mapping;
    private Set<Ontology> ontologies;
    private boolean containsHeaders = true;
    private Long limit;
    private long offset = 0;

    protected DelimitedConfig(Builder builder) {
        data = builder.data;
        mapping = builder.mapping;
        ontologies = builder.ontologies;
        containsHeaders = builder.containsHeaders;
        limit = builder.limit;
        offset = builder.offset;
    }

    public InputStream getData() {
        return data;
    }

    public Model getMapping() {
        return mapping;
    }

    public Set<Ontology> getOntologies() {
        return ontologies;
    }

    public boolean getContainsHeaders() {
        return containsHeaders;
    }

    public Optional<Long> getLimit() {
        return Optional.ofNullable(limit);
    }

    public long getOffset() {
        return offset;
    }

    public static class Builder<T extends Builder> {
        private final InputStream data;
        private final Model mapping;
        private Set<Ontology> ontologies = Collections.emptySet();
        private boolean containsHeaders = true;
        private Long limit;
        private long offset = 0;

        public Builder(InputStream data, Model mapping) {
            this.data = data;
            this.mapping = mapping;
        }

        public T ontologies(Set<Ontology> ontologies) {
            this.ontologies = ontologies;
            return (T) this;
        }

        public T containsHeaders(boolean containsHeaders) {
            this.containsHeaders = containsHeaders;
            return (T) this;
        }

        public T limit(Long limit) {
            this.limit = limit;
            return (T) this;
        }

        public T offset(long offset) {
            this.offset = offset;
            return (T) this;
        }

        public DelimitedConfig build() {
            return new DelimitedConfig(this);
        }
    }
}
