package org.matonto.ontology.core.impl.owlapi.axiom;

import java.util.HashSet;
import java.util.Set;
import java.util.TreeSet;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.classexpression.ClassExpression;
import org.matonto.ontology.core.api.axiom.DisjointUnionAxiom;
import org.matonto.ontology.core.api.classexpression.OClass;
import org.matonto.ontology.core.api.types.AxiomType;


public class SimpleDisjointUnionAxiom 
	extends SimpleClassAxiom 
	implements DisjointUnionAxiom {

	
	private OClass owlClass;
	private Set<ClassExpression> expressions;
	
	
	public SimpleDisjointUnionAxiom(@Nonnull OClass owlClass, @Nonnull Set<ClassExpression> expressions, Set<Annotation> annotations) 
	{
		super(annotations);
		this.owlClass = owlClass;
		this.expressions = new TreeSet<ClassExpression>(expressions);
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
	public DisjointUnionAxiom getAnnotatedAxiom(@Nonnull Set<Annotation> annotations) 
	{
		return new SimpleDisjointUnionAxiom(owlClass, expressions, mergeAnnos(annotations));
	}

	
	@Override
	public AxiomType getAxiomType()
	{
		return AxiomType.DISJOINT_UNION;
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
