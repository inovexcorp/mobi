package org.matonto.explorable.dataset.rest.impl;

/*-
 * #%L
 * org.matonto.explorable-dataset.rest
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

import static org.mockito.Matchers.any;
import static org.mockito.Mockito.verify;
import static org.testng.Assert.assertEquals;
import static org.testng.Assert.fail;

import net.sf.json.JSONArray;
import org.glassfish.jersey.server.ResourceConfig;
import org.matonto.catalog.api.CatalogManager;
import org.matonto.dataset.api.DatasetManager;
import org.matonto.dataset.pagination.DatasetPaginatedSearchParams;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.matonto.rest.util.MatontoRestTestNg;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import javax.ws.rs.core.Application;
import javax.ws.rs.core.Response;

public class ExplorableDatasetRestImplTest extends MatontoRestTestNg {
    private ExplorableDatasetRestImpl rest;
    private ValueFactory vf;

    @Mock
    private DatasetManager datasetManager;

    @Mock
    private CatalogManager catalogManager;

    @Override
    protected Application configureApp() throws Exception {
        vf = SimpleValueFactory.getInstance();

        MockitoAnnotations.initMocks(this);
        rest = new ExplorableDatasetRestImpl();
        rest.setCatalogManager(catalogManager);
        rest.setDatasetManager(datasetManager);
        rest.setFactory(vf);

        return new ResourceConfig().register(rest);
    }

    @BeforeMethod
    public void setupMocks() {

    }

    @Test
    public void getClassDetailsTest() {
//        Response response = target().path("explorable-datasets").request().get();
//        assertEquals(response.getStatus(), 200);
//        verify(datasetManager).getDatasetRecords(any(DatasetPaginatedSearchParams.class));
//        try {
//            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
//            assertEquals(result.size(), 3);
//        } catch (Exception e) {
//            fail("Expected no exception, but got: " + e.getMessage());
//        }
    }

}
