package org.matonto.ontology.core.impl.owlapi;

import java.util.Set;

import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.ClassExpression;
import org.matonto.ontology.core.api.DataPropertyDomainAxiom;
import org.matonto.ontology.core.api.DataPropertyExpression;

import com.google.common.base.Preconditions;
import org.matonto.ontology.core.api.types.AxiomType;


public class SimpleDataPropertyDomainAxiom 
	extends SimpleAxiom 
	implements DataPropertyDomainAxiom {

	
	public DataPropertyExpression property;
	public ClassExpression domain;
	
	
	public SimpleDataPropertyDomainAxiom(DataPropertyExpression property, ClassExpression domain, Set<Annotation> annotations) 
	{
		super(annotations);
		this.property = Preconditions.checkNotNull(property, "property cannot be null");
		this.domain = Preconditions.checkNotNull(domain, "domain cannot be null");
	}

	
	@Override
	public DataPropertyDomainAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleDataPropertyDomainAxiom(property, domain, NO_ANNOTATIONS);	
	}
	

	@Override
	public DataPropertyDomainAxiom getAnnotatedAxiom(Set<Annotation> annotations) 
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
