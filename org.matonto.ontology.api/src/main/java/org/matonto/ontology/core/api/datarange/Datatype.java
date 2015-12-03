package org.matonto.ontology.core.api.datarange;

import org.matonto.ontology.core.api.Entity;

public interface Datatype extends Entity, DataRange {

	  public boolean isString();
	  
	  public boolean isInteger();
	  
	  public boolean isFloat();
	  
	  public boolean isDouble();
	  
	  public boolean isBoolean();
	  
	  public boolean isRDFPlainLiteral();
	  
}
