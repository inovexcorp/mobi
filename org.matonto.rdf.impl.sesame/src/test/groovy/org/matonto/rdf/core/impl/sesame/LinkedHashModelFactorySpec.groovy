package org.matonto.rdf.core.impl.sesame

import org.matonto.rdf.api.Model
import spock.lang.Specification

class LinkedHashModelFactorySpec extends Specification {

    def "Factory method returns a model"() {
        given:
        def factory = LinkedHashModelFactory.getInstance()

        expect:
        factory.createModel() instanceof Model
        factory.createModel() instanceof LinkedHashModel
    }
}
