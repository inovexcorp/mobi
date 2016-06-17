package org.matonto.etl.service.delimited;

import org.matonto.etl.api.delimited.MappingId;
import org.matonto.exception.MatOntoException;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;

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
            throw new MatOntoException("Mapping IRI must not be null if version IRI is present");
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
