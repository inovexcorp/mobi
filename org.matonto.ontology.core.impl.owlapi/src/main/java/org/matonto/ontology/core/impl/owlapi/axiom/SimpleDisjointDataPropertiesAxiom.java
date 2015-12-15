package org.matonto.ontology.core.impl.owlapi.axiom;

import java.util.HashSet;
import java.util.Set;
import java.util.TreeSet;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.propertyexpression.DataPropertyExpression;
import org.matonto.ontology.core.api.axiom.DisjointDataPropertiesAxiom;
import org.matonto.ontology.core.api.types.AxiomType;


public class SimpleDisjointDataPropertiesAxiom 
	extends SimpleAxiom 
	implements DisjointDataPropertiesAxiom {

	
	private Set<DataPropertyExpression> properties;
	
	
	public SimpleDisjointDataPropertiesAxiom(@Nonnull Set<DataPropertyExpression> properties, Set<Annotation> annotations) 
	{
		super(annotations);
		this.properties = new TreeSet<DataPropertyExpression>(properties);
	}

	
	@Override
	public DisjointDataPropertiesAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleDisjointDataPropertiesAxiom(properties, NO_ANNOTATIONS);	
	}
	

	@Override
	public DisjointDataPropertiesAxiom getAnnotatedAxiom(@Nonnull Set<Annotation> annotations) 
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
