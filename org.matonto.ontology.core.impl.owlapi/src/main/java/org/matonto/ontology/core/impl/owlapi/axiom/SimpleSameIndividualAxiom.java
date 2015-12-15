package org.matonto.ontology.core.impl.owlapi.axiom;

import java.util.HashSet;
import java.util.Set;
import java.util.TreeSet;

import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.Individual;
import org.matonto.ontology.core.api.axiom.SameIndividualAxiom;

import com.google.common.base.Preconditions;
import org.matonto.ontology.core.api.types.AxiomType;

public class SimpleSameIndividualAxiom 
	extends SimpleAxiom 
	implements SameIndividualAxiom {

	
	private Set<Individual> individuals;
	
	
	public SimpleSameIndividualAxiom(Set<Individual> individuals, Set<Annotation> annotations) 
	{
		super(annotations);
		this.individuals = new TreeSet<Individual>(Preconditions.checkNotNull(individuals, "individuals cannot be null"));
	}


	@Override
	public SameIndividualAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleSameIndividualAxiom(individuals, NO_ANNOTATIONS);	
	}

	
	@Override
	public SameIndividualAxiom getAnnotatedAxiom(Set<Annotation> annotations) 
	{
		return new SimpleSameIndividualAxiom(individuals, mergeAnnos(annotations));
	}

	
	@Override
	public AxiomType getAxiomType()
	{
		return AxiomType.SAME_INDIVIDUAL;
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
		
		if (obj instanceof SameIndividualAxiom) {
			SameIndividualAxiom other = (SameIndividualAxiom)obj;			 
			return individuals.equals(other.getIndividuals());
		}
		
		return false;
	}

}
