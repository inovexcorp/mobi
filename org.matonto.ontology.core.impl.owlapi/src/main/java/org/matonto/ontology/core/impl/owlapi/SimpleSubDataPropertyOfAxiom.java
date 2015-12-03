package org.matonto.ontology.core.impl.owlapi;

import java.util.Set;

import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.DataPropertyExpression;
import org.matonto.ontology.core.api.SubDataPropertyOfAxiom;

import com.google.common.base.Preconditions;
import org.matonto.ontology.core.api.types.AxiomType;

public class SimpleSubDataPropertyOfAxiom 
	extends SimpleAxiom 
	implements SubDataPropertyOfAxiom {

	private DataPropertyExpression subProperty;
	private DataPropertyExpression superProperty;
	

	public SimpleSubDataPropertyOfAxiom(DataPropertyExpression subProperty, DataPropertyExpression superProperty, Set<Annotation> annotations) 
	{
		super(annotations);
		this.subProperty = Preconditions.checkNotNull(subProperty, "subProperty cannot be null");
		this.superProperty = Preconditions.checkNotNull(superProperty, "superProperty cannot be null");
	}

	
	@Override
	public SubDataPropertyOfAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleSubDataPropertyOfAxiom(subProperty, superProperty, NO_ANNOTATIONS);	
	}

	
	@Override
	public SubDataPropertyOfAxiom getAnnotatedAxiom(Set<Annotation> annotations) 
	{
		return new SimpleSubDataPropertyOfAxiom(subProperty, superProperty, mergeAnnos(annotations));
	}

	
	@Override
	public AxiomType getAxiomType()
	{
		return AxiomType.SUB_DATA_PROPERTY;
	}

	
	@Override
	public DataPropertyExpression getSubDataProperty() 
	{
		return subProperty;
	}

	
	@Override
	public DataPropertyExpression getSuperDataProperty() 
	{
		return superProperty;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (!super.equals(obj)) 
			return false;
		
		if (obj instanceof SubDataPropertyOfAxiom) {
			SubDataPropertyOfAxiom other = (SubDataPropertyOfAxiom)obj;			 
			return ((subProperty.equals(other.getSubDataProperty())) && (superProperty.equals(other.getSuperDataProperty())));
		}
		
		return false;
	}

}
