package com.mobi.etl.api.config.delimited;

/*-
 * #%L
 * com.mobi.etl.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.rio.RDFFormat;

import java.io.InputStream;
import java.nio.charset.Charset;
import java.util.Collections;
import java.util.Optional;
import java.util.Set;

public class DelimitedConfig {
    private InputStream data;
    private Charset charset;
    private Model mapping;
    private Set<Ontology> ontologies;
    private boolean containsHeaders = true;
    private Long limit;
    private long offset = 0;
    private RDFFormat format;

    protected DelimitedConfig(Builder builder) {
        data = builder.data;
        charset = builder.charset;
        mapping = builder.mapping;
        ontologies = builder.ontologies;
        containsHeaders = builder.containsHeaders;
        limit = builder.limit;
        offset = builder.offset;
        format = builder.format;
    }

    public InputStream getData() {
        return data;
    }

    public Charset getCharset() {
        return charset;
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

    public RDFFormat getFormat() {
        return format;
    }

    public static class Builder<T extends Builder> {
        private final InputStream data;
        private final Charset charset;
        private final Model mapping;
        private Set<Ontology> ontologies = Collections.emptySet();
        private boolean containsHeaders = true;
        private Long limit;
        private long offset = 0;
        private RDFFormat format = RDFFormat.TURTLE;

        public Builder(InputStream data, Charset charset, Model mapping) {
            this.data = data;
            this.charset = charset;
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

        public T format(RDFFormat format) {
            this.format = format;
            return (T) this;
        }

        public DelimitedConfig build() {
            return new DelimitedConfig(this);
        }
    }
}
