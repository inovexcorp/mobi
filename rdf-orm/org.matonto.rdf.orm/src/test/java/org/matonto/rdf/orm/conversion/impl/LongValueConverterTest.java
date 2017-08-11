package org.matonto.rdf.orm.conversion.impl;

/*-
 * #%L
 * org.matonto.rdf.orm
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

import junit.framework.TestCase;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.BlockJUnit4ClassRunner;
import org.matonto.rdf.orm.conversion.ValueConversionException;

@RunWith(BlockJUnit4ClassRunner.class)
public class LongValueConverterTest extends ValueConverterTestCase<Long> {

    public LongValueConverterTest() {
        super(new LongValueConverter(), Long.class);
    }

    @Test
    public void simpleTest() {
        TestCase.assertEquals(10L,
                (long) valueConverter.convertValue(valueConverter.convertType(10L, null), null, Long.class));
    }

    @Test(expected = ValueConversionException.class)
    public void badTest() {
        valueConverter.convertValue(valueFactory.createLiteral("3.141592"), null, Long.class);
    }
}
