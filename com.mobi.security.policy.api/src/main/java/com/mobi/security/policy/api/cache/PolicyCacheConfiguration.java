package com.mobi.security.policy.api.cache;

/*-
 * #%L
 * com.mobi.security.policy.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.ConfigurationPolicy;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.metatype.annotations.Designate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.cache.configuration.Configuration;

@Component(
        immediate = true,
        configurationPolicy = ConfigurationPolicy.REQUIRE
)
@Designate(ocd = PolicyCacheServiceConfig.class)
public class PolicyCacheConfiguration implements CacheConfiguration {
    private static final Logger LOG = LoggerFactory.getLogger(PolicyCacheConfiguration.class);

    private String cacheId;
    private int numEntries;

    @Activate
    public void start(PolicyCacheServiceConfig config) {
        this.cacheId = config.id();
        this.numEntries = config.numEntries();
    }

    @Modified
    public void modified(PolicyCacheServiceConfig config) {
        start(config);
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
