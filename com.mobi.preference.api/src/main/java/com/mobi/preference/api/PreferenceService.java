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

    public static final String GRAPH = "http://mobi.com/preferencemanagement";

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
     * @param preferenceType The type of {@link Preference} to retrieve.
     * @return The instance of {@link Preference} for the {@link User} of the passed in type
     */
    Optional<Preference> getUserPreference(User user, Resource preferenceType);

    // TODO: Talk to Megan, I switched these methods back to void because it seems like it would be better just to
    //  throw an exception if it fails
    // Add an instance of Preference for a particular user

    Optional<Preference> getUserPreference(Resource resourceId);

    /**
     * Get the instance of Preference for a user that is of the type of the passed
     * in preferenceNodeShapeIRI. Preference will include all referenced object values.
     *
     * @param user                   The {@link User} to retrieve the preference for.
     * @param preferenceNodeShapeIRI The type of {@link Preference} to retrieve.
     * @return The instance of {@link Preference} for the {@link User} of the passed in type
     */
    void addPreference(User user, Preference preference);

    /*
    Query the repo for the list of IRIs connected to the existingPreference IRI.
    Remove all triples in the namedgraph with a subject of those IRIs if they aren't
    referenced elsewhere (look at removeIfNotReferenced() method in the
    SimpleProvenanceService)
    Remove all triples with a subject of the existingPreference IRI
     */
    void deletePreference(User user, Resource preferenceType);

    void deletePreference(Resource preferenceIRI);

    void updatePreference(User user, Preference preference);

    boolean isSimplePreference(Preference preference);
}
