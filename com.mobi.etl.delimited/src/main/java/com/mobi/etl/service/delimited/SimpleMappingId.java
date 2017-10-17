package com.mobi.etl.service.delimited;

/*-
 * #%L
 * com.mobi.etl.delimited
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

import com.mobi.etl.api.delimited.MappingId;
import com.mobi.exception.MobiException;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;

import java.util.Optional;

public class SimpleMappingId implements MappingId {
    private Resource identifier;
    private IRI mappingIRI;
    private IRI versionIRI;

    public static class Builder {
        private Resource identifier;
        private IRI mappingIRI;
        private IRI versionIRI;
        private ValueFactory factory;

        public Builder(ValueFactory factory) {
            this.factory = factory;
        }

        public Builder id(Resource id) {
            this.identifier = id;
            return this;
        }

        public Builder mappingIRI(IRI mappingIRI) {
            this.mappingIRI = mappingIRI;
            return this;
        }

        public Builder versionIRI(IRI versionIRI) {
            this.versionIRI = versionIRI;
            return this;
        }

        public SimpleMappingId build() {
            return new SimpleMappingId(this);
        }
    }

    private SimpleMappingId(Builder builder) {
        if (builder.versionIRI != null && builder.mappingIRI == null) {
            throw new MobiException("Mapping IRI must not be null if version IRI is present");
        }

        ValueFactory factory = builder.factory;
        this.versionIRI = builder.versionIRI;
        this.mappingIRI = builder.mappingIRI;

        if (versionIRI != null) {
            this.identifier = versionIRI;
        } else if (mappingIRI != null) {
            this.identifier = mappingIRI;
        } else if (builder.identifier != null) {
            this.identifier = builder.identifier;
        } else {
            this.identifier = factory.createBNode();
        }

    }

    @Override
    public Optional<IRI> getMappingIRI() {
        if (mappingIRI == null) {
            return Optional.empty();
        }
        return Optional.of(mappingIRI);
    }

    @Override
    public Optional<IRI> getVersionIRI() {
        if (versionIRI == null) {
            return Optional.empty();
        }
        return Optional.of(versionIRI);
    }

    @Override
    public Resource getMappingIdentifier() {
        return identifier;
    }

    @Override
    public String toString() {
        return mappingIRI.toString();
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }

        if (obj instanceof SimpleMappingId) {
            SimpleMappingId other = (SimpleMappingId) obj;
            if (identifier.equals(other.getMappingIdentifier())) {
                return this.getVersionIRI().equals(other.getVersionIRI());
            }
        }

        return false;
    }

    @Override
    public int hashCode() {
        return this.identifier.hashCode();
    }
}
