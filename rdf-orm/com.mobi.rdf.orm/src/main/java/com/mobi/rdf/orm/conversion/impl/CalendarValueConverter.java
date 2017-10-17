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

import aQute.bnd.annotation.component.Component;
import com.mobi.rdf.orm.conversion.AbstractValueConverter;
import com.mobi.rdf.orm.conversion.ValueConversionException;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.conversion.AbstractValueConverter;
import com.mobi.rdf.orm.conversion.ValueConversionException;
import com.mobi.rdf.orm.conversion.ValueConverter;

import javax.xml.datatype.DatatypeConfigurationException;
import javax.xml.datatype.DatatypeFactory;
import java.util.Calendar;
import java.util.GregorianCalendar;

/**
 * {@link ValueConverter} for creating {@link Calendar} objects from statements.
 *
 * @author bdgould
 */
@Component(provide = ValueConverter.class)
public class CalendarValueConverter extends AbstractValueConverter<Calendar> {

    private static final String XSD_DATETIME = XSD_PREFIX + "dateTime";

    /**
     * Default constructor.
     */
    public CalendarValueConverter() {
        super(Calendar.class);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Calendar convertValue(Value value, Thing thing, Class<? extends Calendar> desiredType)
            throws ValueConversionException {
        try {
            // Use the standard XMLGregorianCalendar object.
            return DatatypeFactory.newInstance().newXMLGregorianCalendar(value.stringValue()).toGregorianCalendar();
        } catch (DatatypeConfigurationException e) {
            throw new ValueConversionException("Environment issue: Cannot instantiate XML Gregorian Calendar data.", e);
        } catch (IllegalArgumentException e) {
            throw new ValueConversionException("Issue converting value of statement into a date object.", e);
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Value convertType(Calendar type, Thing thing) throws ValueConversionException {
        try {
            final GregorianCalendar gcal = new GregorianCalendar();
            gcal.setTimeInMillis(type.getTimeInMillis());
            return getValueFactory(thing).createLiteral(
                    DatatypeFactory.newInstance().newXMLGregorianCalendar(gcal).toXMLFormat(), XSD_DATETIME);
        } catch (Exception e) {
            throw new ValueConversionException("Issue converting calendar into Value", e);
        }
    }

}
