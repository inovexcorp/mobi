package org.matonto.ontology.core.impl.owlapi;

import java.io.File;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;

import org.matonto.ontology.core.api.AnnotationValue;
import org.matonto.ontology.core.api.AnonymousIndividual;
import org.matonto.ontology.core.api.Literal;
import org.matonto.ontology.core.api.OntologyIRI;
import org.semanticweb.owlapi.io.XMLUtils;
import org.semanticweb.owlapi.model.IRI;

import com.google.common.base.Optional;

public class SimpleIRI implements OntologyIRI, AnnotationValue {

	private static String namespace;
	private static String localName;
	private static IRI iri;

	protected SimpleIRI(String ns, String ln) 
	{
		namespace = ns;
		localName = ln;
		iri = IRI.create(namespace, localName);
	}

	protected SimpleIRI(String str) 
	{
		this(XMLUtils.getNCNamePrefix(str), XMLUtils.getNCNameSuffix(str));
	}

	protected SimpleIRI(URI uri) 
	{
		this(uri.toString());
	}

	public static SimpleIRI create(String namespace, String localName) 
	{
		return new SimpleIRI(namespace, localName);
	}

	public static SimpleIRI create(File file) 
	{
		return new SimpleIRI(file.toURI());
	}

	public static SimpleIRI create(URI uri) 
	{
		return new SimpleIRI(uri);
	}

	public static SimpleIRI create(URL url) 
	{
		try {
			return new SimpleIRI(url.toURI());
		} catch (URISyntaxException e) {
			throw new RuntimeException(e);
		}
	}

	protected IRI getOwlapiIRI() {
		return iri;
	}

	public static IRI owlapiIRI(OntologyIRI matontoIri) 
	{
		if (matontoIri == null)
			return null;
		else
			return IRI.create(matontoIri.getNamespace(), matontoIri.getLocalName().orNull());
	}

	public static OntologyIRI matontoIRI(IRI owlIri) 
	{
		if (owlIri == null)
			return null;
		else {
			namespace = owlIri.getNamespace();
			if (owlIri.getRemainder().isPresent())
				localName = owlIri.getRemainder().get();
			return new SimpleIRI(namespace, localName);
		}

	}

	public String getNamespace() 
	{
		return namespace;
	}

	public Optional<String> getLocalName() 
	{
		if (localName.isEmpty())
			return Optional.absent();

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
		return Optional.absent();
	}

	@Override
	public Optional<AnonymousIndividual> asAnonymousIndividual() 
	{
		return Optional.absent();
	}

}
