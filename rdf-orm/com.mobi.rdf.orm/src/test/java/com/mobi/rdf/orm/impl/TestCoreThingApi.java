package com.mobi.rdf.orm.impl;

/*-
 * #%L
 * RDF ORM
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.impl.sesame.LinkedHashModelFactoryService;
import com.mobi.rdf.core.impl.sesame.ValueFactoryService;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.conversion.ValueConverterRegistry;
import com.mobi.rdf.orm.conversion.impl.DefaultValueConverterRegistry;
import com.mobi.rdf.orm.conversion.impl.DoubleValueConverter;
import com.mobi.rdf.orm.conversion.impl.FloatValueConverter;
import com.mobi.rdf.orm.conversion.impl.IntegerValueConverter;
import com.mobi.rdf.orm.conversion.impl.ShortValueConverter;
import com.mobi.rdf.orm.conversion.impl.StringValueConverter;
import com.mobi.rdf.orm.conversion.impl.ValueValueConverter;
import junit.framework.TestCase;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;

import java.util.Optional;

public class TestCoreThingApi {

    private static final ThingFactory thingFactory = new ThingFactory();

    private static final ModelFactory modelFactory = new LinkedHashModelFactoryService();

    private static final ValueFactory valueFactory = new ValueFactoryService();
    private Model model;

    @BeforeClass
    public static void beforeClass() {
        final ValueConverterRegistry valueConverterRegistry = new DefaultValueConverterRegistry();
        valueConverterRegistry.registerValueConverter(new DoubleValueConverter());
        valueConverterRegistry.registerValueConverter(new IntegerValueConverter());
        valueConverterRegistry.registerValueConverter(new FloatValueConverter());
        valueConverterRegistry.registerValueConverter(new ShortValueConverter());
        valueConverterRegistry.registerValueConverter(new StringValueConverter());
        valueConverterRegistry.registerValueConverter(new ValueValueConverter());

        thingFactory.setModelFactory(modelFactory);
        thingFactory.setValueFactory(new ValueFactoryService());
        thingFactory.setValueConverterRegistry(valueConverterRegistry);
    }

    @Before
    public void before() {
        model = modelFactory.createModel();
        model.add(valueFactory.createIRI("urn://mobi.com/orm/test/testAgent"),
                valueFactory.createIRI("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
                valueFactory.createIRI("http://xmlns.com/foaf/0.1/Agent"),
                valueFactory.createIRI("urn://mobi.com/orm/test/testAgent"));
        model.add(valueFactory.createIRI("urn://mobi.com/orm/test/testAgent"),
                valueFactory.createIRI("http://xmlns.com/foaf/0.1/gender"), valueFactory.createLiteral("male"),
                valueFactory.createIRI("urn://mobi.com/orm/test/testAgent"));
        model.add(valueFactory.createIRI("urn://mobi.com/orm/test/testAgent"),
                valueFactory.createIRI("http://xmlns.com/foaf/0.1/age"), valueFactory.createLiteral("100"),
                valueFactory.createIRI("urn://mobi.com/orm/test/testAgent"));
        model.add(valueFactory.createIRI("urn://mobi.com/orm/test/testAgent"),
                valueFactory.createIRI("http://xmlns.com/foaf/0.1/mbox"),
                valueFactory.createIRI("urn://mobi.com/orm/test/account"),
                valueFactory.createIRI("urn://mobi.com/orm/test/testAgent"));

    }

    @Test
    public void testBasic() throws Exception {
        final Thing t = thingFactory.getExisting(valueFactory.createIRI("urn://mobi.com/orm/test/testAgent"), model,
                valueFactory).orElseThrow(() -> new Exception("FAILED TO GET THING"));

        Value typeValue = t.getProperty(valueFactory.createIRI("http://www.w3.org/1999/02/22-rdf-syntax-ns#type")).get();
        TestCase.assertEquals(valueFactory.createIRI("http://xmlns.com/foaf/0.1/Agent"), typeValue);

        int ageValue = Integer.parseInt(t.getProperty(valueFactory.createIRI("http://xmlns.com/foaf/0.1/age")).get().stringValue());
        TestCase.assertEquals(100, ageValue);

        t.addProperty(valueFactory.createLiteral("Ben"), valueFactory.createIRI("urn://mobi.com/silly#myNameIs"),
                valueFactory.createIRI("urn://mobi.com/orm/test/testAgent"));
        String nameValue = t.getProperty(valueFactory.createIRI("urn://mobi.com/silly#myNameIs"),
                valueFactory.createIRI("urn://mobi.com/orm/test/testAgent")).get().stringValue();
        TestCase.assertEquals("Ben", nameValue);

        t.setProperty(valueFactory.createLiteral("John"), valueFactory.createIRI("urn://mobi.com/silly#myNameIs"),
                valueFactory.createIRI("urn://mobi.com/orm/test/testAgent"));
        TestCase.assertEquals(1, t.getModel().filter(t.getResource(),
                valueFactory.createIRI("urn://mobi.com/silly#myNameIs"), null, t.getResource()).size());
        TestCase.assertEquals("John",
                t.getModel().filter(t.getResource(), valueFactory.createIRI("urn://mobi.com/silly#myNameIs"), null,
                        t.getResource()).iterator().next().getObject().stringValue());
    }

    @Test
    public void testCreateNew() throws Exception {
        final IRI myIri = valueFactory.createIRI("urn://someDumbNewThing.org");
        final Thing t2 = thingFactory.createNew(myIri, model);
        IRI pred = valueFactory.createIRI("urn://mobi.com/silly#myNameIs");
        t2.setProperty(valueFactory.createLiteral("Ben"), pred,
                (IRI) t2.getResource());
        Optional<Value> opt = t2.getProperty(pred, (IRI) t2.getResource());
        TestCase.assertTrue(opt.isPresent());
        TestCase.assertEquals(valueFactory.createLiteral("Ben"), opt.orElse(null));

        final Thing t = thingFactory.getExisting(myIri, model,
                valueFactory).orElseThrow(() -> new Exception("FAILED TO GET THING THAT WAS JUST CREATED"));
    }

    @Test
    public void testOptionalEmpty() {
        Optional<Thing> optional = thingFactory.getExisting(valueFactory.createIRI("urn://doesnotexist.org"), model);
        TestCase.assertFalse(optional.isPresent());
    }

    @Test
    public void testSetPropertyWithExistingData() {
        IRI sub = valueFactory.createIRI("http://test.com/1");
        IRI pred1 = valueFactory.createIRI("urn:pred1");
        IRI pred2 = valueFactory.createIRI("urn:pred2");
        IRI pred3 = valueFactory.createIRI("urn:pred3");
        IRI context = valueFactory.createIRI("http://test.com/c1");

        Model model =  modelFactory.createModel();
        model.add(sub, pred1, valueFactory.createLiteral("A"));
        model.add(sub, pred2, valueFactory.createLiteral("B"));
        model.add(sub, pred2, valueFactory.createLiteral("C"));
        model.add(sub, pred3, valueFactory.createLiteral("B"), context);
        model.add(sub, pred3, valueFactory.createLiteral("C"), context);

        final Thing thing = thingFactory.createNew(valueFactory.createIRI("http://test.com/1"), model);

        thing.setProperty(valueFactory.createLiteral("D"), pred2);
        thing.setProperty(valueFactory.createLiteral("D"), pred3, context);

        assertEquals(1, thing.getProperties(pred2).size());
        assertEquals(1, thing.getProperties(pred3).size());
        assertTrue(thing.getProperty(pred2).isPresent());
        assertTrue(thing.getProperty(pred3).isPresent());
        assertEquals(thing.getProperty(pred2).get(), valueFactory.createLiteral("D"));
        assertEquals(thing.getProperty(pred3).get(), valueFactory.createLiteral("D"));

        assertTrue(thing.getModel().contexts().contains(context));
        assertEquals(1, thing.getModel().filter(sub, pred3, null).size());
    }
}
