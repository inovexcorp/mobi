package org.matonto.rdf.orm.conversion;

import java.util.List;
import java.util.stream.Collectors;

import org.matonto.rdf.api.Value;
import org.matonto.rdf.orm.OrmException;

/**
 * This exception indicates there was an issue performing the conversion from a
 * {@link Value} into a specific type using the {@link ValueConverter}
 * infrastructure.
 * 
 * @author bdgould
 *
 */
public class ValueConversionException extends OrmException {

	/**
	 * Serial version UID.
	 */
	private static final long serialVersionUID = 1853010493451281919L;

	/**
	 * Construct a new {@link ValueConversionException}.
	 * 
	 * @param msg
	 *            The message to associate with this
	 *            {@link ValueConversionException}
	 */
	public ValueConversionException(final String msg) {
		super(msg);
	}

	/**
	 * Construct a new {@link ValueConversionException} with the given message
	 * and cause.
	 * 
	 * @param msg
	 *            The message to associate with this
	 *            {@link ValueConversionException}
	 * @param cause
	 *            The underlying cause of this {@link ValueConversionException}
	 */
	public ValueConversionException(final String msg, final Throwable cause) {
		super(msg, cause);
	}

	/**
	 * Construct a new {@link ValueConversionException}.
	 * 
	 * @param msg
	 *            The message to associate with this
	 *            {@link ValueConversionException}
	 * @param causes
	 *            A {@link List} of {@link Throwable} causes
	 */
	public ValueConversionException(final String msg, final List<Exception> causes) {
		super(msg + "\n\t" + join(causes.stream().map(e -> {
			return e.getMessage();
		}).collect(Collectors.toList()), "\n\t"));
	}

	/**
	 * Join a {@link Iterable} list of messages into a new {@link String}.
	 * 
	 * @param target
	 *            The target {@link Iterable} of {@link String}s
	 * @param separator
	 *            A separator for each item in the {@link Iterable}
	 * @return The new message {@link String}
	 */
	public static String join(final Iterable<String> target, final String separator) {
		final StringBuilder sb = new StringBuilder();
		target.forEach(val -> {
			if (sb.length() > 0) {
				sb.append(separator);
			}
			sb.append(val);
		});
		return sb.toString();
	}

}
