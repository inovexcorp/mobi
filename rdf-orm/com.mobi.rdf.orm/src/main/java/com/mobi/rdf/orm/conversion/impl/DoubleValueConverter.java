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
import com.mobi.rdf.orm.conversion.ValueConversionException;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.conversion.AbstractValueConverter;
import com.mobi.rdf.orm.conversion.ValueConversionException;
import com.mobi.rdf.orm.conversion.ValueConverter;

/**
 * {@link ValueConverter} for {@link Double} types.
 *
 * @author bdgould
 */
@Component(provide = ValueConverter.class)
public class DoubleValueConverter extends AbstractValueConverter<Double> {

    /**
     * Construct a new {@link DoubleValueConverter}.
     */
    public DoubleValueConverter() {
        super(Double.class);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Double convertValue(Value value, Thing thing, Class<? extends Double> desiredType)
            throws ValueConversionException {
        try {
            return Double.parseDouble(value.stringValue());
        } catch (NumberFormatException e) {
            throw new ValueConversionException("Issue getting double value from statement", e);
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Value convertType(Double type, Thing thing) throws ValueConversionException {
        return getValueFactory(thing).createLiteral(type);
    }

}
