package org.matonto.ontology.core.impl.owlapi;

import org.matonto.ontology.core.api.NamedIndividual;
import org.matonto.ontology.core.api.types.EntityType;
import org.matonto.rdf.api.IRI;

import javax.annotation.Nonnull;


public class SimpleNamedIndividual
	implements NamedIndividual {

    private IRI iri;


    public SimpleNamedIndividual(@Nonnull IRI iri) {
        this.iri = iri;
    }


    @Override
    public IRI getIRI() {
        return iri;
    }


    @Override
    public EntityType getEntityType() {
        return EntityType.NAMED_INDIVIDUAL;
    }


    @Override
    public boolean equals(Object obj) {
        if (obj == this) {
            return true;
        }
        if (obj instanceof NamedIndividual) {
            NamedIndividual other = (NamedIndividual) obj;
            return iri.equals(other.getIRI());
        }

        return false;
    }


    @Override
    public boolean isNamed() {
        return true;
    }


    @Override
    public boolean isAnonymous() {
        return false;
    }

}
