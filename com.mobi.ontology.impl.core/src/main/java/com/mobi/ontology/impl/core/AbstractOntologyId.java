package com.mobi.ontology.impl.core;

/*-
 * #%L
 * com.mobi.ontology.impl.core
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
import com.mobi.ontology.utils.OntologyModels;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.setting.api.SettingService;
import com.mobi.setting.api.ontologies.ApplicationSetting;

public abstract class AbstractOntologyId implements OntologyId {

    protected Resource identifier;
    protected ValueFactory factory;
    protected SettingService<ApplicationSetting> settingService;

    protected static final String DEFAULT_PREFIX = "http://mobi.com/ontologies/";

    public abstract static class Builder {
        public Resource identifier;
        public IRI ontologyIRI;
        public IRI versionIRI;
        public Model model;
        public ValueFactory factory;
        public SettingService<ApplicationSetting> settingService;

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

        public abstract OntologyId build();
    }

    protected void setUp(Builder builder) {
        this.factory = builder.factory;
        this.settingService = builder.settingService;

        if (builder.model != null) {
            builder.ontologyIRI = null;
            builder.versionIRI = null;
            builder.identifier = null;
            OntologyModels.findFirstOntologyIRI(builder.model, factory).ifPresent(ontologyIRI
                    -> builder.ontologyIRI = ontologyIRI);
            if (builder.ontologyIRI != null) {
                OntologyModels.findFirstVersionIRI(builder.model, builder.ontologyIRI, factory).ifPresent(versionIRI
                        -> builder.versionIRI = versionIRI);
            }
        }

        if (builder.versionIRI != null && builder.ontologyIRI == null) {
            throw new MobiOntologyException("ontology IRI must not be null if version IRI is not null");
        }
    }
}