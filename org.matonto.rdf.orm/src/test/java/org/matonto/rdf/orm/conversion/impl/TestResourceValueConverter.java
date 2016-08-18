package org.matonto.rdf.orm.conversion.impl;

import org.junit.Test;
import org.matonto.rdf.api.Resource;

import junit.framework.TestCase;

public class TestResourceValueConverter extends ValueConverterTestCase<Resource> {

	public TestResourceValueConverter() {
		super(new ResourceValueConverter(), Resource.class);
	}

	@Test
	public void simpleTest() {
		Resource test = valueFactory.createBNode();
		TestCase.assertEquals(test,
				valueConverter.convertValue(valueConverter.convertType(test, null), null, Resource.class));
		test = valueFactory.createIRI("urn://test.org/test");
		TestCase.assertEquals(test,
				valueConverter.convertValue(valueConverter.convertType(test, null), null, Resource.class));

	}

}
