package com.mobi.setting.api;

/*-
 * #%L
 * com.mobi.setting.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.setting.api.ontologies.Setting;

import java.util.Optional;
import java.util.Set;

public interface SettingService<T extends Setting> {

    /**
     * The {@link String} representation of the Graph {@link IRI} to store {@link Setting}s.
     */
    String GRAPH = "http://mobi.com/setting-management";

    /**
     * The type of {@link Setting} this service supports.
     *
     * @return The type of Setting
     */
    Class<T> getType();

    /**
     * Retrieves the IRI of the type of {@link Setting}.
     *
     * @return A IRI string of a subclass of Setting
     */
    String getTypeIRI();

    /**
     * Retrieves the IRI of the group type of {@link Setting}.
     *
     * @return A IRI string of the Setting group type
     */
    String getGroupTypeIRI();

    /**
     * Retrieves a {@link Set} of {@link Setting}s of type {@link T}. If the service utilizes a {@link User} and one is
     * provided, then it retrieves the {@link Setting}s for that user.
     *
     * @param user A {@link User} to filter the {@link Setting} by. Optional if the service does not use it.
     * @return A {@link Set} of {@link Setting}s of type {@link T}.
     */
    Set<T> getSettings(User... user);

    /**
     * Retrieves an {@link Optional} of {@link Setting} for the Setting identified by the {@link Resource} of
     * {@code settingId}.
     *
     * @param settingId The {@link Resource} identifying the {@link Setting} to retrieve.
     * @return An {@link Optional} of {@link Setting} for the provided {@code settingId}.
     */
    Optional<T> getSetting(Resource settingId);

    /**
     * Creates a {@link Setting} of type {@link T} and stores it in the {@link com.mobi.repository.api.Repository}.
     * If the service utilizes a {@link User} and one is provided, then it adds the {@link Setting} for that user.
     *
     * @param setting A {@link Setting} of type {@link T} to add to the repository.
     * @param user A {@link User} to add the {@link Setting} to. Optional if the service does not use it.
     * @return The {@link Resource} that identifies the newly created {@link Setting}.
     */
    Resource createSetting(T setting, User... user);

    /**
     * Creates a {@link Setting} of type {@link T} from the provided {@link Model} and stores it in the
     * {@link com.mobi.repository.api.Repository}. Uses the provided {@code settingType} to find the factory type to use
     * to create the {@link Setting}. If the service utilizes a {@link User} and one is provided, then it adds the
     * {@link Setting} for that user.
     *
     * @param model The {@link Model} representing a {@link Setting}.
     * @param settingType The {@link IRI} representing the subtype of {@link Setting} to create.
     * @param user A {@link User} to add the created {@link Setting} to. Optional if the service does not use it.
     * @return The {@link Resource} that identifies the newly created {@link Setting}.
     */
    Resource createSetting(Model model, IRI settingType, User... user);

    /**
     * Updates a {@link Setting} of type {@link T} with the provided {@code setting}. Uses the {@link Resource} of the
     * provided {@code settingId} to identify which {@link Setting} to update. If the service utilizes a {@link User}
     * and one is provided, then it updates the {@link Setting} for that user.
     *
     * @param settingId The {@link Resource} identifying the {@link Setting} to update.
     * @param setting A {@link Setting} of type {@link T} to update in the repository.
     * @param user A {@link User} to update the {@link Setting} for. Optional if the service does not use it.
     */
    void updateSetting(Resource settingId, T setting, User... user);

    /**
     * Updates a {@link Setting} of type {@link T} with the provided {@link Model}. Uses the {@link Resource} of the
     * provided {@code settingId} to identify which {@link Setting} to update. Uses the provided {@code settingType} to
     * find the factory type to use to create the {@link Setting}. If the service utilizes a {@link User} and one is
     * provided, then it updates the {@link Setting} for that user.
     *
     * @param settingId The {@link Resource} identifying the {@link Setting} to update.
     * @param model The {@link Model} representing a {@link Setting}.
     * @param settingType The {@link IRI} representing the subtype of {@link Setting} to create.
     * @param user A {@link User} to update the {@link Setting} for. Optional if the service does not use it.
     */
    void updateSetting(Resource settingId, Model model, IRI settingType, User... user);

    /**
     * Deletes a {@link Setting} identified by the provided {@link Resource} pf {@code settingId}.
     *
     * @param settingId The {@link Resource} identifying the {@link Setting} to delete.
     */
    void deleteSetting(Resource settingId);

    /**
     * Retrieves a {@link Setting} of type {@link T} if one and only one exists. If the service utilizes a {@link User}
     * and one is provided, then it retrieves the {@link Setting} for that user. If multiple {@link Setting}s of the
     * provided type exist, they should be retrieved by their {@link Resource}.
     *
     * @param type The {@link Resource} identifying the type of {@link Setting} to retrieve.
     * @param user A {@link User} to retrieve the {@link Setting} for. Optional if the service does not use it.
     * @return An {@link Optional} of {@link Setting} of the provided {@code type}.
     * @throws IllegalStateException If multiple settings of the provided type exists.
     */
    Optional<T> getSettingByType(Resource type, User... user);

    /**
     * Deletes a {@link Setting} of type {@link T} if one and only one exists. If the service utilizes a {@link User}
     * and one is provided, then it retrieves the {@link Setting} for that user. If multiple {@link Setting}s of the
     * provided type exist, they should be deleted by their {@link Resource}.
     *
     * @param type The {@link Resource} identifying the type of {@link Setting} to retrieve.
     * @param user A {@link User} to delete the {@link Setting} for. Optional if the service does not use it.
     * @throws IllegalStateException If multiple settings of the provided type exists or none exist.
     */
    void deleteSettingByType(Resource type, User... user);

    /**
     * Retrieves the {@link Resource} identifying the type of {@link Setting}.
     *
     * @param setting The {@link Setting} whose type you want to discover.
     * @return The {@link Resource} identifying the type of {@link Setting}.
     */
    Resource getSettingType(Setting setting);

    /**
     * Retrieves all SHACL shapes in the repo transitively referenced by {@link Setting}'s that are part of the
     * passed in {@code settingGroupId}.
     *
     * @param settingGroupId The {@link Resource} of a {@link com.mobi.setting.api.ontologies.SettingGroup}.
     * @return The SHACL shapes transitively referenced by {@link Setting}'s that are part of the
     * {@code settingGroupId}.
     */
    Model getSettingDefinitions(Resource settingGroupId);

    /**
     * Retrieves the {@link Model} representing the {@link com.mobi.setting.api.ontologies.SettingGroup}s in the repo.
     *
     * @return The {@link Model} representing the {@link com.mobi.setting.api.ontologies.SettingGroup}s in the repo.
     */
    Model getSettingGroups();
}
