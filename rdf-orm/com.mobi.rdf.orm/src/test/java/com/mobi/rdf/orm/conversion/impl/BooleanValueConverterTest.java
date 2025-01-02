package com.mobi.rdf.orm.conversion.impl;

/*-
 * #%L
 * com.mobi.rdf.orm
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
import org.eclipse.rdf4j.model.Value;
import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.BlockJUnit4ClassRunner;

@RunWith(BlockJUnit4ClassRunner.class)
public class BooleanValueConverterTest extends ValueConverterTestCase<Boolean> {

    public BooleanValueConverterTest() {
        super(new BooleanValueConverter(), Boolean.class);
    }

    @Test
    public void basicTest() {
        Value boolValueTrue = valueFactory.createLiteral(true);
        Assert.assertEquals("Boolean literal value not converted correctly", true, this.valueConverter.convertValue(boolValueTrue, null, null));
        Value strValue = valueFactory.createLiteral("true");
        Assert.assertEquals("Boolean literal value not converted correctly", true, this.valueConverter.convertValue(strValue, null, null));

        Value out = this.valueConverter.convertType(true, null);
        Assert.assertEquals("Boolean 'true' didnt' create a correct Value output", boolValueTrue, out);
        Value boolValueFalse = valueFactory.createLiteral(false);
        out = this.valueConverter.convertType(false, null);
        Assert.assertEquals("Boolean 'true' didnt' create a correct Value output", boolValueFalse, out);

    }

    @Test(expected = ValueConversionException.class)
    public void testBad() {
        Value badVal = valueFactory.createLiteral(100L);
        this.valueConverter.convertValue(badVal, null, null);
    }

}
