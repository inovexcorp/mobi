package org.matonto.ontology.core.impl.owlapi;

import java.util.Collections;
import java.util.Set;

import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.Axiom;
import org.matonto.ontology.core.api.ClassAxiom;

public class SimpleDisjointUnionAxiom 
	extends SimpleAxiom 
	implements ClassAxiom {

	
	private Set<Annotation> NO_ANNOTATIONS = Collections.emptySet();
	private SimpleAxiomType axiomType = SimpleAxiomType.DISJOINT_UNION;
	
	public SimpleDisjointUnionAxiom(Set<Annotation> annotations) 
	{
		super(annotations);
		// TODO Auto-generated constructor stub
	}

	@Override
	public Axiom getAxiomWithoutAnnotations() 
	{
		if (!isAnnotated()) {
			return this;
		}
		return new SimpleDisjointUnionAxiom(NO_ANNOTATIONS);
	}

	@Override
	public SimpleAxiomType getAxiomType() 
	{
		return axiomType;
	}

}
