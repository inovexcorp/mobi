package org.matonto.ontology.core.impl.owlapi;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.TreeSet;

import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.Axiom;
import org.matonto.ontology.core.api.ClassAxiom;
import org.matonto.ontology.core.api.ClassExpression;
import org.matonto.ontology.core.api.DisjointUnionAxiom;
import org.matonto.ontology.core.api.EquivalentClassesAxiom;
import org.matonto.ontology.core.api.OClass;

import com.google.common.base.Preconditions;

public class SimpleDisjointUnionAxiom 
	extends SimpleClassAxiom 
	implements DisjointUnionAxiom {

	
	private OClass owlClass;
	private Set<ClassExpression> expressions;
	
	
	public SimpleDisjointUnionAxiom(OClass owlClass, Set<ClassExpression> expressions, Set<Annotation> annotations) 
	{
		super(annotations);
		this.owlClass = Preconditions.checkNotNull(owlClass, "oClass cannot be null");
		this.expressions = new TreeSet<ClassExpression>(Preconditions.checkNotNull(expressions, "expressions cannot be null"));
	}

	
	@Override
	public Set<ClassExpression> getClassExpressions() 
	{
		return new HashSet<ClassExpression>(expressions);
	}
	
	
	@Override
	public OClass getOWLClass() 
	{
		return owlClass;
	}
	
	
	@Override
	public DisjointUnionAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleDisjointUnionAxiom(owlClass, expressions, NO_ANNOTATIONS);	
	}
	
	
	@Override
	public DisjointUnionAxiom getAnnotatedAxiom(Set<Annotation> annotations) 
	{
		return new SimpleDisjointUnionAxiom(owlClass, expressions, mergeAnnos(annotations));
	}

	
	@Override
	public SimpleAxiomType getAxiomType() 
	{
		return SimpleAxiomType.DISJOINT_UNION;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (!super.equals(obj)) 
			return false;
		
		if (obj instanceof DisjointUnionAxiom) {
			DisjointUnionAxiom other = (DisjointUnionAxiom)obj;			 
			return ((expressions.equals(other.getClassExpressions())) && (owlClass.equals(other.getOWLClass())));
		}
		
		return false;
	}



}
