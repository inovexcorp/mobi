package org.matonto.rdf.core.impl.sesame

import org.matonto.rdf.api.Model
import spock.lang.Specification

class TreeModelFactorySpec extends Specification {

    def "Factory method returns a model"() {
        given:
        def factory = TreeModelFactory.getInstance()

        expect:
        factory.createModel() instanceof Model
        factory.createModel() instanceof TreeModel
    }
}
