package com.mobi.workflows.api.action;

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

import com.mobi.workflows.api.ontologies.workflows.Action;

import java.io.InputStream;

public interface ActionHandler<T extends Action> {

    /**
     * Creates an action definition from the SHACL shape of the passed in action.
     *
     * @param action The {@link Action} entity derived from a workflow
     * @return An {@link ActionDefinition} entity for the current workflow Manager engine
     */
    ActionDefinition createDefinition(T action);

    /**
     * Retrieves the IRI of the type of {@link Action} this handler provides logic for.
     *
     * @return A IRI string of a subclass of Action
     */
    String getTypeIRI();

    /**
     * Provides the RDF of the SHACL shape of the {@link Action} to be used for validation. Expects the RDF to be in
     * Turtle format.
     * @return An {@link InputStream} of Turtle RDF data containing the SHACL shape for this {@link Action} type
     */
    InputStream getShaclDefinition();
}
