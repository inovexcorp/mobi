package org.matonto.etl.service.delimited

import org.matonto.exception.MatOntoException
import org.matonto.etl.api.delimited.Mapping
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
    def mapping = Mock(Mapping)
    def mappingId = Mock(MappingId)

    def setup() {
        mapping.getId() >> mappingId
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
        manager.storeMapping(mapping)

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
        def result = manager.storeMapping(mapping)

        then:
        repository.getConnection() >> connection
        repository.getConfig() >> Mock(RepositoryConfig.class)
        result
    }
}
