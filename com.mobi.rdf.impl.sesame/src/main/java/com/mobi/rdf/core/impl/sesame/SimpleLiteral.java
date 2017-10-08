package com.mobi.rdf.core.impl.sesame;

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


import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Literal;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.utils.LiteralUtils;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.util.Optional;

public class SimpleLiteral implements Literal {

    private static final org.openrdf.model.ValueFactory SESAME_VF = org.openrdf.model.impl.SimpleValueFactory.getInstance();
    private static final ValueFactory MATONTO_VF = SimpleValueFactory.getInstance();
    private static final long serialVersionUID = -3684229464632745297L;
    private static final String INF = "INF";
    private static final String NEG_INF = "-INF";

    private org.openrdf.model.Literal sesameLiteral;

    protected SimpleLiteral() {}

    /**
     * Creates a new plain literal with the supplied label.
     *
     * @param label - The label for the literal, must not be null.
     */
    public SimpleLiteral(String label) {
        sesameLiteral = SESAME_VF.createLiteral(label);
    }

    /**
     * Creates a new datatyped literal with the supplied label and datatype.
     *
     * @param label - The label for the literal, must not be null.
     * @param datatype - The datatype for the literal.
     */
    public SimpleLiteral(String label, IRI datatype) {
        sesameLiteral = SESAME_VF.createLiteral(label, SESAME_VF.createIRI(datatype.stringValue()));
    }

    /**
     * Creates a new plain literal with the supplied label and language tag.
     *
     * @param label - The label for the literal, must not be null.
     * @param language - The language tag for the literal, must not be null.
     */
    public SimpleLiteral(String label, String language) {
        sesameLiteral = SESAME_VF.createLiteral(label, language);
    }

    @Override
    public IRI getDatatype() {
        return MATONTO_VF.createIRI(sesameLiteral.getDatatype().stringValue());
    }

    @Override
    public String getLabel() {
        return sesameLiteral.getLabel();
    }

    @Override
    public Optional<String> getLanguage() {
        return sesameLiteral.getLanguage();
    }

    @Override
    public boolean booleanValue() {
        return sesameLiteral.booleanValue();
    }

    @Override
    public byte byteValue() {
        return sesameLiteral.byteValue();
    }

    @Override
    public OffsetDateTime dateTimeValue() {
        String sesameDateTime = sesameLiteral.stringValue();
        // TODO: Don't use exceptions for this!
        try {
            return OffsetDateTime.parse(sesameDateTime, LiteralUtils.READ_TIME_FORMATTER);
        } catch (DateTimeParseException e) {
            return LocalDateTime.parse(sesameDateTime, LiteralUtils.LOCAL_TIME_FORMATTER)
                    .atOffset(ZoneOffset.UTC);
        }
    }

    @Override
    public double doubleValue() {
        try {
            return sesameLiteral.doubleValue();
        } catch (NumberFormatException e) {
            if (sesameLiteral.stringValue().equals(INF)) {
                return Double.POSITIVE_INFINITY;
            } else if (sesameLiteral.stringValue().equals(NEG_INF)) {
                return Double.NEGATIVE_INFINITY;
            } else {
                throw e;
            }
        }
    }

    @Override
    public float floatValue() {
        try {
            return sesameLiteral.floatValue();
        } catch (NumberFormatException e) {
            if (sesameLiteral.stringValue().equals(INF)) {
                return Float.POSITIVE_INFINITY;
            } else if (sesameLiteral.stringValue().equals(NEG_INF)) {
                return Float.NEGATIVE_INFINITY;
            } else {
                throw e;
            }
        }
    }

    @Override
    public int intValue() {
        return sesameLiteral.intValue();
    }

    @Override
    public long longValue() {
        return sesameLiteral.longValue();
    }

    @Override
    public short shortValue() {
        return sesameLiteral.shortValue();
    }

    @Override
    public String stringValue() {
        return sesameLiteral.stringValue();
    }

    @Override
    public String toString() {
        return stringValue();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o instanceof Literal) {
            Literal other = (Literal)o;

            // Compare labels
            if (!this.getLabel().equals(other.getLabel())) {
                return false;
            }

            // Compare datatypes
            if (!this.getDatatype().equals(other.getDatatype())) {
                return false;
            }

            if (getLanguage().isPresent() && other.getLanguage().isPresent()) {
                return getLanguage().get().equalsIgnoreCase(other.getLanguage().get());
            }
            // If only one has a language, then return false
            else if (getLanguage().isPresent() || other.getLanguage().isPresent()) {
                return false;
            }

            return true;
        }

        return false;
    }

    @Override
    public int hashCode() {
        return sesameLiteral.hashCode();
    }
}
