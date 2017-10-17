package com.mobi.rdf.orm.conversion.impl;

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

import com.mobi.rdf.api.Value;
import com.mobi.rdf.orm.conversion.ValueConversionException;
import junit.framework.TestCase;
import org.junit.Test;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.orm.conversion.ValueConversionException;

public class FloatValueConverterTest extends ValueConverterTestCase<Float> {

    public FloatValueConverterTest() {
        super(new FloatValueConverter(), Float.class);
    }

    @Test
    public void basicTest() {
        float test = 3.141592F;
        Value v = valueConverter.convertType(test, null);
        TestCase.assertEquals(test, valueConverter.convertValue(v, null, Float.class));
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
