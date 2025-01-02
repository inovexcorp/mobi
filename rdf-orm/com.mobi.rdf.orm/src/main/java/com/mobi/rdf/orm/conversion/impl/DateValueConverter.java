package com.mobi.rdf.orm.conversion.impl;

/*-
 * #%L
 * RDF ORM
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

import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.conversion.AbstractValueConverter;
import com.mobi.rdf.orm.conversion.ValueConversionException;
import com.mobi.rdf.orm.conversion.ValueConverter;
import org.eclipse.rdf4j.model.Value;
import org.osgi.service.component.annotations.Component;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

/**
 * {@link ValueConverter} for creating {@link java.util.Date} objects from statements.
 *
 * @author bdgould
 */
@Component(
        service = ValueConverter.class,
        property = {
                "converterType=Date"
        }
)
public class DateValueConverter extends AbstractValueConverter<OffsetDateTime> {

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
            return OffsetDateTime.parse(value.stringValue(), DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        } catch (DateTimeParseException e) {
            throw new ValueConversionException("Issue converting value of statement into an OffsetDateTime object.", e);
        }
    }

    @Override
    public Value convertType(OffsetDateTime type, Thing thing) throws ValueConversionException {
        try {
            return getValueFactory(thing).createLiteral(type);
        } catch (Exception e) {
            throw new ValueConversionException("Issue converting calendar into Value", e);
        }
    }

}
