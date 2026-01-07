package com.mobi.jaas.rest;

/*-
 * #%L
 * com.mobi.jaas.rest
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

import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.rest.test.util.MobiRestTestCXF;
import com.mobi.rest.test.util.UsernameTestFilter;
import org.eclipse.rdf4j.model.ValueFactory;
import org.junit.BeforeClass;
import org.junit.Test;
import org.mockito.Mockito;

import javax.ws.rs.core.Response;
import java.util.Optional;

import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getValueFactory;
import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.when;

public class UsernameRestTest extends MobiRestTestCXF {

    private static UsernameRest rest;
    private static EngineManager engineManager;
    private static ValueFactory vf;

    private static final String TEST_IRI = "urn:test:user";

    @BeforeClass
    public static void startServer() {
        vf = getValueFactory();

        engineManager = Mockito.mock(EngineManager.class);

        rest = new UsernameRest();
        rest.engineManager = engineManager;

        configureServer(rest, new UsernameTestFilter());
    }

    @Test
    public void getUsernameTest() {
        when(engineManager.getUsername(vf.createIRI(TEST_IRI)))
                .thenReturn(Optional.of(UsernameTestFilter.USERNAME));

        Response response = target().path("username")
                .queryParam("iri", TEST_IRI)
                .request()
                .get();

        assertEquals(200, response.getStatus());
        assertEquals(UsernameTestFilter.USERNAME, response.readEntity(String.class));
    }

    @Test
    public void getUserForUserThatDoesNotExistTest() {
        Response response = target().path("users/username").queryParam("iri", "http://example.com/error")
                .request().get();
        assertEquals(404, response.getStatus());
    }
}
