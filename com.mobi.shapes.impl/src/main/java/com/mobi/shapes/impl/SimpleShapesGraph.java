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

import com.mobi.ontology.utils.OntologyModels;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rest.util.RestUtils;
import com.mobi.shapes.api.ShapesGraph;

import java.util.Optional;
import javax.ws.rs.core.StreamingOutput;

public class SimpleShapesGraph implements ShapesGraph {

    private Model model;
    private ValueFactory vf;
    private ModelFactory mf;

    /**
     * Creates a SimpleShapesGraph object that represents a Shapes Graph.
     *
     * @param model           The {@link Model} containing the data in this Shapes Graph
     * @param vf              The {@link ValueFactory} used to create Statements
     */
    public SimpleShapesGraph(Model model, ValueFactory vf, ModelFactory mf) {
        this.model = model;
        this.vf = vf;
        this.mf = mf;
    }

    @Override
    public Model getModel() {
        return this.model;
    }

    @Override
    public void setModel(Model model) {
        this.model = model;
    }

    @Override
    public Model getEntity(Resource subjectId) {
        return this.model.filter(subjectId, null, null);
    }

    @Override
    public Optional<IRI> getShapesGraphId() {
        return OntologyModels.findFirstOntologyIRI(this.getModel(), vf);
    }

    @Override
    public Model getShapesGraphContent() {
        Model shapesGraphContent = mf.createModel();
        IRI shapesGraphId = OntologyModels.findFirstOntologyIRI(this.getModel(), vf)
                .orElseThrow(() -> new IllegalStateException("Missing OntologyIRI")); // Check for empty
        this.model.unmodifiable().forEach(statement -> {
            if (!statement.getSubject().equals(shapesGraphId)) {
                shapesGraphContent.add(statement);
            }
        });
        return shapesGraphContent;
    }

    @Override
    public StreamingOutput serializeShapesGraph(String format, SesameTransformer transformer) {
        StreamingOutput output = outputStream ->
                RestUtils.groupedModelToOutputStream(this.getShapesGraphContent(), RestUtils.getRDFFormat(format), transformer, outputStream);
        return output;
    }
}
