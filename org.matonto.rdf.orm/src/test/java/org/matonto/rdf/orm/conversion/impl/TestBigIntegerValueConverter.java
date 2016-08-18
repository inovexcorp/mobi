package org.matonto.rdf.orm.conversion.impl;

/*-
 * #%L
 * RDF ORM
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

import java.math.BigInteger;

import org.junit.Test;

import junit.framework.TestCase;

public class TestBigIntegerValueConverter extends ValueConverterTestCase<BigInteger> {

	public TestBigIntegerValueConverter() {
		super(new BigIntegerValueConverter(), BigInteger.class);
	}

	@Test
	public void simpleTest() {
		BigInteger test = new BigInteger("12345678987654321");
		TestCase.assertEquals(test,
				valueConverter.convertValue(valueConverter.convertType(test, null), null, BigInteger.class));
	}

}
