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

import static org.junit.Assert.assertEquals;

import com.mobi.rdf.api.Literal;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.impl.sesame.SimpleValueFactory;
import com.mobi.vocabularies.xsd.XSD;
import org.junit.Test;

import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;

public class DateValueConverterTest extends ValueConverterTestCase<OffsetDateTime> {

    private ValueFactory vf = SimpleValueFactory.getInstance();

    public DateValueConverterTest() {
        super(new DateValueConverter(), OffsetDateTime.class);
    }

    @Test
    public void convertTypeReturnsCorrectStringValue() {
        OffsetDateTime expected = OffsetDateTime.now();
        Value value = valueConverter.convertType(expected, null);
        OffsetDateTime actual = OffsetDateTime.parse(value.stringValue());
        assertEquals(expected.truncatedTo(ChronoUnit.SECONDS), actual);
    }

    @Test
    public void convertTypeReturnsCorrectDatatype() {
        OffsetDateTime expected = OffsetDateTime.now();
        Value value = valueConverter.convertType(expected, null);
        assertEquals(((Literal) value).getDatatype(), vf.createIRI(XSD.DATE_TIME));
    }

    @Test
    public void convertValue() {
        OffsetDateTime expected = OffsetDateTime.now();
        Literal literal = vf.createLiteral(expected);
        OffsetDateTime actual = valueConverter.convertValue(literal, null, OffsetDateTime.class);
        assertEquals(expected.truncatedTo(ChronoUnit.SECONDS), actual);
    }
}
