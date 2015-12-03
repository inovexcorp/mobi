package org.matonto.ontology.core.impl.owlapi;

import java.util.HashSet;
import java.util.Set;
import java.util.TreeSet;

import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.propertyexpression.DataPropertyExpression;
import org.matonto.ontology.core.api.axiom.DisjointDataPropertiesAxiom;

import com.google.common.base.Preconditions;
import org.matonto.ontology.core.api.types.AxiomType;


public class SimpleDisjointDataPropertiesAxiom 
	extends SimpleAxiom 
	implements DisjointDataPropertiesAxiom {

	
	private Set<DataPropertyExpression> properties;
	
	
	public SimpleDisjointDataPropertiesAxiom(Set<DataPropertyExpression> properties, Set<Annotation> annotations) 
	{
		super(annotations);
		this.properties = new TreeSet<DataPropertyExpression>(Preconditions.checkNotNull(properties, "properties cannot be null"));
	}

	
	@Override
	public DisjointDataPropertiesAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleDisjointDataPropertiesAxiom(properties, NO_ANNOTATIONS);	
	}
	

	@Override
	public DisjointDataPropertiesAxiom getAnnotatedAxiom(Set<Annotation> annotations) 
	{
		return new SimpleDisjointDataPropertiesAxiom(properties, mergeAnnos(annotations));
	}
	

	@Override
	public AxiomType getAxiomType()
	{
		return AxiomType.DISJOINT_DATA_PROPERTIES;
	}
	

	@Override
	public Set<DataPropertyExpression> getDataProperties() 
	{
		return new HashSet<DataPropertyExpression>(properties);
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (!super.equals(obj)) 
			return false;
		
		if (obj instanceof DisjointDataPropertiesAxiom) {
			DisjointDataPropertiesAxiom other = (DisjointDataPropertiesAxiom)obj;			 
			return properties.equals(other.getDataProperties());
		}
		
		return false;
	}


}
