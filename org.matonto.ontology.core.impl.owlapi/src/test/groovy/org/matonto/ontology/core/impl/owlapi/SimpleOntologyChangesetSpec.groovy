package org.matonto.ontology.core.impl.owlapi

import org.matonto.ontology.core.api.Annotation
import org.matonto.ontology.core.api.Ontology
import org.matonto.ontology.core.impl.owlapi.change.SimpleOntologyAddition
import org.matonto.ontology.core.impl.owlapi.change.SimpleOntologyChangeset
import spock.lang.Specification

class SimpleOntologyChangesetSpec extends Specification {

    def "getOntology() returns the correct Ontology"() {
        setup:
        def ontology = Mock(Ontology)

        when:
        def changeset = new SimpleOntologyChangeset(ontology)

        then:
  //      1 * ontology.equals(ontology) >> true
        changeset.getOntology() == ontology
    }

    def "addChange() increments the changes count"() {
        setup:
        def ontology = Mock(Ontology)
        def annotation = Mock(Annotation)

        when:
        def change = new SimpleOntologyAddition<Annotation>(ontology, annotation)
        def changeset = new SimpleOntologyChangeset(ontology)
        changeset.addChange(change)

        then:
        changeset.getChanges().size() == 1
    }
}
