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
 * {@link ValueConverter} for {@link Literal}s.
 *
 * @author bdgould
 */
@Component(provide = ValueConverter.class)
public class LiteralValueConverter extends AbstractValueConverter<Literal> {

    /**
     * Construct a new {@link LiteralValueConverter}.
     */
    public LiteralValueConverter() {
        super(Literal.class);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Literal convertValue(Value value, Thing thing, Class<? extends Literal> desiredType)
            throws ValueConversionException {
        try {
            return Literal.class.cast(value);
        } catch (ClassCastException e) {
            throw new ValueConversionException("Issue creating literal from value specified: " + value, e);
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Value convertType(Literal type, Thing thing) throws ValueConversionException {
        return type;
    }

}
