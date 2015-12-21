package org.matonto.ontology.core.impl.owlapi

import org.matonto.ontology.core.api.Ontology
import org.matonto.ontology.core.api.OntologyId
import org.matonto.ontology.core.utils.MatontoOntologyException
import org.matonto.rdf.api.ValueFactory
import org.openrdf.model.Model
import org.openrdf.model.Resource
import org.openrdf.repository.Repository
import org.openrdf.repository.RepositoryConnection
import spock.lang.Specification

class SimpleOntologyManagerSpec extends Specification {

    def repository = Mock(Repository)
    def connection = Mock(RepositoryConnection)
    def model = Mock(Model)
    def sesameValues = Mock(SesameValues)
    def resource = Mock(Resource)
    def factory = Mock(ValueFactory)
    def ontology = Mock(Ontology)
    def ontologyId = Mock(OntologyId)

    def "storeOntology throws an exception when ontology exists"() {
        setup:
        def manager = [
                ontologyExists: { o -> return true }
        ] as SimpleOntologyManager
        manager.setRepo(repository)
        manager.setValueFactory(factory)

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
        manager.setRepo(repository)
        manager.setValueFactory(factory)

        when:
        def result = manager.storeOntology(ontology)

        then:
        ontology.getOntologyId() >> ontologyId
        ontology.asModel() >> model
        sesameValues.sesameResource(_) >> resource
        repository.getConnection() >> connection
        result
    }

    // TODO: Test retrieveOntology

    // TODO: Test deleteOntology

    // TODO: Test createOntology

    // TODO: Test getOntologyRegistry

    // TODO: Test createOntologyId

    // TODO: Test createOntologyIri
}
