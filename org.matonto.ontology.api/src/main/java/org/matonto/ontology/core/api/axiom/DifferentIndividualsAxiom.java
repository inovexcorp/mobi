package org.matonto.ontology.core.api.axiom;

import org.matonto.ontology.core.api.Individual;
import org.matonto.ontology.core.api.axiom.AssertionAxiom;

import java.util.Set;


public interface DifferentIndividualsAxiom extends AssertionAxiom {

	public boolean containsAnonymousIndividuals();
	
	public Set<Individual> getIndividuals();

}
