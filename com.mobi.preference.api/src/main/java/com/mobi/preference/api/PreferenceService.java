package com.mobi.preference.api;

/*-
 * #%L
 * com.mobi.preference.api
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

import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.preference.api.ontologies.Preference;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface PreferenceService {

    String GRAPH = "http://mobi.com/preferencemanagement";

    /**
     * Get all instances of Preference for a particular user. Preferences will include all referenced
     * object values.
     *
     * @param user The {@link User} to retrieve preferences for.
     * @return All instances of {@link Preference} for the {@link User}
     */
    Set<Preference> getUserPreferences(User user);

    /**
     * Get the instance of Preference for a user that is of the type of the passed
     * in preferenceType. Preference will include all referenced object values.
     *
     * @param user                   The {@link User} to retrieve the preference for.
     * @param preferenceType         The type of {@link Preference} to retrieve.
     * @return An optional containing the {@link Preference} for the {@link User} of the passed in type
     */
    Optional<Preference> getUserPreference(User user, Resource preferenceType);

    /**
     * Get the instance of Preference for a user that is of the type of the passed
     * in preferenceType. Preference will include all referenced object values.
     *
     * @param resourceId                   The {@link Resource} of the preference to retrieve.
     * @return An optional containing the instance of {@link Preference} for the provided {@link Resource}
     */
    Optional<Preference> getUserPreference(Resource resourceId);

    /**
     * Add the associated preference instance to the repo for the passed in user.
     * Additionally, add the object value for the preference to the repo if one exists.
     *
     * @param user                   The {@link User} to add the preference for.
     * @param preference             The {@link Preference} to add.
     */
    void addPreference(User user, Preference preference);

    /**
     * Removes the Preference of the passed in preferenceType for a user. Referenced Entities will only
     * be removed if not referenced by another Preference.
     *
     * @param user The {@link User} who's {@link Preference} will be deleted.
     * @param preferenceType The type of {@link Preference} to remove.
     */
    void deletePreference(User user, Resource preferenceType);

    /**
     * Removes a Preference identified by its IRI from the repo. Referenced Entities will only be removed
     * if not referenced by another Preference.
     *
     * @param preferenceIRI The IRI of a {@link Preference}
     */
    void deletePreference(Resource preferenceIRI);

    /**
     * Updates the Preference for a user identified by the IRI of the passed in preference.
     *
     * @param user The {@link User} who's {@link Preference} will be updated.
     * @param preference The new {@link Preference} for the {@link User}
     */
    void updatePreference(User user, Preference preference);

    Model getPreferenceDefinitions(Resource preferenceGroup);

    List<String> getPreferenceGroups();
}