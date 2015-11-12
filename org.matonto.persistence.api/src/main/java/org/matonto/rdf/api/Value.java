package org.matonto.rdf.api;

import java.io.Serializable;

/**
 * The supertype of all RDF model objects (URIs, blank nodes and literals).
 */
public interface Value extends Serializable {

    /**
     * Returns the String-value of a Value object. This returns either a Literal's label, a IRI's URI or a BNode's ID.
     */
    String stringValue();
}
