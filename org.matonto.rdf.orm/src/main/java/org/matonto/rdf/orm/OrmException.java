package org.matonto.rdf.orm;

import org.matonto.exception.MatOntoException;

/**
 * This {@link MatOntoException} indicates something went wrong with the ORM
 * action.
 * 
 * @author bdgould
 *
 */
public class OrmException extends MatOntoException {

	/**
	 * Serial version UID.
	 */
	private static final long serialVersionUID = -411409811095531213L;

	/**
	 * Construct a new {@link OrmException}.
	 * 
	 * @param msg
	 *            The message to attach
	 */
	public OrmException(final String msg) {
		super(msg);
	}

	/**
	 * Construct a new {@link OrmException}.
	 * 
	 * @param msg
	 *            The message to attach
	 * @param cause
	 *            The underlying cause to attach
	 */
	public OrmException(final String msg, final Throwable cause) {
		super(msg, cause);
	}
}
