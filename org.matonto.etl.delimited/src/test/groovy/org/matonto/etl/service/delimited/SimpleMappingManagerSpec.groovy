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

import org.matonto.etl.api.delimited.MappingId
import org.matonto.etl.api.delimited.MappingWrapper
import org.matonto.etl.api.ontologies.delimited.*
import org.matonto.exception.MatOntoException
import org.matonto.ontologies.rdfs.Resource
import org.matonto.ontology.utils.api.SesameTransformer
import org.matonto.rdf.api.Model
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory
import org.matonto.rdf.core.utils.Values
import org.matonto.rdf.orm.conversion.impl.*
import org.matonto.rdf.orm.impl.ThingFactory
import org.matonto.repository.api.Repository
import org.matonto.repository.api.RepositoryConnection
import org.matonto.repository.config.RepositoryConfig
import org.matonto.vocabularies.xsd.XSD
import org.openrdf.rio.RDFFormat
import org.openrdf.rio.Rio
import spock.lang.Specification

import java.nio.file.Paths

class SimpleMappingManagerSpec extends Specification {

    def repository = Mock(Repository)
    def connection = Mock(RepositoryConnection)
    def model = Mock(Model)
    def vf = SimpleValueFactory.getInstance()
    def mf = LinkedHashModelFactory.getInstance()
    def mappingWrapper = Mock(MappingWrapper)
    def mappingId = Mock(MappingId)
    def mapping = Mock(Mapping)
    def service = new SimpleMappingManager()
    def vcr = new DefaultValueConverterRegistry()
    def mappingFactory = new MappingFactory()
    def classMappingFactory = new ClassMappingFactory()
    def dataMappingFactory = new DataMappingFactory()
    def propertyFactory = new PropertyFactory()
    def objectFactory = new ObjectMappingFactory()
    def thingFactory = new ThingFactory()
    def builder = new SimpleMappingId.Builder(vf)
    def mappingIRI = vf.createIRI("http://test.com/mapping")
    def versionIRI = vf.createIRI("http://test.com/mapping/1.0")
    def transformer = Mock(SesameTransformer)

    def setup() {
        mappingFactory.setValueFactory(vf)
        mappingFactory.setModelFactory(mf)
        mappingFactory.setValueConverterRegistry(vcr)
        classMappingFactory.setValueFactory(vf)
        classMappingFactory.setModelFactory(mf)
        classMappingFactory.setValueConverterRegistry(vcr);
        dataMappingFactory.setValueFactory(vf)
        dataMappingFactory.setValueConverterRegistry(vcr)
        propertyFactory.setValueFactory(vf)
        propertyFactory.setValueConverterRegistry(vcr)
        objectFactory.setValueFactory(vf)
        objectFactory.setValueConverterRegistry(vcr)
        thingFactory.setValueFactory(vf)
        thingFactory.setValueConverterRegistry(vcr)

        vcr.registerValueConverter(classMappingFactory)
        vcr.registerValueConverter(dataMappingFactory)
        vcr.registerValueConverter(propertyFactory)
        vcr.registerValueConverter(objectFactory)
        vcr.registerValueConverter(thingFactory)
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
        service.setRepository(repository)
        service.setModelFactory(mf)
        service.setMappingFactory(mappingFactory)
        service.setClassMappingFactory(classMappingFactory)
        service.setSesameTransformer(transformer)

        mappingWrapper.getId() >> mappingId
        mappingWrapper.getMapping() >> mapping
        mappingWrapper.getClassMappings() >> []
        mappingWrapper.getModel() >> model

        mapping.getModel() >> model

        transformer.matontoModel(_) >> { args -> Values.matontoModel(args[0])}
    }

    def "storeMapping throws an exception when mapping exists"() {
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

    def "storeMapping stores a Mapping when mapping does not exist"() {
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

    def "Create a Mapping using a MappingId with an id"() {
        setup:
        def mappingId = builder.id(mappingIRI).build();
        def mapping = service.createMapping(mappingId)

        expect:
        mapping.getId() == mappingId;
        mapping.getModel().contains(mappingIRI, vf.createIRI(Resource.type_IRI), vf.createIRI(Mapping.TYPE));
    }

    def "Create a Mapping using a MappingId with a mapping iri"() {
        setup:
        def mappingId = builder.mappingIRI(mappingIRI).build();
        def mapping = service.createMapping(mappingId)

        expect:
        mapping.getId() == mappingId;
        mapping.getModel().contains(mappingIRI, vf.createIRI(Resource.type_IRI), vf.createIRI(Mapping.TYPE));
    }

    def "Create a Mapping using a MappingId with a version IRI"() {
        setup:
        SimpleMappingId mappingId = new SimpleMappingId.Builder(vf)
                .mappingIRI(mappingIRI)
                .versionIRI(versionIRI)
                .build();
        def mapping = service.createMapping(mappingId)

        expect:
        mapping.getId() == mappingId;
        mapping.getModel().contains(mappingIRI, vf.createIRI(Resource.type_IRI), vf.createIRI(Mapping.TYPE));
        mapping.getModel().contains(mappingIRI, vf.createIRI(Mapping.versionIRI_IRI), versionIRI);
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
        actualMapping.getModel() == expectedModel;
        actualVersionedMapping.getModel() == expectedVersionedModel;
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
        mapping.getModel() == model;
        versionedMapping.getModel() == versionedModel;
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
        actualMapping.getModel() == expectedModel;
        actualVersionedMapping.getModel() == expectedVersionedModel;
    }

    def "Throw an exception when Mapping is invalid"() {
        when:
        service.createMapping(getClass().getClassLoader()
                .getResourceAsStream("testInvalidMapping.ttl"), RDFFormat.TURTLE)

        then:
        thrown(MatOntoException);
    }
}
