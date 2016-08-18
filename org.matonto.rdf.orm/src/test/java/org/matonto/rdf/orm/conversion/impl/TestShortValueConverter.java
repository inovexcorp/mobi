package org.matonto.rdf.orm.conversion.impl;

import org.junit.Test;
import org.matonto.rdf.orm.conversion.ValueConversionException;

import junit.framework.TestCase;

public class TestShortValueConverter extends ValueConverterTestCase<Short> {

	public TestShortValueConverter() {
		super(new ShortValueConverter(), Short.class);
	}

	@Test
	public void basicTest() {
		short test = 3;
		TestCase.assertEquals(test,
				valueConverter.convertValue(valueConverter.convertType(test, null), null, Short.class).shortValue());
	}

	@Test
	public void testEmpty() {
		try {
			valueConverter.convertValue(valueFactory.createLiteral(""), null, type);
			TestCase.fail("Empty string should cause ValueConversionException");
		} catch (ValueConversionException e) {
			TestCase.assertTrue("Cause of error should have been NumberFormatException",
					e.getCause() instanceof NumberFormatException);
		}
	}

}
