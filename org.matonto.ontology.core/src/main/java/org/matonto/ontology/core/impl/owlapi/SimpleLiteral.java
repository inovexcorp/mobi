package org.matonto.ontology.core.impl.owlapi;

import org.matonto.ontology.core.api.Datatype;
import org.matonto.ontology.core.api.Literal;
import org.semanticweb.owlapi.model.OWLDatatype;
import org.semanticweb.owlapi.model.OWLLiteral;

import uk.ac.manchester.cs.owl.owlapi.OWLLiteralImpl;

public class SimpleLiteral implements Literal {

	private String literal;
	private String language;
	private OWLDatatype datatype;

	public SimpleLiteral(String literal, String lang, OWLDatatype datatype) 
	{
		this.literal = literal;
		this.language = lang;
		this.datatype = datatype;
	}
	
	
	public String getLanguage()
	{
		return language;
	}

	
	@Override
	public String getLiteral() 
	{
		return literal;
	}
	
	
	public OWLDatatype getDatatype()
	{
		return datatype;
	}
	
	
	public static OWLLiteral owlapiLiteral(SimpleLiteral simpleLiteral)
	{
		return new OWLLiteralImpl(simpleLiteral.getLiteral(), simpleLiteral.getLanguage(), simpleLiteral.getDatatype());
	}
	
	
	public static SimpleLiteral matontoLiteral(OWLLiteral owlLiteral)
	{
		return new SimpleLiteral(owlLiteral.getLiteral(), owlLiteral.getLang(), owlLiteral.getDatatype());
	}


}
