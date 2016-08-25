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

import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.orm.Thing;
import org.matonto.rdf.orm.conversion.AbstractValueConverter;
import org.matonto.rdf.orm.conversion.ValueConversionException;
import org.matonto.rdf.orm.conversion.ValueConverter;

import aQute.bnd.annotation.component.Component;

/**
 * {@link ValueConverter} for creating {@link IRI}s from statements.
 * 
 * @author bdgould
 *
 */
@Component(provide = ValueConverter.class)
public class IRIValueConverter extends AbstractValueConverter<IRI> {

	/**
	 * Default constructor.
	 */
	public IRIValueConverter() {
		super(IRI.class);
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public IRI convertValue(Value value, Thing thing, Class<? extends IRI> desiredType)
			throws ValueConversionException {
		if (value instanceof IRI) {
			try {
				return (IRI) value;
			} catch (ClassCastException e) {
				throw new ValueConversionException("Issue casting value '" + value + "' to an IRI.", e);
			}
		} else {
			try {
				return getValueFactory(thing).createIRI(value.stringValue());
			} catch (Exception e) {
				throw new ValueConversionException("Issue creating IRI from statement.", e);
			}
		}
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public Value convertType(IRI type, Thing thing) throws ValueConversionException {
		return type;
	}

}
