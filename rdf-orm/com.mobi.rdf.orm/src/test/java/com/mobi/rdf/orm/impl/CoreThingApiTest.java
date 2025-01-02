package com.mobi.rdf.orm.impl;

/*-
 * #%L
 * RDF ORM
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.ValueFactory;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.conversion.ValueConverterRegistry;
import com.mobi.rdf.orm.conversion.impl.DefaultValueConverterRegistry;
import com.mobi.rdf.orm.conversion.impl.DoubleValueConverter;
import com.mobi.rdf.orm.conversion.impl.FloatValueConverter;
import com.mobi.rdf.orm.conversion.impl.IntegerValueConverter;
import com.mobi.rdf.orm.conversion.impl.ShortValueConverter;
import com.mobi.rdf.orm.conversion.impl.StringValueConverter;
import com.mobi.rdf.orm.conversion.impl.ValueValueConverter;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;

import java.util.Optional;

public class CoreThingApiTest {

    private static final ThingFactory thingFactory = new ThingFactory();

    private static final ModelFactory modelFactory = new DynamicModelFactory();

    private static final ValueFactory valueFactory = new ValidatingValueFactory();
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

        thingFactory.valueConverterRegistry = valueConverterRegistry;
    }

    @Before
    public void before() {
        model = modelFactory.createEmptyModel();
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
        assertEquals(valueFactory.createIRI("http://xmlns.com/foaf/0.1/Agent"), typeValue);

        int ageValue = Integer.parseInt(t.getProperty(valueFactory.createIRI("http://xmlns.com/foaf/0.1/age")).get().stringValue());
        assertEquals(100, ageValue);

        t.addProperty(valueFactory.createLiteral("Ben"), valueFactory.createIRI("urn://mobi.com/silly#myNameIs"),
                valueFactory.createIRI("urn://mobi.com/orm/test/testAgent"));
        String nameValue = t.getProperty(valueFactory.createIRI("urn://mobi.com/silly#myNameIs"),
                valueFactory.createIRI("urn://mobi.com/orm/test/testAgent")).get().stringValue();
        assertEquals("Ben", nameValue);

        t.setProperty(valueFactory.createLiteral("John"), valueFactory.createIRI("urn://mobi.com/silly#myNameIs"),
                valueFactory.createIRI("urn://mobi.com/orm/test/testAgent"));
        assertEquals(1, t.getModel().filter(t.getResource(),
                valueFactory.createIRI("urn://mobi.com/silly#myNameIs"), null, t.getResource()).size());
        assertEquals("John",
                t.getModel().filter(t.getResource(), valueFactory.createIRI("urn://mobi.com/silly#myNameIs"), null,
                        t.getResource()).iterator().next().getObject().stringValue());

        assertTrue(t.clearProperty(valueFactory.createIRI("http://xmlns.com/foaf/0.1/age")));
        assertFalse(t.getProperty(valueFactory.createIRI("http://xmlns.com/foaf/0.1/age")).isPresent());
        assertFalse(t.clearProperty(valueFactory.createIRI("http://xmlns.com/foaf/0.1/age")));
        assertEquals("John",
                t.getModel().filter(t.getResource(), valueFactory.createIRI("urn://mobi.com/silly#myNameIs"), null,
                        t.getResource()).iterator().next().getObject().stringValue());

        t.setProperty(null, valueFactory.createIRI("urn://mobi.com/silly#myNameIs"));
        assertFalse(t.getProperty(valueFactory.createIRI("urn://mobi.com/silly#myNameIs")).isPresent());
    }

    @Test
    public void testCreateNew() throws Exception {
        final IRI myIri = valueFactory.createIRI("urn://someDumbNewThing.org");
        final Thing t2 = thingFactory.createNew(myIri, model);
        IRI pred = valueFactory.createIRI("urn://mobi.com/silly#myNameIs");
        t2.setProperty(valueFactory.createLiteral("Ben"), pred,
                (IRI) t2.getResource());
        Optional<Value> opt = t2.getProperty(pred, (IRI) t2.getResource());
        assertTrue(opt.isPresent());
        assertEquals(valueFactory.createLiteral("Ben"), opt.orElse(null));

        final Thing t = thingFactory.getExisting(myIri, model,
                valueFactory).orElseThrow(() -> new Exception("FAILED TO GET THING THAT WAS JUST CREATED"));
    }

    @Test
    public void testOptionalEmpty() {
        Optional<Thing> optional = thingFactory.getExisting(valueFactory.createIRI("urn://doesnotexist.org"), model);
        assertFalse(optional.isPresent());
    }

    @Test
    public void testSetPropertyWithExistingData() {
        IRI sub = valueFactory.createIRI("http://test.com/1");
        IRI pred1 = valueFactory.createIRI("urn:pred1");
        IRI pred2 = valueFactory.createIRI("urn:pred2");
        IRI pred3 = valueFactory.createIRI("urn:pred3");
        IRI context = valueFactory.createIRI("http://test.com/c1");

        Model model = modelFactory.createEmptyModel();
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
