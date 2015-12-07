package org.matonto.rdf.core.impl.sesame

import org.matonto.rdf.api.Model
import spock.lang.Specification

class TreeModelFactorySpec extends Specification {

    def "Factory method returns a model"() {
        given:
        def factory = new TreeModelFactory()

        expect:
        factory.createEmptyModel() instanceof Model
        factory.createEmptyModel() instanceof TreeModel
    }
}
