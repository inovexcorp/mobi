package com.mobi.etl.service.ontology

import com.mobi.catalog.api.CatalogManager
import com.mobi.catalog.api.builder.Difference
import com.mobi.catalog.api.versioning.VersioningManager
import com.mobi.catalog.config.CatalogConfigProvider
import com.mobi.jaas.api.ontologies.usermanagement.User
import com.mobi.ontologies.owl.Ontology
import com.mobi.ontologies.rdfs.Resource
import com.mobi.ontology.core.api.OntologyManager
import com.mobi.rdf.api.IRI
import com.mobi.rdf.core.impl.sesame.LinkedHashModelFactory
import com.mobi.rdf.core.impl.sesame.SimpleValueFactory
import spock.lang.Specification

class OntologyImportServiceImplSpec extends Specification {

    def service = new OntologyImportServiceImpl()

    def vf = SimpleValueFactory.getInstance()
    def mf = LinkedHashModelFactory.getInstance()
    def versioningManager = Mock(VersioningManager)
    def catalogManager = Mock(CatalogManager)
    def ontologyManager = Mock(OntologyManager)
    def configProivder = Mock(CatalogConfigProvider)

    def ontologyIRI = Mock(IRI)
    def branchIRI = Mock(IRI)
    def user = Mock(User)

    def stmt1 = vf.createStatement(vf.createIRI("http://test.org/ontology-record-1"),
            vf.createIRI("http://test.org/property"), vf.createLiteral(true))
    def stmt2 = vf.createStatement(vf.createIRI("http://test.org/ontology-record-2"),
            vf.createIRI("http://test.org/property"), vf.createLiteral(true))
    def stmt3 = vf.createStatement(vf.createIRI("http://test.org/ontology-record-3"),
            vf.createIRI("http://test.org/property"), vf.createLiteral(true))
    def ontStmt1 = vf.createStatement(vf.createIRI("urn:ont1"), vf.createIRI(Resource.type_IRI),
            vf.createIRI(Ontology.TYPE))
    def ontStmt2 = vf.createStatement(vf.createIRI("urn:ont2"), vf.createIRI(Resource.type_IRI),
            vf.createIRI(Ontology.TYPE))

    def setup() {
        service.setValueFactory(vf)
        service.setModelFactory(mf)
        service.setVersioningManager(versioningManager)
        service.setCatalogManager(catalogManager)
        service.setOntologyManager(ontologyManager)
        service.setConfigProvider(configProivder)
    }

    def "Service commits addition data"() {
        setup:
        def mappedData = mf.createModel([stmt1, stmt2])
        def expectedCommit = mf.createModel([stmt2])
        ontologyManager.getOntologyModel(ontologyIRI, branchIRI) >> mf.createModel([stmt1])

        when:
        def committedData = service.importOntology(ontologyIRI, branchIRI, false, mappedData, user, "")

        then:
        committedData.getAdditions() as Set == expectedCommit as Set
        committedData.getDeletions() == null
        1 * versioningManager.commit(_, ontologyIRI, branchIRI, user, "", expectedCommit, null)
    }

    def "Service does not commit duplicate additions"() {
        setup:
        def mappedData = mf.createModel([stmt1, stmt2])
        def expectedCommit = mf.createModel()
        ontologyManager.getOntologyModel(ontologyIRI, branchIRI) >> mf.createModel([stmt1, stmt2])

        when:
        def committedData = service.importOntology(ontologyIRI, branchIRI, false, mappedData, user, "")

        then:
        committedData.getAdditions() as Set == expectedCommit as Set
        committedData.getDeletions() == null
        0 * versioningManager.commit(*_)
    }

    def "Service commits update data"() {
        setup:
        def mappedData = mf.createModel([stmt1, stmt2])
        def existingData = mf.createModel([stmt1])
        def additions = mf.createModel([stmt2])
        def deletions = mf.createModel()
        ontologyManager.getOntologyModel(ontologyIRI, branchIRI) >> existingData
        catalogManager.getDiff(existingData, mappedData) >> new Difference.Builder()
                .additions(additions)
                .deletions(deletions)
                .build()

        when:
        def committedData = service.importOntology(ontologyIRI, branchIRI, true, mappedData, user, "")

        then:
        committedData.getAdditions() as Set == additions as Set
        committedData.getDeletions() as Set == deletions as Set
        1 * versioningManager.commit(_, ontologyIRI, branchIRI, user, "", additions, deletions)
    }

    def "Service does not commit duplicate updates"() {
        setup:
        def mappedData = mf.createModel([stmt1, stmt2])
        def existingData = mf.createModel([stmt1, stmt2])
        def additions = mf.createModel()
        def deletions = mf.createModel()
        ontologyManager.getOntologyModel(ontologyIRI, branchIRI) >> existingData
        catalogManager.getDiff(existingData, mappedData) >> new Difference.Builder()
                .additions(additions)
                .deletions(deletions)
                .build()

        when:
        def committedData = service.importOntology(ontologyIRI, branchIRI, true, mappedData, user, "")

        then:
        committedData.getAdditions() as Set == additions as Set
        committedData.getDeletions() as Set == deletions as Set
        0 * versioningManager.commit(*_)
    }

    def "Service commits update data with one ontology object"() {
        setup:
        def mappedData = mf.createModel([stmt1, stmt2])
        def existingData = mf.createModel([stmt1, ontStmt1])
        def additions = mf.createModel([stmt2])
        def deletions = mf.createModel()
        ontologyManager.getOntologyModel(ontologyIRI, branchIRI) >> existingData
        catalogManager.getDiff(existingData, mf.createModel([stmt1, stmt2, ontStmt1])) >> new Difference.Builder()
                .additions(additions)
                .deletions(deletions)
                .build()

        when:
        def committedData = service.importOntology(ontologyIRI, branchIRI, true, mappedData, user, "")

        then:
        committedData.getAdditions() as Set == additions as Set
        committedData.getDeletions() as Set == deletions as Set
        1 * versioningManager.commit(_, ontologyIRI, branchIRI, user, "", additions, deletions)
    }

    def "Service commits update data with two ontology objects"() {
        setup:
        def mappedData = mf.createModel([stmt1, stmt2])
        def existingData = mf.createModel([stmt1, ontStmt1, ontStmt2, stmt3])
        def additions = mf.createModel([stmt2])
        def deletions = mf.createModel([stmt3])
        ontologyManager.getOntologyModel(ontologyIRI, branchIRI) >> existingData
        catalogManager.getDiff(existingData, mf.createModel([stmt1, stmt2, ontStmt1, ontStmt2])) >> new Difference.Builder()
                .additions(additions)
                .deletions(deletions)
                .build()

        when:
        def committedData = service.importOntology(ontologyIRI, branchIRI, true, mappedData, user, "")

        then:
        committedData.getAdditions() as Set == additions as Set
        committedData.getDeletions() as Set == deletions as Set
        1 * versioningManager.commit(_, ontologyIRI, branchIRI, user, "", additions, deletions)
    }
}
