package com.mobi.etl.service.workflows.routefactories;

/*-
 * #%L
 * com.mobi.etl.workflows
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

import com.mobi.etl.api.ontologies.etl.DirectoryDataSource;
import com.mobi.etl.api.ontologies.etl.DirectoryDataSourceFactory;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.impl.sesame.LinkedHashModelFactory;
import com.mobi.rdf.core.impl.sesame.SimpleValueFactory;
import com.mobi.rdf.orm.conversion.ValueConverterRegistry;
import com.mobi.rdf.orm.conversion.impl.DefaultValueConverterRegistry;
import com.mobi.rdf.orm.conversion.impl.DoubleValueConverter;
import com.mobi.rdf.orm.conversion.impl.FloatValueConverter;
import com.mobi.rdf.orm.conversion.impl.IRIValueConverter;
import com.mobi.rdf.orm.conversion.impl.IntegerValueConverter;
import com.mobi.rdf.orm.conversion.impl.LiteralValueConverter;
import com.mobi.rdf.orm.conversion.impl.ResourceValueConverter;
import com.mobi.rdf.orm.conversion.impl.ShortValueConverter;
import com.mobi.rdf.orm.conversion.impl.StringValueConverter;
import com.mobi.rdf.orm.conversion.impl.ValueValueConverter;
import org.apache.camel.CamelContext;
import org.apache.camel.Endpoint;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

public class DirectoryDataSourceRouteFactoryTest {
    private DirectoryDataSourceRouteFactory factory;

    private ValueFactory vf = SimpleValueFactory.getInstance();
    private ModelFactory mf = LinkedHashModelFactory.getInstance();
    private ValueConverterRegistry vcr = new DefaultValueConverterRegistry();
    private DirectoryDataSourceFactory directoryDataSourceFactory = new DirectoryDataSourceFactory();

    private DirectoryDataSource dataSource;

    @Mock
    private CamelContext context;

    @Before
    public void setUp() throws Exception {
        directoryDataSourceFactory.setModelFactory(mf);
        directoryDataSourceFactory.setValueFactory(vf);
        directoryDataSourceFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(directoryDataSourceFactory);

        vcr.registerValueConverter(new ResourceValueConverter());
        vcr.registerValueConverter(new IRIValueConverter());
        vcr.registerValueConverter(new DoubleValueConverter());
        vcr.registerValueConverter(new IntegerValueConverter());
        vcr.registerValueConverter(new FloatValueConverter());
        vcr.registerValueConverter(new ShortValueConverter());
        vcr.registerValueConverter(new StringValueConverter());
        vcr.registerValueConverter(new ValueValueConverter());
        vcr.registerValueConverter(new LiteralValueConverter());

        dataSource = directoryDataSourceFactory.createNew(vf.createIRI("http://test.com/data-source"));

        MockitoAnnotations.initMocks(this);

        factory = new DirectoryDataSourceRouteFactory();
        factory.setVf(vf);
    }

    @Test
    public void getTypeIRITest() {
        assertEquals(vf.createIRI(DirectoryDataSource.TYPE), factory.getTypeIRI());
    }

    @Test
    public void getTypeTest() {
        assertEquals(DirectoryDataSource.class, factory.getType());
    }

    @Test(expected = IllegalArgumentException.class)
    public void getEndpointWithMissingFilePathTest() {
        factory.getEndpoint(context, dataSource);
    }

    @Test
    public void getEndpointTest() throws Exception {
        // Setup:
        dataSource.setFilePath("this/is/a/path");

        Endpoint endpoint = factory.getEndpoint(context, dataSource);
        assertEquals(context, endpoint.getCamelContext());
        assertEquals("file:this/is/a/path", endpoint.getEndpointUri());
    }
}
