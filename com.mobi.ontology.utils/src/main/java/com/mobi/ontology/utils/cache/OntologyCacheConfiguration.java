package com.mobi.ontology.utils.cache;

/*-
 * #%L
 * com.mobi.ontology.utils
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

import com.mobi.cache.api.repository.jcache.config.RepositoryConfiguration;
import com.mobi.cache.config.CacheConfiguration;
import com.mobi.cache.config.CacheServiceConfig;
import com.mobi.ontology.core.api.Ontology;
import org.apache.commons.lang3.StringUtils;
import org.ehcache.config.builders.CacheConfigurationBuilder;
import org.ehcache.config.builders.ResourcePoolsBuilder;
import org.ehcache.jsr107.Eh107Configuration;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.ConfigurationPolicy;
import org.osgi.service.component.annotations.Modified;

import javax.cache.configuration.Configuration;

@Component(
        immediate = true,
        configurationPolicy = ConfigurationPolicy.REQUIRE
)
public class OntologyCacheConfiguration implements CacheConfiguration {

    private String cacheId;
    private String repoId;
    private int numEntries;

    @Activate
    public void start(CacheServiceConfig config) {
        this.cacheId = config.id();
        this.numEntries = config.numEntries();
        this.repoId = config.repoId();
    }

    @Modified
    public void modified(CacheServiceConfig config) {
        start(config);
    }

    @Override
    public String getCacheId() {
        return cacheId;
    }

    @Override
    public Configuration getCacheConfiguration() {
        if (!StringUtils.isEmpty(repoId)) {
            return new RepositoryConfiguration(String.class, Ontology.class, repoId);
        } else {
            return Eh107Configuration.fromEhcacheCacheConfiguration(CacheConfigurationBuilder
                    .newCacheConfigurationBuilder(String.class, Ontology.class, ResourcePoolsBuilder.heap(numEntries))
                    .build());
        }
    }
}
