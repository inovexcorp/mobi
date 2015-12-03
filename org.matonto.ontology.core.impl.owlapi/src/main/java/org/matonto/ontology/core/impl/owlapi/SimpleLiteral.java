package org.matonto.ontology.core.impl.owlapi;

import org.matonto.ontology.core.api.AnonymousIndividual;
import org.matonto.ontology.core.api.datarange.Datatype;
import org.matonto.ontology.core.impl.owlapi.datarange.SimpleDatatype;
import org.matonto.ontology.core.api.Literal;
import org.matonto.ontology.core.api.OntologyIRI;
import org.semanticweb.owlapi.model.OWLLiteral;

import com.google.common.base.Optional;

import uk.ac.manchester.cs.owl.owlapi.OWLLiteralImpl;

public class SimpleLiteral implements Literal {

	private String literal;
	private String language;
	private Datatype datatype;

	public SimpleLiteral(String literal, String lang, Datatype datatype) 
	{
		this.literal = literal;
		this.language = lang;
		this.datatype = datatype;
	}
	
	
	@Override
	public String getLanguage()
	{
		return language;
	}

	
	@Override
	public String getLiteral() 
	{
		return literal;
	}
	
	@Override
	public Datatype getDatatype()
	{
		return datatype;
	}
	
	
	public static OWLLiteral owlapiLiteral(Literal literal)
	{
		return new OWLLiteralImpl(literal.getLiteral(), literal.getLanguage(), SimpleDatatype.owlapiDatatype(literal.getDatatype()));
	}
	
	
	public static Literal matontoLiteral(OWLLiteral owlLiteral)
	{
		return new SimpleLiteral(owlLiteral.getLiteral(), owlLiteral.getLang(), SimpleDatatype.matontoDatatype(owlLiteral.getDatatype()));
	}


	@Override
	public Optional<OntologyIRI> asIRI() 
	{
		return Optional.absent();
	}


	@Override
	public Optional<Literal> asLiteral() 
	{
		return Optional.of(this);
	}


	@Override
	public Optional<AnonymousIndividual> asAnonymousIndividual() 
	{
		return Optional.absent();
	}

	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) {
			return true;
		}
		
		if(obj instanceof Literal) {
			Literal other = (Literal) obj;
			return (literal.equals(other.getLiteral()) && (language.equals(other.getLanguage())) && (datatype.equals(other.getDatatype())));
		}
		
		return false;		
	}
	
	
	@Override
	public int hashCode()
	{
		return (literal.hashCode() + language.hashCode() + datatype.hashCode());
	}

}
