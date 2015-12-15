package org.matonto.ontology.core.impl.owlapi.axiom;

import java.util.Collections;
import java.util.Set;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.axiom.DeclarationAxiom;
import org.matonto.ontology.core.api.Entity;
import org.matonto.ontology.core.api.types.AxiomType;
import org.matonto.ontology.core.api.Annotation;


public class SimpleDeclarationAxiom 
	extends SimpleAxiom
	implements DeclarationAxiom {

	private Entity entity;
	private Set<Annotation> NO_ANNOTATIONS = Collections.emptySet();
	private AxiomType axiomType = AxiomType.DECLARATION;
	
	
	public SimpleDeclarationAxiom(@Nonnull Entity entity, Set<Annotation> annotations) 
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
	
	
	public DeclarationAxiom getAnnotatedAxiom(@Nonnull Set<Annotation> annotations) 
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
