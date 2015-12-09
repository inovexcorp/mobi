package org.matonto.ontology.core.api;

import org.openrdf.model.Resource;

import com.google.common.base.Optional;


public interface OntologyId {

	Optional<OntologyIRI> getOntologyIRI();
	
	Optional<OntologyIRI> getVersionIRI();

	/**
	 * The Resource that uniquely identifies this ontology. OWL2 Specifications state that an ontology
	 * <i>may</i> have an Ontology IRI, and, if present, <i>may</i> additionally have a Version IRI.
	 * The behavior of the ontology identifier is as follows:
	 *
	 * <ol>
	 *     <li>If a Version IRI is present, the ontology identifier will match the Version IRI</li>
	 *     <li>Else if an Ontology IRI is present, the ontology identifier will match the Ontology IRI</li>
     *     <li>Else if neither are present, the ontology identifier will be a system generated blank node</li>
	 * </ol>
	 *
	 * @return The Resource that represents the ontology identifier.
     */
	Resource getOntologyIdentifier();
}
