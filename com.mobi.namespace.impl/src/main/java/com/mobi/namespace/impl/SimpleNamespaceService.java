package com.mobi.namespace.impl;

/*-
 * #%L
 * com.mobi.namespace.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2020 iNovex Information Systems, Inc.
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

import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.setting.api.SettingUtilsService;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.component.annotations.Reference;

import java.io.InputStream;

@Component(immediate = true)
public class SimpleNamespaceService {
    private static final String NAMESPACE_ONTOLOGY_NAME = "http://mobi.com/ontologies/namespace";
    private static final InputStream NAMESPACE_ONTOLOGY;
    private static final String DEFAULT_NAMESPACE_IRI = "http://mobi.com/ontologies/namespace/DefaultOntologyNamespace/";

    @Reference
    SettingUtilsService settingUtilsService;

    static {
        NAMESPACE_ONTOLOGY = SimpleNamespaceService.class.getResourceAsStream("/namespace.ttl");
    }

    @Reference
    ValueFactory vf;

    @Activate
    @Modified
    protected void start() {
        Model model = settingUtilsService.updateRepoWithSettingDefinitions(NAMESPACE_ONTOLOGY, NAMESPACE_ONTOLOGY_NAME);
        settingUtilsService.initializeApplicationSettingsWithDefaultValues(model, vf.createIRI(DEFAULT_NAMESPACE_IRI));
    }
}
