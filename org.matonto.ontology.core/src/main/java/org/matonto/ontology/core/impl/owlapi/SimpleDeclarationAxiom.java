package org.matonto.ontology.core.impl.owlapi;

import java.util.Collections;
import java.util.List;

import org.matonto.ontology.core.api.DeclarationAxiom;
import org.matonto.ontology.core.api.Entity;
import org.matonto.ontology.core.api.Annotation;


public class SimpleDeclarationAxiom 
	extends SimpleAxiom
	implements DeclarationAxiom {

	private Entity entity;
	private List<Annotation> NO_ANNOTATIONS = Collections.emptyList();
	
	public SimpleDeclarationAxiom(List<Annotation> annotations) 
	{
		super(annotations);
	}
	
	public SimpleDeclarationAxiom(Entity entity, List<Annotation> annotations) 
	{
		super(annotations);
		this.entity = entity;
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
	
	public DeclarationAxiom getAnnotatedAxiom(List<Annotation> annotations) 
	{
		return new SimpleDeclarationAxiom(getEntity(), mergeAnnos(annotations));
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) {
		    return true;
		}
	
		if ((obj instanceof SimpleDeclarationAxiom)) {
			SimpleDeclarationAxiom other = (SimpleDeclarationAxiom)obj;
				if(this.getAnnotations().equals(other.getAnnotations())) {
					return this.getEntity().equals(other.getEntity());
				}
		}
		
		return false;
	}
	


}
