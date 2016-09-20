package org.matonto.ontology.core.impl.owlapi;

/*-
 * #%L
 * org.matonto.ontology.core.impl.owlapi
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

import org.matonto.ontology.core.api.OntologyId;
import org.matonto.ontology.core.utils.MatontoOntologyException;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.semanticweb.owlapi.model.OWLOntologyID;

import java.util.Optional;
import java.util.UUID;


public class SimpleOntologyId implements OntologyId {

    private Resource identifier;
    private OWLOntologyID ontologyId;
    private ValueFactory factory;

    private static final String DEFAULT_PREFIX = "http://matonto.org/ontologies/";

    public static class Builder {
        private Resource identifier;
        private IRI ontologyIRI;
        private IRI versionIRI;
        private ValueFactory factory;

        public Builder(ValueFactory factory) {
            this.factory = factory;
        }

        public Builder id(Resource identifier) {
            this.identifier = identifier;
            return this;
        }

        public Builder ontologyIRI(IRI ontologyIRI) {
            this.ontologyIRI = ontologyIRI;
            return this;
        }

        public Builder versionIRI(IRI versionIRI) {
            this.versionIRI = versionIRI;
            return this;
        }

        public SimpleOntologyId build() {
            return new SimpleOntologyId(this);
        }
    }

    private SimpleOntologyId(Builder builder) {
        if (builder.versionIRI != null && builder.ontologyIRI == null) {
            throw new MatontoOntologyException("ontology IRI must not be null if version IRI is not null");
        }
        this.factory = builder.factory;
        org.semanticweb.owlapi.model.IRI ontologyIRI = null;
        org.semanticweb.owlapi.model.IRI versionIRI = null;

        if (builder.versionIRI != null) {
            versionIRI = SimpleOntologyValues.owlapiIRI(builder.versionIRI);
        }
        if (builder.ontologyIRI != null) {
            ontologyIRI = SimpleOntologyValues.owlapiIRI(builder.ontologyIRI);
        }
        if (versionIRI != null) {
            ontologyId = new OWLOntologyID(com.google.common.base.Optional.of(ontologyIRI),
                    com.google.common.base.Optional.of(versionIRI));
            this.identifier = factory.createIRI(builder.versionIRI.toString());
        } else if (ontologyIRI != null) {
            ontologyId = new OWLOntologyID(com.google.common.base.Optional.of(ontologyIRI),
                    com.google.common.base.Optional.absent());
            this.identifier = factory.createIRI(builder.ontologyIRI.toString());
        } else if (builder.identifier != null) {
            this.identifier = builder.identifier;
            ontologyId = new OWLOntologyID(com.google.common.base.Optional.absent(),
                    com.google.common.base.Optional.absent());
        } else {
            this.identifier = factory.createIRI(DEFAULT_PREFIX + UUID.randomUUID());
            ontologyId = new OWLOntologyID(com.google.common.base.Optional.absent(),
                    com.google.common.base.Optional.absent());
        }

    }

    @Override
    public Optional<IRI> getOntologyIRI() {
        if (ontologyId.getOntologyIRI().isPresent()) {
            org.semanticweb.owlapi.model.IRI owlIri = ontologyId.getOntologyIRI().get();
            return Optional.of(SimpleOntologyValues.matontoIRI(owlIri));
        } else {
            return Optional.empty();
        }
    }


    @Override
    public Optional<IRI> getVersionIRI() {
        if (ontologyId.getVersionIRI().isPresent()) {
            org.semanticweb.owlapi.model.IRI versionIri = ontologyId.getVersionIRI().get();
            return Optional.of(SimpleOntologyValues.matontoIRI(versionIri));
        } else {
            return Optional.empty();
        }
    }


    @Override
    public Resource getOntologyIdentifier() {
        return identifier;
    }

    protected OWLOntologyID getOwlapiOntologyId() {
        return ontologyId;
    }

    @Override
    public String toString() {
        return ontologyId.toString();
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }

        if (obj instanceof SimpleOntologyId) {
            SimpleOntologyId other = (SimpleOntologyId) obj;
            if (identifier.equals(other.getOntologyIdentifier())) {
                return this.getVersionIRI().equals(other.getVersionIRI());
            }
        }

        return false;
    }

    @Override
    public int hashCode() {
        return identifier.hashCode();
    }

}



