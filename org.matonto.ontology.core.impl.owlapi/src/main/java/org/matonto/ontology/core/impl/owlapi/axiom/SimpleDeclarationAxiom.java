package org.matonto.ontology.core.impl.owlapi.axiom;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

import org.matonto.ontology.core.api.axiom.DeclarationAxiom;
import org.matonto.ontology.core.api.Entity;
import org.matonto.ontology.core.api.NamedIndividual;
import org.matonto.ontology.core.api.classexpression.OClass;
import org.matonto.ontology.core.api.propertyexpression.ObjectProperty;
import org.matonto.ontology.core.api.types.AxiomType;
import org.matonto.ontology.core.impl.owlapi.SimpleAnnotation;
import org.matonto.ontology.core.impl.owlapi.SimpleNamedIndividual;
import org.matonto.ontology.core.impl.owlapi.classexpression.SimpleClass;
import org.matonto.ontology.core.impl.owlapi.datarange.SimpleDatatype;
import org.matonto.ontology.core.impl.owlapi.propertyExpression.SimpleAnnotationProperty;
import org.matonto.ontology.core.impl.owlapi.propertyExpression.SimpleDataProperty;
import org.matonto.ontology.core.impl.owlapi.propertyExpression.SimpleObjectProperty;
import org.semanticweb.owlapi.model.OWLAnnotation;
import org.semanticweb.owlapi.model.OWLAnnotationProperty;
import org.semanticweb.owlapi.model.OWLClass;
import org.semanticweb.owlapi.model.OWLDataProperty;
import org.semanticweb.owlapi.model.OWLDatatype;
import org.semanticweb.owlapi.model.OWLDeclarationAxiom;
import org.semanticweb.owlapi.model.OWLEntity;
import org.semanticweb.owlapi.model.OWLNamedIndividual;
import org.semanticweb.owlapi.model.OWLObjectProperty;

import com.google.common.base.Preconditions;

import uk.ac.manchester.cs.owl.owlapi.OWLDeclarationAxiomImpl;

import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.propertyexpression.AnnotationProperty;
import org.matonto.ontology.core.api.propertyexpression.DataProperty;
import org.matonto.ontology.core.api.datarange.Datatype;


public class SimpleDeclarationAxiom 
	extends SimpleAxiom
	implements DeclarationAxiom {

	private Entity entity;
	private Set<Annotation> NO_ANNOTATIONS = Collections.emptySet();
	private AxiomType axiomType = AxiomType.DECLARATION;
	
	
	public SimpleDeclarationAxiom(Entity entity, Set<Annotation> annotations) 
	{
		super(annotations);
		this.entity = Preconditions.checkNotNull(entity, "entity cannot be null");
	}

	@Override
	public Entity getEntity() 
	{
		return entity;
	}

	@Override
	public DeclarationAxiom getAxiomWithoutAnnotations() 
	{
		if (!isAnnotated()) {
			return this;
		}
		return new SimpleDeclarationAxiom(getEntity(), NO_ANNOTATIONS);
	}
	
	
	public DeclarationAxiom getAnnotatedAxiom(Set<Annotation> annotations) 
	{
		return new SimpleDeclarationAxiom(getEntity(), mergeAnnos(annotations));
	}
	
	
	@Override
	public AxiomType getAxiomType()
	{
		return axiomType;
	}

		
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) {
		    return true;
		}
	
		if ((obj instanceof DeclarationAxiom)) {
			DeclarationAxiom other = (DeclarationAxiom)obj;
				if(getAnnotations().equals(other.getAnnotations())) {
					return getEntity().equals(other.getEntity());
				}
		}
		
		return false;
	}
	
	
	public static DeclarationAxiom matonotoDeclarationAxiom(OWLDeclarationAxiom owlapiAxiom)
	{
		OWLEntity owlapiEntity = owlapiAxiom.getEntity();
		Entity matontoEntity = null;
		switch(owlapiEntity.getEntityType().getName()) {
			case "Class":
				matontoEntity = SimpleClass.matontoClass((OWLClass) owlapiEntity);
			
			case "ObjectProperty":
				matontoEntity = SimpleObjectProperty.matontoObjectProperty((OWLObjectProperty) owlapiEntity);
				
			case "DataProperty":
				matontoEntity = SimpleDataProperty.matontoDataProperty((OWLDataProperty) owlapiEntity);
				
			case "AnnotationProperty":
				matontoEntity = SimpleAnnotationProperty.matontoAnnotationProperty((OWLAnnotationProperty) owlapiEntity);
				
			case "NamedIndividual":
				matontoEntity = SimpleNamedIndividual.matontoNamedIndividual((OWLNamedIndividual) owlapiEntity);
				
			case "Datatype":
				matontoEntity = SimpleDatatype.matontoDatatype((OWLDatatype) owlapiEntity);	
		}
		
		Set<OWLAnnotation> owlapiAnnotations = owlapiAxiom.getAnnotations();
		Set<Annotation> matontoAnnotations = new HashSet<Annotation>();
		for(OWLAnnotation owlapiAnnotation : owlapiAnnotations)
			matontoAnnotations.add(SimpleAnnotation.matontoAnnotation(owlapiAnnotation));
			
		return new SimpleDeclarationAxiom(matontoEntity, matontoAnnotations);
	}
	
	
	public static OWLDeclarationAxiom owlapiDeclarationAxiom(DeclarationAxiom matontoAxiom)
	{
		Entity matontoEntity = matontoAxiom.getEntity();
		OWLEntity owlapiEntity = null;
		switch(matontoEntity.getEntityType().getName()) {
			case "Class":
				owlapiEntity = SimpleClass.owlapiClass((OClass) matontoEntity);
			
			case "ObjectProperty":
				owlapiEntity = SimpleObjectProperty.owlapiObjectProperty((ObjectProperty) matontoEntity);
				
			case "DataProperty":
				owlapiEntity = SimpleDataProperty.owlapiDataProperty((DataProperty) matontoEntity);
				
			case "AnnotationProperty":
				owlapiEntity = SimpleAnnotationProperty.owlapiAnnotationProperty((AnnotationProperty) matontoEntity);
				
			case "NamedIndividual":
				owlapiEntity = SimpleNamedIndividual.owlapiNamedIndividual((NamedIndividual) matontoEntity);
				
			case "Datatype":
				owlapiEntity = SimpleDatatype.owlapiDatatype((Datatype) matontoEntity);	
		}
		
		Set<Annotation> matontoAnnotations = matontoAxiom.getAnnotations();
		Set<OWLAnnotation> owlapiAnnotations = new HashSet<OWLAnnotation>();
		for(Annotation matontoAnnotation : matontoAnnotations)
			owlapiAnnotations.add(SimpleAnnotation.owlapiAnnotation(matontoAnnotation));
			
		return new OWLDeclarationAxiomImpl(owlapiEntity, owlapiAnnotations);
	}

}
