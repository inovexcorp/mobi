package org.matonto.ontology.core.impl.owlapi.axiom;

import java.util.Set;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.propertyexpression.AnnotationProperty;
import org.matonto.ontology.core.api.axiom.AnnotationPropertyDomainAxiom;
import org.matonto.ontology.core.api.types.AxiomType;
import org.matonto.rdf.api.IRI;


public class SimpleAnnotationPropertyDomainAxiom 
	extends SimpleAxiom 
	implements AnnotationPropertyDomainAxiom {

	
	private IRI domain;
	private AnnotationProperty property;
	
	
	public SimpleAnnotationPropertyDomainAxiom(IRI domain, @Nonnull AnnotationProperty property, Set<Annotation> annotations) 
	{
		super(annotations);
		this.domain = domain;
		this.property = property;
	}

	
	@Override
	public AnnotationPropertyDomainAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleAnnotationPropertyDomainAxiom(domain, property, NO_ANNOTATIONS);	
	}
	

	@Override
	public AnnotationPropertyDomainAxiom getAnnotatedAxiom(@Nonnull Set<Annotation> annotations) 
	{
		return new SimpleAnnotationPropertyDomainAxiom(domain, property, mergeAnnos(annotations));
	}

	
	@Override
	public AxiomType getAxiomType()
	{		
		return AxiomType.ANNOTATION_PROPERTY_DOMAIN;
	}

	
	@Override
	public IRI getDomain() 
	{
		return domain;
	}

	
	@Override
	public AnnotationProperty getProperty() 
	{		
		return property;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (!super.equals(obj)) 
			return false;
		
		if (obj instanceof AnnotationPropertyDomainAxiom) {
			AnnotationPropertyDomainAxiom other = (AnnotationPropertyDomainAxiom)obj;			 
			return ((domain.equals(other.getDomain())) && (property.equals(other.getProperty())));
		}
		
		return false;
	}

}
