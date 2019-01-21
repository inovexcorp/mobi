package com.mobi.rdf.core.impl.sesame


import com.mobi.rdf.api.ValueFactory
import org.eclipse.rdf4j.model.vocabulary.RDF
import org.eclipse.rdf4j.model.vocabulary.XMLSchema
import spock.lang.Shared
import spock.lang.Specification
import spock.lang.Unroll

import java.time.OffsetDateTime
import java.time.format.DateTimeParseException

class SimpleLiteralSpec extends Specification {

    ValueFactory vf = SimpleValueFactory.getInstance();

/*-
 * #%L
 * com.mobi.rdf.impl.sesame
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

    @Shared
    List<String> labelsToTest = []

    @Shared
    def stringLabels = [
            "RDF is Awesome!",
            "",
            "Mobi"
    ]

    @Shared
    def booleanLabels = [
            "true": true,
            "false": false,
            "1": true,
            "0": false
    ]

    @Shared
    def badBooleanLabels = [
            "TRUE",
            "FALSE",
            "2",
            "-1",
            "anything else"
    ]

    @Shared
    def byteLabels = [
            "-128": (byte) -128,
            "127": (byte) 127,
            "0": (byte) 0,
            "42": (byte) 42,
            "+105": (byte) 105
    ]

    @Shared
    def badByteLabels = [
            "-129",
            "128",
            "42.42",
            "1.",
            "0A",
            "INF"
    ]

    @Shared
    def dateLabels = [
            "2015-01-01T00:00:00": OffsetDateTime.parse("2015-01-01T00:00:00Z"),
            "2015-01-01T00:00:00.123": OffsetDateTime.parse("2015-01-01T00:00:00.123Z"),
            "2015-01-01T00:00:00Z": OffsetDateTime.parse("2015-01-01T00:00:00Z"),
            "2015-01-01T00:00:00.000Z": OffsetDateTime.parse("2015-01-01T00:00:00Z"),
            "2015-01-01T00:00:00.1Z": OffsetDateTime.parse("2015-01-01T00:00:00.1Z"),
            "2015-01-01T00:00:00.123Z": OffsetDateTime.parse("2015-01-01T00:00:00.123Z"),
            "2015-01-01T00:00:00.12345Z": OffsetDateTime.parse("2015-01-01T00:00:00.12345Z"),
            "2015-01-01T00:00:00.123456789Z": OffsetDateTime.parse("2015-01-01T00:00:00.123456789Z"),
            "2015-01-01T00:00:00.100Z": OffsetDateTime.parse("2015-01-01T00:00:00.100Z"),
            "2015-01-01T00:00:00+01:00": OffsetDateTime.parse("2015-01-01T00:00:00+01:00"),
            "2015-01-01T00:00:00-05:00": OffsetDateTime.parse("2015-01-01T00:00:00-05:00"),
            "-2015-01-01T00:00:00": OffsetDateTime.parse("-2015-01-01T00:00:00Z"),
            "-2015-01-01T00:00:00Z": OffsetDateTime.parse("-2015-01-01T00:00:00Z")
    ]

    @Shared
    def badDateLabels = [
            "2001-10-26",
            "2001-10-26T01",
            "2001-10-26T01:01:01.1234567890Z",
            "2001-10-26T25:32:52+02:00",
            "01-10-26T21:32",
            "2015-01-01T00:00:00.1234567890Z"
    ]

    @Shared
    def doubleLabels = [
            "0": (double) 0,
            "INF": Double.POSITIVE_INFINITY,
            "-INF": Double.NEGATIVE_INFINITY,
            "NaN": Double.NaN,
            "123.456": (double) 123.456,
            "+123.456": (double) 123.456,
            "-1.2344e56": ((double) -1.2344) * Math.pow(10, 56),
            "-.45E-6": (double) -0.00000045
    ]

    @Shared
    def badDoubleLabels = [
            "1234.4E 56",
            "1E+2.5",
            "+INF",
            "NAN"
    ]

    @Shared
    def floatLabels = [
            "0": 0f,
            "INF": Float.POSITIVE_INFINITY,
            "-INF": Float.NEGATIVE_INFINITY,
            "NaN": Float.NaN,
            "123.456": 123.456f,
            "+123.456": 123.456f,
            "-1.2344e56": Float.NEGATIVE_INFINITY,
            "-.45E-6": -0.00000045f
    ]

    @Shared
    def badFloatLabels = [
            "1234.4E 56",
            "1E+2.5",
            "+INF",
            "NAN"
    ]

    @Shared
    def intLabels = [
            "-2147483648": -2147483648,
            "2147483647": 2147483647,
            "-0": 0,
            "+0": 0,
            "42": 42,
            "-00005": -5
    ]

    @Shared
    def badIntLabels = [
            "-2147483649",
            "2147483648",
            "42.42",
            "1."
    ]

    @Shared
    def longLabels = [
            "-9223372036854775808": -9223372036854775808L,
            "9223372036854775807": 9223372036854775807L,
            "42": 42L,
            "-00005": -5L
    ]

    @Shared
    def badLongLabels = [
            "-9223372036854775809",
            "9223372036854775808",
            "42.42",
            "1."
    ]

    @Shared
    def shortLabels = [
            "-32768": (short) -32768,
            "32767": (short) 32767,
            "0": (short) 0,
            "42": (short) 42,
            "-00005": (short) -5
    ]

    @Shared
    def badShortLabels = [
            "-32769",
            "32768",
            "42.42",
            "1."
    ]

    def setupSpec() {
        labelsToTest.addAll(stringLabels)
        labelsToTest.addAll(booleanLabels.keySet())
        labelsToTest.addAll(byteLabels.keySet())
        labelsToTest.addAll(dateLabels.keySet())
        labelsToTest.addAll(doubleLabels.keySet())
        labelsToTest.addAll(floatLabels.keySet())
        labelsToTest.addAll(intLabels.keySet())
        labelsToTest.addAll(longLabels.keySet())
        labelsToTest.addAll(shortLabels.keySet())
    }

    /* String Tests */

