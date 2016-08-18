package org.matonto.rdf.orm.generate;

public class OntologyToJavaException extends Exception {

	private static final long serialVersionUID = 1L;

	public OntologyToJavaException(final String msg) {
		super(msg);
	}

	public OntologyToJavaException(final String msg, final Throwable cause) {
		super(msg, cause);
	}

}