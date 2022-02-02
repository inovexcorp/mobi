package com.mobi.shapes.impl;

/*-
 * #%L
 * com.mobi.shapes.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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

import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.utils.OntologyModels;
import com.mobi.ontology.utils.imports.ImportsResolver;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.Repository;
import com.mobi.shapes.api.ShapesGraph;

import java.io.File;
import java.util.Optional;

public class SimpleShapesGraph implements ShapesGraph {

    private Model model;
    private ValueFactory vf;

    /**
     * Creates a SimpleShapesGraph object that represents a Shapes Graph.
     *
     * @param model           The {@link Model} containing the data in this Shapes Graph
     * @param vf              The {@link ValueFactory} used to create Statements
     */
    public SimpleShapesGraph(Model model, ValueFactory vf) {
        this.model = model;
        this.vf = vf;
    }

    /**
     * Retrieves the model backing the SimpleShapesGraph object.
     *
     * @return The {@link Model} backing the Shapes Graph.
     */
    @Override
    public Model getModel() {
        return this.model;
    }

    /**
     * Sets the model containing the contents of the Shapes Graph.
     *
     * @param model The {@link Model} containing the data in this Shapes Graph
     */
    @Override
    public void setModel(Model model) { this.model = model; }

    /**
     * Retrieves the model containing all Statements in the Shapes Graph with the passed in subjectId.
     *
     * @param subjectId The {@link Resource} to retrieve statements for.
     *
     * @return The {@link Model} containing all statements with the passed in subjectId.
     */
    @Override
    public Model getEntity(Resource subjectId) {
        return this.model.filter(subjectId, null, null);
    }

    /**
     * Retrieves an Optional of the Shapes Graph IRI.
     *
     * @return An optional of the Shapes Graph IRI if it exists. Otherwise an empty Optional.
     */
    @Override
    public Optional<IRI> getShapesGraphId() {
        return OntologyModels.findFirstOntologyIRI(this.getModel(), vf);
    }
}
