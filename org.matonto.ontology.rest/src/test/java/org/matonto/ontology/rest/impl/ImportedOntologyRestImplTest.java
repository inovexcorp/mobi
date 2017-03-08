package org.matonto.ontology.rest.impl;

/*-
 * #%L
 * org.matonto.ontology.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

import static org.matonto.rest.util.RestUtils.encode;
import static org.testng.Assert.assertEquals;

import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;
import org.matonto.rest.util.MatontoRestTestNg;
import org.mockito.MockitoAnnotations;
import org.testng.annotations.Test;

import javax.ws.rs.core.Application;
import javax.ws.rs.core.Response;

public class ImportedOntologyRestImplTest extends MatontoRestTestNg {
    private ImportedOntologyRestImpl rest;

    @Override
    protected Application configureApp() throws Exception {
        MockitoAnnotations.initMocks(this);
        rest = new ImportedOntologyRestImpl();
        return new ResourceConfig().register(rest);
    }

    @Override
    protected void configureClient(ClientConfig config) {
        config.register(MultiPartFeature.class);
    }

    @Test
    public void testVerifyUrl() {
        Response response = target().path("imported-ontologies/" + encode("http://matonto.org/")).request().head();
        assertEquals(response.getStatus(), 200);
    }

    @Test
    public void testVerifyUrlWhenUrlIsNotThere() {
        Response response = target().path("imported-ontologies/" + encode("https://not-there.com/")).request().head();
        assertEquals(response.getStatus(), 400);
    }
}
