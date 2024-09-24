package com.mobi.ontology.utils;

/*-
 * #%L
 * com.mobi.ontology.utils
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

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.eclipse.rdf4j.model.vocabulary.RDF;

import java.util.Optional;

public class OntologyModels {

    /**
     * Finds the first OntologyIRI in the provided Model.
     *
     * @param model The Model to filter
     * @return An Optional IRI of the first OntologyIRI found in the Model
     */
    public static Optional<IRI> findFirstOntologyIRI(Model model) {
        Model ontologyDefs = model.filter(null, RDF.TYPE, OWL.ONTOLOGY);
        if (!ontologyDefs.isEmpty()) {
            IRI ontWithMostStatements = null;
            int size = 0;
            for (Resource ontologyId : ontologyDefs.subjects()) {
                int ontologyIdStatementCount = model.filter(ontologyId, null, null).size();
                if (ontologyIdStatementCount > size && ontologyId instanceof IRI ontologyIRI) {
                    ontWithMostStatements = ontologyIRI;
                    size = ontologyIdStatementCount;
                }
            }
            if (ontWithMostStatements != null) {
                return Optional.of(ontWithMostStatements);
            }
        }
        return Optional.empty();
    }

    /**
     * Finds the first VersionIRI in the provided Model with the given OntologyIRI.
     *
     * @param model The Model to filter
     * @param ontologyIRI The OntologyIRI used to filter
     * @return An Optional IRI of the first VersionIRI found for the given OntologyIRI
     */
    public static Optional<IRI> findFirstVersionIRI(Model model, IRI ontologyIRI) {
        Optional<Value> optionalValue = findFirstObject(model, ontologyIRI, OWL.VERSIONIRI);
        if (optionalValue.isPresent() && optionalValue.get() instanceof IRI) {
            return Optional.of((IRI) optionalValue.get());
        }
        return Optional.empty();
    }

    /**
     * Finds the first subject in the provided Model that has the given predicate and object.
     *
     * @param model The Model to filter
     * @param predicate The predicate to filter by
     * @param object The object to filter by
     * @return An Optional Resource of the first subject found with the given predicate and object
     */
    private static Optional<Resource> findFirstSubject(Model model, IRI predicate, IRI object) {
        Model filteredModel = model.filter(null, predicate, object);
        if (!filteredModel.isEmpty()) {
            Statement statement = filteredModel.stream()
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException("Model cannot be empty"));
            return Optional.of(statement.getSubject());
        }
        return Optional.empty();
    }

    /**
     * Finds the first object in the provided Model that has the given subject and predicate.
     *
     * @param model The Model to filter
     * @param subject The subject to filter by
     * @param predicate The predicate to filter by
     * @return An Optional Value of the first object found with the given subject and predicate
     */
    private static Optional<Value> findFirstObject(Model model, IRI subject, IRI predicate) {
        Model filteredModel = model.filter(subject, predicate, null);
        if (!filteredModel.isEmpty()) {
            Statement statement = filteredModel.stream()
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException("Model cannot be empty"));
            return Optional.of(statement.getObject());
        }
        return Optional.empty();
    }
}
