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
import org.matonto.ontology.core.impl.owlapi.Values;
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
	

}
