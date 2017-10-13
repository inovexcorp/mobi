package com.mobi.rdf.orm.generate;

/*-
 * #%L
 * com.mobi.rdf.orm.generate
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

import org.apache.commons.lang3.StringUtils;
import org.openrdf.model.IRI;
import org.openrdf.model.Model;
import org.openrdf.model.vocabulary.OWL;
import org.openrdf.model.vocabulary.RDF;
import org.openrdf.model.vocabulary.RDFS;

import java.io.IOException;
import java.util.List;

/**
 * Created by bdgould on 9/19/16.
 */
public class ReferenceOntology {

    private final Model ontologyModel;

    private final String packageName;

    private final String ontologyName;

    private SourceGenerator sourceGenerator;

    public ReferenceOntology(final String packageName, final Model ontologyModel) {
        this(packageName, null, ontologyModel);
    }

    public ReferenceOntology(final String packageName, final String ontologyName, final Model ontologyModel) {
        this.packageName = packageName;
        this.ontologyModel = ontologyModel;
        this.ontologyName = ontologyName;
    }

    public Model getOntologyModel() {
        return ontologyModel;
    }

    public String getPackageName() {
        return packageName;
    }

    public boolean containsClass(final IRI classIri) {
        return !ontologyModel.filter(classIri, RDF.TYPE, RDFS.CLASS).isEmpty() || !ontologyModel.filter(classIri, RDF.TYPE, OWL.CLASS).isEmpty();
    }

    public String getClassName(final IRI classUri) {
        return packageName + "." + SourceGenerator.getName(true, classUri, ontologyModel);
    }

    public boolean containsProperty(final IRI propertyIri) {
        return !ontologyModel.filter(propertyIri, RDF.TYPE, RDF.PROPERTY).isEmpty();
    }

    public SourceGenerator getSourceGenerator() {
        return sourceGenerator;
    }

    public void generateSource(List<ReferenceOntology> references) throws OntologyToJavaException, IOException {
        this.sourceGenerator = new SourceGenerator(this.ontologyModel, this.packageName, this.ontologyName, references);
    }


}
