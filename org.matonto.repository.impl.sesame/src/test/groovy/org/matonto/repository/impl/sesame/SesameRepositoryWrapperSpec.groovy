package org.matonto.repository.impl.sesame

import org.junit.Rule
import org.junit.rules.TemporaryFolder
import org.matonto.repository.api.RepositoryConnection
import org.openrdf.repository.sail.SailRepository
import org.openrdf.sail.memory.MemoryStore
import spock.lang.Specification

class SesameRepositoryWrapperSpec extends Specification {

    @Rule
    public TemporaryFolder tempDir = new TemporaryFolder();

    def memRepo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()))
    def persistedMemRepo

    def setup() {

    }

    def "initialize() and shutdown() do not throw exceptions"() {
        when:
        memRepo.initialize()
        memRepo.shutDown()

        then:
        notThrown(Exception)
    }

    def "isInitialized() returns false when not initialized"() {
        expect:
        !memRepo.isInitialized()
    }

    def "isInitialized() returns true when initialized"() {
        setup:
        memRepo.initialize()

        expect:
        memRepo.isInitialized()
    }

    def "getConnection() returns a RepositoryConnection Object"() {
        setup:
        memRepo.initialize()
        def conn = memRepo.getConnection()

        expect:
        conn instanceof RepositoryConnection
    }

    def "getDataDir() returns an empty optional when not configured"() {
        setup:
        memRepo.initialize()

        expect:
        memRepo.getDataDir() == Optional.empty()
    }

    def "getDataDir() returns a populated optional when configured"() {
        setup:
        persistedMemRepo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore(tempDir.newFolder("data"))))
        persistedMemRepo.initialize()

        expect:
        persistedMemRepo.getDataDir().isPresent()
    }
}
