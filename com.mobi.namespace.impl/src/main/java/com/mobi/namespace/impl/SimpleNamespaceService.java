package com.mobi.namespace.impl;

/*-
 * #%L
 * com.mobi.namespace.impl
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

import com.mobi.namespace.api.NamespaceService;
import com.mobi.setting.api.SettingUtilsService;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.component.annotations.Reference;

import java.io.IOException;
import java.io.InputStream;

@Component(name = SimpleNamespaceService.COMPONENT_NAME, immediate = true)
public class SimpleNamespaceService implements NamespaceService {

    static final String COMPONENT_NAME = "com.mobi.namespace.api.NamespaceService";

    private static final String NAMESPACE_ONTOLOGY_NAME = "http://mobi.com/ontologies/namespace";
    private static final String DEFAULT_NAMESPACE_IRI = "http://mobi.com/ontologies/namespace/DefaultOntologyNamespace/";
    private String defaultOntologyNamespace = "http://mobi.com/ontologies/";
    final ValueFactory vf = new ValidatingValueFactory();

    @Reference
    SettingUtilsService settingUtilsService;

    @Activate
    @Modified
    protected void start() throws IOException {
        InputStream namespaceOntology = NamespaceService.class.getResourceAsStream("/namespace.ttl");
        Model model = settingUtilsService.updateRepoWithSettingDefinitions(namespaceOntology, NAMESPACE_ONTOLOGY_NAME);
        settingUtilsService.initializeApplicationSettingsWithDefaultValues(model, vf.createIRI(DEFAULT_NAMESPACE_IRI));
    }

    @Override
    public void setDefaultOntologyNamespace(String namespace) {
        this.defaultOntologyNamespace = namespace;
    }

    @Override
    public String getDefaultOntologyNamespace() {
        return this.defaultOntologyNamespace;
    }
}
