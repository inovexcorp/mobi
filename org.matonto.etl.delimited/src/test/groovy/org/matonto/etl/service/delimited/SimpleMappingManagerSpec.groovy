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

//    def "Create a Mapping using a MappingId with an id"() {
//        setup:
//        def mappingId = builder.id(mappingIRI).build();
//        def mapping = new SimpleMappingWrapper(mappingId, mf, vf);
//
//        expect:
//        mapping.getId().equals(mappingId);
//        mapping.asModel().contains(mappingIRI, vf.createIRI(Delimited.TYPE.stringValue()),
//                vf.createIRI(Delimited.MAPPING.stringValue()));
//    }
//
//    def "Create a Mapping using a MappingId without an id"() {
//        setup:
//        SimpleMappingId mappingId = builder.mappingIRI(mappingIRI).build();
//        SimpleMapping mapping = new SimpleMapping(mappingId, mf, vf);
//
//        expect:
//        mapping.getId().equals(mappingId);
//        mapping.asModel().contains(mappingIRI, vf.createIRI(Delimited.TYPE.stringValue()),
//                vf.createIRI(Delimited.MAPPING.stringValue()));
//    }
//
//    def "Create a Mapping using a MappingId with a version IRI"() {
//        setup:
//        SimpleMappingId mappingId = new SimpleMappingId.Builder(vf).mappingIRI(mappingIRI)
//                .versionIRI(versionIRI).build();
//        SimpleMapping mapping = new SimpleMapping(mappingId, mf, vf);
//
//        expect:
//        mapping.getId().equals(mappingId);
//        mapping.asModel().contains(mappingIRI, vf.createIRI(Delimited.VERSION.stringValue()), versionIRI);
//    }
//
//    def "Create a Mapping using a valid Model"() {
//        setup:
//        SimpleMapping mapping = new SimpleMapping(model, vf, mf);
//        SimpleMapping versionedMapping = new SimpleMapping(versionedModel, vf, mf);
//
//        expect:
//        mapping.asModel().equals(model);
//        mapping.getId().equals(new SimpleMappingId.Builder(vf).mappingIRI(mappingIRI).build());
//        versionedMapping.asModel().equals(versionedModel);
//        versionedMapping.getId().equals(new SimpleMappingId.Builder(vf).mappingIRI(mappingIRI).versionIRI(versionIRI)
//                .build());
//    }
//
//    def "Create a Mapping using a valid File"() {
//        setup:
//        SimpleMapping mapping = new SimpleMapping(new ClassPathResource("newestMapping.jsonld").getFile(), vf, mf);
//        SimpleMapping versionedMapping = new SimpleMapping(new ClassPathResource("newestVersionedMapping.jsonld")
//                .getFile(), vf, mf);
//
//        expect:
//        mapping.asModel().equals(model);
//        mapping.getId().equals(new SimpleMappingId.Builder(vf).mappingIRI(mappingIRI).build());
//        versionedMapping.asModel().equals(versionedModel);
//        versionedMapping.getId().equals(new SimpleMappingId.Builder(vf).mappingIRI(mappingIRI).versionIRI(versionIRI)
//                .build());
//    }
//
//    def "Create a Mapping using a valid InputStream"() {
//        setup:
//        SimpleMapping mapping = new SimpleMapping(new ClassPathResource("newestMapping.jsonld").getInputStream(),
//                RDFFormat.JSONLD, vf, mf);
//        SimpleMapping versionedMapping = new SimpleMapping(new ClassPathResource("newestVersionedMapping.jsonld")
//                .getInputStream(), RDFFormat.JSONLD, vf, mf);
//
//        expect:
//        mapping.asModel().equals(model);
//        mapping.getId().equals(new SimpleMappingId.Builder(vf).mappingIRI(mappingIRI).build());
//        versionedMapping.asModel().equals(versionedModel);
//        versionedMapping.getId().equals(new SimpleMappingId.Builder(vf).mappingIRI(mappingIRI).versionIRI(versionIRI)
//                .build());
//    }
//
//    def "Create a Mapping using a valid JSON-LD String"() {
//        setup:
//        SimpleMapping mapping = new SimpleMapping(new ClassPathResource("newestMapping.jsonld").getFile()
//                .getText("UTF-8"), vf, mf);
//        SimpleMapping versionedMapping = new SimpleMapping(new ClassPathResource("newestVersionedMapping.jsonld")
//                .getFile().getText("UTF-8"), vf, mf);
//
//        expect:
//        mapping.asModel().equals(model);
//        mapping.getId().equals(new SimpleMappingId.Builder(vf).mappingIRI(mappingIRI).build());
//        versionedMapping.asModel().equals(versionedModel);
//        versionedMapping.getId().equals(new SimpleMappingId.Builder(vf).mappingIRI(mappingIRI).versionIRI(versionIRI)
//                .build());
//    }
//
//    def "Throw an exception when Mapping is invalid"() {
//        when:
//        SimpleMapping mapping = new SimpleMapping(mf.createModel(), vf, mf);
//
//        then:
//        thrown(MatOntoException);
//    }
}
