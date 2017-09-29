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

import org.matonto.catalog.api.CatalogManager
import org.matonto.catalog.api.ontologies.mcat.BranchFactory
import org.matonto.etl.api.config.delimited.MappingRecordConfig
import org.matonto.etl.api.delimited.MappingId
import org.matonto.etl.api.delimited.MappingWrapper
import org.matonto.etl.api.ontologies.delimited.*
import org.matonto.exception.MatOntoException
import org.matonto.jaas.api.ontologies.usermanagement.UserFactory
import org.matonto.ontologies.rdfs.Resource
import org.matonto.persistence.utils.api.SesameTransformer
import org.matonto.rdf.api.Model
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory
import org.matonto.rdf.core.utils.Values
import org.matonto.rdf.orm.conversion.impl.*
import org.openrdf.rio.RDFFormat
import org.openrdf.rio.Rio
import spock.lang.Specification

import java.nio.file.Paths

class SimpleMappingManagerSpec extends Specification {

    def service = new SimpleMappingManager()
    def vf = SimpleValueFactory.getInstance()
    def mf = LinkedHashModelFactory.getInstance()
    def vcr = new DefaultValueConverterRegistry()
    def userFactory = new UserFactory()
    def mappingRecordFactory = new MappingRecordFactory()
    def mappingFactory = new MappingFactory()
    def classMappingFactory = new ClassMappingFactory()
    def dataMappingFactory = new DataMappingFactory()
    def branchFactory = new BranchFactory()
    def propertyFactory = new PropertyFactory()
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
        userFactory.setValueFactory(vf)
        userFactory.setModelFactory(mf)
        userFactory.setValueConverterRegistry(vcr)
        vcr.registerValueConverter(userFactory)
        mappingRecordFactory.setValueFactory(vf)
        mappingRecordFactory.setModelFactory(mf)
        mappingRecordFactory.setValueConverterRegistry(vcr)
        vcr.registerValueConverter(mappingRecordFactory)
        mappingFactory.setValueFactory(vf)
        mappingFactory.setModelFactory(mf)
        mappingFactory.setValueConverterRegistry(vcr)
        vcr.registerValueConverter(mappingFactory)
        classMappingFactory.setValueFactory(vf)
        classMappingFactory.setModelFactory(mf)
        classMappingFactory.setValueConverterRegistry(vcr)
        vcr.registerValueConverter(classMappingFactory)
        dataMappingFactory.setValueFactory(vf)
        dataMappingFactory.setModelFactory(mf)
        dataMappingFactory.setValueConverterRegistry(vcr)
        vcr.registerValueConverter(dataMappingFactory)
        propertyFactory.setValueFactory(vf)
        propertyFactory.setModelFactory(mf)
        propertyFactory.setValueConverterRegistry(vcr)
        vcr.registerValueConverter(propertyFactory)
        branchFactory.setValueFactory(vf)
        branchFactory.setModelFactory(mf)
        branchFactory.setValueConverterRegistry(vcr)
        vcr.registerValueConverter(branchFactory)

        vcr.registerValueConverter(new ResourceValueConverter())
        vcr.registerValueConverter(new IRIValueConverter())
        vcr.registerValueConverter(new DoubleValueConverter())
        vcr.registerValueConverter(new IntegerValueConverter())
        vcr.registerValueConverter(new FloatValueConverter())
        vcr.registerValueConverter(new ShortValueConverter())
        vcr.registerValueConverter(new StringValueConverter())
        vcr.registerValueConverter(new ValueValueConverter())
        vcr.registerValueConverter(new LiteralValueConverter())

        service.setValueFactory(vf)
        service.setCatalogManager(catalogManager)
        service.setMappingRecordFactory(mappingRecordFactory)
        service.setMappingFactory(mappingFactory)
        service.setMappingFactory(mappingFactory)
        service.setClassMappingFactory(classMappingFactory)
        service.setBranchFactory(branchFactory)
        service.setSesameTransformer(transformer)

        mappingWrapper.getId() >> mappingId
        mappingWrapper.getMapping() >> mapping
        mappingWrapper.getClassMappings() >> []
        mappingWrapper.getModel() >> model

        mapping.getModel() >> model

        mappingId.getMappingIdentifier() >> mappingIRI

        transformer.matontoModel(_) >> { args -> Values.matontoModel(args[0])}
    }

    def "Create a MappingRecord"() {
        setup:
        MappingRecord record = mappingRecordFactory.createNew(vf.createIRI("http://matonto.org/test/records#mapping-record"))
        catalogManager.createRecord(_, mappingRecordFactory) >> record
        def config = new MappingRecordConfig.MappingRecordBuilder("Title",
                Collections.singleton(userFactory.createNew(vf.createIRI("http://matonto.org/test/users#user")))).build()

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

        def expectedModel = Values.matontoModel(Rio.parse(mappingStream, "", RDFFormat.TURTLE))
        def expectedVersionedModel = Values.matontoModel(Rio.parse(versionedMappingStream, "", RDFFormat.JSONLD))

        when:
        def actualMapping = service.createMapping(mappingFile)
        def actualVersionedMapping = service.createMapping(versionedMappingFile)

        then:
        actualMapping.getModel() == expectedModel
        actualVersionedMapping.getModel() == expectedVersionedModel
    }

    def "Create a Mapping using a valid InputStream"() {
        setup:
        def model = Values.matontoModel(Rio.parse(getClass().getClassLoader()
                .getResourceAsStream("newestMapping.ttl"), "", RDFFormat.TURTLE))
        def versionedModel = Values.matontoModel(Rio.parse(getClass().getClassLoader()
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

        def expectedModel = Values.matontoModel(Rio.parse(mappingStream, "", RDFFormat.JSONLD))
        def expectedVersionedModel = Values.matontoModel(Rio.parse(versionedMappingStream, "", RDFFormat.JSONLD))

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
        thrown(MatOntoException)
    }
}
