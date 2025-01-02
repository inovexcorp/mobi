package com.mobi.workflows.api.trigger;

/*-
 * #%L
 * com.mobi.workflows.api
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

import com.mobi.workflows.api.ontologies.workflows.Trigger;
import org.eclipse.rdf4j.model.Resource;

import java.io.InputStream;

public interface TriggerHandler<T extends Trigger> {

    /**
     * Creates a {@link TriggerService} for the identified Workflow based on the provided Trigger definition.
     *
     * @param workflowId The {@link org.eclipse.rdf4j.model.IRI} of the workflow to link the trigger entity to
     * @param trigger The newly generated trigger entity
     */
    void create(Resource workflowId, T trigger);

    /**
     * Validates whether a {@link TriggerService} with the passed in Trigger IRI already exists.
     *
     * @param triggerId The {@link org.eclipse.rdf4j.model.IRI} of the trigger whose existence to check
     * @return true, if the trigger already exists within the repo; false if it does not.
     */
    boolean exists(Resource triggerId);

    /**
     * Updates the type and underlying configuration for the {@link TriggerService} linked to the passed in Trigger IRI.
     *
     * @param trigger The {@link Trigger} entity to be updated
     */
    void update(T trigger);

    /**
     * Removes all triples related to the {@link TriggerService} linked to the passed in Trigger IRI.
     *
     * @param triggerId The {@link org.eclipse.rdf4j.model.IRI} of the Trigger entity to remove from the system
     */
    void remove(Resource triggerId);

    /**
     * Retrieves the IRI of the subclass type of the {@link Trigger} linked to the handler.
     *
     * @return A {@link org.eclipse.rdf4j.model.IRI} string of a subclass of Trigger
     */
    String getTypeIRI();

    /**
     * Provides the RDF of the SHACL shape of the {@link Trigger} to be used for validation. Expects the RDF to be in
     * Turtle format.
     *
     * @return An {@link InputStream} of Turtle RDF data containing the SHACL shape for this Trigger type
     */
    InputStream getShaclDefinition();
}
