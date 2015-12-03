package org.matonto.ontology.core.api;

import java.util.Set;


public interface DifferentIndividualsAxiom extends AssertionAxiom {

	public boolean containsAnonymousIndividuals();
	
	public Set<Individual> getIndividuals();

}
