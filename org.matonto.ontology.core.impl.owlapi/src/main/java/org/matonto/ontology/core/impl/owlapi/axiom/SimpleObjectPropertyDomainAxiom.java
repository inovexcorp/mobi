package org.matonto.ontology.core.impl.owlapi.axiom;

import java.util.Set;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.classexpression.ClassExpression;
import org.matonto.ontology.core.api.axiom.ObjectPropertyDomainAxiom;
import org.matonto.ontology.core.api.propertyexpression.ObjectPropertyExpression;
import org.matonto.ontology.core.api.types.AxiomType;


public class SimpleObjectPropertyDomainAxiom 
	extends SimpleAxiom 
	implements ObjectPropertyDomainAxiom {

	
	private ObjectPropertyExpression objectProperty;
	private ClassExpression domain;
	
	
	public SimpleObjectPropertyDomainAxiom(@Nonnull ObjectPropertyExpression objectProperty, @Nonnull ClassExpression domain, Set<Annotation> annotations) 
	{
		super(annotations);
		this.objectProperty = objectProperty;
		this.domain = domain;
	}

	
	@Override
	public ObjectPropertyDomainAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleObjectPropertyDomainAxiom(objectProperty, domain, NO_ANNOTATIONS);	
	}

	
	@Override
	public ObjectPropertyDomainAxiom getAnnotatedAxiom(@Nonnull Set<Annotation> annotations) 
	{
		return new SimpleObjectPropertyDomainAxiom(objectProperty, domain, mergeAnnos(annotations));
	}


	@Override
	public AxiomType getAxiomType()
	{
		return AxiomType.OBJECT_PROPERTY_DOMAIN;
	}

	
	@Override
	public ObjectPropertyExpression getObjectProperty() 
	{
		return objectProperty;
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
		
		if (obj instanceof ObjectPropertyDomainAxiom) {
			ObjectPropertyDomainAxiom other = (ObjectPropertyDomainAxiom)obj;			 
			return ((objectProperty.equals(other.getObjectProperty())) && (domain.equals(other.getDomain())));
		}
		
		return false;
	}

}
