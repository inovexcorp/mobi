package com.mobi.rest.test.util;

/*-
 * #%L
 * com.mobi.rest.test.util
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

import com.fasterxml.jackson.jaxrs.json.JacksonJaxbJsonProvider;
import org.apache.cxf.endpoint.Server;
import org.apache.cxf.jaxrs.JAXRSServerFactoryBean;
import org.apache.cxf.jaxrs.lifecycle.SingletonResourceProvider;
import org.apache.cxf.service.factory.ServiceConstructionException;
import org.apache.cxf.testutil.common.TestUtil;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.client.WebTarget;
import javax.ws.rs.container.ContainerRequestFilter;

/**
 * Class used to create CXF servers for tests and provide a WebTarget to connect to the server.
 */
public class MobiRestTestCXF {

    protected static Server server;
    protected static String baseUrl;

    /**
     * Configures a CXF server for testing with the provided restService. Adds any provided filter as a Provider.
     *
     * @param restService The REST service under test
     * @param filters An optional list of ContainerRequestFilters to apply
     */
    protected static void configureServer(Object restService, ContainerRequestFilter... filters) {
        int count = 0;
        int maxTries = 3;
        List<Object> filterList = new ArrayList<>(Arrays.asList(filters));
        filterList.add(new JacksonJaxbJsonProvider());
        while (true) {
            try {
                final JAXRSServerFactoryBean factory = new JAXRSServerFactoryBean();
                baseUrl = String.format("http://localhost:%s/", TestUtil.getNewPortNumber(restService.getClass()));
                factory.setProviders(filterList);
                factory.setAddress(baseUrl);
                factory.setResourceClasses(restService.getClass());
                factory.setResourceProvider(restService.getClass(), new SingletonResourceProvider(restService, true));
                server = factory.create();
                break;
            } catch (ServiceConstructionException e) {
                if (++count == maxTries) {
                    throw e;
                }
            }
        }
    }

    /**
     * Retrieves a {@link WebTarget}.
     *
     * @return A {@link WebTarget}
     */
    protected WebTarget target() {
        return ClientBuilder.newClient().target(baseUrl);
    }
}
