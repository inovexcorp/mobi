package com.mobi.security.policy.impl.core.cache;

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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.when;

import com.mobi.cache.api.CacheManager;
import com.mobi.security.policy.api.Policy;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;
import javax.cache.Cache;

public class PolicyCacheImplTest {
    private PolicyCacheImpl service;

    @Mock
    private CacheManager cacheManager;

    @Mock
    private Cache<String, Policy> cache;

    @Before
    public void setUp() throws Exception {
        MockitoAnnotations.initMocks(this);
        when(cacheManager.getCache(anyString(), eq(String.class), eq(Policy.class))).thenReturn(Optional.of(cache));

        service = new PolicyCacheImpl();
        service.setCacheManager(cacheManager);
    }

    @Test
    public void getPolicyCacheTest() {
        Optional<Cache<String, Policy>> result = service.getPolicyCache();
        assertTrue(result.isPresent());
        assertEquals(cache, result.get());

        service.setCacheManager(null);
        result = service.getPolicyCache();
        assertFalse(result.isPresent());
    }
}
