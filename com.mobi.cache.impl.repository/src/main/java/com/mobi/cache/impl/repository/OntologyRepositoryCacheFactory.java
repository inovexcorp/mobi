package com.mobi.cache.impl.repository;

/*-
 * #%L
 * com.mobi.cache.impl.repository
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyCreationService;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecordFactory;
import com.mobi.repository.api.OsgiRepository;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import javax.cache.Cache;
import javax.cache.CacheManager;

@Component
public class OntologyRepositoryCacheFactory implements CacheFactory<String, Ontology> {

    @Reference
    private DatasetManager datasetManager;

    @Reference
    private CatalogConfigProvider configProvider;

    @Reference
    private CatalogUtilsService utilsService;

    @Reference
    private OntologyRecordFactory ontologyRecordFactory;

    @Reference
    private OntologyCreationService ontologyCreationService;

    @Override
    public Class<Ontology> getValueType() {
        return Ontology.class;
    }

    @Override
    public Cache<String, Ontology> createCache(RepositoryConfiguration<String, Ontology> configuration,
                                               CacheManager cacheManager, OsgiRepository repository) {
        return new OntologyRepositoryCache(configuration.getRepoId(), repository, cacheManager,
                configuration, configProvider, utilsService, ontologyRecordFactory, datasetManager,
                ontologyCreationService);
    }
}
