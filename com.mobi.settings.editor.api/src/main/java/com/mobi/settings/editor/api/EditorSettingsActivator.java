package com.mobi.settings.editor.api;

/*-
 * #%L
 * com.mobi.settings.editor.api
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

@Component(name = EditorSettingsActivator.COMPONENT_NAME, immediate = true)
public class EditorSettingsActivator {
    static final String COMPONENT_NAME = "com.mobi.settings.editor.api.EditorSettingsActivator";

    private static final String NAMESPACE_ONTOLOGY_NAME = "http://mobi.com/ontologies/namespace";
    private static final String DEFAULT_NAMESPACE_IRI = "http://mobi.solutions/ontologies/namespace/DefaultOntologyNamespace/";
    private static final String EDITOR_PREFERENCE_ONTOLOGY_NAME = "https://mobi.solutions/ontologies/editor";
    private static final InputStream EDITOR_PREFERENCE_ONTOLOGY_STREAM;

    final ValueFactory vf = new ValidatingValueFactory();

    @Reference
    SettingUtilsService settingUtilsService;

    static {
        EDITOR_PREFERENCE_ONTOLOGY_STREAM = EditorSettingsActivator.class.getResourceAsStream("/user_preferences/editor_preferences.ttl");
    }

    @Activate
    @Modified
    protected void start() throws IOException {
        initializeSetting("/application_settings/namespace.ttl", NAMESPACE_ONTOLOGY_NAME, true, DEFAULT_NAMESPACE_IRI);
        settingUtilsService.updateRepoWithSettingDefinitions(EDITOR_PREFERENCE_ONTOLOGY_STREAM,
                EDITOR_PREFERENCE_ONTOLOGY_NAME);

    }

    private void initializeSetting(String fileName, String ontology, boolean hasDefaultValues, String defaultValue) {
        InputStream settingOntology = EditorSettingsActivator.class.getResourceAsStream(fileName);
        Model model = settingUtilsService.updateRepoWithSettingDefinitions(settingOntology, ontology);

        if (hasDefaultValues) {
            settingUtilsService.initializeApplicationSettingsWithDefaultValues(model, vf.createIRI(defaultValue));
        }
    }
}
