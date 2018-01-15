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

import com.mobi.analytic.ontologies.analytic.Column;
import com.mobi.analytic.ontologies.analytic.TableConfiguration;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import junit.framework.TestCase;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.junit.Before;
import org.junit.Test;

import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class TableConfigurationServiceTest extends OrmEnabledTestCase {
    private TableConfigurationService service;
    private OrmFactory<Column> columnFactory = getRequiredOrmFactory(Column.class);

    private static final String DATASET = "https://mobi.com/test/datasets#1";
    private static final String ROW = "https://mobi.com/test/rows#1";
    private static final String COLUMN_1 = "https://mobi.com/test/columns#1";
    private static final String COLUMN_2 = "https://mobi.com/test/columns#2";
    private static final Set<String> properties = Stream.of(COLUMN_1, COLUMN_2).collect(Collectors.toSet());
    private static final Set<Integer> indexes = Stream.of(0, 1).collect(Collectors.toSet());

    @Before
    public void setUp() {
        service = new TableConfigurationService();
        injectOrmFactoryReferencesIntoService(service);
        service.setValueFactory(VALUE_FACTORY);
    }

    @Test
    public void getTypeIRITest() throws Exception {
        TestCase.assertEquals(TableConfiguration.TYPE, service.getTypeIRI());
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
        assertTrue(result.getDatasetRecord_resource().contains(VALUE_FACTORY.createIRI(DATASET)));
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
