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

import junit.framework.TestCase;
import org.junit.Test;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.orm.Thing;

import java.util.Calendar;
import java.util.GregorianCalendar;

public class CalendarValueConverterTest extends ValueConverterTestCase<Calendar> {

    public CalendarValueConverterTest() {
        super(new CalendarValueConverter(), Calendar.class);
    }

    @Test
    public void test() {
        Calendar c = new GregorianCalendar();
        Value v = valueConverter.convertType(c, (Thing) null);
        Calendar c1 = valueConverter.convertValue(v, null, Calendar.class);
        // TODO - evalutate why equality doesn't work...
        TestCase.assertEquals(c.getTimeInMillis(), c1.getTimeInMillis());

    }

}
