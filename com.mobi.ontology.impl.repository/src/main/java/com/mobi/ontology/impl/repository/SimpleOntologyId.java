package com.mobi.ontology.impl.repository;

/*-
 * #%L
 * com.mobi.ontology.impl.repository
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

import com.mobi.namespace.api.NamespaceService;
import com.mobi.namespace.api.ontologies.DefaultOntologyNamespaceApplicationSetting;
import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.utils.MobiOntologyException;
import com.mobi.ontology.utils.OntologyModels;
import com.mobi.setting.api.SettingService;
import com.mobi.setting.api.ontologies.setting.ApplicationSetting;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;

import java.util.Optional;
import java.util.UUID;

public class SimpleOntologyId implements OntologyId {

    private final Resource identifier;
    private IRI ontologyIRI;
    private IRI versionIRI;

    public static class Builder {
        private Resource identifier;
        private IRI ontologyIRI;
        private IRI versionIRI;
        private Model model;
        private final SettingService<ApplicationSetting> settingService;
        private final NamespaceService namespaceService;

        public Builder(SettingService<ApplicationSetting> settingService,
                       NamespaceService namespaceService) {
            this.settingService = settingService;
            this.namespaceService = namespaceService;
        }

        /**
         * If model is set, will attempt to pull OntologyIRI and VersionIRI from model. Will ignore builder fields for
         * OntologyIRI and VersionIRI.
         *
         * @param model the Model to use to retrieve identifier information
         * @return SimpleOntologyId Builder
         */
        public SimpleOntologyId.Builder model(Model model) {
            this.model = model;
            return this;
        }

        public SimpleOntologyId.Builder id(Resource identifier) {
            this.identifier = identifier;
            return this;
        }

        public SimpleOntologyId.Builder ontologyIRI(IRI ontologyIRI) {
            this.ontologyIRI = ontologyIRI;
            return this;
        }

        public SimpleOntologyId.Builder versionIRI(IRI versionIRI) {
            this.versionIRI = versionIRI;
            return this;
        }

        public OntologyId build() {
            return new SimpleOntologyId(this);
        }
    }

    private SimpleOntologyId(Builder builder) {
        SettingService<ApplicationSetting> settingService = builder.settingService;
        NamespaceService namespaceService = builder.namespaceService;

        if (builder.model != null) {
            builder.ontologyIRI = null;
            builder.versionIRI = null;
            builder.identifier = null;
            OntologyModels.findFirstOntologyIRI(builder.model).ifPresent(ontologyIRI
                    -> builder.ontologyIRI = ontologyIRI);
            if (builder.ontologyIRI != null) {
                OntologyModels.findFirstVersionIRI(builder.model, builder.ontologyIRI).ifPresent(versionIRI
                        -> builder.versionIRI = versionIRI);
            }
        }

        if (builder.versionIRI != null && builder.ontologyIRI == null) {
            throw new MobiOntologyException("ontology IRI must not be null if version IRI is not null");
        }

        ValueFactory vf = new ValidatingValueFactory();
        if (builder.versionIRI != null) {
            this.ontologyIRI = vf.createIRI(builder.ontologyIRI.stringValue());
            this.versionIRI = vf.createIRI(builder.versionIRI.stringValue());
            this.identifier = vf.createIRI(builder.versionIRI.stringValue());
        } else if (builder.ontologyIRI != null) {
            this.ontologyIRI = vf.createIRI(builder.ontologyIRI.stringValue());
            this.identifier = vf.createIRI(builder.ontologyIRI.stringValue());
        } else if (builder.identifier != null) {
            this.identifier = builder.identifier;
        } else {
            String ontologyNamespace;
            Optional<ApplicationSetting> ontologyNamespaceApplicationSetting = settingService.getSettingByType(
                    vf.createIRI(DefaultOntologyNamespaceApplicationSetting.TYPE));
            if (ontologyNamespaceApplicationSetting.isPresent() && ontologyNamespaceApplicationSetting.get()
                    .getHasDataValue().isPresent()) {
                ontologyNamespace = ontologyNamespaceApplicationSetting.get().getHasDataValue().get().stringValue();
            } else {
                ontologyNamespace = namespaceService.getDefaultOntologyNamespace();
            }
            this.identifier = vf.createIRI(ontologyNamespace + UUID.randomUUID());
        }

    }

    @Override
    public Optional<IRI> getOntologyIRI() {
        return Optional.ofNullable(ontologyIRI);
    }


    @Override
    public Optional<IRI> getVersionIRI() {
        return Optional.ofNullable(versionIRI);
    }


    @Override
    public Resource getOntologyIdentifier() {
        return identifier;
    }


    @Override
    public String toString() {
        if (ontologyIRI != null) {
            String template = "OntologyID(OntologyIRI(<%s>) VersionIRI(<%s>))";
            String versionString = versionIRI == null ? "" : versionIRI.stringValue();
            return String.format(template, ontologyIRI.stringValue(), versionString);
        } else {
            return "OntologyID(" + identifier.stringValue() + ')';
        }
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



