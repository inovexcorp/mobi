package org.matonto.etl.service.delimited

import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory
import org.matonto.rdf.core.utils.Values
import org.openrdf.rio.RDFFormat
import org.openrdf.rio.Rio
import org.springframework.core.io.ClassPathResource
import spock.lang.Specification
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
class SimpleMappingSpec extends Specification {

    def mf = LinkedHashModelFactory.getInstance();
    def vf = SimpleValueFactory.getInstance();
    def builder = new SimpleMappingId.Builder(vf);

    def model = Values.matontoModel(Rio.parse(new ClassPathResource("newestMapping.jsonld").getInputStream(), "",
            RDFFormat.JSONLD));
    def versionedModel = Values.matontoModel(Rio.parse(
            new ClassPathResource("newestVersionedMapping.jsonld").getInputStream(), "", RDFFormat.JSONLD));
    def mappingIRI = vf.createIRI("http://matonto.org/mappings/test");
    def versionIRI = vf.createIRI("http://matonto.org/mappings/test/1.0");

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