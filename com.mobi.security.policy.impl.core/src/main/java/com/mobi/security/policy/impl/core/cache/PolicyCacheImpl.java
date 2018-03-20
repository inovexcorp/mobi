package com.mobi.security.policy.impl.cache;

/*-
 * #%L
 * com.mobi.security.policy.impl.core
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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.cache.api.CacheManager;
import com.mobi.security.policy.api.Policy;
import com.mobi.security.policy.api.cache.PolicyCache;

import java.util.Optional;
import javax.cache.Cache;

@Component
public class PolicyCacheImpl implements PolicyCache {

    private final String CACHE_NAME = "policyCache";
    private CacheManager cacheManager;

    @Reference
    void setCacheManager(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    @Override
    public Optional<Cache<String, Policy>> getPolicyCache() {
        if (cacheManager != null) {
            return cacheManager.getCache(CACHE_NAME, String.class, Policy.class);
        }
        return Optional.empty();
    }

}
