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

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.junit.Before;
import org.junit.Test;
import org.matonto.analytic.ontologies.analytic.Column;
import org.matonto.analytic.ontologies.analytic.ColumnFactory;
import org.matonto.analytic.ontologies.analytic.Configuration;
import org.matonto.analytic.ontologies.analytic.TableConfiguration;
import org.matonto.analytic.ontologies.analytic.TableConfigurationFactory;
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
import org.matonto.rdf.orm.impl.ThingFactory;

import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class TableConfigurationServiceTest {
    private TableConfigurationService service;
    private ValueFactory vf = SimpleValueFactory.getInstance();
    private ModelFactory mf = LinkedHashModelFactory.getInstance();
    private ValueConverterRegistry vcr = new DefaultValueConverterRegistry();
    private TableConfigurationFactory tableConfigurationFactory = new TableConfigurationFactory();
    private DatasetRecordFactory datasetRecordFactory = new DatasetRecordFactory();
    private ColumnFactory columnFactory = new ColumnFactory();

    private static final String DATASET = "https://matonto.org/test/datasets#1";
    private static final String ROW = "https://matonto.org/test/rows#1";
    private static final String COLUMN_1 = "https://matonto.org/test/columns#1";
    private static final String COLUMN_2 = "https://matonto.org/test/columns#2";
    private static final Set<String> properties = Stream.of(COLUMN_1, COLUMN_2).collect(Collectors.toSet());
    private static final Set<Integer> indexes = Stream.of(0, 1).collect(Collectors.toSet());

    @Before
    public void setUp() {
        tableConfigurationFactory.setModelFactory(mf);
        tableConfigurationFactory.setValueFactory(vf);
        tableConfigurationFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(tableConfigurationFactory);

        datasetRecordFactory.setModelFactory(mf);
        datasetRecordFactory.setValueFactory(vf);
        datasetRecordFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(datasetRecordFactory);

        columnFactory.setModelFactory(mf);
        columnFactory.setValueFactory(vf);
        columnFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(columnFactory);

        vcr.registerValueConverter(new ResourceValueConverter());
        vcr.registerValueConverter(new IRIValueConverter());
        vcr.registerValueConverter(new DoubleValueConverter());
        vcr.registerValueConverter(new IntegerValueConverter());
        vcr.registerValueConverter(new FloatValueConverter());
        vcr.registerValueConverter(new ShortValueConverter());
        vcr.registerValueConverter(new StringValueConverter());
        vcr.registerValueConverter(new ValueValueConverter());
        vcr.registerValueConverter(new LiteralValueConverter());

        service = new TableConfigurationService();
        service.setTableConfigurationFactory(tableConfigurationFactory);
        service.setDatasetRecordFactory(datasetRecordFactory);
        service.setValueFactory(vf);
        service.setColumnFactory(columnFactory);
    }

    @Test
    public void getTypeIRITest() throws Exception {
        assertEquals(TableConfiguration.TYPE, service.getTypeIRI());
    }

    @Test
    public void createTest() throws Exception {
        // SetUp:
        JSONArray columns = new JSONArray();
        columns.add(new JSONObject().element("property", COLUMN_1).element("index", 0));
        columns.add(new JSONObject().element("property", COLUMN_2).element("index", 1));
        JSONObject json = new JSONObject().element("datasetRecordId", DATASET).element("row", ROW).element("columns", columns);

        TableConfiguration result = service.create(json.toString());
        assertEquals(1, result.getDatasetRecord_resource().size());
        assertTrue(result.getDatasetRecord_resource().contains(vf.createIRI(DATASET)));
        assertTrue(result.getHasRow_resource().isPresent());
        assertEquals(ROW, result.getHasRow_resource().get().stringValue());
        assertEquals(2, result.getHasColumn_resource().size());
        result.getHasColumn_resource().forEach(columnResource -> {
            Column column = columnFactory.getExisting(columnResource, result.getModel()).get();
            assertTrue(indexes.contains(column.getHasIndex().get()));
            assertTrue(properties.contains(column.getHasProperty().get().stringValue()));
        });
    }

    @Test(expected = IllegalArgumentException.class)
    public void createWithWrongJsonTest() throws Exception {
        // SetUp:
        JSONObject json = new JSONObject().element("datasetRecordId", DATASET);

        service.create(json.toString());
    }

    @Test(expected = IllegalArgumentException.class)
    public void createWithWrongColumnJsonTest() {
        // SetUp:
        JSONArray columns = new JSONArray();
        columns.add(new JSONObject().element("property", COLUMN_1));
        JSONObject json = new JSONObject().element("datasetRecordId", DATASET).element("row", ROW).element("columns", columns);

        service.create(json.toString());
    }
}
