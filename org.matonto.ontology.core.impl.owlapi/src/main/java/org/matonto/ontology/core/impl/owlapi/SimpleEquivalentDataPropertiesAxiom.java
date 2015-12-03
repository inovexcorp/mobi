package org.matonto.ontology.core.impl.owlapi;

import java.util.HashSet;
import java.util.Set;
import java.util.TreeSet;

import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.propertyexpression.DataPropertyExpression;
import org.matonto.ontology.core.api.axiom.EquivalentDataPropertiesAxiom;

import com.google.common.base.Preconditions;
import org.matonto.ontology.core.api.types.AxiomType;


public class SimpleEquivalentDataPropertiesAxiom 
	extends SimpleAxiom 
	implements EquivalentDataPropertiesAxiom {

	
	private Set<DataPropertyExpression> properties;
	
	
	public SimpleEquivalentDataPropertiesAxiom(Set<DataPropertyExpression> properties, Set<Annotation> annotations) 
	{
		super(annotations);
		this.properties = new TreeSet<DataPropertyExpression>(Preconditions.checkNotNull(properties, "properties cannot be null"));
	}

	
	@Override
	public EquivalentDataPropertiesAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleEquivalentDataPropertiesAxiom(properties, NO_ANNOTATIONS);	
	}
	

	@Override
	public EquivalentDataPropertiesAxiom getAnnotatedAxiom(Set<Annotation> annotations) 
	{
		return new SimpleEquivalentDataPropertiesAxiom(properties, mergeAnnos(annotations));
	}
	

	@Override
	public AxiomType getAxiomType()
	{
		return AxiomType.EQUIVALENT_DATA_PROPERTIES;
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
		
		if (obj instanceof EquivalentDataPropertiesAxiom) {
			EquivalentDataPropertiesAxiom other = (EquivalentDataPropertiesAxiom)obj;			 
			return properties.equals(other.getDataProperties());
		}
		
		return false;
	}

}
