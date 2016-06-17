package org.matonto.etl.service.delimited

import org.matonto.etl.api.config.ExcelConfig;
import org.matonto.etl.api.config.SVConfig;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.matonto.rdf.core.utils.Values;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.springframework.core.io.ClassPathResource;
import spock.lang.Specification;

class ConverterSpec extends Specification {

    def mf = LinkedHashModelFactory.getInstance();
    def vf = SimpleValueFactory.getInstance();

    def c = Spy(DelimitedConverterImpl)

    def out = new ClassPathResource("testOutput.ttl").getFile();
    def r = new FileReader(out);

    def setup() {
        c.setValueFactory(vf)
        c.setModelFactory(mf);
    }

    def "Convert CSV File with Multiple Object per Row and Object and Data Properties"() {
        setup:
        InputStream csv = new ClassPathResource("testFile.csv").getInputStream();
        InputStream mappingFile = new ClassPathResource("newestMapping.ttl").getInputStream();
        c.generateUuid() >>> ["abc", "bcd", "cdf", "dfg", "fgh", "ghi", "hij", "ijk", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        Model m = Values.matontoModel(Rio.parse(r, "", RDFFormat.TURTLE));
        Model mapping = Values.matontoModel(Rio.parse(mappingFile, "", RDFFormat.TURTLE));
        SVConfig config = new SVConfig.Builder(csv, mapping).containsHeaders(true).separator((char) ',').build();
        Model convertedModel = c.convert(config);

        expect:
        m.equals(convertedModel);
    }

    def "Test non-comma separator"() {
        setup:
        InputStream csv = new ClassPathResource("semicolonFile.csv").getInputStream();
        InputStream mappingFile = new ClassPathResource("newestMapping.ttl").getInputStream();
        c.generateUuid() >>> ["abc", "bcd", "cdf", "dfg", "fgh", "ghi", "hij", "ijk", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        Model m = Values.matontoModel(Rio.parse(r, "", RDFFormat.TURTLE));
        Model mapping = Values.matontoModel(Rio.parse(mappingFile, "", RDFFormat.TURTLE));
        SVConfig config = new SVConfig.Builder(csv, mapping).containsHeaders(true).separator((char) ';').build();
        Model convertedModel = c.convert(config)

        expect:
        m.equals(convertedModel);
    }

    def "Tab Separated"() {
        setup:
        InputStream csv = new ClassPathResource("tabFile.csv").getInputStream();
        InputStream mappingFile = new ClassPathResource("newestMapping.ttl").getInputStream();
        c.generateUuid() >>> ["abc", "bcd", "cdf", "dfg", "fgh", "ghi", "hij", "ijk", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        Model m = Values.matontoModel(Rio.parse(r, "", RDFFormat.TURTLE));
        Model mapping = Values.matontoModel(Rio.parse(mappingFile, "", RDFFormat.TURTLE));
        SVConfig config = new SVConfig.Builder(csv, mapping).containsHeaders(true).separator((char) '\t').build();
        Model convertedModel = c.convert(config)

        expect:
        m.equals(convertedModel);
    }

    def "Mapping with default Local Name"() {
        setup:
        InputStream csv = new ClassPathResource("testFile.csv").getInputStream();
        InputStream mappingFile = new ClassPathResource("mappingNoLocalName.ttl").getInputStream();
        c.generateUuid() >>> ["abc", "bcd", "cdf", "dfg", "fgh", "ghi", "hij", "ijk", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        Model m = Values.matontoModel(Rio.parse(r, "", RDFFormat.TURTLE));
        Model mapping = Values.matontoModel(Rio.parse(mappingFile, "", RDFFormat.TURTLE));
        SVConfig config = new SVConfig.Builder(csv, mapping).containsHeaders(true).separator((char) ',').build();
        Model convertedModel = c.convert(config)

        expect:
        m.equals(convertedModel);
    }

    def "Without headers"() {
        setup:
        InputStream csv = new ClassPathResource("testFileNoHeaders.csv").getInputStream();
        InputStream mappingFile = new ClassPathResource("newestMapping.ttl").getInputStream();
        c.generateUuid() >>> ["abc", "bcd", "cdf", "dfg", "fgh", "ghi", "hij", "ijk", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        Model m = Values.matontoModel(Rio.parse(r, "", RDFFormat.TURTLE));
        Model mapping = Values.matontoModel(Rio.parse(mappingFile, "", RDFFormat.TURTLE));
        SVConfig config = new SVConfig.Builder(csv, mapping).containsHeaders(false).separator((char) ',').build();
        Model convertedModel = c.convert(config);

        expect:
        m.equals(convertedModel);
    }

    def "Convert Excel 97-2003 File with Multiple Object per Row and Object and Data Properties"() {
        setup:
        InputStream xls = new ClassPathResource("testFile.xls").getInputStream();
        InputStream mappingFile = new ClassPathResource("newestMapping.ttl").getInputStream();
        c.generateUuid() >>> ["abc", "bcd", "cdf", "dfg", "fgh", "ghi", "hij", "ijk", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        Model m = Values.matontoModel(Rio.parse(r, "", RDFFormat.TURTLE));
        Model mapping = Values.matontoModel(Rio.parse(mappingFile, "", RDFFormat.TURTLE));
        ExcelConfig config = new ExcelConfig.Builder(xls, mapping).containsHeaders(true).build();
        Model convertedModel = c.convert(config);

        expect:
        m.equals(convertedModel);
    }

    def "Convert Excel 2007 File with Multiple Object per Row and Object and Data Properties"() {
        setup:
        InputStream xls = new ClassPathResource("testFile.xlsx").getInputStream();
        InputStream mappingFile = new ClassPathResource("newestMapping.ttl").getInputStream();
        c.generateUuid() >>> ["abc", "bcd", "cdf", "dfg", "fgh", "ghi", "hij", "ijk", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        Model m = Values.matontoModel(Rio.parse(r, "", RDFFormat.TURTLE))
        Model mapping = Values.matontoModel(Rio.parse(mappingFile, "", RDFFormat.TURTLE));
        ExcelConfig config = new ExcelConfig.Builder(xls, mapping).containsHeaders(true).build();
        Model convertedModel = c.convert(config);

        expect:
        m.equals(convertedModel);
    }

    def "Test Generation of Local Name"() {
        setup:
        String[] nextLine = ["abcd","efgh","ijkl","mnop","qrst"]
        c.generateUuid() >> "12345"

        expect:
        result.equals(c.generateLocalName(localName, nextLine))

        where:
        result              | localName
        "12345"             | "\${UUID}"
        "12345/abcd"        | "\${UUID}/\${0}"
        "abcd"              | "\${0}"
        "abcd/12345"        | "\${0}/\${UUID}"
        "abcd/12345/ijkl"   | "\${0}/\${UUID}/\${2}"
        "abcd/abcd"         | "\${0}/\${0}"
        "12345"             | ""
    }

    def "With a limit set with no offset"() {
        setup:
        InputStream csv = new ClassPathResource("testFile.csv").getInputStream();
        InputStream mappingFile = new ClassPathResource("newestMapping.ttl").getInputStream();
        c.generateUuid() >>> ["abc", "bcd", "cdf", "dfg", "fgh", "ghi", "hij", "ijk", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        out = new ClassPathResource("testLimitNoOffsetOutput.ttl").getFile();
        r = new FileReader(out);
        Model m = Values.matontoModel(Rio.parse(r, "", RDFFormat.TURTLE));
        Model mapping = Values.matontoModel(Rio.parse(mappingFile, "", RDFFormat.TURTLE));
        SVConfig config = new SVConfig.Builder(csv, mapping).containsHeaders(true).separator((char) ',')
                .limit(2).build();
        Model convertedModel = c.convert(config);

        expect:
        m.equals(convertedModel);
    }

    def "With a limit set with an offset"() {
        setup:
        InputStream csv = new ClassPathResource("testFile.csv").getInputStream();
        InputStream mappingFile = new ClassPathResource("newestMapping.ttl").getInputStream();
        c.generateUuid() >>> ["abc", "bcd", "cdf", "dfg", "fgh", "ghi", "hij", "ijk", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        out = new ClassPathResource("testLimitWithOffsetOutput.ttl").getFile();
        r = new FileReader(out);
        Model m = Values.matontoModel(Rio.parse(r, "", RDFFormat.TURTLE));
        Model mapping = Values.matontoModel(Rio.parse(mappingFile, "", RDFFormat.TURTLE));
        SVConfig config = new SVConfig.Builder(csv, mapping).containsHeaders(true).separator((char) ',')
                .limit(2).offset(1).build();
        Model convertedModel = c.convert(config);

        expect:
        m.equals(convertedModel);
    }

    def "With an offset and headers"() {
        setup:
        InputStream csv = new ClassPathResource("testFile.csv").getInputStream();
        InputStream mappingFile = new ClassPathResource("newestMapping.ttl").getInputStream();
        c.generateUuid() >>> ["abc", "bcd", "cdf", "dfg", "fgh", "ghi", "hij", "ijk", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        out = new ClassPathResource("testOffsetOutput.ttl").getFile();
        r = new FileReader(out);
        Model m = Values.matontoModel(Rio.parse(r, "", RDFFormat.TURTLE));
        Model mapping = Values.matontoModel(Rio.parse(mappingFile, "", RDFFormat.TURTLE));
        SVConfig config = new SVConfig.Builder(csv, mapping).containsHeaders(true).separator((char) ',')
                .offset(1).build();
        Model convertedModel = c.convert(config);

        expect:
        m.equals(convertedModel);
    }

    def "With an offset and no headers"() {
        setup:
        InputStream csv = new ClassPathResource("testFileNoHeaders.csv").getInputStream();
        InputStream mappingFile = new ClassPathResource("newestMapping.ttl").getInputStream();
        c.generateUuid() >>> ["abc", "bcd", "cdf", "dfg", "fgh", "ghi", "hij", "ijk", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        out = new ClassPathResource("testOffsetOutput.ttl").getFile();
        r = new FileReader(out);
        Model m = Values.matontoModel(Rio.parse(r, "", RDFFormat.TURTLE));
        Model mapping = Values.matontoModel(Rio.parse(mappingFile, "", RDFFormat.TURTLE));
        SVConfig config = new SVConfig.Builder(csv, mapping).containsHeaders(false).separator((char) ',')
                .offset(1).build();
        Model convertedModel = c.convert(config);

        expect:
        m.equals(convertedModel);
    }

    def "Convert File with Missing Properties Ignored"() {
        setup:
        InputStream csv = new ClassPathResource("testPropertiesMissing.csv").getInputStream();
        InputStream mappingFile = new ClassPathResource("newestMapping.ttl").getInputStream();
        out = new ClassPathResource("testPropertiesMissingOut.ttl").getFile();
        r = new FileReader(out);
        c.generateUuid() >>> ["abc", "bcd", "cdf", "dfg", "fgh", "ghi", "hij", "ijk", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        Model m = Values.matontoModel(Rio.parse(r, "", RDFFormat.TURTLE));
        Model mapping = Values.matontoModel(Rio.parse(mappingFile, "", RDFFormat.TURTLE));
        SVConfig config = new SVConfig.Builder(csv, mapping).containsHeaders(true).separator((char) ',').build();
        Model convertedModel = c.convert(config);

        expect:
        m.equals(convertedModel);
    }
}