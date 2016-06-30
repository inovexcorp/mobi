package org.matonto.rdf.api;

/*-
 * #%L
 * org.matonto.persistence.api
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

import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.Optional;

/**
 * An RDF literal consisting of a label (the lexical value), a datatype, and optionally a language tag.
 */
public interface Literal extends Value {

    /**
     * Gets the datatype for this literal.
     *
     * @return The datatype for this literal. If getLanguage() returns a non-empty value than this must
     * return RDF#LANGSTRING.
     */
    IRI getDatatype();

    /**
     * Gets the label (the lexical value) of this literal.
     *
     * @return The literal's label.
     */
    String getLabel();

    /**
     * Gets the language tag for this literal, normalized to lower case.
     *
     * @return The language tag for this literal, or Optional.empty() if it doesn't have one.
     */
    Optional<String> getLanguage();

    /**
     * Returns the boolean value of this literal.
     *
     * @return The long value of the literal.
     * @throws IllegalArgumentException - If the literal's label cannot be represented by a boolean.
     */
    boolean booleanValue();

    /**
     * Returns the byte value of this literal.
     *
     * @return The byte value of the literal.
     * @throws NumberFormatException - If the literal cannot be represented by a byte.
     */
    byte byteValue();

    /**
     * Returns the OffsetDateTime value of this literal. Note that an xsd:dateTime contains an optional
     * offset. This method will return OffsetDateTime objects with the offset set to Z if this offset
     * is missing.
     *
     * @return The OffsetDateTime value of the literal.
     * @throws DateTimeParseException - If the literal cannot be represented by a OffsetDateTime.
     */
    OffsetDateTime dateTimeValue();

    /**
     * Returns the double value of this literal.
     *
     * @return The double value of the literal.
     * @throws NumberFormatException - If the literal cannot be represented by a double.
     */
    double doubleValue();

    /**
     * Compares a literal object to another object.
     *
     * @param object - The object to compare this literal to.
     * @return true if the other object is an instance of Literal and if their labels, language tags and datatypes
     * are equal.
     */
    boolean equals(Object object);

    /**
     * Returns the float value of this literal.
     *
     * @return The float value of the literal.
     * @throws NumberFormatException - If the literal cannot be represented by a float.
     */
    float floatValue();

    /**
     * Returns the literal's hash code. The hash code of a literal is defined as the hash code of its label, language,
     * and datatype.
     *
     * @return A hash code for the literal.
     */
    int hashCode();

    /**
     * Returns the int value of this literal.
     *
     * @return The int value of the literal.
     * @throws NumberFormatException - If the literal cannot be represented by a int.
     */
    int intValue();

    /**
     * Returns the long value of this literal.
     *
     * @return The long value of the literal.
     * @throws NumberFormatException - If the literal cannot be represented by a long.
     */
    long longValue();

    /**
     * Returns the short value of this literal.
     *
     * @return The short value of the literal.
     * @throws NumberFormatException - If the literal cannot be represented by a short.
     */
    short shortValue();
}
