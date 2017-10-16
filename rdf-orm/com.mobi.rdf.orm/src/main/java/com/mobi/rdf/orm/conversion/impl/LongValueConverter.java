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

import javax.annotation.Nonnull;

@Component(provide = ValueConverter.class)
public class LongValueConverter extends AbstractValueConverter<Long> {

    public LongValueConverter() {
        super(Long.class);
    }

    @Override
    public Long convertValue(@Nonnull Value value, @Nonnull Thing thing, @Nonnull Class<? extends Long> desiredType) throws ValueConversionException {
        try {
            return ((Literal) value).longValue();
        } catch (Exception e) {
            throw new ValueConversionException("Issue converting value '" + value + "' into a long", e);
        }
    }

    @Override
    public Value convertType(@Nonnull Long type, @Nonnull Thing thing) throws ValueConversionException {
        return getValueFactory(thing).createLiteral(type);
    }
}
