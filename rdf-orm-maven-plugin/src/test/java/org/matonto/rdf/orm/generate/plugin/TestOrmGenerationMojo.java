package org.matonto.rdf.orm.generate.plugin;

import java.lang.reflect.Field;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.BlockJUnit4ClassRunner;

@RunWith(BlockJUnit4ClassRunner.class)
public class TestOrmGenerationMojo {

	@Test
	public void simpleTest() throws Exception {
		OrmGenerationMojo mojo = new OrmGenerationMojo();
		set("ontologyFile", "src/test/resources/foaf.rdf", mojo);
		set("ontologyIri", "http://xmlns.com/foaf/0.1/", mojo);
		set("outputLocation", "target/generated-test-sources", mojo);
		mojo.execute();
	}

	private void set(final String field, String value, OrmGenerationMojo mojo)
			throws IllegalArgumentException, IllegalAccessException, NoSuchFieldException, SecurityException {
		Field f = OrmGenerationMojo.class.getDeclaredField(field);
		f.setAccessible(true);
		f.set(mojo, value);
	}

}
