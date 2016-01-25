package org.matonto.etl.service.csv

import org.matonto.rdf.api.Model
import org.matonto.rdf.api.ModelFactory
import org.matonto.rdf.core.impl.sesame.LinkedHashModel
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory
import org.matonto.rdf.api.ValueFactory
import org.openrdf.rio.RDFFormat
import org.openrdf.rio.RDFParseException
import org.openrdf.rio.Rio
import org.springframework.core.io.ClassPathResource
import spock.lang.Specification

class ConverterSpec extends Specification {

    def "Convert File with Multiple Object per Row and Object and Data Properties"() {
        setup:

        File csv = new ClassPathResource("testFile.csv").getFile();
        File mappingFile = new ClassPathResource("newMapping.ttl").getFile();
        File out = new ClassPathResource("testOutput.ttl").getFile();
        Model m = new LinkedHashModel();
        CSVConverterImpl c = Spy(CSVConverterImpl)
        ModelFactory mf = new LinkedHashModelFactory().getInstance();
        ValueFactory vf = new SimpleValueFactory().getInstance();
        c.setValueFactory(vf)
        c.setModelFactory(mf);
        c.generateUUID() >>> ["abc", "bcd", "cdf", "dfg", "fgh", "ghi", "hij", "ijk", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        FileReader r = new FileReader(out);
        m = c.matontoModel(Rio.parse(r, "", RDFFormat.TURTLE))
        Model convertedModel = c.convert(csv, mappingFile);

        expect:
        m.equals(convertedModel);
    }

    def "Test non-comma separator"(){
        setup:

        File csv = new ClassPathResource("semicolonFile.csv").getFile();
        File mappingFile = new ClassPathResource("semicolonMapping.ttl").getFile();
        File out = new ClassPathResource("testOutput.ttl").getFile();
        Model m = new LinkedHashModel();
        CSVConverterImpl c = Spy(CSVConverterImpl)
        ModelFactory mf = new LinkedHashModelFactory().getInstance();
        ValueFactory vf = new SimpleValueFactory().getInstance();
        c.setValueFactory(vf)
        c.setModelFactory(mf);
        c.generateUUID() >>> ["abc", "bcd", "cdf", "dfg", "fgh", "ghi", "hij", "ijk", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        FileReader r = new FileReader(out);
        m = c.matontoModel(Rio.parse(r, "", RDFFormat.TURTLE))
        Model convertedModel = c.convert(csv, mappingFile)

        expect:
        m.equals(convertedModel);
    }

    def "Test default separator is comma"(){
        setup:

        File csv = new ClassPathResource("testFile.csv").getFile();
        File mappingFile = new ClassPathResource("defaultSeparatorMapping.ttl").getFile();
        File out = new ClassPathResource("testOutput.ttl").getFile();
        Model m = new LinkedHashModel();
        CSVConverterImpl c = Spy(CSVConverterImpl)
        ModelFactory mf = new LinkedHashModelFactory().getInstance();
        ValueFactory vf = new SimpleValueFactory().getInstance();
        c.setValueFactory(vf)
        c.setModelFactory(mf);
        c.generateUUID() >>> ["abc", "bcd", "cdf", "dfg", "fgh", "ghi", "hij", "ijk", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        FileReader r = new FileReader(out);
        m = c.matontoModel(Rio.parse(r, "", RDFFormat.TURTLE))
        Model convertedModel = c.convert(csv, mappingFile);

        expect:
        m.equals(convertedModel);
    }

    def "Tab Separated"(){
        setup:

        File csv = new ClassPathResource("tabFile.csv").getFile();
        File mappingFile = new ClassPathResource("tabMapping.ttl").getFile();
        File out = new ClassPathResource("testOutput.ttl").getFile();
        Model m = new LinkedHashModel();
        CSVConverterImpl c = Spy(CSVConverterImpl)
        ModelFactory mf = new LinkedHashModelFactory().getInstance();
        ValueFactory vf = new SimpleValueFactory().getInstance();
        c.setValueFactory(vf)
        c.setModelFactory(mf);
        c.generateUUID() >>> ["abc", "bcd", "cdf", "dfg", "fgh", "ghi", "hij", "ijk", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        FileReader r = new FileReader(out);
        m = c.matontoModel(Rio.parse(r, "", RDFFormat.TURTLE))
        Model convertedModel = c.convert(csv, mappingFile)

        expect:
        m.equals(convertedModel);
    }

    def "Mapping with default Local Name"(){
        setup:

        File csv = new ClassPathResource("testFile.csv").getFile();
        File mappingFile = new ClassPathResource("mappingNoLocalName.ttl").getFile();
        File out = new ClassPathResource("testOutput.ttl").getFile();
        Model m = new LinkedHashModel();
        CSVConverterImpl c = Spy(CSVConverterImpl)
        ModelFactory mf = new LinkedHashModelFactory().getInstance();
        ValueFactory vf = new SimpleValueFactory().getInstance();
        c.setValueFactory(vf)
        c.setModelFactory(mf);
        c.generateUUID() >>> ["abc", "bcd", "cdf", "dfg", "fgh", "ghi", "hij", "ijk", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        FileReader r = new FileReader(out);
        m = c.matontoModel(Rio.parse(r, "", RDFFormat.TURTLE))
        Model convertedModel = c.convert(csv, mappingFile)

        expect:
        m.equals(convertedModel);
    }

    def "Test Generation of Local Name"(){
        setup:
        String[] nextLine = ["abcd","efgh","ijkl","mnop","qrst"]
        CSVConverterImpl c = Spy(CSVConverterImpl)
        ModelFactory mf = new LinkedHashModelFactory().getInstance();
        ValueFactory vf = new SimpleValueFactory().getInstance();
        c.setValueFactory(vf)
        c.setModelFactory(mf);
        def uuid = "12345"
        c.generateUUID() >> "12345"
        expect:
        result.equals(c.generateLocalName(localName, nextLine))

        where:
        result              | localName
        "12345"             | "\${UUID}"
        "12345/abcd"        | "\${UUID}/\${1}"
        "abcd"              | "\${1}"
        "abcd/12345"        | "\${1}/\${UUID}"
        "abcd/12345/ijkl"   | "\${1}/\${UUID}/\${3}"
        "abcd/abcd"         | "\${1}/\${1}"
        "12345"             | ""


    }

    def "Invalid RDF Causes RDFParseException"(){
        setup:
        File csv = new ClassPathResource("testFile.csv").getFile();
        File mappingFile = new ClassPathResource("testInvalidMapping.ttl").getFile();
        CSVConverterImpl c = new CSVConverterImpl();
        ModelFactory mf = new LinkedHashModelFactory().getInstance();
        ValueFactory vf = new SimpleValueFactory().getInstance();
        c.setValueFactory(vf)
        c.setModelFactory(mf);

        when:
        Model convertedModel = c.convert(csv, mappingFile);

        then:
        thrown RDFParseException;
    }

    def "Convert File with Missing Properties Ignored"() {
        setup:
        File csv = new ClassPathResource("testPropertiesMissing.csv").getFile();
        File mappingFile = new ClassPathResource("newMapping.ttl").getFile();
        File out = new ClassPathResource("testPropertiesMissingOut.ttl").getFile();
        Model m = new LinkedHashModel();
        CSVConverterImpl c = Spy(CSVConverterImpl);
        ModelFactory mf = new LinkedHashModelFactory().getInstance();
        ValueFactory vf = new SimpleValueFactory().getInstance();
        c.setValueFactory(vf)
        c.setModelFactory(mf);
        c.generateUUID() >>> ["abc", "bcd", "cdf", "dfg", "fgh", "ghi", "hij", "ijk", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        FileReader r = new FileReader(out);
        m = c.matontoModel(Rio.parse(r, "", RDFFormat.TURTLE))
        Model convertedModel = c.convert(csv, mappingFile);
        expect:
        m.equals(convertedModel);
    }

    
}