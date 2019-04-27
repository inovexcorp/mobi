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

import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.repository.api.Repository;

import java.io.IOException;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

public interface CacheImportsResolver {

    Map<String, Set<Resource>> loadOntologyIntoCache(OntologyId ontologyId, String key, Model ontModel,
                                                     Repository cacheRepo, OntologyManager ontologyManager);

    Optional<Model> retrieveOntologyFromWeb(Resource ontologyIRI) throws IOException;

    Optional<Model> retrieveOntologyLocal(Resource ontologyIRI, OntologyManager ontologyManager);
}
