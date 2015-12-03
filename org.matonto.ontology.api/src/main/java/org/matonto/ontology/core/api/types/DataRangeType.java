package org.matonto.ontology.core.api.types;

import javax.annotation.Nonnull;

import org.semanticweb.owlapi.vocab.Namespaces;

public enum DataRangeType {

	DATATYPE("Datatype"), 
	DATA_ONE_OF("DataOneOf"), 
	DATATYPE_RESTRICTION("DatatypeRestriction"), 
	DATA_COMPLEMENT_OF("DataComplementOf"), 
	DATA_UNION_OF("DataUnionOf"), 
	DATA_INTERSECTION_OF("DataIntersectionOf");
	

	private final String name;
	private final String prefixedName;
//	private final SimpleIRI iri;
	
	private DataRangeType(@Nonnull String name)
	{
		this.name = name;
		prefixedName = (Namespaces.OWL.getPrefixName() + ':' + name);
//		iri = SimpleIRI.create(Namespaces.OWL.getPrefixIRI(), name);
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
	
	
//	public SimpleIRI getIRI()
//	{
//		return iri;
//	}
	
	
	public String getPrefixedName()
	{
		return prefixedName;
	}
}
