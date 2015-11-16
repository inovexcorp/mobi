package org.matonto.ontology.core.impl.owlapi;

import org.matonto.ontology.core.api.OClass;
import org.matonto.ontology.core.api.OntologyIRI;
import org.semanticweb.owlapi.model.IRI;
import org.semanticweb.owlapi.model.OWLClass;

import com.google.common.base.Preconditions;

import uk.ac.manchester.cs.owl.owlapi.OWLClassImpl;

public class SimpleClass implements OClass {

	private OntologyIRI iri;
	private final boolean isThing;
	private final boolean isNothing;
	private OWLClass owlClass;
	
	
	public SimpleClass(OntologyIRI iri)
	{
		this.iri = Preconditions.checkNotNull(iri, "iri cannot be null");
		owlClass = new OWLClassImpl(SimpleIRI.owlapiIRI(iri));
		isThing = owlClass.isOWLThing();
		isNothing = owlClass.isOWLNothing();
	}
	
	@Override
	public OntologyIRI getIRI() 
	{
		return iri;
	}

	
	public boolean isTopEntity()
	{
		return isThing;
	}
	
	
	public boolean isBottomEntity()
	{
		return isNothing;
	}
	
	
	public SimpleEntityType getEntityType()
	{
		return SimpleEntityType.CLASS;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (obj == this) {
			return true;
		}
		
		if(obj instanceof OClass) {
			OntologyIRI otherIri = ((OClass) obj).getIRI();
			return otherIri.equals(iri);
		}
		
		return false;
	}
	
	
	public static OClass matontoClass(OWLClass owlapiClass)
	{
		IRI owlapiIri = owlapiClass.getIRI();
		OntologyIRI matontoIri = SimpleIRI.matontoIRI(owlapiIri);
		return new SimpleClass(matontoIri);
	}
	
	
	public static OWLClass owlapiClass(OClass matontoClass)
	{
		OntologyIRI matontoIri = matontoClass.getIRI();
		IRI owlapiIri = SimpleIRI.owlapiIRI(matontoIri);
		return new OWLClassImpl(owlapiIri);
	}
	

}
