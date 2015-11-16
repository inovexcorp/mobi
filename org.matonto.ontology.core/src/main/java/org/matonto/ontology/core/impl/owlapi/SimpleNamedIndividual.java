package org.matonto.ontology.core.impl.owlapi;

import org.matonto.ontology.core.api.Datatype;
import org.matonto.ontology.core.api.NamedIndividual;
import org.matonto.ontology.core.api.OntologyIRI;
import org.semanticweb.owlapi.model.IRI;
import org.semanticweb.owlapi.model.OWLNamedIndividual;

import com.google.common.base.Preconditions;

import uk.ac.manchester.cs.owl.owlapi.OWLNamedIndividualImpl;

public class SimpleNamedIndividual implements NamedIndividual {

	private OntologyIRI iri;
	
	
	public SimpleNamedIndividual(OntologyIRI iri)
	{
		this.iri = Preconditions.checkNotNull(iri, "iri cannot be null");
	}
	
	@Override
	public OntologyIRI getIRI() 
	{
		return iri;
	}
	
	public SimpleEntityType getEntityType()
	{
		return SimpleEntityType.NAMED_INDIVIDUAL;
	}
	
	@Override
	public boolean equals(Object obj)
	{
		if(obj == this)
			return true;
		
		if(obj instanceof NamedIndividual) {
			NamedIndividual other = (NamedIndividual) obj;
			return iri.equals(other.getIRI());
		}
		
		return false;
	}
	
	
	public static NamedIndividual matontoNamedIndividual(OWLNamedIndividual owlapiIndividual)
	{
		IRI owlapiIri = ((OWLNamedIndividualImpl) owlapiIndividual).getIRI();
		OntologyIRI matontoIri = SimpleIRI.matontoIRI(owlapiIri);
		return new SimpleNamedIndividual(matontoIri);
	}
	
	
	public static OWLNamedIndividual owlapiNamedIndividual(NamedIndividual matontoIndividual)
	{
		OntologyIRI matontoIri = ((SimpleNamedIndividual) matontoIndividual).getIRI();
		IRI owlapiIri = SimpleIRI.owlapiIRI(matontoIri);
		return new OWLNamedIndividualImpl(owlapiIri);
	}

}
