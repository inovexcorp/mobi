package org.matonto.rdf.orm.conversion.impl;

import org.junit.Test;
import org.matonto.rdf.api.Literal;

import junit.framework.TestCase;

public class TestLiteralValueConverter extends ValueConverterTestCase<Literal> {

	public TestLiteralValueConverter() {
		super(new LiteralValueConverter(), Literal.class);
	}

	@Test
	public void simpleTest() {
		Literal test = valueFactory.createLiteral(true);
		TestCase.assertEquals(test,
				valueConverter.convertValue(valueConverter.convertType(test, null), null, Literal.class));
	}

}
