package com.mobi.ontology.impl.owlapi;

/*-
 * #%L
 * com.mobi.ontology.impl.owlapi
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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

import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.utils.MobiOntologyException;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.ValueFactory;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.semanticweb.owlapi.model.OWLOntologyID;

import java.util.Optional;
import java.util.UUID;


public class SimpleOntologyId implements OntologyId {

    private Resource identifier;
    private OWLOntologyID ontologyId;
    private ValueFactory factory;

    private static final String DEFAULT_PREFIX = "http://mobi.com/ontologies/";

    public static class Builder {
        private Resource identifier;
        private IRI ontologyIRI;
        private IRI versionIRI;
        private Model model;
        private ValueFactory factory;

        public Builder(ValueFactory factory) {
            this.factory = factory;
        }

        /**
         * If model is set, will attempt to pull OntologyIRI and VersionIRI from model. Will ignore builder fields for
         * OntologyIRI and VersionIRI.
         *
         * @param model the Model to use to retrieve identifier information
         * @return SimpleOntologyId Builder
         */
        public Builder model(Model model) {
            this.model = model;
            return this;
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
        this.factory = builder.factory;

        if (builder.model != null) {
            builder.ontologyIRI = null;
            builder.versionIRI = null;
            builder.identifier = null;
            Model ontologyIriModel = builder.model.filter(null, factory.createIRI(RDF.TYPE.stringValue()),
                    factory.createIRI(OWL.ONTOLOGY.stringValue()));
            if (ontologyIriModel.size() > 0) {
                Optional<Statement> ontologyStatementOpt = ontologyIriModel.stream().findFirst();
                ontologyStatementOpt.ifPresent(ontologyStatement
                        -> builder.ontologyIRI = factory.createIRI(ontologyStatement.getSubject().stringValue()));
            }
            if (builder.ontologyIRI != null) {
                Model versionIriModel = builder.model.filter(builder.ontologyIRI,
                        factory.createIRI(OWL.VERSIONIRI.stringValue()), null);
                if (versionIriModel.size() > 0) {
                    Optional<Statement> versionStatementOpt = versionIriModel.stream().findFirst();
                    versionStatementOpt.ifPresent(versionStatement
                            -> builder.versionIRI = factory.createIRI(versionStatement.getObject().stringValue()));
                }
            }
        }

        if (builder.versionIRI != null && builder.ontologyIRI == null) {
            throw new MobiOntologyException("ontology IRI must not be null if version IRI is not null");
        }

        org.semanticweb.owlapi.model.IRI ontologyIRI = null;
        org.semanticweb.owlapi.model.IRI versionIRI = null;
        if (builder.versionIRI != null) {
            versionIRI = SimpleOntologyValues.owlapiIRI(builder.versionIRI);
        }
        if (builder.ontologyIRI != null) {
            ontologyIRI = SimpleOntologyValues.owlapiIRI(builder.ontologyIRI);
        }

        if (versionIRI != null) {
            ontologyId = new OWLOntologyID(ontologyIRI, versionIRI);
            this.identifier = factory.createIRI(builder.versionIRI.stringValue());
        } else if (ontologyIRI != null) {
            ontologyId = new OWLOntologyID(ontologyIRI);
            this.identifier = factory.createIRI(builder.ontologyIRI.stringValue());
        } else if (builder.identifier != null) {
            this.identifier = builder.identifier;
            ontologyId = new OWLOntologyID();
        } else {
            this.identifier = factory.createIRI(DEFAULT_PREFIX + UUID.randomUUID());
            ontologyId = new OWLOntologyID();
        }

    }

    @Override
    public Optional<IRI> getOntologyIRI() {
        Optional<org.semanticweb.owlapi.model.IRI> ontIRI = ontologyId.getOntologyIRI();

        return ontIRI.map(SimpleOntologyValues::mobiIRI);
    }


    @Override
    public Optional<IRI> getVersionIRI() {
        Optional<org.semanticweb.owlapi.model.IRI> verIRI = ontologyId.getVersionIRI();

        return verIRI.map(SimpleOntologyValues::mobiIRI);
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



