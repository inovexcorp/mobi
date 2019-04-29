package com.mobi.ontology.utils.cache;

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

import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.repository.api.Repository;

import java.util.Map;
import java.util.Optional;
import java.util.Set;

public interface ImportsResolver {

    /**
     * Loads the provided Ontology Model and imports into the provided cache Repository as a dataset. If a key is
     * provided, will add the ontology into a dataset with the key. Otherwise, will use the ontologyIRI.
     *
     * @param ontologyIRI The IRI of the ontology to add to the cache
     * @param key The recordId and commitId key associated with the provided Model
     * @param ontModel The Model of the ontology
     * @param cacheRepo The Repository used as the cache
     * @param ontologyManager The OntologyManager used to check if a ontologyIRI exists in the catalog
     * @return A map of the set of the imports closure and the set of unresolved imports
     */
    Map<String, Set<Resource>> loadOntologyIntoCache(Resource ontologyIRI, String key, Model ontModel,
                                                     Repository cacheRepo, OntologyManager ontologyManager);

    /**
     * Attempts to retrieve an ontology from the web given an IRI.
     *
     * @param ontologyIRI The IRI of the Ontology to resolve from the web
     * @return An Optional of the Model representing the ontology of the provided IRI
     */
    Optional<Model> retrieveOntologyFromWeb(Resource ontologyIRI);

    /**
     * Attempts to retrieve an ontology from the local catalog given an IRI.
     * @param ontologyIRI The IRI of the Ontology to resolve from the local catalog
     * @param ontologyManager The OntologyManager used to check if the IRI exists in the catalog
     * @return An Optional of the Model representing the ontology of the provided IRI
     */
    Optional<Model> retrieveOntologyLocal(Resource ontologyIRI, OntologyManager ontologyManager);
}
