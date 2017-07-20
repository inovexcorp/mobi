package org.matonto.itests.orm;

/*-
 * #%L
 * itests-orm
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

import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.matonto.itests.support.KarafTestSupport;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.orm.Thing;
import org.matonto.rdf.orm.conversion.ValueConverterRegistry;
import org.matonto.rdf.orm.impl.ThingFactory;
import org.ops4j.pax.exam.junit.PaxExam;
import org.ops4j.pax.exam.spi.reactors.ExamReactorStrategy;
import org.ops4j.pax.exam.spi.reactors.PerClass;
import org.osgi.framework.BundleContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;
import javax.inject.Inject;
import javax.xml.datatype.DatatypeFactory;

@RunWith(PaxExam.class)
@ExamReactorStrategy(PerClass.class)
public class OrmIT extends KarafTestSupport {

    private static final Logger LOGGER = LoggerFactory.getLogger(OrmIT.class);

    @Inject
    protected BundleContext thisBundleContext;

    @Before
    public synchronized void setup() throws Exception {
        setup(thisBundleContext);
    }

    @Test
    public void testConversions() throws Exception {
        ValueConverterRegistry valueConverterRegistry = getOsgiService(ValueConverterRegistry.class);
        ValueFactory vf = getOsgiService(ValueFactory.class);
        Thing thing = getOsgiService(ThingFactory.class).createNew(vf.createIRI("urn://thing"));
        //boolean
        //valueConverterRegistry.convertType(true, thing);
        //int
        Assert.assertEquals("", vf.createLiteral(3), valueConverterRegistry.convertType(3, thing));
        //long
        //Assert.assertEquals("", vf.createLiteral(2L), valueConverterRegistry.convertType(2L, thing));
        //double
        Assert.assertEquals("", vf.createLiteral(3.14), valueConverterRegistry.convertType(3.14, thing));
        //short
        Assert.assertEquals("", vf.createLiteral((short) 3), valueConverterRegistry.convertType((short) 3, thing));
        //string
        Assert.assertEquals("", vf.createLiteral("testing"), valueConverterRegistry.convertType("testing", thing));
        //date
        Date d = new Date();
        GregorianCalendar c = new GregorianCalendar();
        c.setTime(d);
        Assert.assertEquals("", vf.createLiteral(DatatypeFactory.newInstance().newXMLGregorianCalendar(c).toXMLFormat(),
                "http://www.w3.org/2001/XMLSchema#dateTime"), valueConverterRegistry.convertType(d, thing));
    }

    @Test
    public void testThingFactory() throws Exception {
        ThingFactory factory = getOsgiService(ThingFactory.class);
        ValueFactory vf = getOsgiService(ValueFactory.class);
        IRI test = vf.createIRI("urn://thing");
        Thing thing = factory.createNew(test);
        Assert.assertEquals("IRI mismatch", test, thing.getResource());

        Model m = thing.getModel();
        Thing thing1 = factory.getExisting(test, m).orElseThrow(() -> new Exception("No thing with IRI " + test.stringValue()));
        Assert.assertEquals("IRI mismatch on get", test, thing1.getResource());
    }

}
