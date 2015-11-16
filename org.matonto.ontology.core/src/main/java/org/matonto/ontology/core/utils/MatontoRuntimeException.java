package org.matonto.ontology.core.utils;

public class MatontoRuntimeException extends RuntimeException {

	
	public MatontoRuntimeException() {}
	
	public MatontoRuntimeException(String message) 
	{
		super(message);
	}
	
	public MatontoRuntimeException(String message, Throwable cause) 
	{
		super(message, cause);
	}
	
	public MatontoRuntimeException(Throwable cause) 
	{
		super(cause);
	}
	
	
}