    def "label of #labelString is #labelString"() {
        setup:
        def literal = new SimpleLiteral(labelString)

        expect:
        literal.getLabel() == labelString

        where:
        labelString << labelsToTest
    }

    /* Datatype Tests */

    def "datatype of #labelString is XSD:String"() {
        setup:
        def literal = new SimpleLiteral(labelString)

        expect:
        literal.getDatatype() == vf.createIRI(XMLSchema.STRING.stringValue())

        where:
        labelString << labelsToTest
    }

    def "datatype of #labelString with a language is RDF:LangString"() {
        setup:
        def literal = new SimpleLiteral("test with language", "en")

        expect:
        literal.getDatatype() == vf.createIRI(RDF.LANGSTRING.stringValue())
    }

    /* Language Tests */

    def "language of #labelString with a language exists and is correct"() {
        setup:
        def literal = new SimpleLiteral("test with language", "en")

        expect:
        literal.getLanguage().isPresent()
        literal.getLanguage().get() == "en"
    }

    def "language of #labelString without a language does not exist"() {
        setup:
        def literal = new SimpleLiteral("test with language")

        expect:
        !literal.getLanguage().isPresent()
    }

    def "language of #labelString with an IRI and without a language does not exist"() {
        setup:
        def literal = new SimpleLiteral("true", vf.createIRI(XMLSchema.BOOLEAN.stringValue()))

        expect:
        !literal.getLanguage().isPresent()
    }

    /* Boolean Tests */

    def "boolean #boolLabel resolves to #boolVal"() {
        setup:
        def label = new SimpleLiteral(boolLabel, vf.createIRI(XMLSchema.BOOLEAN.stringValue()))

        expect:
        label.booleanValue() == boolVal

        where:
        boolLabel << booleanLabels.keySet()
        boolVal << booleanLabels.values()
    }

    def "bad boolean #boolLabel throws an IllegalArgumentException when accessed"() {
        when:
        new SimpleLiteral(boolLabel, vf.createIRI(XMLSchema.BOOLEAN.stringValue())).booleanValue()

        then:
        thrown IllegalArgumentException

        where:
        boolLabel << badBooleanLabels
    }

