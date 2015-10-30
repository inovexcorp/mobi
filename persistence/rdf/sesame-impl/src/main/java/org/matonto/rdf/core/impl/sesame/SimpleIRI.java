package org.matonto.rdf.core.impl.sesame;

import org.matonto.rdf.core.api.IRI;

public class SimpleIRI extends org.openrdf.model.impl.SimpleIRI implements IRI {
    private static final long serialVersionUID = 2569239388718344294L;

    protected SimpleIRI() {
    }

    /**
     * Creates a new IRI from the supplied string.
     *
     * Note that creating SimpleIRI objects directly via this constructor is not the recommended approach. Instead,
     * use a ValueFactory (obtained from your repository or by using SimpleValueFactory.getInstance()) to create new
     * IRI objects.
     *
     * @param iriString - A String representing a valid, absolute IRI. May not be null.
     * @throws IllegalArgumentException - If the supplied IRI is not a valid (absolute) IRI.
     */
    public SimpleIRI(String iriString) {
        super(iriString);
    }
}
