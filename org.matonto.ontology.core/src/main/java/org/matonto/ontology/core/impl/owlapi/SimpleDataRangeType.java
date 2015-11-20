package org.matonto.ontology.core.impl.owlapi;

import javax.annotation.Nonnull;

import org.semanticweb.owlapi.model.DataRangeType;
import org.semanticweb.owlapi.vocab.Namespaces;

public enum SimpleDataRangeType {

	DATATYPE("Datatype"), 
	DATA_ONE_OF("DataOneOf"), 
	DATATYPE_RESTRICTION("DatatypeRestriction"), 
	DATA_COMPLEMENT_OF("DataComplementOf"), 
	DATA_UNION_OF("DataUnionOf"), 
	DATA_INTERSECTION_OF("DataIntersectionOf");
	

	private final String name;
	private final String prefixedName;
	private final SimpleIRI iri;
	
	private SimpleDataRangeType(@Nonnull String name) 
	{
		this.name = name;
		prefixedName = (Namespaces.OWL.getPrefixName() + ':' + name);
		iri = SimpleIRI.create(Namespaces.OWL.getPrefixIRI(), name);
	}
   
	public String getName()
	{
		return name;
	}
	
	
	public String toString()
	{
		return name;
	}
	
	
	public String getShortForm()
	{
		return name;
	}
	
	
	public SimpleIRI getIRI()
	{
		return iri;
	}
	
	
	public String getPrefixedName()
	{
		return prefixedName;
	}
	
	
	public static SimpleDataRangeType matontoDataRangeType(DataRangeType owlapiDRType)
	{
		return SimpleDataRangeType.valueOf(owlapiDRType.getName());
	}
	
	
	public static DataRangeType owlapiDataRangeType(SimpleDataRangeType matontoDRType)
	{
		return DataRangeType.valueOf(matontoDRType.getName());
	}
	
	      
}
