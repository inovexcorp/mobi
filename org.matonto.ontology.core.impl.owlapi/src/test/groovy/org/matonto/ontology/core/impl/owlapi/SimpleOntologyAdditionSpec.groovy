package org.matonto.ontology.core.impl.owlapi

import org.matonto.ontology.core.api.Annotation
import org.matonto.ontology.core.api.Ontology
import org.matonto.ontology.core.impl.owlapi.change.SimpleOntologyAddition
import spock.lang.Specification

class SimpleOntologyAdditionSpec extends Specification {

    def "test"() {
        setup:
        def ontology = Mock(Ontology)
        def annotation = Mock(Annotation)

        when:
        def addition = new SimpleOntologyAddition<Annotation>(ontology, annotation)

        then:
        addition instanceof Annotation
    }
}
