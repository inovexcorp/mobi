package org.matonto.ontology.core.api.types;

import aQute.bnd.annotation.component.Reference;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.ValueFactory;

import javax.annotation.Nonnull;
import java.util.HashSet;
import java.util.Set;

public enum Facet {
    LENGTH("http://www.w3.org/2001/XMLSchema#", "xsd", "length", "length"),
    MIN_LENGTH("http://www.w3.org/2001/XMLSchema#", "xsd", "minLength", "minLength"),
    MAX_LENGTH("http://www.w3.org/2001/XMLSchema#", "xsd", "maxLength", "maxLength"),
    PATTERN("http://www.w3.org/2001/XMLSchema#", "xsd", "pattern", "pattern"),
    MIN_INCLUSIVE("http://www.w3.org/2001/XMLSchema#", "xsd", "minInclusive", ">="),
    MIN_EXCLUSIVE("http://www.w3.org/2001/XMLSchema#", "xsd", "minExclusive", ">"),
    MAX_INCLUSIVE("http://www.w3.org/2001/XMLSchema#", "xsd", "maxInclusive", "<="),
    MAX_EXCLUSIVE("http://www.w3.org/2001/XMLSchema#", "xsd", "maxExclusive", "<"),
    TOTAL_DIGITS("http://www.w3.org/2001/XMLSchema#", "xsd", "totalDigits", "totalDigits"),
    FRACTION_DIGITS("http://www.w3.org/2001/XMLSchema#", "xsd", "fractionDigits", "fractionDigits"),
    LANG_RANGE("http://www.w3.org/1999/02/22-rdf-syntax-ns#", "rdf", "langRange", "langRange");

    private final IRI iri;
    private final String shortForm;
    private final String symbolicForm;
    private final String prefixedName;
    private static ValueFactory factory;

    @Reference
    protected void setValueFactory(final ValueFactory vf)
    {
        factory = vf;
    }

    Facet(@Nonnull String ns, @Nonnull String nsPrefix,@Nonnull String shortForm, @Nonnull String symbolicForm)
    {
        iri = createIRI(ns.toString(), shortForm);
        this.shortForm = shortForm;
        this.symbolicForm = symbolicForm;
        prefixedName = (nsPrefix + ':' + shortForm);
    }

    private IRI createIRI(String namespace, String localName)
    {
        return factory.createIRI(namespace.toString(), localName);
    }

    public String getShortForm()
    {
        return shortForm;
    }

    public IRI getOntologyIRI()
    {
        return iri;
    }

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

    public static Set<IRI> getFacetIRIs()
    {
        Set<IRI> iris = new HashSet<IRI>();
        for (Facet v : values()) {
            iris.add(v.getOntologyIRI());
        }
        return iris;
    }

    public static Set<String> getFacets()
    {
        Set<String> result = new HashSet<String>();
        for (Facet v : values()) {
            result.add(v.getSymbolicForm());
        }
        return result;
    }

    public static Facet getFacet(@Nonnull IRI iri)
    {
        for (Facet vocabulary : values()) {
            if (vocabulary.getOntologyIRI().equals(iri)) {
                return vocabulary;
            }
        }
        throw new IllegalArgumentException("Unknown facet: " + iri);
    }

    public static Facet getFacetByShortName(@Nonnull String shortName)
    {
        for (Facet vocabulary : values()) {
            if (vocabulary.getShortForm().equals(shortName)) {
                return vocabulary;
            }
        }
        return null;
    }

    public static Facet getFacetBySymbolicName(@Nonnull String symbolicName)
    {
        for (Facet vocabulary : values()) {
            if (vocabulary.getSymbolicForm().equals(symbolicName)) {
                return vocabulary;
            }
        }
        return null;
    }
}
