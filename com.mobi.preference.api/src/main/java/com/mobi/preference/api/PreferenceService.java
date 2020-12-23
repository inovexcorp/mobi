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
import com.mobi.rdf.api.Resource;

import java.util.Optional;
import java.util.Set;

public interface PreferenceService {
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
     * in preferenceNodeShapeIRI. Preference will include all referenced object values.
     *
     * @param user                   The {@link User} to retrieve the preference for.
     * @param preferenceNodeShapeIRI The type of {@link Preference} to retrieve.
     * @return The instance of {@link Preference} for the {@link User} of the passed in type
     */
    Optional<Preference> getPreference(User user, Resource preferenceNodeShapeIRI);

    // TODO: Talk to Megan, I switched these methods back to void because it seems like it would be better just to
    //  throw an exception if it fails
    // Add an instance of Preference for a particular user
    /**
     * Get the instance of Preference for a user that is of the type of the passed
     * in preferenceNodeShapeIRI. Preference will include all referenced object values.
     *
     * @param user                   The {@link User} to retrieve the preference for.
     * @param preferenceNodeShapeIRI The type of {@link Preference} to retrieve.
     * @return The instance of {@link Preference} for the {@link User} of the passed in type
     */
    void addPreference(User user, Preference preference);

    void deletePreference(Preference preference);

    void updatePreference(User user, Preference preference, Preference existingPreference);

    boolean isSimplePreference(Preference preference);
}
