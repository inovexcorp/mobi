package org.matonto.rdf.api;

public interface BNode extends Resource {

    /**
     * Compares a blank node object to another object.
     *
     * @param object - The object to compare this blank node to.
     * @return true if the other object is an instance of BNode and their IDs are equal, false otherwise.
     */
    boolean equals(Object object);

    /**
     * Retrieves this blank node's identifier.
     *
     * @return - A blank node identifier.
     */
    String getID();

    /**
     * The hash code of a blank node is defined as the hash code of its identifier: id.hashCode().
     *
     * @return A hash code for the blank node.
     */
    int hashCode();
}
