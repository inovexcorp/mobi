package org.matonto.ontology.core.api;

import java.util.Set;


public interface SameIndividualAxiom extends AssertionAxiom {
	
	public boolean containsAnonymousIndividuals();
	
	public Set<Individual> getIndividuals();

}
