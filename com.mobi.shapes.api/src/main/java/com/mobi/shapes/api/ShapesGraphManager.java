package com.mobi.shapes.api;

/*-
 * #%L
 * com.mobi.shapes.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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

import org.eclipse.rdf4j.model.Resource;

import java.util.Optional;
import javax.annotation.Nonnull;

public interface ShapesGraphManager {

    /**
     * Tests whether a ShapesGraphRecord with the provided shapesGraphId Resource exists in the Catalog.
     *
     * @param shapesGraphId A shapes graph {@link Resource}
     * @return True if the shapes graph exists; false otherwise
     */
    boolean shapesGraphIriExists(Resource shapesGraphId);

    /**
     * Retrieves a ShapesGraph using a record id and the head commit of its MASTER branch.
     *
     * @param recordId the record id for the ShapesGraphRecord you want to retrieve.
     * @return Returns an Optional of the ShapesGraph if found, otherwise Optional.empty().
     */
    Optional<ShapesGraph> retrieveShapesGraph(@Nonnull Resource recordId);

    /**
     * Collects a {@link ShapesGraph} specified by the passed IRI {@link Resource Resources} for a
     * {@link com.mobi.shapes.api.ontologies.shapesgrapheditor.ShapesGraphRecord} and a
     * {@link com.mobi.catalog.api.ontologies.mcat.Branch} from the repository if it exists.
     *
     * @param recordId the IRI {@link Resource} for a Shapes Graph Record
     * @param branchId the IRI {@link Resource} for a {@link com.mobi.catalog.api.ontologies.mcat.Branch}
     * @return an {@link Optional} with a Shapes Graph with the mapping RDF if it was found
     */
    Optional<ShapesGraph> retrieveShapesGraph(@Nonnull Resource recordId, @Nonnull Resource branchId);

    /**
     * Collects a {@link ShapesGraph} specified by the passed shapesGraph IRI {@link Resource Resources} for a
     * {@link com.mobi.shapes.api.ontologies.shapesgrapheditor.ShapesGraphRecord},
     * {@link com.mobi.catalog.api.ontologies.mcat.Branch}, and a
     * {@link com.mobi.catalog.api.ontologies.mcat.Commit} from the repository if it exists.
     *
     * @param recordId the IRI {@link Resource} for a Shapes Graph Record
     * @param branchId the IRI {@link Resource} for a {@link com.mobi.catalog.api.ontologies.mcat.Branch}
     * @param commitId the IRI {@link Resource} for a {@link com.mobi.catalog.api.ontologies.mcat.Commit}
     * @return an {@link Optional} with a Shapes Graph with the mapping RDF if it was found
     */
    Optional<ShapesGraph> retrieveShapesGraph(@Nonnull Resource recordId, @Nonnull Resource branchId,
                                              @Nonnull Resource commitId);

    /**
     * Collects a {@link ShapesGraph} specified by the passed IRI {@link Resource Resources} for a
     * {@link com.mobi.catalog.api.ontologies.mcat.Commit} from the repository if it exists.
     *
     * @param commitId the IRI {@link Resource} for a {@link com.mobi.catalog.api.ontologies.mcat.Commit}
     * @return an {@link Optional} with a Shapes Graph with the mapping RDF if it was found
     */
    Optional<ShapesGraph> retrieveShapesGraphByCommit(@Nonnull Resource commitId);
}
