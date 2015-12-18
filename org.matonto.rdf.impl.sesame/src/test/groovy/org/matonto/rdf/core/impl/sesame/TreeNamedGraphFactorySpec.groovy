package org.matonto.rdf.core.impl.sesame

import org.matonto.rdf.api.NamedGraph
import spock.lang.Specification

class TreeNamedGraphFactorySpec extends Specification {

    def "Factory method returns a NamedGraph"() {
        given:
        def factory = TreeNamedGraphFactory.getInstance()

        expect:
        factory.createNamedGraph(new SimpleIRI("urn:test")) instanceof NamedGraph
        factory.createNamedGraph(new SimpleIRI("urn:test")).asModel() instanceof TreeModel
    }
}
