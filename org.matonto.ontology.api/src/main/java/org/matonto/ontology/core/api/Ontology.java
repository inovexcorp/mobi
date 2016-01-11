package org.matonto.ontology.core.api;

import org.matonto.ontology.core.api.axiom.Axiom;
import org.matonto.ontology.core.api.classexpression.OClass;
import org.matonto.ontology.core.utils.MatontoOntologyException;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;

import java.io.OutputStream;
import java.util.Set;

public interface Ontology {
	
	Model asModel(ModelFactory factory) throws MatontoOntologyException;
	
	OutputStream asTurtle() throws MatontoOntologyException;
	
	OutputStream asRdfXml() throws MatontoOntologyException;
	
	OutputStream asOwlXml() throws MatontoOntologyException;
	
	OutputStream asJsonLD() throws MatontoOntologyException;
	
	OntologyId getOntologyId();
	
	/**
	 * Gets the ontology annotations, excluding annotations for other objects such as classes and entities
	 * 
	 * @return ontology annotations
	 */
	Set<Annotation> getOntologyAnnotations();
		
	/**
     * Gets all the annotations in the ontology, excluding ontology annotations, annotations for other objects such as classes 
     * and entities
     * 
     * @return ontology annotations
     */
	Set<Annotation> getAllAnnotations();
	
	Set<OClass> getAllClasses();

    Set<Axiom> getAxioms();

	/**
	 * Compares two SimpleOntology objects by their resource ids (ontologyId) and RDF model of the ontology objects, 
	 * and returns true if the resource ids are equal and their RDF models are isomorphic. 
	 * 
	 * Two models are considered isomorphic if for each of the graphs in one model, an isomorphic graph exists in the 
	 * other model, and the context identifiers of these graphs are either identical or (in the case of blank nodes) 
	 * map 1:1 on each other.  RDF graphs are isomorphic graphs if statements from one graphs can be mapped 1:1 on to 
	 * statements in the other graphs. In this mapping, blank nodes are not considered mapped when having an identical 
	 * internal id, but are mapped from one graph to the other by looking at the statements in which the blank nodes 
	 * occur.
     *
     * Note: Depending on the size of the models, this can be an expensive operation.
     *
     * @return true if the resource ids are equal and their RDF models are isomorphic.
	 */
	boolean equals(Object o);
	
	int hashCode();
}
