package com.mobi.ontology.utils.cache;

/*-
 * #%L
 * com.mobi.ontology.core.impl.owlapi
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

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.ConfigurationPolicy;
import aQute.bnd.annotation.component.Modified;
import aQute.bnd.annotation.metatype.Configurable;
import org.ehcache.config.builders.CacheConfigurationBuilder;
import org.ehcache.config.builders.ResourcePoolsBuilder;
import org.ehcache.jsr107.Eh107Configuration;
import com.mobi.cache.config.CacheConfiguration;
import com.mobi.cache.config.CacheServiceConfig;
import com.mobi.ontology.core.api.Ontology;

import java.util.Map;
import javax.cache.configuration.Configuration;

@Component(
        immediate = true,
        configurationPolicy = ConfigurationPolicy.require
)
public class OntologyCacheConfiguration implements CacheConfiguration {

    private String cacheId;
    private int numEntries;

    @Activate
    public void start(Map<String, Object> props) {
        CacheServiceConfig config = Configurable.createConfigurable(CacheServiceConfig.class, props);

        this.cacheId = config.id();

        if (props.containsKey("numEntries")) {
            this.numEntries = config.numEntries();
        } else {
            this.numEntries = 10;
        }
    }

    @Modified
    public void modified(Map<String, Object> props) {
        start(props);
    }

    @Override
    public String getCacheId() {
        return cacheId;
    }

    @Override
    public Configuration getCacheConfiguration() {
        return Eh107Configuration.fromEhcacheCacheConfiguration(CacheConfigurationBuilder
                .newCacheConfigurationBuilder(String.class, Ontology.class, ResourcePoolsBuilder.heap(numEntries))
                .build());
    }
}
