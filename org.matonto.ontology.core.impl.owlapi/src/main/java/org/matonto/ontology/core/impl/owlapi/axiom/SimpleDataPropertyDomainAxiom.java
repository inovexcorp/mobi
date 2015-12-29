package org.matonto.ontology.core.impl.owlapi.axiom;

import java.util.Set;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.classexpression.ClassExpression;
import org.matonto.ontology.core.api.axiom.DataPropertyDomainAxiom;
import org.matonto.ontology.core.api.propertyexpression.DataPropertyExpression;
import org.matonto.ontology.core.api.types.AxiomType;


public class SimpleDataPropertyDomainAxiom 
	extends SimpleAxiom 
	implements DataPropertyDomainAxiom {

	
	public DataPropertyExpression property;
	public ClassExpression domain;
	
	
	public SimpleDataPropertyDomainAxiom(@Nonnull DataPropertyExpression property, @Nonnull ClassExpression domain, Set<Annotation> annotations) 
	{
		super(annotations);
		this.property = property;
		this.domain = domain;
	}

	
	@Override
	public DataPropertyDomainAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleDataPropertyDomainAxiom(property, domain, NO_ANNOTATIONS);	
	}
	

	@Override
	public DataPropertyDomainAxiom getAnnotatedAxiom(@Nonnull Set<Annotation> annotations) 
	{
		return new SimpleDataPropertyDomainAxiom(property, domain, mergeAnnos(annotations));
	}

	
	@Override
	public AxiomType getAxiomType()
	{
		return AxiomType.DATA_PROPERTY_DOMAIN;
	}

	
	@Override
	public DataPropertyExpression getDataProperty() 
	{
		return property;
	}

	
	@Override
	public ClassExpression getDomain() 
	{
		return domain;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (!super.equals(obj)) 
			return false;
		
		if (obj instanceof DataPropertyDomainAxiom) {
			DataPropertyDomainAxiom other = (DataPropertyDomainAxiom)obj;			 
			return ((property.equals(other.getDataProperty())) && (domain.equals(other.getDomain())));
		}
		
		return false;
	}

}
