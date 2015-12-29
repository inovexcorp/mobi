package org.matonto.ontology.core.utils;

import org.matonto.exception.MatOntoException;


public class MatontoOntologyException extends MatOntoException {

	private static final long serialVersionUID = -5863496450275604264L;

	public MatontoOntologyException() {}
	
	public MatontoOntologyException(String message) 
	{
		super(message);
	}
	
	public MatontoOntologyException(String message, Throwable cause) 
	{
		super(message, cause);
	}
	
	public MatontoOntologyException(Throwable cause) 
	{
		super(cause);
	}
}
