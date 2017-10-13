package com.mobi.prov.api;

/*-
 * #%L
 * com.mobi.prov.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

import com.mobi.ontologies.provo.Activity;
import com.mobi.prov.api.builder.ActivityConfig;
import com.mobi.rdf.api.Resource;
import com.mobi.ontologies.provo.Activity;
import com.mobi.prov.api.builder.ActivityConfig;
import com.mobi.rdf.api.Resource;
import com.mobi.repository.api.RepositoryConnection;

import java.util.Optional;

public interface ProvenanceService {

    /**
     * Returns a read-only RepositoryConnection that facilitates running SPARQL queries against the provenance
     * repository.
     *
     * @return a read-only RepositoryConnection on provenance data
     */
    RepositoryConnection getConnection();

    /**
     * Creates an Activity using the provided configuration with the Activity types, associated User, and references
     * to Entities generated, used, or invalidated by the Activity. Any referenced Entities will be included in the
     * Activity's Model.
     *
     * @param config an ActivityConfig
     * @return an Activity with all referenced Entities
     */
    Activity createActivity(ActivityConfig config);

    /**
     * Adds the passed Activity to the provenance repository. The Activity should include all referenced Entities.
     *
     * @param activity The Activity to be added to the provenance repository
     */
    void addActivity(Activity activity);

    /**
     * Retrieves an Activity identified by its IRI from the provenance store. Activity will include all referenced
     * Entities.
     *
     * @param activityIRI The IRI of an Activity
     * @return The identified Activity if found; otherwise, an empty Optional
     */
    Optional<Activity> getActivity(Resource activityIRI);

    /**
     * Updates the Activity with the matching IRI from the provided Activity. The Activity should include all
     * referenced Entities.
     *
     * @param newActivity The Activity to replace the existing one in the provenance repository
     */
    void updateActivity(Activity newActivity);

    /**
     * Removes an Activity identified by its IRI from the provenance store. Referenced Entities will only be removed
     * if not referenced by another Activity.
     *
     * @param activityIRI The IRI of an Activity
     */
    void deleteActivity(Resource activityIRI);
}
