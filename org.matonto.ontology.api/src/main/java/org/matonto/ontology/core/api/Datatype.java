package org.matonto.ontology.core.api;

public interface Datatype extends Entity, DataRange {

	  public boolean isString();
	  
	  public boolean isInteger();
	  
	  public boolean isFloat();
	  
	  public boolean isDouble();
	  
	  public boolean isBoolean();
	  
	  public boolean isRDFPlainLiteral();
	  
}
