package org.matonto.ontology.utils.cache;

/*-
 * #%L
 * org.matonto.ontology.utils
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

import org.matonto.ontology.core.api.Ontology;
import org.matonto.rdf.api.Resource;

import java.util.Optional;
import javax.annotation.Nonnull;
import javax.cache.Cache;


public interface OntologyCache {
    String generateKey(String recordIri, String branchIri, String commitIri);

    Optional<Cache<String, Ontology>> getOntologyCache();

    void clearCacheImports(Resource ontologyIRI);

    void clearCache(@Nonnull Resource recordId, Resource branchId);
}
