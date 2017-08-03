package org.matonto.prov.api;

/*-
 * #%L
 * org.matonto.prov.api
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

import org.matonto.ontologies.provo.Activity;
import org.matonto.prov.api.builder.ActivityConfig;

public interface ProvenanceService {

    /**
     * Returns a ProvenanceQueryConnection that facilitates running SPARQL queries against the provenance repository.
     *
     * @return a ProvenanceQueryConnection
     */
    ProvenanceQueryConnection getQueryConnection();

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
     * Updates the Activity with the matching IRI from the provided Activity. The Activity should include all
     * referenced Entities.
     *
     * @param newActivity The Activity to replace the existing one in the provenance repository
     */
    void updateActivity(Activity newActivity);
}
