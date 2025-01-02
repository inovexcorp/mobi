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
import org.eclipse.rdf4j.model.base.CoreDatatype;
import org.osgi.service.component.annotations.Component;

import java.math.BigInteger;

/**
 * {@link ValueConverter} for {@link BigInteger} objects.
 *
 * @author bdgould
 */
@Component(
        service = ValueConverter.class,
        property = {
                "converterType=BigInteger"
        }
)
public class BigIntegerValueConverter extends AbstractValueConverter<BigInteger> {

    /**
     * Default constructor.
     */
    public BigIntegerValueConverter() {
        super(BigInteger.class);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public BigInteger convertValue(Value value, Thing thing, Class<? extends BigInteger> desiredType)
            throws ValueConversionException {
        try {
            return new BigInteger(value.stringValue());
        } catch (NumberFormatException e) {
            throw new ValueConversionException("Issue getting big integer value from statement.", e);
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Value convertType(BigInteger type, Thing thing) throws ValueConversionException {
        return getValueFactory(thing).createLiteral(type.toString(), CoreDatatype.XSD.INTEGER);
    }

}