    /* Byte Tests */

    def "byte #byteLabel resolves to #byteVal"() {
        setup:
        def literal = new SimpleLiteral(byteLabel, vf.createIRI(XMLSchema.BOOLEAN.stringValue()))

        expect:
        literal.byteValue() == byteVal

        where:
        byteLabel << byteLabels.keySet()
        byteVal << byteLabels.values()
    }

    def "bad byte #byteLabel throws an IllegalArgumentException when accessed"() {
        when:
        new SimpleLiteral(byteLabel, vf.createIRI(XMLSchema.BYTE.stringValue())).byteValue()

        then:
        thrown IllegalArgumentException

        where:
        byteLabel << badByteLabels
    }

    /* Date Tests */

    def "dateTime #dateLabel resolves to #dateVal"() {
        setup:
        def literal = new SimpleLiteral(dateLabel, vf.createIRI(XMLSchema.DATETIME.stringValue()))

        expect:
        literal.stringValue() == dateLabel
        literal.dateTimeValue() == dateVal

        where:
        dateLabel << dateLabels.keySet()
        dateVal << dateLabels.values()
    }

    @Unroll
    def "bad date #dateLabel throws a DateTimeParseException when accessed"() {
        when:
        new SimpleLiteral(dateLabel, vf.createIRI(XMLSchema.DATETIME.stringValue())).dateTimeValue()

        then:
        thrown DateTimeParseException

        where:
        dateLabel << badDateLabels
    }

    /* Double Tests */

    def "double #doubleLabel resolves to #doubleVal"() {
        setup:
        def literal = new SimpleLiteral(doubleLabel, vf.createIRI(XMLSchema.DOUBLE.stringValue()))

        expect:
        literal.doubleValue() == doubleVal

        where:
        doubleLabel << doubleLabels.keySet()
        doubleVal << doubleLabels.values()
    }

    def "bad double #doubleLabel throws a IllegalArgumentException when accessed"() {
        when:
        new SimpleLiteral(doubleLabel, vf.createIRI(XMLSchema.DOUBLE.stringValue())).doubleValue()

        then:
        thrown IllegalArgumentException

        where:
        doubleLabel << badDoubleLabels
    }

    /* Float Tests */

    def "float #floatLabel resolves to #floatVal"() {
        setup:
        def literal = new SimpleLiteral(floatLabel, vf.createIRI(XMLSchema.FLOAT.stringValue()))

        expect:
        literal.floatValue() == floatVal

        where:
        floatLabel << floatLabels.keySet()
        floatVal << floatLabels.values()
    }

    def "bad float #floatLabel throws a IllegalArgumentException when accessed"() {
        when:
        new SimpleLiteral(floatLabel, vf.createIRI(XMLSchema.FLOAT.stringValue())).floatValue()

        then:
        thrown IllegalArgumentException

        where:
        floatLabel << badFloatLabels
    }

    /* Integer Tests */

    def "int #intLabel resolves to #intVal"() {
        setup:
        def literal = new SimpleLiteral(intLabel, vf.createIRI(XMLSchema.INT.stringValue()))

        expect:
        literal.intValue() == intVal

        where:
        intLabel << intLabels.keySet()
        intVal << intLabels.values()
    }

    def "bad int #intLabel throws a IllegalArgumentException when accessed"() {
        when:
        new SimpleLiteral(intLabel, vf.createIRI(XMLSchema.INT.stringValue())).intValue()

        then:
        thrown IllegalArgumentException

        where:
        intLabel << badIntLabels
    }

    def "integer #intLabel resolves to #intVal"() {
        setup:
        def literal = new SimpleLiteral(intLabel, vf.createIRI(XMLSchema.INTEGER.stringValue()))

        expect:
        literal.intValue() == intVal

        where:
        intLabel << intLabels.keySet()
        intVal << intLabels.values()
    }

    def "bad integer #intLabel throws a IllegalArgumentException when accessed"() {
        when:
        new SimpleLiteral(intLabel, vf.createIRI(XMLSchema.INTEGER.stringValue())).intValue()

        then:
        thrown IllegalArgumentException

        where:
        intLabel << badIntLabels
    }

