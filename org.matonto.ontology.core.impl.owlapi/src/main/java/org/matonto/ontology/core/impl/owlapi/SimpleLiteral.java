package org.matonto.ontology.core.impl.owlapi;

import java.util.Optional;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.AnonymousIndividual;
import org.matonto.ontology.core.api.datarange.Datatype;
import org.matonto.ontology.core.api.Literal;
import org.matonto.ontology.core.api.OntologyIRI;


public class SimpleLiteral implements Literal {

	private String literal;
	private String language;
	private Datatype datatype;

	public SimpleLiteral(@Nonnull String literal, String lang, @Nonnull Datatype datatype) 
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
	

	@Override
	public Optional<OntologyIRI> asIRI() 
	{
		return Optional.empty();
	}


	@Override
	public Optional<Literal> asLiteral() 
	{
		return Optional.of(this);
	}


	@Override
	public Optional<AnonymousIndividual> asAnonymousIndividual() 
	{
		return Optional.empty();
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
