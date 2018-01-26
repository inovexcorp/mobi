/*-
 * #%L
 * com.mobi.etl.delimited
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
package com.mobi.etl.service.delimited

import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getRequiredOrmFactory
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getValueFactory
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.injectOrmFactoryReferencesIntoService

import com.mobi.catalog.api.CatalogManager
import com.mobi.etl.api.config.delimited.MappingRecordConfig
import com.mobi.etl.api.delimited.MappingId
import com.mobi.etl.api.delimited.MappingWrapper
import com.mobi.etl.api.ontologies.delimited.Mapping
import com.mobi.etl.api.ontologies.delimited.MappingRecord
import com.mobi.exception.MobiException
import com.mobi.jaas.api.ontologies.usermanagement.User
import com.mobi.ontologies.rdfs.Resource
import com.mobi.persistence.utils.api.SesameTransformer
import com.mobi.rdf.api.Model
import com.mobi.rdf.core.utils.Values
import org.openrdf.rio.RDFFormat
import org.openrdf.rio.Rio
import spock.lang.Specification

import java.nio.file.Paths

class SimpleMappingManagerSpec extends Specification {

    def service = new SimpleMappingManager()
    def vf = getValueFactory()
    def userFactory = getRequiredOrmFactory(User.class)
    def mappingRecordFactory = getRequiredOrmFactory(MappingRecord.class)
    def builder = new SimpleMappingId.Builder(vf)

    def catalogManager = Mock(CatalogManager)
    def model = Mock(Model)
    def mappingWrapper = Mock(MappingWrapper)
    def mappingId = Mock(MappingId)
    def mapping = Mock(Mapping)
    def transformer = Mock(SesameTransformer)

    def mappingIRI = vf.createIRI("http://test.com/mapping")
    def versionIRI = vf.createIRI("http://test.com/mapping/1.0")

    def setup() {
        injectOrmFactoryReferencesIntoService(service)
        service.setValueFactory(vf)
        service.setCatalogManager(catalogManager)
        service.setSesameTransformer(transformer)

        mappingWrapper.getId() >> mappingId
        mappingWrapper.getMapping() >> mapping
        mappingWrapper.getClassMappings() >> []
        mappingWrapper.getModel() >> model

        mapping.getModel() >> model

        mappingId.getMappingIdentifier() >> mappingIRI

        transformer.mobiModel(_) >> { args -> Values.mobiModel(args[0])}
    }

    def "Create a MappingRecord"() {
        setup:
        MappingRecord record = mappingRecordFactory.createNew(vf.createIRI("http://mobi.com/test/records#mapping-record"))
        catalogManager.createRecord(_, mappingRecordFactory) >> record
        def config = new MappingRecordConfig.MappingRecordBuilder("Title",
                Collections.singleton(userFactory.createNew(vf.createIRI("http://mobi.com/test/users#user")))).build()

        when:
        def result = service.createMappingRecord(config)

        then:
        result == record
    }

    def "Create a Mapping using a MappingId with an id"() {
        setup:
        def mappingId = builder.id(mappingIRI).build()
        def mapping = service.createMapping(mappingId)

        expect:
        mapping.getId() == mappingId
        mapping.getModel().contains(mappingIRI, vf.createIRI(Resource.type_IRI), vf.createIRI(Mapping.TYPE))
    }

    def "Create a Mapping using a MappingId with a mapping iri"() {
        setup:
        def mappingId = builder.mappingIRI(mappingIRI).build()
        def mapping = service.createMapping(mappingId)

        expect:
        mapping.getId() == mappingId
        mapping.getModel().contains(mappingIRI, vf.createIRI(Resource.type_IRI), vf.createIRI(Mapping.TYPE))
    }

    def "Create a Mapping using a MappingId with a version IRI"() {
        setup:
        SimpleMappingId mappingId = new SimpleMappingId.Builder(vf)
                .mappingIRI(mappingIRI)
                .versionIRI(versionIRI)
                .build()
        def mapping = service.createMapping(mappingId)

        expect:
        mapping.getId() == mappingId
        mapping.getModel().contains(mappingIRI, vf.createIRI(Resource.type_IRI), vf.createIRI(Mapping.TYPE))
        mapping.getModel().contains(mappingIRI, vf.createIRI(Mapping.versionIRI_IRI), versionIRI)
    }

    def "Create a Mapping using a valid File"() {
        setup:
        def mappingStream = getClass().getClassLoader().getResourceAsStream("newestMapping.ttl")
        def mappingFile = Paths.get(getClass().getClassLoader().getResource("newestMapping.ttl").toURI()).toFile()
        def versionedMappingStream = getClass().getClassLoader().getResourceAsStream("newestVersionedMapping.jsonld")
        def versionedMappingFile = Paths.get(getClass().getClassLoader().getResource("newestVersionedMapping.jsonld")
                .toURI()).toFile()

        def expectedModel = Values.mobiModel(Rio.parse(mappingStream, "", RDFFormat.TURTLE))
        def expectedVersionedModel = Values.mobiModel(Rio.parse(versionedMappingStream, "", RDFFormat.JSONLD))

        when:
        def actualMapping = service.createMapping(mappingFile)
        def actualVersionedMapping = service.createMapping(versionedMappingFile)

        then:
        actualMapping.getModel() == expectedModel
        actualVersionedMapping.getModel() == expectedVersionedModel
    }

    def "Create a Mapping using a valid InputStream"() {
        setup:
        def model = Values.mobiModel(Rio.parse(getClass().getClassLoader()
                .getResourceAsStream("newestMapping.ttl"), "", RDFFormat.TURTLE))
        def versionedModel = Values.mobiModel(Rio.parse(getClass().getClassLoader()
                .getResourceAsStream("newestVersionedMapping.jsonld"), "", RDFFormat.JSONLD))

        when:
        def mapping = service.createMapping(getClass().getClassLoader()
                .getResourceAsStream("newestMapping.ttl"), RDFFormat.TURTLE)
        def versionedMapping = service.createMapping(getClass().getClassLoader()
                .getResourceAsStream("newestVersionedMapping.jsonld"), RDFFormat.JSONLD)

        then:
        mapping.getModel() == model
        versionedMapping.getModel() == versionedModel
    }

    def "Create a Mapping using a valid JSON-LD String"() {
        setup:
        def mappingStream = getClass().getClassLoader().getResourceAsStream("newestMapping.jsonld")
        def mappingFile = Paths.get(getClass().getClassLoader().getResource("newestMapping.jsonld").toURI()).toFile()
        def versionedMappingStream = getClass().getClassLoader().getResourceAsStream("newestVersionedMapping.jsonld")
        def versionedMappingFile = Paths.get(getClass().getClassLoader().getResource("newestVersionedMapping.jsonld")
                .toURI()).toFile()

        def expectedModel = Values.mobiModel(Rio.parse(mappingStream, "", RDFFormat.JSONLD))
        def expectedVersionedModel = Values.mobiModel(Rio.parse(versionedMappingStream, "", RDFFormat.JSONLD))

        when:
        def actualMapping = service.createMapping(mappingFile.getText("UTF-8"))
        def actualVersionedMapping = service.createMapping(versionedMappingFile.getText("UTF-8"))

        then:
        actualMapping.getModel() == expectedModel
        actualVersionedMapping.getModel() == expectedVersionedModel
    }

    def "Throw an exception when Mapping is invalid"() {
        when:
        service.createMapping(getClass().getClassLoader()
                .getResourceAsStream("invalidMapping.ttl"), RDFFormat.TURTLE)

        then:
        thrown(MobiException)
    }
}
