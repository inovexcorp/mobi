package com.mobi.cache.impl.repository;

/*-
 * #%L
 * com.mobi.cache.impl.repository
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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

import com.mobi.cache.api.repository.CacheFactory;
import com.mobi.cache.api.repository.jcache.config.RepositoryConfiguration;
import com.mobi.cache.impl.repository.jcache.OntologyRepositoryCache;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.repository.api.OsgiRepository;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ReferencePolicyOption;

import javax.cache.Cache;
import javax.cache.CacheManager;

@Component
public class OntologyRepositoryCacheFactory implements CacheFactory<String, Ontology> {

    private OntologyManager ontologyManager;
    private DatasetManager datasetManager;

    @Reference(policyOption = ReferencePolicyOption.GREEDY)
    void setOntologyManager(OntologyManager ontologyManager) {
        this.ontologyManager = ontologyManager;
    }

    @Reference
    void setDatasetManager(DatasetManager datasetManager) {
        this.datasetManager = datasetManager;
    }

    @Override
    public Class<Ontology> getValueType() {
        return Ontology.class;
    }

    @Override
    public Cache<String, Ontology> createCache(RepositoryConfiguration<String, Ontology> configuration,
                                               CacheManager cacheManager, OsgiRepository repository) {
        OntologyRepositoryCache cache = new OntologyRepositoryCache(configuration.getRepoId(), repository, cacheManager,
                configuration);
        cache.setOntologyManager(ontologyManager);
        cache.setDatasetManager(datasetManager);
        return cache;
    }
}
