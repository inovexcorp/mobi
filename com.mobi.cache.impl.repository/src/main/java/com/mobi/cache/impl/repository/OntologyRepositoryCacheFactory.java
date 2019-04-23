package com.mobi.cache.impl.repository;

/*-
 * #%L
 * com.mobi.cache.impl.repository
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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.cache.api.repository.CacheFactory;
import com.mobi.cache.api.repository.jcache.config.RepositoryConfiguration;
import com.mobi.cache.impl.repository.jcache.OntologyRepositoryCache;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.dataset.ontology.dataset.DatasetFactory;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.Repository;

import javax.cache.Cache;
import javax.cache.CacheManager;

@Component
public class OntologyRepositoryCacheFactory implements CacheFactory<String, Ontology> {

    private OntologyManager ontologyManager;
    private ModelFactory mf;
    private ValueFactory vf;
    private DatasetFactory datasetFactory;
    private DatasetManager datasetManager;

    // TODO: Remove when Repository based OntologyManager is implemented (or are we leaving it?)
    @Reference
    void setOntologyManager(OntologyManager ontologyManager) {
        this.ontologyManager = ontologyManager;
    }

    @Reference
    void setModelFactory(ModelFactory modelFactory) {
        this.mf = modelFactory;
    }

    @Reference
    void setValueFactory(ValueFactory valueFactory) {
        this.vf = valueFactory;
    }

    @Reference
    void setDatasetFactory(DatasetFactory datasetFactory) {
        this.datasetFactory = datasetFactory;
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
                                               CacheManager cacheManager, Repository repository) {
        OntologyRepositoryCache cache = new OntologyRepositoryCache(configuration.getRepoId(), repository, cacheManager,
                configuration);
        cache.setOntologyManager(ontologyManager);
        cache.setModelFactory(mf);
        cache.setValueFactory(vf);
        cache.setDatasetFactory(datasetFactory);
        cache.setDatasetManager(datasetManager);
        return cache;
    }
}