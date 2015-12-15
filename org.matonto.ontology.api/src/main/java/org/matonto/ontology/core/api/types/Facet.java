package org.matonto.ontology.core.api.types;

import java.util.HashSet;
import java.util.Set;
import javax.annotation.Nonnull;

import org.matonto.ontology.core.api.OntologyIRI;
import org.matonto.ontology.core.api.OntologyManager;
import org.semanticweb.owlapi.vocab.Namespaces;
import com.google.common.base.Preconditions;


public enum Facet {
	LENGTH(Namespaces.XSD, "length", "length"),
	MIN_LENGTH(Namespaces.XSD, "minLength", "minLength"), 
	MAX_LENGTH(Namespaces.XSD, "maxLength", "maxLength"), 
	PATTERN(Namespaces.XSD, "pattern", "pattern"), 
	MIN_INCLUSIVE(Namespaces.XSD, "minInclusive", ">="), 
	MIN_EXCLUSIVE(Namespaces.XSD, "minExclusive", ">"), 
	MAX_INCLUSIVE(Namespaces.XSD, "maxInclusive", "<="), 
	MAX_EXCLUSIVE(Namespaces.XSD, "maxExclusive", "<"), 
	TOTAL_DIGITS(Namespaces.XSD, "totalDigits", "totalDigits"), 
	FRACTION_DIGITS(Namespaces.XSD, "fractionDigits", "fractionDigits"), 
	LANG_RANGE(Namespaces.RDF, "langRange", "langRange");
	
	private final OntologyIRI iri;
	private final String shortForm;	
	private final String symbolicForm;	
	private final String prefixedName;
	
	Facet(@Nonnull Namespaces ns, @Nonnull String shortForm, @Nonnull String symbolicForm) {
	    OntologyManager manager = null;
		iri = manager.createOntologyIRI(ns.toString(), shortForm);
		this.shortForm = shortForm;
		this.symbolicForm = symbolicForm;
		prefixedName = (ns.getPrefixName() + ':' + shortForm);
	}
	   
	public String getShortForm()
	{
		return shortForm;
	}

//	public OntologyIRI getOntologyIRI()
//	{
//		return iri;
//	}
	
	public String getSymbolicForm()
	{
		return symbolicForm;
	}
	
	public String getPrefixedName()
	{
		return prefixedName;
	}
	
	@Override
	public String toString()
	{
		return getShortForm();
	}

//	public static Set<OntologyIRI> getFacetIRIs()
//	{
//		Set<OntologyIRI> iris = new HashSet<OntologyIRI>();
//		for (Facet v : values()) {
//			iris.add(v.getOntologyIRI());
//		}
//		return iris;
//	}

	public static Set<String> getFacets()
	{
		Set<String> result = new HashSet<String>();
		for (Facet v : values()) {
			result.add(v.getSymbolicForm());
		}
		return result;
	}

//	public static Facet getFacet(OntologyIRI iri)
//	{
//		Preconditions.checkNotNull(iri, "iri cannot be null");
//		for (Facet vocabulary : values()) {
//			if (vocabulary.getOntologyIRI().equals(iri)) {
//				return vocabulary;
//			}
//		}
//		throw new IllegalArgumentException("Unknown facet: " + iri);
//	}
//
	public static Facet getFacetByShortName(String shortName)
	{
		Preconditions.checkNotNull(shortName);
		for (Facet vocabulary : values()) {
			if (vocabulary.getShortForm().equals(shortName)) {
				return vocabulary;
			}
		}
		return null;
	}

	public static Facet getFacetBySymbolicName(String symbolicName)
	{
		for (Facet vocabulary : values()) {
			if (vocabulary.getSymbolicForm().equals(symbolicName)) {
				return vocabulary;
			}
		}
		return null;
	}
}
