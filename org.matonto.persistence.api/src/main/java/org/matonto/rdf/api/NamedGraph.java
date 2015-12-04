package org.matonto.rdf.api;

public interface NamedGraph extends Model {

    boolean add(Resource subject, IRI predicate, Value object);

    boolean contains(Resource subject, IRI predicate, Value object);

    Model filter(Resource subject, IRI predicate, Value object);

    IRI getGraphIRI();

    boolean remove(Resource subject, IRI predicate, Value object);
}
