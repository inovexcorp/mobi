package org.matonto.rdf.orm.conversion.impl;

import org.junit.Test;
import org.matonto.rdf.orm.conversion.ValueConversionException;

import junit.framework.TestCase;

public class TestIntegerValueConverter extends ValueConverterTestCase<Integer> {

	public TestIntegerValueConverter() {
		super(new IntegerValueConverter(), Integer.class);
	}

	@Test
	public void basicTest() {
		int test = 3;

		TestCase.assertEquals(test,
				valueConverter.convertValue(valueConverter.convertType(test, null), null, Integer.class).intValue());
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
