package com.mobi.ontology.core.impl.owlapi.axiom;

/*-
 * #%L
 * com.mobi.ontology.core.impl.owlapi
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

import com.mobi.ontology.core.api.Annotation;
import com.mobi.ontology.core.api.types.AxiomType;
import com.mobi.ontology.core.api.Individual;
import com.mobi.ontology.core.api.axiom.SameIndividualAxiom;

import java.util.HashSet;
import java.util.Set;
import java.util.TreeSet;
import javax.annotation.Nonnull;


public class SimpleSameIndividualAxiom 
	extends SimpleAxiom 
	implements SameIndividualAxiom {

	
	private Set<Individual> individuals;
	
	
	public SimpleSameIndividualAxiom(@Nonnull Set<Individual> individuals, Set<Annotation> annotations)
	{
		super(annotations);
		this.individuals = new TreeSet<Individual>(individuals);
	}


	@Override
	public SameIndividualAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleSameIndividualAxiom(individuals, NO_ANNOTATIONS);	
	}

	
	@Override
	public SameIndividualAxiom getAnnotatedAxiom(@Nonnull Set<Annotation> annotations) 
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
