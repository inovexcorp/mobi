package org.matonto.rdf.core.impl.sesame

import org.matonto.rdf.api.NamedGraph
import spock.lang.Specification

class LinkedHashNamedGraphFactorySpec extends Specification {

    def "Factory method returns a NamedGraph"() {
        given:
        def factory = LinkedHashNamedGraphFactory.getInstance()

        expect:
        factory.createNamedGraph(new SimpleIRI("urn:test")) instanceof NamedGraph
        factory.createNamedGraph(new SimpleIRI("urn:test")).asModel() instanceof LinkedHashModel
    }
}
