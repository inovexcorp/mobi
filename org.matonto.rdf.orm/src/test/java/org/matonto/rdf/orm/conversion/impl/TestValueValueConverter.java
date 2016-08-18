package org.matonto.rdf.orm.conversion.impl;

import org.junit.Test;
import org.matonto.rdf.api.Value;

import junit.framework.TestCase;

public class TestValueValueConverter extends ValueConverterTestCase<Value> {

	public TestValueValueConverter() {
		super(new ValueValueConverter(), Value.class);
	}

	@Test
	public void testBasic() {
		Value test = valueFactory.createIRI("urn://silly.test");
		TestCase.assertEquals(test,
				valueConverter.convertValue(valueConverter.convertType(test, null), null, Value.class));
	}

}
