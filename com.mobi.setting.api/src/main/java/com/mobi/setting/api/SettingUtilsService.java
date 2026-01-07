package com.mobi.setting.api;

/*-
 * #%L
 * com.mobi.setting.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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

import com.mobi.jaas.api.ontologies.usermanagement.User;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;

import java.io.InputStream;
import java.util.Set;

public interface SettingUtilsService {

    /**
     * Checks a model for all shacl property shapes that have a defaultValue. If it does, it ensures that a value exists
     * in the repo for the associated setting. If not it creates a setting using the default value and stores it in the
     * repo.
     *
     * @param model The {@link Model} to scan for defaultValues
     * @param defaultIRI The {@link Resource} to use as a namespace for creating settings
     *
     */
    void initializeApplicationSettingsWithDefaultValues(Model model, Resource defaultIRI);

    /**
     * Retrieves a {@link Set} of {@link com.mobi.setting.api.ontologies.setting.Setting}s of type {@link T}.
     * If the service utilizes a {@link User} and one is provided, then it retrieves the
     * {@link com.mobi.setting.api.ontologies.setting.Setting}s for that user.
     *
     * @param ontology An {@link InputStream} containing setting shacl definitions to load into the repo
     * @param ontologyName The name of the ontology being stored
     * @return A {@link Model} representing the shacl shapes and associated entities of the passed in ontology
     */
    Model updateRepoWithSettingDefinitions(InputStream ontology, String ontologyName);
}
