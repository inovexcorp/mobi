package org.matonto.ontology.core.impl.owlapi.axiom;

import java.util.Set;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.propertyexpression.DataPropertyExpression;
import org.matonto.ontology.core.api.axiom.DataPropertyRangeAxiom;
import org.matonto.ontology.core.api.datarange.DataRange;
import org.matonto.ontology.core.api.types.AxiomType;


public class SimpleDataPropertyRangeAxiom 
	extends SimpleAxiom 
	implements DataPropertyRangeAxiom {

	
	public DataPropertyExpression property;
	public DataRange range;
	
	
	public SimpleDataPropertyRangeAxiom(@Nonnull DataPropertyExpression property, @Nonnull DataRange range, Set<Annotation> annotations) 
	{
		super(annotations);
		this.property = property;
		this.range = range;
	}

	
	@Override
	public DataPropertyRangeAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleDataPropertyRangeAxiom(property, range, NO_ANNOTATIONS);	
	}
	

	@Override
	public DataPropertyRangeAxiom getAnnotatedAxiom(@Nonnull Set<Annotation> annotations) 
	{
		return new SimpleDataPropertyRangeAxiom(property, range, mergeAnnos(annotations));
	}

	
	@Override
	public AxiomType getAxiomType()
	{
		return AxiomType.DATA_PROPERTY_RANGE;
	}

	
	@Override
	public DataPropertyExpression getDataProperty() 
	{
		return property;
	}

	
	@Override
	public DataRange getRange() 
	{
		return range;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (!super.equals(obj)) 
			return false;
		
		if (obj instanceof DataPropertyRangeAxiom) {
			DataPropertyRangeAxiom other = (DataPropertyRangeAxiom)obj;			 
			return ((property.equals(other.getDataProperty())) && (range.equals(other.getRange())));
		}
		
		return false;
	}

}
