package com.mobi.rest.util;

/*-
 * #%L
 * com.mobi.rest.util
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.fail;
import static org.mockito.Matchers.anyBoolean;
import static org.mockito.Mockito.when;

import org.junit.Before;
import org.junit.Test;
import com.mobi.rest.util.jaxb.Links;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import javax.ws.rs.core.MultivaluedHashMap;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.core.UriInfo;
import java.net.URI;
import java.util.Collections;;

public class LinkUtilsTest {
    private String base = "http://example.com";
    private String path = "/path";
    private String self = base + path;
    private MultivaluedMap<String, String> params;

    @Mock
    private UriInfo info;

    @Before
    public void setUp() throws Exception {
        params = new MultivaluedHashMap<>();
        params.put("test", Collections.singletonList("true"));

        MockitoAnnotations.initMocks(this);
        when(info.getAbsolutePath()).thenReturn(new URI(self));
        when(info.getBaseUri()).thenReturn(new URI(base));
        when(info.getPath(anyBoolean())).thenReturn(path);
        when(info.getQueryParameters()).thenReturn(params);
    }

    @Test
    public void validateParamsWithNegativeLimitTest() {
        try {
            LinksUtils.validateParams(-1, 0);
            fail("Exception should have been thrown");
        } catch (MobiWebException ex) {
            assertEquals(400, ex.getResponse().getStatus());
        }
    }

    @Test
    public void validateParamsWithNegativeOffsetTest() {
        try {
            LinksUtils.validateParams(1, -1);
            fail("Exception should have been thrown");
        } catch (MobiWebException ex) {
            assertEquals(400, ex.getResponse().getStatus());
        }
    }

    @Test
    public void buildLinksTest() {
        Links result = LinksUtils.buildLinks(info, 0, 0, 1, 0);
        assertEquals(base, result.getBase());
        assertEquals(path, result.getContext());
        assertEquals(self, result.getSelf());
        assertNull(result.getNext());
        assertNull(result.getPrev());
    }

    @Test
    public void buildLinksWithPrevTest() {
        params.put("offset", Collections.singletonList("1"));
        params.put("limit", Collections.singletonList("1"));
        Links result = LinksUtils.buildLinks(info, 1, 2, 1, 1);
        assertEquals(base, result.getBase());
        assertEquals(path, result.getContext());
        assertEquals(self, result.getSelf());
        assertNull(result.getNext());
        assertEquals(path + "?test=true&offset=0&limit=1", result.getPrev());
    }

    @Test
    public void buildLinksWithNextTest() {
        params.put("offset", Collections.singletonList("1"));
        params.put("limit", Collections.singletonList("1"));
        Links result = LinksUtils.buildLinks(info, 1, 2, 1, 0);
        assertEquals(base, result.getBase());
        assertEquals(path, result.getContext());
        assertEquals(self, result.getSelf());
        assertEquals(path + "?test=true&offset=1&limit=1", result.getNext());
        assertNull(result.getPrev());
    }
}
