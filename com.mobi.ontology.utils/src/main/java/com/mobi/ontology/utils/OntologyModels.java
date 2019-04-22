package com.mobi.ontology.utils;

/*-
 * #%L
 * com.mobi.ontology.utils
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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

import com.mobi.persistence.utils.Models;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.eclipse.rdf4j.model.vocabulary.RDF;

import java.util.Optional;

public class OntologyModels {

    /**
     * Finds the first OntologyIRI in the provided Model.
     *
     * @param model The Model to filter
     * @param vf The ValueFactory used to create an IRI
     * @return An Optional IRI of the first OntologyIRI found in the Model
     */
    public static Optional<IRI> findFirstOntologyIRI(Model model, ValueFactory vf) {
        Optional<Resource> optionalResource = Models.findFirstSubject(model, vf.createIRI(RDF.TYPE.stringValue()),
                vf.createIRI(OWL.ONTOLOGY.stringValue()));
        if (optionalResource.isPresent() && optionalResource.get() instanceof IRI) {
            return Optional.of((IRI) optionalResource.get());
        }
        return Optional.empty();
    }

    /**
     * Finds the first VersionIRI in the provided Model with the given OntologyIRI.
     *
     * @param model The Model to filter
     * @param ontologyIRI The OntologyIRI used to filter
     * @param vf The ValueFactory used to create an IRI
     * @return An Optional IRI of the first VersionIRI found for the given OntologyIRI
     */
    public static Optional<IRI> findFirstVersionIRI(Model model, IRI ontologyIRI, ValueFactory vf) {
        Optional<Value> optionalValue = Models.findFirstObject(model, ontologyIRI, vf.createIRI(OWL.VERSIONIRI.stringValue()));
        if (optionalValue.isPresent() && optionalValue.get() instanceof IRI) {
            return Optional.of((IRI) optionalValue.get());
        }
        return Optional.empty();
    }
}