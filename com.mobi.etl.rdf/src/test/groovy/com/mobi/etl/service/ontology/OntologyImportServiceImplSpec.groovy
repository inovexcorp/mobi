/*-
 * #%L
 * com.mobi.etl.rdf
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
package com.mobi.etl.service.ontology

import com.mobi.catalog.api.BranchManager
import com.mobi.catalog.api.CommitManager
import com.mobi.catalog.api.DifferenceManager
import com.mobi.catalog.api.builder.Difference
import com.mobi.catalog.api.ontologies.mcat.Branch
import com.mobi.catalog.api.versioning.VersioningManager
import com.mobi.catalog.config.CatalogConfigProvider
import com.mobi.jaas.api.ontologies.usermanagement.User
import com.mobi.ontologies.owl.Ontology
import com.mobi.ontologies.rdfs.Resource
import com.mobi.ontology.core.api.OntologyManager
import com.mobi.repository.api.OsgiRepository
import org.eclipse.rdf4j.model.IRI
import org.eclipse.rdf4j.model.impl.DynamicModelFactory
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory
import org.eclipse.rdf4j.repository.RepositoryConnection
import spock.lang.Specification

class OntologyImportServiceImplSpec extends Specification {

    def service = new OntologyImportServiceImpl()

    def vf = new ValidatingValueFactory()
    def mf = new DynamicModelFactory()
    def versioningManager = Mock(VersioningManager)
    def branchManager = Mock(BranchManager)
    def commitManager = Mock(CommitManager)
    def differenceManager = Mock(DifferenceManager)
    def ontologyManager = Mock(OntologyManager)
    def configProvider = Mock(CatalogConfigProvider)
    def connMock = Mock(RepositoryConnection)
    def repositoryMock = Mock(OsgiRepository)

    def ontologyIRI = Mock(IRI)
    def branch = Mock(Branch)
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
        service.versioningManager = versioningManager
        service.branchManager = branchManager
        service.commitManager = commitManager;
        service.differenceManager = differenceManager
        service.ontologyManager = ontologyManager
        service.configProvider = configProvider

        configProvider.getRepository() >> repositoryMock
        repositoryMock.getConnection() >> connMock
    }

    def "Service commits addition data"() {
        setup:
        def mappedData = mf.createEmptyModel()
        mappedData.addAll([stmt1, stmt2])
        def expectedCommit = mf.createEmptyModel()
        expectedCommit.addAll([stmt2])
        def returnModel = mf.createEmptyModel()
        returnModel.addAll([stmt1])
        ontologyManager.getOntologyModel(ontologyIRI, branchIRI) >> returnModel

        when:
        def committedData = service.importOntology(ontologyIRI, branchIRI, false, mappedData, user, "")

        then:
        committedData.getAdditions() as Set == expectedCommit as Set
        committedData.getDeletions() as Set == [] as Set
        1 * versioningManager.commit(_, ontologyIRI, branchIRI, user, "", connMock)
    }

    def "Service does not commit duplicate additions"() {
        setup:
        def mappedData = mf.createEmptyModel()
        mappedData.addAll([stmt1, stmt2])
        def expectedCommit = mf.createEmptyModel()
        def returnModel = mf.createEmptyModel()
        returnModel.addAll([stmt1, stmt2])
        ontologyManager.getOntologyModel(ontologyIRI, branchIRI) >> returnModel

        when:
        def committedData = service.importOntology(ontologyIRI, branchIRI, false, mappedData, user, "")

        then:
        committedData.getAdditions() as Set == expectedCommit as Set
        committedData.getDeletions() as Set == [] as Set
        0 * versioningManager.commit(*_)
    }

    def "Service commits addition data to master branch"() {
        setup:
        def mappedData = mf.createEmptyModel()
        mappedData.addAll([stmt1, stmt2])
        def expectedCommit = mf.createEmptyModel()
        expectedCommit.addAll([stmt2])
        branchManager.getMasterBranch(_, ontologyIRI, connMock) >> branch
        branch.getResource() >> branchIRI
        def returnModel = mf.createEmptyModel()
        returnModel.addAll([stmt1])
        ontologyManager.getOntologyModel(ontologyIRI, branchIRI) >> returnModel

        when:
        def committedData = service.importOntology(ontologyIRI, false, mappedData, user, "")

        then:
        committedData.getAdditions() as Set == expectedCommit as Set
        committedData.getDeletions() as Set == [] as Set
        1 * versioningManager.commit(_, ontologyIRI, branchIRI, user, "", connMock)
    }

    def "Service commits update data"() {
        setup:
        def mappedData = mf.createEmptyModel()
        mappedData.addAll([stmt1, stmt2])
        def existingData = mf.createEmptyModel()
        existingData.addAll([stmt1])
        def additions = mf.createEmptyModel()
        additions.addAll([stmt2])
        def deletions = mf.createEmptyModel()
        ontologyManager.getOntologyModel(ontologyIRI, branchIRI) >> existingData
        differenceManager.getDiff(existingData, mappedData) >> new Difference.Builder()
                .additions(additions)
                .deletions(deletions)
                .build()

        when:
        def committedData = service.importOntology(ontologyIRI, branchIRI, true, mappedData, user, "")

        then:
        committedData.getAdditions() as Set == additions as Set
        committedData.getDeletions() as Set == deletions as Set
        1 * versioningManager.commit(_, ontologyIRI, branchIRI, user, "", connMock)
    }

    def "Service does not commit duplicate updates"() {
        setup:
        def mappedData = mf.createEmptyModel()
        mappedData.addAll([stmt1, stmt2])
        def existingData = mf.createEmptyModel()
        existingData.addAll([stmt1, stmt2])
        def additions = mf.createEmptyModel()
        def deletions = mf.createEmptyModel()
        ontologyManager.getOntologyModel(ontologyIRI, branchIRI) >> existingData
        differenceManager.getDiff(existingData, mappedData) >> new Difference.Builder()
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
        def mappedData = mf.createEmptyModel()
        mappedData.addAll([stmt1, stmt2])
        def existingData = mf.createEmptyModel()
        existingData.addAll([stmt1, ontStmt1])
        def additions = mf.createEmptyModel()
        additions.addAll([stmt2])
        def deletions = mf.createEmptyModel()
        def testModel = mf.createEmptyModel()
        testModel.addAll([stmt1, stmt2, ontStmt1])
        ontologyManager.getOntologyModel(ontologyIRI, branchIRI) >> existingData
        differenceManager.getDiff(existingData, testModel) >> new Difference.Builder()
                .additions(additions)
                .deletions(deletions)
                .build()

        when:
        def committedData = service.importOntology(ontologyIRI, branchIRI, true, mappedData, user, "")

        then:
        committedData.getAdditions() as Set == additions as Set
        committedData.getDeletions() as Set == deletions as Set
        1 * versioningManager.commit(_, ontologyIRI, branchIRI, user, "", connMock)
    }

    def "Service commits update data with two ontology objects"() {
        setup:
        def mappedData = mf.createEmptyModel()
        mappedData.addAll([stmt1, stmt2])
        def existingData = mf.createEmptyModel()
        existingData.addAll([stmt1, ontStmt1, ontStmt2, stmt3])
        def additions = mf.createEmptyModel()
        additions.addAll([stmt2])
        def deletions = mf.createEmptyModel()
        deletions.addAll([stmt3])
        def testModel = mf.createEmptyModel()
        testModel.addAll([stmt1, stmt2, ontStmt1, ontStmt2])
        ontologyManager.getOntologyModel(ontologyIRI, branchIRI) >> existingData
        differenceManager.getDiff(existingData, testModel) >> new Difference.Builder()
                .additions(additions)
                .deletions(deletions)
                .build()

        when:
        def committedData = service.importOntology(ontologyIRI, branchIRI, true, mappedData, user, "")

        then:
        committedData.getAdditions() as Set == additions as Set
        committedData.getDeletions() as Set == deletions as Set
        1 * versioningManager.commit(_, ontologyIRI, branchIRI, user, "", connMock)
    }
}
