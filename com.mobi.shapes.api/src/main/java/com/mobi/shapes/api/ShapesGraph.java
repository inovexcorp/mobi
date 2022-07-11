package com.mobi.shapes.api;

/*-
 * #%L
 * com.mobi.shapes.api
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

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;

import java.util.Optional;
import javax.ws.rs.core.StreamingOutput;

public interface ShapesGraph {

    /**
     * Retrieves the model backing the SimpleShapesGraph object.
     *
     * @return The {@link Model} backing the Shapes Graph.
     */
    Model getModel();

    /**
     * Sets the model containing the contents of the Shapes Graph.
     *
     * @param model The {@link Model} containing the data in this Shapes Graph
     */
    void setModel(Model model);

    /**
     * Retrieves the model containing all Statements in the Shapes Graph with the passed in subjectId.
     *
     * @param subjectId The {@link Resource} to retrieve statements for.
     *
     * @return The {@link Model} containing all statements with the passed in subjectId.
     */
    Model getEntity(Resource subjectId);

    /**
     * Retrieves an Optional of the Shapes Graph IRI.
     *
     * @return An optional of the Shapes Graph IRI if it exists. Otherwise an empty Optional.
     */
    Optional<IRI> getShapesGraphId();

    /**
     * Retrieves the model containing all Statements in the Shapes Graph except for those with a subjectID of the Shapes
     * Graph IRI.
     *
     * @return The model containing all Statements in the Shapes Graph except for statements with a subjectID of the
     * Shapes Graph IRI.
     */
    Model getShapesGraphContent();

    /**
     * Retrieves a serialization of the Shapes Graph except for statements with a subjectID of the Shapes Graph IRI.
     *
     * @return The serialization of the Shapes Graph except for statements with a subjectID of the Shapes Graph IRI.
     */
    StreamingOutput serializeShapesGraph(String format);
}
