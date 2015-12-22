package org.matonto.ontology.core.impl.owlapi

import org.matonto.ontology.core.api.Ontology
import org.matonto.ontology.core.api.OntologyId
import org.matonto.ontology.core.utils.MatontoOntologyException
import org.matonto.ontology.utils.api.SesameTransformer
import org.matonto.rdf.api.Model
import org.matonto.rdf.api.ValueFactory
import org.matonto.repository.api.Repository
import org.matonto.repository.api.RepositoryManager
import org.matonto.repository.api.RepositoryConnection
import org.matonto.repository.config.RepositoryConfig
import spock.lang.Specification

class SimpleOntologyManagerSpec extends Specification {

    def repositoryManager = Mock(RepositoryManager)
    def repository = Mock(Repository)
    def connection = Mock(RepositoryConnection)
    def model = Mock(Model)
    def sesameTransformer = Mock(SesameTransformer)
    def factory = Mock(ValueFactory)
    def ontology = Mock(Ontology)
    def ontologyId = Mock(OntologyId)

    def "storeOntology throws an exception when ontology exists"() {
        setup:
        def manager = [
                ontologyExists: { o -> return true }
        ] as SimpleOntologyManager
        manager.setRepositoryManager(repositoryManager)
        manager.setValueFactory(factory)
        manager.setRepo(repository)

        when:
        manager.storeOntology(ontology)

        then:
        ontology.getOntologyId() >> ontologyId
        manager.ontologyExists(_) >> true
        thrown(MatontoOntologyException)
    }

    def "storeOntology stores an Ontology when ontology does not exist"() {
        setup:
        def manager = [
                ontologyExists: { o -> return false }
        ] as SimpleOntologyManager
        manager.setRepositoryManager(repositoryManager)
        manager.setValueFactory(factory)
        manager.setTransformer(sesameTransformer)
        manager.setRepo(repository)

        when:
        def result = manager.storeOntology(ontology)

        then:
        ontology.getOntologyId() >> ontologyId
        ontology.asModel(_) >> model
//        sesameTransformer.sesameResource(_) >> resource
        repository.getConnection() >> connection
        repository.getConfig() >> Mock(RepositoryConfig.class)
        result
    }

    // TODO: Test retrieveOntology

    // TODO: Test deleteOntology

    // TODO: Test createOntology

    // TODO: Test getOntologyRegistry

    // TODO: Test createOntologyId

    // TODO: Test createOntologyIri
}
