package org.matonto.rdf.orm.conversion.impl;

import org.junit.Test;
import org.matonto.rdf.api.IRI;

import junit.framework.TestCase;

public class TestIRIValueConverter extends ValueConverterTestCase<IRI> {

	public TestIRIValueConverter() {
		super(new IRIValueConverter(), IRI.class);
	}

	@Test
	public void simpleTest() {
		IRI test = valueFactory.createIRI("http://test.com/test");
		TestCase.assertEquals(test,
				valueConverter.convertValue(valueConverter.convertType(test, null), null, IRI.class));
	}

}
