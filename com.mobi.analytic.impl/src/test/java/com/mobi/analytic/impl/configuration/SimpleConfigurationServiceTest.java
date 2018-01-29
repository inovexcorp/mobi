package com.mobi.analytic.impl.configuration;

/*-
 * #%L
 * com.mobi.analytic.impl
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

import static junit.framework.TestCase.assertEquals;
import static junit.framework.TestCase.assertTrue;

import com.mobi.analytic.ontologies.analytic.Configuration;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import net.sf.json.JSONObject;
import org.junit.Before;
import org.junit.Test;

public class SimpleConfigurationServiceTest extends OrmEnabledTestCase {
    private SimpleConfigurationService service;

    private static final String DATASET = "https://mobi.com/test/datasets#1";
    private static final String CONFIG = "https://mobi.com/test/configs#1";

    @Before
    public void setUp() {
        service = new SimpleConfigurationService();
        injectOrmFactoryReferencesIntoService(service);
        service.setValueFactory(VALUE_FACTORY);
    }

    @Test
    public void getTypeIRITest() throws Exception {
        assertEquals(Configuration.TYPE, service.getTypeIRI());
    }

    @Test
    public void createTest() throws Exception {
        // SetUp:
        JSONObject json = new JSONObject().element("datasetRecordId", DATASET).element("configurationId", CONFIG);

        Configuration result = service.create(json.toString());
        assertEquals(1, result.getDatasetRecord_resource().size());
        assertTrue(result.getDatasetRecord_resource().contains(VALUE_FACTORY.createIRI(DATASET)));
        assertEquals(CONFIG, result.getResource().stringValue());
    }

    @Test(expected = IllegalArgumentException.class)
    public void createWithWrongJsonTest() throws Exception {
        service.create("{}");
    }
}
