package com.mobi.repository.impl.sesame

/*-
 * #%L
 * com.mobi.repository.impl.sesame
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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

import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper
import org.eclipse.rdf4j.repository.sail.SailRepository
import org.eclipse.rdf4j.repository.RepositoryConnection
import org.eclipse.rdf4j.sail.memory.MemoryStore
import spock.lang.Specification
import spock.lang.TempDir

class SesameRepositoryWrapperSpec extends Specification {

    @TempDir
    public File tempDir;

    def memRepo = new MemoryRepositoryWrapper();
    def persistedMemRepo

    def "initialize() and shutdown() do not throw exceptions"() {
        when:
        memRepo.setDelegate(new SailRepository(new MemoryStore()))
        memRepo.initialize()
        memRepo.shutDown()

        then:
        notThrown(Exception)
    }

    def "isInitialized() returns true when initialized"() {
        setup:
        memRepo.setDelegate(new SailRepository(new MemoryStore()))
        memRepo.initialize()

        expect:
        memRepo.isInitialized()
    }

    def "getConnection() returns a RepositoryConnection Object"() {
        setup:
        memRepo.setDelegate(new SailRepository(new MemoryStore()))
        memRepo.initialize()
        def conn = memRepo.getConnection()

        expect:
        conn instanceof RepositoryConnection
    }

    def "getDataDir() returns an empty optional when not configured"() {
        setup:
        memRepo.setDelegate(new SailRepository(new MemoryStore()))
        memRepo.initialize()

        expect:
        memRepo.getDataDir() == null
    }

    def "getDataDir() returns a populated optional when configured"() {
        setup:
        persistedMemRepo = new MemoryRepositoryWrapper();
        persistedMemRepo.setDelegate(new SailRepository(new MemoryStore(tempDir)))

        expect:
        persistedMemRepo.getDataDir().exists()
    }
}
