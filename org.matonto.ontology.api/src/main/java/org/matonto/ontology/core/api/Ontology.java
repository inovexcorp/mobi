package org.matonto.ontology.core.api;

import java.io.File;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URL;
import java.util.Set;

import org.matonto.ontology.core.api.axiom.Axiom;
import org.matonto.ontology.core.utils.MatontoOntologyException;
import org.openrdf.model.Model;

public interface Ontology {
	
	Model asModel() throws MatontoOntologyException;
	
	OutputStream asTurtle() throws MatontoOntologyException;
	
	OutputStream asRdfXml() throws MatontoOntologyException;
	
	OutputStream asOwlXml() throws MatontoOntologyException;
	
	OutputStream asJsonLD() throws MatontoOntologyException;
	
	OntologyId getOntologyId();
	
	Set<Annotation> getAnnotations();
	
	void setOntologyId(OntologyId ontologyId);
	
	void setAnnotations(Set<Annotation> annotations);
	
//	public Set<Axiom> getAxioms();
	
	void addAxiom(Axiom axiom);
	
	void addAxioms(Set<Axiom> axioms);
	
	void addAnnotation(Annotation annotation);
	
	void addAnnotations(Set<Annotation> annotations);
	
	void addDirectImport(OntologyIRI diIri);
	
	void addDirectImports(Set<OntologyIRI> diIris);
	
	Set<OntologyIRI> getDirectImportsDocuments();
	
	boolean importOntology(InputStream inputStream, OntologyId ontologyId) throws MatontoOntologyException;
	
	boolean importOntology(File file, OntologyId ontologyId) throws MatontoOntologyException;
	
	boolean importOntology(URL url, OntologyId ontologyId) throws MatontoOntologyException;
	
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
