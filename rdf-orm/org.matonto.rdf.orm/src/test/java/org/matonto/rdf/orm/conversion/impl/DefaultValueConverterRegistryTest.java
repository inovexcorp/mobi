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

import junit.framework.TestCase;
import org.junit.Test;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Literal;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.SimpleLiteral;
import org.matonto.rdf.core.impl.sesame.ValueFactoryService;
import org.matonto.rdf.orm.conversion.ValueConverter;

import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Optional;
import java.util.Set;

public class DefaultValueConverterRegistryTest {

    protected ValueFactory valueFactory = new ValueFactoryService();

    @Test
    public void testBoxify() {
        TestCase.assertEquals(Integer.class, DefaultValueConverterRegistry.boxify(int.class));
        TestCase.assertEquals(Byte.class, DefaultValueConverterRegistry.boxify(byte.class));
        TestCase.assertEquals(Short.class, DefaultValueConverterRegistry.boxify(short.class));
        TestCase.assertEquals(Long.class, DefaultValueConverterRegistry.boxify(long.class));
        TestCase.assertEquals(Double.class, DefaultValueConverterRegistry.boxify(double.class));
        TestCase.assertEquals(Float.class, DefaultValueConverterRegistry.boxify(float.class));
        TestCase.assertEquals(Boolean.class, DefaultValueConverterRegistry.boxify(boolean.class));
        TestCase.assertEquals(Character.class, DefaultValueConverterRegistry.boxify(char.class));
    }

    @Test
    public void testBasic() {
        final DefaultValueConverterRegistry reg = new DefaultValueConverterRegistry();
        final ValueConverter<Double> converter = new DoubleValueConverter();
        reg.registerValueConverter(converter);
        TestCase.assertEquals(converter, reg.getValueConverter(Double.class));

        double val = 3.14;
        TestCase.assertEquals(val, reg.convertValue(valueFactory.createLiteral(3.14), null, Double.class));
        Set<Value> values = new HashSet<>();
        values.add(valueFactory.createLiteral(3.14));
        values.add(valueFactory.createLiteral(1.23));
        Set<Double> doubles = reg.convertValues(values, null, Double.class);
        TestCase.assertEquals(2, doubles.size());
        Iterator<Double> it = doubles.iterator();
        TestCase.assertEquals(3.14, it.next());
        TestCase.assertEquals(1.23, it.next());
    }

    @Test
    public void testGetValueConverterRecursive() {
        final DefaultValueConverterRegistry reg = new DefaultValueConverterRegistry();
        final ValueConverter<Literal> converter = new LiteralValueConverter();
        reg.registerValueConverter(converter);
//        TestCase.assertEquals(converter, reg.getValueConverter(Literal.class));
//        TestCase.assertEquals(converter, reg.getValueConverter(SimpleLiteral.class));
        TestCase.assertEquals(converter, reg.getValueConverter(ComplexLiteral.class));
    }

    private static class ComplexLiteral extends SimpleLiteral {}

    private interface SubLiteral extends Literal {}

    private static class SubLiteralImpl implements SubLiteral {
        @Override
        public IRI getDatatype() {
            return null;
        }

        @Override
        public String getLabel() {
            return null;
        }

        @Override
        public Optional<String> getLanguage() {
            return null;
        }

        @Override
        public boolean booleanValue() {
            return false;
        }

        @Override
        public byte byteValue() {
            return 0;
        }

        @Override
        public OffsetDateTime dateTimeValue() {
            return null;
        }

        @Override
        public double doubleValue() {
            return 0;
        }

        @Override
        public float floatValue() {
            return 0;
        }

        @Override
        public int intValue() {
            return 0;
        }

        @Override
        public long longValue() {
            return 0;
        }

        @Override
        public short shortValue() {
            return 0;
        }

        @Override
        public String stringValue() {
            return null;
        }
    }

    private static class SubLiteralImplExt extends SubLiteralImpl {}
}
