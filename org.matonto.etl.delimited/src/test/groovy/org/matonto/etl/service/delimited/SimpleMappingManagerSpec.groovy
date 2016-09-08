/*-
 * #%L
 * org.matonto.etl.delimited
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
package org.matonto.etl.service.delimited

import org.matonto.etl.api.ontologies.delimited.Mapping
import org.matonto.exception.MatOntoException
import org.matonto.etl.api.delimited.MappingWrapper
import org.matonto.etl.api.delimited.MappingId
import org.matonto.rdf.api.Model
import org.matonto.rdf.api.ModelFactory
import org.matonto.rdf.api.ValueFactory
import org.matonto.repository.api.Repository
import org.matonto.repository.api.RepositoryConnection
import org.matonto.repository.config.RepositoryConfig
import spock.lang.Specification

class SimpleMappingManagerSpec extends Specification {

    def repository = Mock(Repository)
    def connection = Mock(RepositoryConnection)
    def model = Mock(Model)
    def vf = Mock(ValueFactory)
    def mf = Mock(ModelFactory)
    def mappingWrapper = Mock(MappingWrapper)
    def mappingId = Mock(MappingId)
    def mapping = Mock(Mapping)

    def setup() {
        mappingWrapper.getId() >> mappingId
        mappingWrapper.getMapping() >> mapping
        mappingWrapper.getClassMappings() >> []
        mappingWrapper.getModel() >> model

        mapping.getModel() >> model
    }

    def "storeMapping throws an exception when ontology exists"() {
        setup:
        def manager = [
                mappingExists: { o -> return true }
        ] as SimpleMappingManager
        manager.setValueFactory(vf)
        manager.setModelFactory(mf)
        manager.setRepository(repository)

        when:
        manager.storeMapping(mappingWrapper)

        then:
        thrown(MatOntoException)
    }

    def "storeMapping stores an Ontology when ontology does not exist"() {
        setup:
        def manager = [
                mappingExists: { o -> return false }
        ] as SimpleMappingManager
        manager.setValueFactory(vf)
        manager.setModelFactory(mf)
        manager.setRepository(repository)

        when:
        def result = manager.storeMapping(mappingWrapper)

        then:
        repository.getConnection() >> connection
        repository.getConfig() >> Mock(RepositoryConfig.class)
        result
    }
}
