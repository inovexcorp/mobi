package com.mobi.rdf.orm.conversion.impl;

/*-
 * #%L
 * RDF ORM
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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

import com.mobi.rdf.orm.conversion.ValueConverter;
import junit.framework.TestCase;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.base.CoreDatatype;
import org.eclipse.rdf4j.model.impl.SimpleLiteral;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.junit.Test;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Optional;
import java.util.Set;
import javax.xml.datatype.XMLGregorianCalendar;

public class DefaultValueConverterRegistryTest {

    protected final ValueFactory valueFactory = new ValidatingValueFactory();

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
        public double doubleValue() {
            return 0;
        }

        @Override
        public XMLGregorianCalendar calendarValue() {
            return null;
        }

        @Override
        public CoreDatatype getCoreDatatype() {
            return null;
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
        public BigInteger integerValue() {
            return new BigInteger("0".getBytes(StandardCharsets.UTF_8));
        }

        @Override
        public BigDecimal decimalValue() {
            return new BigDecimal(new BigInteger("0".getBytes(StandardCharsets.UTF_8)));
        }

        @Override
        public short shortValue() {
            return 0;
        }

        @Override
        public String stringValue() {
            return "0";
        }
    }

    private static class SubLiteralImplExt extends SubLiteralImpl {}
}
