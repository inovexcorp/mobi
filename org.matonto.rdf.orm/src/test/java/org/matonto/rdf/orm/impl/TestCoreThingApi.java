package org.matonto.rdf.orm.impl;

import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactoryService;
import org.matonto.rdf.core.impl.sesame.ValueFactoryService;
import org.matonto.rdf.orm.Thing;
import org.matonto.rdf.orm.conversion.ValueConverterRegistry;
import org.matonto.rdf.orm.conversion.impl.DefaultValueConverterRegistry;
import org.matonto.rdf.orm.conversion.impl.DoubleValueConverter;
import org.matonto.rdf.orm.conversion.impl.FloatValueConverter;
import org.matonto.rdf.orm.conversion.impl.IntegerValueConverter;
import org.matonto.rdf.orm.conversion.impl.ShortValueConverter;
import org.matonto.rdf.orm.conversion.impl.StringValueConverter;
import org.matonto.rdf.orm.conversion.impl.ValueValueConverter;

import junit.framework.TestCase;

public class TestCoreThingApi {

	private static final ThingFactory thingFactory = new ThingFactory();

	private static final ModelFactory modelFactory = new LinkedHashModelFactoryService();

	private static final ValueFactory valueFactory = new ValueFactoryService();

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

	private Model model;

	@Before
	public void before() {
		model = modelFactory.createModel();
		model.add(valueFactory.createIRI("urn://matonto.org/orm/test/testAgent"),
				valueFactory.createIRI("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
				valueFactory.createIRI("http://xmlns.com/foaf/0.1/Agent"),
				valueFactory.createIRI("urn://matonto.org/orm/test/testAgent"));
		model.add(valueFactory.createIRI("urn://matonto.org/orm/test/testAgent"),
				valueFactory.createIRI("http://xmlns.com/foaf/0.1/gender"), valueFactory.createLiteral("male"),
				valueFactory.createIRI("urn://matonto.org/orm/test/testAgent"));
		model.add(valueFactory.createIRI("urn://matonto.org/orm/test/testAgent"),
				valueFactory.createIRI("http://xmlns.com/foaf/0.1/age"), valueFactory.createLiteral("100"),
				valueFactory.createIRI("urn://matonto.org/orm/test/testAgent"));
		model.add(valueFactory.createIRI("urn://matonto.org/orm/test/testAgent"),
				valueFactory.createIRI("http://xmlns.com/foaf/0.1/mbox"),
				valueFactory.createIRI("urn://matonto.org/orm/test/account"),
				valueFactory.createIRI("urn://matonto.org/orm/test/testAgent"));

	}

	@Test
	public void testBasic() {
		final Thing t = thingFactory.getExisting(valueFactory.createIRI("urn://matonto.org/orm/test/testAgent"), model,
				valueFactory);
		TestCase.assertEquals(valueFactory.createIRI("http://xmlns.com/foaf/0.1/Agent"),
				t.getProperty(valueFactory.createIRI("http://www.w3.org/1999/02/22-rdf-syntax-ns#type")));
		TestCase.assertEquals(100,
				Integer.parseInt(t.getProperty(valueFactory.createIRI("http://xmlns.com/foaf/0.1/age")).stringValue()));
		t.addProperty(valueFactory.createLiteral("Ben"), valueFactory.createIRI("urn://matonto.org/silly#myNameIs"),
				valueFactory.createIRI("urn://matonto.org/orm/test/testAgent"));
		TestCase.assertEquals("Ben", (t.getProperty(valueFactory.createIRI("urn://matonto.org/silly#myNameIs"),
				valueFactory.createIRI("urn://matonto.org/orm/test/testAgent"))).stringValue());
		t.setProperty(valueFactory.createLiteral("John"), valueFactory.createIRI("urn://matonto.org/silly#myNameIs"),
				valueFactory.createIRI("urn://matonto.org/orm/test/testAgent"));
		TestCase.assertEquals(1, t.getModel().filter(t.getResource(),
				valueFactory.createIRI("urn://matonto.org/silly#myNameIs"), null, t.getResource()).size());
		TestCase.assertEquals("John",
				t.getModel().filter(t.getResource(), valueFactory.createIRI("urn://matonto.org/silly#myNameIs"), null,
						t.getResource()).iterator().next().getObject().stringValue());
	}

}
