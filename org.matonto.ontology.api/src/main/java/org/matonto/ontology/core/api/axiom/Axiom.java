package org.matonto.ontology.core.api.axiom;

import java.util.Set;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.OWLObject;
import org.matonto.ontology.core.api.types.AxiomType;


public interface Axiom extends OWLObject {

	Set<Annotation> getAnnotations();
	
	boolean isAnnotated();
	
	Axiom getAxiomWithoutAnnotations();
	
	Axiom getAnnotatedAxiom(@Nonnull Set<Annotation> annotations);
	
	AxiomType getAxiomType();
}
