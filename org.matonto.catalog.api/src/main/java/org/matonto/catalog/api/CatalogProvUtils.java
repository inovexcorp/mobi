package org.matonto.catalog.api;

/*-
 * #%L
 * org.matonto.catalog.api
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

import org.matonto.catalog.api.ontologies.mcat.Record;
import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.matonto.ontologies.provo.Activity;
import org.matonto.prov.api.ontologies.mobiprov.CreateActivity;
import org.matonto.prov.api.ontologies.mobiprov.DeleteActivity;
import org.matonto.rdf.api.Resource;

import javax.annotation.Nullable;

public interface CatalogProvUtils {

    /**
     * Creates a CreateActivity started by the provided User to indicate beginning to create a catalog Record.
     *
     * @param user The User who started the record creation
     * @return The CreateActivity for the record creation
     */
    CreateActivity startCreateActivity(User user);

    /**
     * Updates the provided CreateActivity with an end time and an Entity representing the Record identified by the
     * provided Resource IRI.
     *
     * @param createActivity The CreateActivity to update
     * @param recordIRI The IRI of the Record that was successfully created
     */
    void endCreateActivity(CreateActivity createActivity, Resource recordIRI);

    /**
     * Creates a DeleteActivity started by the provided User to indicate beginning to delete a catalog Record.
     *
     * @param user The User who started the record deletion
     * @param recordIri The IRI of the Record to be deleted
     * @return The DeleteActivity for the record deletion
     */
    DeleteActivity startDeleteActivity(User user, Resource recordIri);

    /**
     * Updates the provided DeleteActivity with an end time and an Entity representing the Record identified by the
     * provided Resource IRI.
     *
     * @param deleteActivity The DeleteActivity to update
     * @param record         The Record that was successfully deleted
     */
    void endDeleteActivity(DeleteActivity deleteActivity, Record record);

    /**
     * Removes the provided Activity. Typical use case is if something goes wrong during a process and the Activity
     * is nullified.
     *
     * @param activity The Activity to remove
     */
    void removeActivity(@Nullable Activity activity);
}
