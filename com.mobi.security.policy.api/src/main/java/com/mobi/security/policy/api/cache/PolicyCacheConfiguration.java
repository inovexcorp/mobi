package com.mobi.security.policy.api.cache;

/*-
 * #%L
 * com.mobi.security.policy.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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
import com.mobi.cache.config.CacheConfiguration;
import com.mobi.security.policy.api.Policy;
import com.mobi.security.policy.api.cache.config.PolicyCacheServiceConfig;
import org.ehcache.config.builders.CacheConfigurationBuilder;
import org.ehcache.config.builders.CacheEventListenerConfigurationBuilder;
import org.ehcache.config.builders.ResourcePoolsBuilder;
import org.ehcache.core.events.CacheEventListenerConfiguration;
import org.ehcache.event.EventType;
import org.ehcache.expiry.Expirations;
import org.ehcache.jsr107.Eh107Configuration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import javax.cache.configuration.Configuration;

@Component(
        immediate = true,
        configurationPolicy = ConfigurationPolicy.require,
        designateFactory = PolicyCacheServiceConfig.class
)
public class PolicyCacheConfiguration implements CacheConfiguration {
    private static final Logger LOG = LoggerFactory.getLogger(PolicyCacheConfiguration.class);

    private String cacheId;
    private int numEntries;

    @Activate
    public void start(Map<String, Object> props) {
        PolicyCacheServiceConfig config = Configurable.createConfigurable(PolicyCacheServiceConfig.class, props);

        this.cacheId = config.id();

        if (props.containsKey("numEntries")) {
            this.numEntries = config.numEntries();
        } else {
            this.numEntries = 100;
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
        CacheEventListenerConfiguration eventConfig = CacheEventListenerConfigurationBuilder
                .newEventListenerConfiguration(cacheEvent ->
                        LOG.warn("Policy " + ((Policy) cacheEvent.getOldValue()).getId()
                                + " has been evicted. Check your max heap size settings"), EventType.EVICTED)
                .build();
        return Eh107Configuration.fromEhcacheCacheConfiguration(CacheConfigurationBuilder
                .newCacheConfigurationBuilder(String.class, Policy.class,
                        ResourcePoolsBuilder.heap(numEntries))
                .withSizeOfMaxObjectGraph(2000)
                .withExpiry(Expirations.noExpiration())
                .add(eventConfig)
                .build());
    }
}
