package org.matonto.catalog.impl

import spock.lang.Specification

import java.time.OffsetDateTime


class SimpleCatalogSpec extends Specification {

    def catalogBuilder = new SimpleCatalog.Builder("MatOnto Catalog")

    def "getTitle() returns title, and defaults are set for optionals"() {
        def catalog = catalogBuilder.build()

        expect:
        catalog.getTitle() == "MatOnto Catalog"
        catalog.getDescription() == ""
        catalog.getIssued() == catalog.getModified()
        catalog.getLicense() == ""
        catalog.getRights() == ""
    }

    def "getDescription() returns description"() {
        def catalog = catalogBuilder.description("This is a catalog").build()

        expect:
        catalog.getDescription() == "This is a catalog"
    }

    def "getIssued() returns issued"() {
        def now = OffsetDateTime.now()
        def catalog = catalogBuilder.issued(now).build()

        expect:
        catalog.getIssued() == now
    }

    def "getModified() returns modified"() {
        def now = OffsetDateTime.now()
        def catalog = catalogBuilder.modified(now).build()

        expect:
        catalog.getModified() == now
    }

    def "issued equals modified if not provided"() {
        def now = OffsetDateTime.now()
        def catalog = catalogBuilder.issued(now).build()

        expect:
        catalog.getIssued() == catalog.getModified()
    }

    def "modified is greater than or equal to issued if issued is not provided"() {
        def now = OffsetDateTime.now()
        sleep(1)
        def catalog = catalogBuilder.modified(now).build()

        expect:
        catalog.getIssued() <= catalog.getModified()
    }

    def "modified can be greater than issued"() {
        def now = OffsetDateTime.now()
        sleep(1)
        def then = OffsetDateTime.now()
        def catalog = catalogBuilder.issued(now).modified(then).build()

        expect:
        catalog.getIssued() < catalog.getModified()
    }

    def "modified cannot be less than issued"() {
        def now = OffsetDateTime.now()
        sleep(1)
        def then = OffsetDateTime.now()

        when:
        catalogBuilder.issued(then).modified(now).build()

        then:
        thrown(IllegalStateException)
    }

    def "issued cannot be greater than modified"() {
        def now = OffsetDateTime.now()
        sleep(1)
        def then = OffsetDateTime.now()

        when:
        catalogBuilder.modified(now).issued(then).build()

        then:
        thrown(IllegalStateException)
    }

    def "getLicense() returns license"() {
        def catalog = catalogBuilder.license("license").build()

        expect:
        catalog.getLicense() == "license"
    }

    def "getRights() returns rights"() {
        def catalog = catalogBuilder.rights("rights").build()

        expect:
        catalog.getRights() == "rights"
    }
}