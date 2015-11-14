package org.matonto.repository.impl.sesame

import org.openrdf.repository.sail.SailRepository
import org.openrdf.sail.memory.MemoryStore
import spock.lang.Specification

class SesameRepositoryWrapperSpec extends Specification {

    def "test"() {
        setup:
        def repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()))

        repo.initialize()
        repo.shutDown()

        expect:
        true == true
    }
}
