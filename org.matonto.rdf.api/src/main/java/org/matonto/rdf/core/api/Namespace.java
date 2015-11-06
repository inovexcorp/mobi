package org.matonto.rdf.core.api;

/**
 * A namespace, consisting of a namespace name and a prefix that has been assigned to it.
 */
public interface Namespace {

    /**
     * Gets the name of the current namespace (i.e. its IRI).
     *
     * @return name of namespace
     */
    String getName();

    /**
     * Gets the prefix of the current namespace. The default namespace is represented by an empty prefix string.
     *
     * @return prefix of namespace, or an empty string in case of the default namespace
     */
    String getPrefix();
}
