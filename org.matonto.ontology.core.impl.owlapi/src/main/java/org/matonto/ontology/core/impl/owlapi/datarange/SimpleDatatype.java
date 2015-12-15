package org.matonto.ontology.core.impl.owlapi.datarange;

import java.util.HashSet;
import java.util.Set;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.datarange.Datatype;
import org.matonto.ontology.core.api.OntologyIRI;
import org.matonto.ontology.core.api.types.DataRangeType;
import org.matonto.ontology.core.api.types.EntityType;
import org.matonto.ontology.core.impl.owlapi.Values;
import org.semanticweb.owlapi.model.IRI;
import org.semanticweb.owlapi.model.OWLDatatype;
import org.semanticweb.owlapi.vocab.OWL2Datatype;
import uk.ac.manchester.cs.owl.owlapi.OWLDatatypeImpl;


public class SimpleDatatype implements Datatype {
	
	private OntologyIRI iri;
	private OWLDatatype owlDatatype;
	private OWL2Datatype owl2Datatype;

	
	public SimpleDatatype(@Nonnull OntologyIRI iri)
	{
		this.iri = iri;
		IRI owlIri = Values.owlapiIRI(iri);
		owlDatatype = new OWLDatatypeImpl(owlIri);
		owl2Datatype = OWL2Datatype.getDatatype(owlIri);
	}
	
	
	@Override
	public boolean isString()
	{
		return owlDatatype.isString();
	}

	
	@Override
	public boolean isInteger() 
	{
		return owlDatatype.isInteger();
	}

	
	@Override
	public boolean isFloat() 	
	{
		return owlDatatype.isFloat();
	}

	
	@Override
	public boolean isDouble() 
	{
		return owlDatatype.isDouble();
	}

	
	@Override
	public boolean isBoolean() 
	{
		return owlDatatype.isBoolean();
	}

	
	@Override
	public boolean isRDFPlainLiteral() 
	{
		return owlDatatype.isRDFPlainLiteral();
	}
	
	
	@Override
	public OntologyIRI getIRI()
	{
		return iri;
	}
	
	
	@Override
	public EntityType getEntityType()
	{
		return EntityType.DATATYPE;
	}
	
	
	public static Set<OntologyIRI> getDatatypeIRIs()
	{
		Set<OntologyIRI> matontoIris = new HashSet<OntologyIRI>();
		Set<IRI> owlapiIris = OWL2Datatype.getDatatypeIRIs();
		for(IRI i : owlapiIris) {
			matontoIris.add(Values.matontoIRI(i));
		}
		
		return matontoIris;
	}
	
	
	public String getShortForm()
	{
		return owl2Datatype.getShortForm();
	}
	
	
	public String getPatternString()
	{
		return owl2Datatype.getPatternString();
	}
	
	
	public String getPrefixedName()
	{
		return owl2Datatype.getPrefixedName();
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if(obj == this)
			return true;
		
		if(obj instanceof Datatype) {
			Datatype other = (Datatype) obj;
			return iri.equals(other.getIRI());
		}
		
		return false;
	}
	
	
	@Override
	public int hashCode()
	{
		return owlDatatype.hashCode();
	}


	@Override
	public boolean isDatatype() 
	{
		return true;
	}


	@Override
	public DataRangeType getDataRangeType()
	{
		return DataRangeType.DATATYPE;
	}
	

}
