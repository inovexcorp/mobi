package org.matonto.ontology.core.impl.owlapi;

import java.util.Optional;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.AnonymousIndividual;
import org.matonto.ontology.core.api.Literal;
import org.matonto.ontology.core.api.OntologyIRI;
import org.semanticweb.owlapi.io.XMLUtils;
import org.semanticweb.owlapi.model.IRI;


public class SimpleIRI implements OntologyIRI {

	private static String namespace;
	private static String localName;
	private static IRI iri;

	public SimpleIRI(@Nonnull String ns, String ln) 
	{
		namespace = ns;
		localName = ln;
		iri = IRI.create(namespace, localName);
	}

	public SimpleIRI(@Nonnull String str) 
	{
		this(XMLUtils.getNCNamePrefix(str), XMLUtils.getNCNameSuffix(str));
	}

	protected IRI getOwlapiIRI() {
		return iri;
	}

	@Override
	public String getNamespace() 
	{
		return namespace;
	}
	
	@Override
	public Optional<String> getLocalName() 
	{
		if (localName.isEmpty())
			return Optional.empty();

		return Optional.of(localName);
	}

	@Override
	public Optional<OntologyIRI> asIRI() 
	{
		return Optional.of(this);
	}

	@Override
	public Optional<Literal> asLiteral() 
	{
		return Optional.empty();
	}

	@Override
	public Optional<AnonymousIndividual> asAnonymousIndividual() 
	{
		return Optional.empty();
	}
	
	@Override
	public boolean equals(Object obj)
	{
		if(obj == this)
			return true;
		
		if(obj instanceof SimpleIRI) {
			SimpleIRI other = (SimpleIRI) obj;
			return (localName.equals(other.getLocalName().get())) && (namespace.equals(other.getNamespace())) && (iri.equals(other.getOwlapiIRI()));
		}
		
		return false;
	}
	
	@Override
	public String toString()
	{
		return iri.toString();
	}

}
