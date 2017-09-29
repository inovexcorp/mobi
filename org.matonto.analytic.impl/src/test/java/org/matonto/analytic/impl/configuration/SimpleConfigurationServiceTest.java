package org.matonto.analytic.impl.configuration;

/*-
 * #%L
 * org.matonto.analytic.impl
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

import net.sf.json.JSONObject;
import org.junit.Before;
import org.junit.Test;
import org.matonto.analytic.ontologies.analytic.Configuration;
import org.matonto.analytic.ontologies.analytic.ConfigurationFactory;
import org.matonto.dataset.ontology.dataset.DatasetRecordFactory;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.matonto.rdf.orm.conversion.ValueConverterRegistry;
import org.matonto.rdf.orm.conversion.impl.DefaultValueConverterRegistry;
import org.matonto.rdf.orm.conversion.impl.DoubleValueConverter;
import org.matonto.rdf.orm.conversion.impl.FloatValueConverter;
import org.matonto.rdf.orm.conversion.impl.IRIValueConverter;
import org.matonto.rdf.orm.conversion.impl.IntegerValueConverter;
import org.matonto.rdf.orm.conversion.impl.LiteralValueConverter;
import org.matonto.rdf.orm.conversion.impl.ResourceValueConverter;
import org.matonto.rdf.orm.conversion.impl.ShortValueConverter;
import org.matonto.rdf.orm.conversion.impl.StringValueConverter;
import org.matonto.rdf.orm.conversion.impl.ValueValueConverter;

public class SimpleConfigurationServiceTest {
    private SimpleConfigurationService service;
    private ValueFactory vf = SimpleValueFactory.getInstance();
    private ModelFactory mf = LinkedHashModelFactory.getInstance();
    private ValueConverterRegistry vcr = new DefaultValueConverterRegistry();
    private ConfigurationFactory configurationFactory = new ConfigurationFactory();
    private DatasetRecordFactory datasetRecordFactory = new DatasetRecordFactory();

    private static final String DATASET = "https://matonto.org/test/datasets#1";
    private static final String CONFIG = "https://matonto.org/test/configs#1";

    @Before
    public void setUp() {
        configurationFactory.setModelFactory(mf);
        configurationFactory.setValueFactory(vf);
        configurationFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(configurationFactory);

        datasetRecordFactory.setModelFactory(mf);
        datasetRecordFactory.setValueFactory(vf);
        datasetRecordFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(datasetRecordFactory);

        vcr.registerValueConverter(new ResourceValueConverter());
        vcr.registerValueConverter(new IRIValueConverter());
        vcr.registerValueConverter(new DoubleValueConverter());
        vcr.registerValueConverter(new IntegerValueConverter());
        vcr.registerValueConverter(new FloatValueConverter());
        vcr.registerValueConverter(new ShortValueConverter());
        vcr.registerValueConverter(new StringValueConverter());
        vcr.registerValueConverter(new ValueValueConverter());
        vcr.registerValueConverter(new LiteralValueConverter());

        service = new SimpleConfigurationService();
        service.setConfigurationFactory(configurationFactory);
        service.setDatasetRecordFactory(datasetRecordFactory);
        service.setValueFactory(vf);
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
        assertTrue(result.getDatasetRecord_resource().contains(vf.createIRI(DATASET)));
        assertEquals(CONFIG, result.getResource().stringValue());
    }

    @Test(expected = IllegalArgumentException.class)
    public void createWithWrongJsonTest() throws Exception {
        service.create("{}");
    }
}
