package org.matonto.rdf.core.impl.sesame;

import org.matonto.rdf.core.api.BNode;

/**
 * An simple default implementation of the BNode interface.
 */
public class SimpleBNode extends org.openrdf.model.impl.SimpleBNode implements BNode {
    private static final long serialVersionUID = -3536371650881494322L;

    protected SimpleBNode() {
        super();
    }

    /**
     * Creates a new blank node with the supplied identifier.
     *
     * @param id - The identifier for this blank node, must not be null.
     */
    public SimpleBNode(String id) {
        super(id);
    }

    @Override
    public String toString() {
        return stringValue();
    }
}
