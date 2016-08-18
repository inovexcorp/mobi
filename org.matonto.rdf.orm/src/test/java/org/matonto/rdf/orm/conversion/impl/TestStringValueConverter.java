package org.matonto.rdf.orm.conversion.impl;

import org.junit.Test;

import junit.framework.TestCase;

public class TestStringValueConverter extends ValueConverterTestCase<String> {

	public TestStringValueConverter() {
		super(new StringValueConverter(), String.class);
	}

	@Test
	public void basicTest() {
		String test = "WHOA";
		TestCase.assertEquals(test,
				valueConverter.convertValue(valueConverter.convertType(test, null), null, String.class));
	}

	@Test
	public void testEmpty() {
		TestCase.assertEquals("", valueConverter.convertValue(valueFactory.createLiteral(""), null, type));
	}

}
