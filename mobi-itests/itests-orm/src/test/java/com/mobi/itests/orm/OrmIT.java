package com.mobi.itests.orm;

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
import com.mobi.itests.support.KarafTestSupport;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.conversion.ValueConverterRegistry;
import com.mobi.rdf.orm.impl.ThingFactory;
import org.ops4j.pax.exam.junit.PaxExam;
import org.ops4j.pax.exam.spi.reactors.ExamReactorStrategy;
import org.ops4j.pax.exam.spi.reactors.PerClass;
import org.osgi.framework.BundleContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigInteger;
import java.time.OffsetDateTime;
import java.util.Calendar;
import java.util.GregorianCalendar;
import javax.inject.Inject;

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
        testConversion(true, thing, valueConverterRegistry, "Failed working with boolean converter");
        //int
        testConversion(3, thing, valueConverterRegistry, "Integer conversion failure");
        //long
        testConversion(2L, thing, valueConverterRegistry, "Long conversion failure");
        //double
        testConversion(3.14, thing, valueConverterRegistry, "Double conversion failure");
        //float
        testConversion((float) 1.2, thing, valueConverterRegistry, "Float conversion failure");
        //short
        testConversion((short) 3, thing, valueConverterRegistry, "Short conversion failure");
        //string
        testConversion("testing", thing, valueConverterRegistry, "String conversion failure");
        //date
        testConversion(OffsetDateTime.now(), thing, valueConverterRegistry, "Date conversion failure");
        //IRI
        IRI iri = vf.createIRI("urn:test");
        testConversion(iri, thing, valueConverterRegistry, "IRI conversion failure");
        //Literal
        testConversion(vf.createLiteral("blah"), thing, valueConverterRegistry, "Literal conversion failure");
        //Resource
        testConversion((Resource) vf.createIRI("urn:resource"), thing, valueConverterRegistry, "Resource conversion failure");
        //Value
        testConversion((Value) vf.createLiteral(1.32), thing, valueConverterRegistry, "Value conversion failure");
        //Calendar
        testConversion(new GregorianCalendar(), thing, valueConverterRegistry, "Calendar conversion failure");
        //BigInteger
        BigInteger big = BigInteger.valueOf(123L);
        testConversion(big, thing, valueConverterRegistry, "BigInteger conversion failure");
    }

    private <T> void testConversion(final T type, final Thing thing, final ValueConverterRegistry valueConverterRegistry, final String failureMessage) {
        Value val = valueConverterRegistry.convertType(type, thing);
        T back = (T) valueConverterRegistry.convertValue(val, thing, type.getClass());
        if (type instanceof Calendar) {
            Assert.assertEquals(failureMessage,((Calendar)type).getTime(), ((Calendar)back).getTime());
        } else {
            Assert.assertEquals(failureMessage, type, back);
        }
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
