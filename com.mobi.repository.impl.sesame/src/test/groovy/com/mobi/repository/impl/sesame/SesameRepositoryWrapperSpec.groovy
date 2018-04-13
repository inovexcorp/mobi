package com.mobi.repository.impl.sesame

import com.mobi.repository.api.RepositoryConnection
import org.eclipse.rdf4j.repository.sail.SailRepository
import org.eclipse.rdf4j.sail.memory.MemoryStore
import org.junit.Rule
import org.junit.rules.TemporaryFolder
import spock.lang.Specification

class SesameRepositoryWrapperSpec extends Specification {

    @Rule
    public TemporaryFolder tempDir = new TemporaryFolder();

/*-
 * #%L
 * com.mobi.repository.impl.sesame
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

    def memRepo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()))
    def persistedMemRepo

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