    /* Long Tests */

    def "long #longLabel resolves to #longVal"() {
        setup:
        def literal = new SimpleLiteral(longLabel, vf.createIRI(XMLSchema.LONG.stringValue()))

        expect:
        literal.longValue() == longVal

        where:
        longLabel << intLabels.keySet()
        longVal << intLabels.values()
    }

    def "bad long #longLabel throws a IllegalArgumentException when accessed"() {
        when:
        new SimpleLiteral(longLabel, vf.createIRI(XMLSchema.LONG.stringValue())).longValue()

        then:
        thrown IllegalArgumentException

        where:
        longLabel << badLongLabels
    }

    /* Short Tests */

    def "long #shortLabel resolves to #shortVal"() {
        setup:
        def literal = new SimpleLiteral(shortLabel, vf.createIRI(XMLSchema.SHORT.stringValue()))

        expect:
        literal.shortValue() == shortVal

        where:
        shortLabel << shortLabels.keySet()
        shortVal << shortLabels.values()
    }

    def "bad short #shortLabel throws a IllegalArgumentException when accessed"() {
        when:
        new SimpleLiteral(shortLabel, vf.createIRI(XMLSchema.SHORT.stringValue())).shortValue()

        then:
        thrown IllegalArgumentException

        where:
        shortLabel << badShortLabels
    }

    /* Equals Tests */

    def "#literalString equals #literalString"() {
        setup:
        def literal1 = new SimpleLiteral(literalString)
        def literal2 = new SimpleLiteral(literalString)

        expect:
        literal1.equals(literal2)

        where:
        literalString << labelsToTest
    }

    def "#literalString equals #literalString with datatypes"() {
        setup:
        def literal1 = new SimpleLiteral(literalString, vf.createIRI(XMLSchema.BOOLEAN.stringValue()))
        def literal2 = new SimpleLiteral(literalString, vf.createIRI(XMLSchema.BOOLEAN.stringValue()))

        expect:
        literal1.equals(literal2)

        where:
        literalString << booleanLabels.keySet()
    }

    def "#literalString equals #literalString with languages"() {
        setup:
        def literal1 = new SimpleLiteral(literalString, "en")
        def literal2 = new SimpleLiteral(literalString, "en")

        expect:
        literal1.equals(literal2)

        where:
        literalString << booleanLabels.keySet()
    }

    def "#literalString1 does not equal #literalString2"() {
        setup:
        def literal1 = new SimpleLiteral(literalString1)
        def literal2 = new SimpleLiteral(literalString2)

        expect:
        !literal1.equals(literal2)

        where:
        literalString1 | literalString2
        "Test1" | "Test2"
        "Test 1" | "Test 2"
    }

    def "#literalString does not equal #literalString with different datatype"() {
        setup:
        def literal1 = new SimpleLiteral(literalString, vf.createIRI(XMLSchema.BOOLEAN.stringValue()))
        def literal2 = new SimpleLiteral(literalString)

        expect:
        !literal1.equals(literal2)

        where:
        literalString << booleanLabels.keySet()
    }

    def "#literalString does not equal #literalString with different languages"() {
        setup:
        def literal1 = new SimpleLiteral(literalString, "en")
        def literal2 = new SimpleLiteral(literalString, "fr")

        expect:
        !literal1.equals(literal2)

        where:
        literalString << booleanLabels.keySet()
    }

    /* HashCode Tests */

    def "hashcode of #literalString equals #literalString"() {
        setup:
        def literal1 = new SimpleLiteral(literalString)
        def literal2 = new SimpleLiteral(literalString)

        expect:
        literal1.hashCode() == literal2.hashCode()

        where:
        literalString << labelsToTest
    }

    /* String Tests */

    def "stringValue of #labelString is #labelString"() {
        setup:
        def literal = new SimpleLiteral(labelString)

        expect:
        literal.stringValue() == labelString

        where:
        labelString << labelsToTest
    }

    def "toString of #labelString is #labelString"() {
        setup:
        def literal = new SimpleLiteral(labelString)

        expect:
        literal.toString() == labelString

        where:
        labelString << labelsToTest
    }
}
