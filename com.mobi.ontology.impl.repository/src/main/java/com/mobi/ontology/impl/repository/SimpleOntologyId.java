package com.mobi.ontology.impl.repository;

/*-
 * #%L
 * com.mobi.ontology.impl.repository
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import com.mobi.ontology.impl.core.AbstractOntologyId;
import com.mobi.setting.api.SettingService;
import com.mobi.setting.api.ontologies.ApplicationSetting;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;

import java.util.Optional;
import java.util.UUID;


public class SimpleOntologyId extends AbstractOntologyId {

    private IRI ontologyIRI;
    private IRI versionIRI;

    public static class Builder extends AbstractOntologyId.Builder {
        public Builder(ValueFactory factory, SettingService<ApplicationSetting> settingService,
                       NamespaceService namespaceService) {
            this.settingService = settingService;
            this.namespaceService = namespaceService;
            this.factory = factory;
        }

        @Override
        public OntologyId build() {
            return new SimpleOntologyId(this);
        }
    }

    private SimpleOntologyId(Builder builder) {
        setUp(builder);

        if (builder.versionIRI != null) {
            this.ontologyIRI = factory.createIRI(builder.ontologyIRI.stringValue());
            this.versionIRI = factory.createIRI(builder.versionIRI.stringValue());
            this.identifier = factory.createIRI(builder.versionIRI.stringValue());
        } else if (builder.ontologyIRI != null) {
            this.ontologyIRI = factory.createIRI(builder.ontologyIRI.stringValue());
            this.identifier = factory.createIRI(builder.ontologyIRI.stringValue());
        } else if (builder.identifier != null) {
            this.identifier = builder.identifier;
        } else {
            String ontologyNamespace;
            Optional<ApplicationSetting> ontologyNamespaceApplicationSetting = settingService.getSettingByType(
                    factory.createIRI(DefaultOntologyNamespaceApplicationSetting.TYPE));
            if (ontologyNamespaceApplicationSetting.isPresent() && ontologyNamespaceApplicationSetting.get()
                    .getHasDataValue().isPresent()) {
                ontologyNamespace = ontologyNamespaceApplicationSetting.get().getHasDataValue().get().stringValue();
            } else {
                ontologyNamespace = namespaceService.getDefaultOntologyNamespace();
            }
            this.identifier = factory.createIRI(ontologyNamespace + UUID.randomUUID());
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



