package org.matonto.ontology.core.impl.owlapi;

import java.util.HashSet;
import java.util.Set;
import java.util.TreeSet;

import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.Individual;
import org.matonto.ontology.core.api.axiom.DifferentIndividualsAxiom;

import com.google.common.base.Preconditions;
import org.matonto.ontology.core.api.types.AxiomType;

public class SimpleDifferentIndividualsAxiom 
	extends SimpleAxiom 
	implements DifferentIndividualsAxiom {

	
	private Set<Individual> individuals;
	
	
	public SimpleDifferentIndividualsAxiom(Set<Individual> individuals, Set<Annotation> annotations) 
	{
		super(annotations);
		this.individuals = new TreeSet<Individual>(Preconditions.checkNotNull(individuals, "individuals cannot be null"));
	}


	@Override
	public DifferentIndividualsAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleDifferentIndividualsAxiom(individuals, NO_ANNOTATIONS);	
	}

	
	@Override
	public DifferentIndividualsAxiom getAnnotatedAxiom(Set<Annotation> annotations) 
	{
		return new SimpleDifferentIndividualsAxiom(individuals, mergeAnnos(annotations));
	}

	
	@Override
	public AxiomType getAxiomType()
	{
		return AxiomType.DIFFERENT_INDIVIDUALS;
	}

	
	@Override
	public boolean containsAnonymousIndividuals() 
	{
		for(Individual ind : individuals) {
			if(ind.isAnonymous())
				return true;
		}
		return false;
	}


	@Override
	public Set<Individual> getIndividuals() 
	{
		return new HashSet<Individual>(individuals);
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (!super.equals(obj)) 
			return false;
		
		if (obj instanceof DifferentIndividualsAxiom) {
			DifferentIndividualsAxiom other = (DifferentIndividualsAxiom)obj;			 
			return individuals.equals(other.getIndividuals());
		}
		
		return false;
	}

}
