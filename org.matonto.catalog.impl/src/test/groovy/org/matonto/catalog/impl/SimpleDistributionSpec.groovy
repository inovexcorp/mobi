package org.matonto.catalog.impl

import org.matonto.rdf.core.impl.sesame.SimpleValueFactory
import spock.lang.Specification


class SimpleDistributionSpec extends Specification {

    def distribution
    def vf = SimpleValueFactory.getInstance();


    def setup() {
        distribution = new SimpleDistribution.Builder(vf.createIRI("http://test.com/dist/1"), "Test Dist 1")
                .build()
    }

    def "test equals"() {
        given:
        def distribution2 = new SimpleDistribution.Builder(vf.createIRI("http://test.com/dist/1"), "Test Dist 1")
                .build()
        def distribution3 = new SimpleDistribution.Builder(vf.createIRI("http://test.com/dist/2"), "Test Dist 2")
                .build()

        expect:
        distribution == distribution2
        distribution != distribution3
    }
}