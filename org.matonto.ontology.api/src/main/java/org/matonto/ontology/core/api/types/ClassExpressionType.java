package org.matonto.ontology.core.api.types;

import javax.annotation.Nonnull;

import org.matonto.ontology.core.api.OntologyIRI;
import org.semanticweb.owlapi.vocab.Namespaces;


public enum ClassExpressionType
{
	OWL_CLASS("Class"), 
	OBJECT_SOME_VALUES_FROM("ObjectSomeValuesFrom"), 
	OBJECT_ALL_VALUES_FROM("ObjectAllValuesFrom"), 
	OBJECT_MIN_CARDINALITY("ObjectMinCardinality"), 
	OBJECT_MAX_CARDINALITY("ObjectMaxCardinality"), 
	OBJECT_EXACT_CARDINALITY("ObjectExactCardinality"), 
	OBJECT_HAS_VALUE("ObjectHasValue"), 
	OBJECT_HAS_SELF("ObjectHasSelf"), 
	DATA_SOME_VALUES_FROM("DataSomeValuesFrom"), 
	DATA_ALL_VALUES_FROM("DataAllValuesFrom"), 
	DATA_MIN_CARDINALITY("DataMinCardinality"), 
	DATA_MAX_CARDINALITY("DataMaxCardinality"), 
	DATA_EXACT_CARDINALITY("DataExactCardinality"), 
	DATA_HAS_VALUE("DataHasValue"), 
	OBJECT_INTERSECTION_OF("ObjectIntersectionOf"), 
	OBJECT_UNION_OF("ObjectUnionOf"), 
	OBJECT_COMPLEMENT_OF("ObjectComplementOf"), 
	OBJECT_ONE_OF("ObjectOneOf");


	private final String name;
	private final String prefixedName;
//	private final OntologyIRI iri;

	private ClassExpressionType(@Nonnull String name)
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
	
	
//	public OntologyIRI getIRI()
//	{
//		return iri;
//	}
	
	
	public String getPrefixedName()
	{
		return prefixedName;
	}
 }
