package org.matonto.rdf.orm.generate;

import java.io.File;
import java.util.Set;

import org.apache.commons.io.FileUtils;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.BlockJUnit4ClassRunner;
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
import org.matonto.rdf.orm.conversion.impl.LiteralValueConverter;
import org.matonto.rdf.orm.conversion.impl.ShortValueConverter;
import org.matonto.rdf.orm.conversion.impl.StringValueConverter;
import org.matonto.rdf.orm.conversion.impl.ValueValueConverter;
import org.matonto.rdf.orm.impl.ThingFactory;

import com.xmlns.foaf._0._1.Agent;
import com.xmlns.foaf._0._1.AgentFactory;

import junit.framework.TestCase;

@RunWith(BlockJUnit4ClassRunner.class)
public class TestSourceGenerator {

	private static ValueFactory valueFactory;

	private static ValueConverterRegistry valueConverterRegistry;

	private static ModelFactory modelFactory;

	@Before
	public void beforeTest() {
		valueFactory = new ValueFactoryService();
		modelFactory = new LinkedHashModelFactoryService();
		valueConverterRegistry = new DefaultValueConverterRegistry();
		valueConverterRegistry.registerValueConverter(new DoubleValueConverter());
		valueConverterRegistry.registerValueConverter(new IntegerValueConverter());
		valueConverterRegistry.registerValueConverter(new FloatValueConverter());
		valueConverterRegistry.registerValueConverter(new ShortValueConverter());
		valueConverterRegistry.registerValueConverter(new StringValueConverter());
		valueConverterRegistry.registerValueConverter(new ValueValueConverter());
		valueConverterRegistry.registerValueConverter(new LiteralValueConverter());
		valueConverterRegistry.registerValueConverter(new ThingFactory());
	}

	@Test
	public void generateFoafOntologyStuff() throws Exception {
		try {
			final File foaf = new File("src/test/java/generated/test/foaf");
			if (foaf.exists()) {
				FileUtils.deleteDirectory(foaf);
			}
			SourceGenerator.toSource(GraphReadingUtility.readOntology(new File("src/test/resources/foaf.rdf"),
					"http://xmlns.com/foaf/0.1/"), "http://xmlns.com/foaf/0.1/", "target/generated-test-sources");
		} catch (Exception e) {
			e.printStackTrace();
			TestCase.fail(e.getMessage());
		}

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
				valueFactory.createIRI("http://xmlns.com/foaf/0.1/age"), valueFactory.createLiteral(100),
				valueFactory.createIRI("urn://matonto.org/orm/test/testAgent"));
		model.add(valueFactory.createIRI("urn://matonto.org/orm/test/testAgent"),
				valueFactory.createIRI("http://xmlns.com/foaf/0.1/mbox"),
				valueFactory.createIRI("urn://matonto.org/orm/test/account"),
				valueFactory.createIRI("urn://matonto.org/orm/test/testAgent"));

		model.add(valueFactory.createIRI("urn://matonto.org/orm/test/account"),
				valueFactory.createIRI("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
				valueFactory.createIRI("http://xmlns.com/foaf/0.1/OnlineAccount"),
				valueFactory.createIRI("urn://matonto.org/orm/test/account"));
		model.add(valueFactory.createIRI("urn://matonto.org/orm/test/account"),
				valueFactory.createIRI("http://xmlns.com/foaf/0.1/accountName"),
				valueFactory.createLiteral("tester@gmail.com"),
				valueFactory.createIRI("urn://matonto.org/orm/test/account"));
	}

	@Test
	public void testAgent() {
		final AgentFactory factory = new AgentFactory();
		final Agent a = factory.getExisting(valueFactory.createIRI("urn://matonto.org/orm/test/testAgent"), model,
				valueFactory, valueConverterRegistry);
		TestCase.assertEquals(valueFactory.createLiteral(100), a.getAge());
		TestCase.assertEquals(valueFactory.createLiteral("male"), a.getGender());
		final Set<Thing> mboxes = a.getMbox();
		TestCase.assertNotNull(mboxes);
		TestCase.assertFalse(mboxes.isEmpty());
		final Thing mbox = mboxes.iterator().next();
		TestCase.assertEquals(valueFactory.createLiteral("tester@gmail.com"),
				mbox.getProperty(valueFactory.createIRI("http://xmlns.com/foaf/0.1/accountName"),
						valueFactory.createIRI("urn://matonto.org/orm/test/account")));
		TestCase.assertEquals(valueFactory.createIRI("urn://matonto.org/orm/test/account"), mbox.getResource());
	}

}