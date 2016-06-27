package org.matonto.etl.service.delimited

import org.matonto.exception.MatOntoException
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory
import org.springframework.core.io.ClassPathResource
import spock.lang.Specification;
import org.matonto.rdf.core.utils.Values;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;

class SimpleMappingSpec extends Specification {

    def mf = LinkedHashModelFactory.getInstance();
    def vf = SimpleValueFactory.getInstance();

    def model = Values.matontoModel(Rio.parse(new ClassPathResource("newestMapping.jsonld").getInputStream(), "",
            RDFFormat.JSONLD));
    def versionedModel = Values.matontoModel(Rio.parse(
            new ClassPathResource("newestVersionedMapping.jsonld").getInputStream(), "", RDFFormat.JSONLD));
    def mappingIRI = vf.createIRI("http://matonto.org/mappings/test");
    def versionIRI = vf.createIRI("http://matonto.org/mappings/test/1.0");

    def "Create a Mapping using a MappingId with an id"() {
        setup:
        SimpleMappingId mappingId = new SimpleMappingId.Builder(vf).id(mappingIRI).build();
        SimpleMapping mapping = new SimpleMapping(mappingId, mf, vf);

        expect:
        mapping.getId().equals(mappingId);
        mapping.getModel().contains(mappingIRI, vf.createIRI(Delimited.TYPE.stringValue()),
                vf.createIRI(Delimited.MAPPING.stringValue()));
    }

    def "Create a Mapping using a MappingId without an id"() {
        setup:
        SimpleMappingId mappingId = new SimpleMappingId.Builder(vf).mappingIRI(mappingIRI).build();
        SimpleMapping mapping = new SimpleMapping(mappingId, mf, vf);

        expect:
        mapping.getId().equals(mappingId);
        mapping.getModel().contains(mappingIRI, vf.createIRI(Delimited.TYPE.stringValue()),
                vf.createIRI(Delimited.MAPPING.stringValue()));
    }

    def "Create a Mapping using a MappingId with a version IRI"() {
        setup:
        SimpleMappingId mappingId = new SimpleMappingId.Builder(vf).mappingIRI(mappingIRI)
                .versionIRI(versionIRI).build();
        SimpleMapping mapping = new SimpleMapping(mappingId, mf, vf);

        expect:
        mapping.getId().equals(mappingId);
        mapping.getModel().contains(mappingIRI, vf.createIRI(Delimited.VERSION.stringValue()), versionIRI);
    }

    def "Create a Mapping using a valid Model"() {
        setup:
        SimpleMapping mapping = new SimpleMapping(model, vf);
        SimpleMapping versionedMapping = new SimpleMapping(versionedModel, vf);

        expect:
        mapping.getModel().equals(model);
        mapping.getId().equals(new SimpleMappingId.Builder(vf).mappingIRI(mappingIRI).build());
        versionedMapping.getModel().equals(versionedModel);
        versionedMapping.getId().equals(new SimpleMappingId.Builder(vf).mappingIRI(mappingIRI).versionIRI(versionIRI)
                .build());
    }

    def "Create a Mapping using a valid File"() {
        setup:
        SimpleMapping mapping = new SimpleMapping(new ClassPathResource("newestMapping.jsonld").getFile(), vf);
        SimpleMapping versionedMapping = new SimpleMapping(new ClassPathResource("newestVersionedMapping.jsonld")
                .getFile(), vf);

        expect:
        mapping.getModel().equals(model);
        mapping.getId().equals(new SimpleMappingId.Builder(vf).mappingIRI(mappingIRI).build());
        versionedMapping.getModel().equals(versionedModel);
        versionedMapping.getId().equals(new SimpleMappingId.Builder(vf).mappingIRI(mappingIRI).versionIRI(versionIRI)
                .build());
    }

    def "Create a Mapping using a valid InputStream"() {
        setup:
        SimpleMapping mapping = new SimpleMapping(new ClassPathResource("newestMapping.jsonld").getInputStream(),
                RDFFormat.JSONLD, vf);
        SimpleMapping versionedMapping = new SimpleMapping(new ClassPathResource("newestVersionedMapping.jsonld")
                .getInputStream(), RDFFormat.JSONLD, vf);

        expect:
        mapping.getModel().equals(model);
        mapping.getId().equals(new SimpleMappingId.Builder(vf).mappingIRI(mappingIRI).build());
        versionedMapping.getModel().equals(versionedModel);
        versionedMapping.getId().equals(new SimpleMappingId.Builder(vf).mappingIRI(mappingIRI).versionIRI(versionIRI)
                .build());
    }

    def "Create a Mapping using a valid JSON-LD String"() {
        setup:
        SimpleMapping mapping = new SimpleMapping(new ClassPathResource("newestMapping.jsonld").getFile()
                .getText("UTF-8"), vf);
        SimpleMapping versionedMapping = new SimpleMapping(new ClassPathResource("newestVersionedMapping.jsonld")
                .getFile().getText("UTF-8"), vf);

        expect:
        mapping.getModel().equals(model);
        mapping.getId().equals(new SimpleMappingId.Builder(vf).mappingIRI(mappingIRI).build());
        versionedMapping.getModel().equals(versionedModel);
        versionedMapping.getId().equals(new SimpleMappingId.Builder(vf).mappingIRI(mappingIRI).versionIRI(versionIRI)
                .build());
    }

    def "Throw an exception when Mapping is invalid"() {
        when:
        SimpleMapping mapping = new SimpleMapping(mf.createModel(), vf);

        then:
        thrown(MatOntoException);
    }
}