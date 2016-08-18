package org.matonto.rdf.orm.conversion.impl;

import java.util.Date;
import java.util.GregorianCalendar;

import javax.xml.datatype.DatatypeConfigurationException;
import javax.xml.datatype.DatatypeFactory;

import org.matonto.rdf.api.Value;
import org.matonto.rdf.orm.Thing;
import org.matonto.rdf.orm.conversion.AbstractValueConverter;
import org.matonto.rdf.orm.conversion.ValueConversionException;
import org.matonto.rdf.orm.conversion.ValueConverter;

import aQute.bnd.annotation.component.Component;

/**
 * {@link ValueConverter} for creating {@link Date} objects from statements.
 * 
 * @author bdgould
 *
 */
@Component
public class DateValueConverter extends AbstractValueConverter<Date> {

	private static final String XSD_DATETIME = XSD_PREFIX + "dateTime";

	/**
	 * Default constructor.
	 */
	public DateValueConverter() {
		super(Date.class);
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public Date convertValue(final Value value, final Thing thing, final Class<? extends Date> desiredType)
			throws ValueConversionException {
		try {
			// Use the standard XMLGregorianCalendar object.
			return DatatypeFactory.newInstance().newXMLGregorianCalendar(value.stringValue()).toGregorianCalendar()
					.getTime();
		} catch (DatatypeConfigurationException e) {
			throw new ValueConversionException("Environment issue: Cannot instantiate XML Gregorian Calendar data.", e);
		} catch (IllegalArgumentException e) {
			throw new ValueConversionException("Issue converting value of statement into a date object.", e);
		}
	}

	@Override
	public Value convertType(Date type, Thing thing) throws ValueConversionException {
		try {
			final GregorianCalendar gcal = new GregorianCalendar();
			gcal.setTime(type);
			return getValueFactory(thing).createLiteral(
					DatatypeFactory.newInstance().newXMLGregorianCalendar(gcal).toXMLFormat(), XSD_DATETIME);
		} catch (Exception e) {
			throw new ValueConversionException("Issue converting calendar into Value", e);
		}
	}

}
