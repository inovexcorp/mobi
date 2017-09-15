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

import aQute.bnd.annotation.component.Component;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.orm.Thing;
import org.matonto.rdf.orm.conversion.AbstractValueConverter;
import org.matonto.rdf.orm.conversion.ValueConversionException;
import org.matonto.rdf.orm.conversion.ValueConverter;

import java.time.OffsetDateTime;
import java.util.GregorianCalendar;
import java.util.TimeZone;
import javax.xml.datatype.DatatypeConfigurationException;
import javax.xml.datatype.DatatypeFactory;

/**
 * {@link ValueConverter} for creating {@link Date} objects from statements.
 *
 * @author bdgould
 */
@Component(provide = ValueConverter.class)
public class DateValueConverter extends AbstractValueConverter<OffsetDateTime> {

    private static final String XSD_DATETIME = XSD_PREFIX + "dateTime";

    /**
     * Default constructor.
     */
    public DateValueConverter() {
        super(OffsetDateTime.class);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public OffsetDateTime convertValue(final Value value, final Thing thing,
            final Class<? extends OffsetDateTime> desiredType) throws ValueConversionException {
        try {
            // Use the standard XMLGregorianCalendar object.
            return DatatypeFactory.newInstance().newXMLGregorianCalendar(value.stringValue()).toGregorianCalendar().
                    toZonedDateTime().toOffsetDateTime();
        } catch (DatatypeConfigurationException e) {
            throw new ValueConversionException("Environment issue: Cannot instantiate XML Gregorian Calendar data.", e);
        } catch (IllegalArgumentException e) {
            throw new ValueConversionException("Issue converting value of statement into a date object.", e);
        }
    }

    @Override
    public Value convertType(OffsetDateTime type, Thing thing) throws ValueConversionException {
        try {
            final GregorianCalendar gcal = new GregorianCalendar();
            gcal.setTimeInMillis(type.toEpochSecond() * 1000 + type.getNano() / 1000000);
            gcal.setTimeZone(TimeZone.getTimeZone(type.getOffset().getId()));
            return getValueFactory(thing).createLiteral(
                    DatatypeFactory.newInstance().newXMLGregorianCalendar(gcal).toXMLFormat(), XSD_DATETIME);
        } catch (Exception e) {
            throw new ValueConversionException("Issue converting calendar into Value", e);
        }
    }

}
