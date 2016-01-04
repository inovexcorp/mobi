package org.matonto.ontology.core.impl.owlapi.axiom;

import java.util.Set;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.propertyexpression.DataPropertyExpression;
import org.matonto.ontology.core.api.axiom.SubDataPropertyOfAxiom;
import org.matonto.ontology.core.api.types.AxiomType;


public class SimpleSubDataPropertyOfAxiom 
	extends SimpleAxiom 
	implements SubDataPropertyOfAxiom {

	private DataPropertyExpression subProperty;
	private DataPropertyExpression superProperty;
	

	public SimpleSubDataPropertyOfAxiom(@Nonnull DataPropertyExpression subProperty, @Nonnull DataPropertyExpression superProperty, Set<Annotation> annotations) 
	{
		super(annotations);
		this.subProperty = subProperty;
		this.superProperty = superProperty;
	}

	
	@Override
	public SubDataPropertyOfAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleSubDataPropertyOfAxiom(subProperty, superProperty, NO_ANNOTATIONS);	
	}

	
	@Override
	public SubDataPropertyOfAxiom getAnnotatedAxiom(@Nonnull Set<Annotation> annotations) 
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
