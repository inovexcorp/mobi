package com.mobi.rdf.orm.conversion.impl;

/*-
 * #%L
 * RDF ORM
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import com.mobi.rdf.orm.conversion.ValueConversionException;
import junit.framework.TestCase;
import org.junit.Test;
import org.eclipse.rdf4j.model.Value;
import com.mobi.rdf.orm.conversion.ValueConversionException;

public class DoubleValueConverterTest extends ValueConverterTestCase<Double> {

    public DoubleValueConverterTest() {
        super(new DoubleValueConverter(), Double.class);
    }

    @Test
    public void testSimple() {
        double test = 3.14159;
        Value l = valueConverter.convertType(test, null);
        TestCase.assertEquals(test, valueConverter.convertValue(l, null, Double.class));
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
