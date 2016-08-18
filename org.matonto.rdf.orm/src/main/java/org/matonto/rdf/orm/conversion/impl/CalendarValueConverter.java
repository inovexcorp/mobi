package org.matonto.rdf.orm.conversion.impl;

import java.util.Calendar;
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
 * {@link ValueConverter} for creating {@link Calendar} objects from statements.
 * 
 * @author bdgould
 *
 */
@Component
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
