package org.matonto.ontology.core.impl.owlapi;

import java.util.HashSet;
import java.util.Set;
import java.util.TreeSet;

import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.EquivalentObjectPropertiesAxiom;
import org.matonto.ontology.core.api.ObjectPropertyExpression;

import com.google.common.base.Preconditions;
import org.matonto.ontology.core.api.types.AxiomType;


public class SimpleEquivalentObjectPropertiesAxiom 
	extends SimpleAxiom 
	implements EquivalentObjectPropertiesAxiom {

	
	private Set<ObjectPropertyExpression> properties;
	
	
	public SimpleEquivalentObjectPropertiesAxiom(Set<ObjectPropertyExpression> properties, Set<Annotation> annotations) 
	{
		super(annotations);
		this.properties = new TreeSet<ObjectPropertyExpression>(Preconditions.checkNotNull(properties, "properties cannot be null"));;
	}

	
	@Override
	public EquivalentObjectPropertiesAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleEquivalentObjectPropertiesAxiom(properties, NO_ANNOTATIONS);	
	}

	
	@Override
	public EquivalentObjectPropertiesAxiom getAnnotatedAxiom(Set<Annotation> annotations) 
	{
		return new SimpleEquivalentObjectPropertiesAxiom(properties, mergeAnnos(annotations));
	}

	
	@Override
	public AxiomType getAxiomType()
	{
		return AxiomType.EQUIVALENT_OBJECT_PROPERTIES;
	}

	
	@Override
	public Set<ObjectPropertyExpression> getObjectPropertys() 
	{
		return new HashSet<ObjectPropertyExpression> (properties);
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (!super.equals(obj)) 
			return false;
		
		if (obj instanceof EquivalentObjectPropertiesAxiom) {
			EquivalentObjectPropertiesAxiom other = (EquivalentObjectPropertiesAxiom)obj;			 
			return properties.equals(other.getObjectPropertys());
		}
		
		return false;
	}

}
