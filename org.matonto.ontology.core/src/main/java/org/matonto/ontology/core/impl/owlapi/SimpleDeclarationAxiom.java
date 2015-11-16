package org.matonto.ontology.core.impl.owlapi;

import java.util.Collections;
import java.util.Set;

import org.matonto.ontology.core.api.DeclarationAxiom;
import org.matonto.ontology.core.api.Entity;
import org.semanticweb.owlapi.model.OWLDeclarationAxiom;

import com.google.common.base.Preconditions;

import org.matonto.ontology.core.api.Annotation;


public class SimpleDeclarationAxiom 
	extends SimpleAxiom
	implements DeclarationAxiom {

	private Entity entity;
	private Set<Annotation> NO_ANNOTATIONS = Collections.emptySet();
	private SimpleAxiomType axiomType;
	
	
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
	
	
	/*
	 * MUST Implement!!!
	 */
	public static DeclarationAxiom matonotoDeclarationAxiom(OWLDeclarationAxiom owlapiAxiom)
	{
		return null;
	}
	
	
	public static OWLDeclarationAxiom owlapiDeclarationAxiom(DeclarationAxiom matontoAxiom)
	{
		return null;
	}

}
