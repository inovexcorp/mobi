package com.mobi.ontology.utils.cache.impl;

/*-
 * #%L
 * com.mobi.ontology.utils
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


import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.cache.api.CacheManager;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.utils.cache.OntologyCache;
import com.mobi.rdf.api.Resource;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import javax.annotation.Nonnull;
import javax.cache.Cache;

@Component
public class OntologyCacheImpl implements OntologyCache {
    private final String CACHE_NAME = "ontologyCache";
    private CacheManager cacheManager;

    @Reference
    public void setCacheManager(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    @Override
    public String generateKey(String recordIri, String commitIri) {
        return String.format("%s&%s", recordIri, commitIri);
    }

    @Override
    public Optional<Cache<String, Ontology>> getOntologyCache() {
        if (cacheManager != null) {
            return cacheManager.getCache(CACHE_NAME, String.class, Ontology.class);
        }
        return Optional.empty();
    }

    @Override
    public void clearCacheImports(Resource ontologyIRI) {
        Optional<Cache<String, Ontology>> optCache = getOntologyCache();
        optCache.ifPresent(cache -> {
            Set<String> cachesToRemove = new HashSet<>();
            for (Cache.Entry<String, Ontology> entry : cache) {
                Set<? extends Resource> importedIRIs = entry.getValue().getImportedOntologyIRIs();
                if (importedIRIs.contains(ontologyIRI)) {
                    cachesToRemove.add(entry.getKey());
                }
            }
            cache.removeAll(cachesToRemove);
        });
    }

    @Override
    public void clearCache(@Nonnull Resource recordId) {
        getOntologyCache().ifPresent(cache -> {
            for (Cache.Entry<String, Ontology> entry : cache) {
                if (entry.getKey().startsWith(recordId.stringValue())) {
                    cache.remove(entry.getKey());
                }
            }
        });
    }

    @Override
    public void removeFromCache(String recordIdStr, String commitIdStr) {
        Cache<String, Ontology> cache;
        Optional<Cache<String, Ontology>> optCache = getOntologyCache();
        String key = generateKey(recordIdStr, commitIdStr);
        if (optCache.isPresent() && (cache = optCache.get()).containsKey(key)) {
            cache.remove(key);
        }
    }
}
