package com.mobi.ontology.utils.imports;

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

import com.mobi.ontology.core.api.OntologyManager;
import org.eclipse.rdf4j.model.Resource;

import java.io.File;
import java.util.Optional;

public interface ImportsResolver {

    /**
     * Attempts to retrieve an ontology from the web given an IRI.
     *
     * @param ontologyIRI The IRI of the Ontology to resolve from the web
     * @return An Optional of the File representing the ontology of the provided IRI
     */
    Optional<File> retrieveOntologyFromWebFile(Resource ontologyIRI);

    /**
     * Attempts to retrieve an ontology from the local catalog given an IRI.
     * @param ontologyIRI The IRI of the Ontology to resolve from the local catalog
     * @param ontologyManager The OntologyManager used to check if the IRI exists in the catalog
     * @return An Optional of the File representing the ontology of the provided IRI
     */
    Optional<File> retrieveOntologyLocalFile(Resource ontologyIRI, OntologyManager ontologyManager);
}
