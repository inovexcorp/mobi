package com.mobi.rdf.orm.conversion.impl;

/*-
 * #%L
 * com.mobi.rdf.orm
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
import com.mobi.rdf.api.Literal;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.conversion.AbstractValueConverter;
import com.mobi.rdf.orm.conversion.ValueConversionException;
import com.mobi.rdf.orm.conversion.ValueConverter;
import com.mobi.rdf.api.Literal;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.conversion.AbstractValueConverter;
import com.mobi.rdf.orm.conversion.ValueConversionException;
import com.mobi.rdf.orm.conversion.ValueConverter;

/**
 * {@link ValueConverter} implementation for converting {@link Boolean} values from statements.
 */
@Component(provide = ValueConverter.class)
public class BooleanValueConverter extends AbstractValueConverter<Boolean> {

    /**
     * Create a new instance of a {@link BooleanValueConverter}.
     */
    public BooleanValueConverter() {
        super(Boolean.class);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Boolean convertValue(final Value value, final Thing thing, final Class<? extends Boolean> desiredType) throws ValueConversionException {
        try {
            return ((Literal) value).booleanValue();
        } catch (Exception e) {
            throw new ValueConversionException("Issue converting '" + value.stringValue() + "' to boolean", e);
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Value convertType(final Boolean value, final Thing thing) throws ValueConversionException {
        return getValueFactory(thing).createLiteral(value);
    }
}
