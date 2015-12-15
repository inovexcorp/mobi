package org.matonto.ontology.core.api.types;

import javax.annotation.Nonnull;

import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.ValueFactory;

import aQute.bnd.annotation.component.Reference;


public enum DataRangeType {

	DATATYPE("Datatype"), 
	DATA_ONE_OF("DataOneOf"), 
	DATATYPE_RESTRICTION("DatatypeRestriction"), 
	DATA_COMPLEMENT_OF("DataComplementOf"), 
	DATA_UNION_OF("DataUnionOf"), 
	DATA_INTERSECTION_OF("DataIntersectionOf");

	private final String name;
	private final String prefixedName;
	private final IRI iri;
    private static ValueFactory factory;
    
    @Reference
    protected void setValueFactory(final ValueFactory vf)
    {
        factory = vf;
    }
    	
	DataRangeType(@Nonnull String name) {
		this.name = name;
		prefixedName = ("owl" + ':' + name);
		iri = createIRI("http://www.w3.org/2002/07/owl#", name);
	}
	
    private IRI createIRI(String namespace, String localName)
    {
        return factory.createIRI(namespace.toString(), localName);
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

	public IRI getIRI()
	{
		return iri;
	}

	public String getPrefixedName()
	{
		return prefixedName;
	}
}
