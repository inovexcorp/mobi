package org.matonto.etl.service.delimited

import org.matonto.etl.api.config.ExcelConfig
import org.matonto.etl.api.config.SVConfig
import org.matonto.etl.api.exception.MatOntoETLException
import org.matonto.etl.api.ontologies.delimited.*
import org.matonto.rdf.api.Model
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory
import org.matonto.rdf.core.utils.Values
import org.matonto.rdf.orm.conversion.impl.*
import org.matonto.rdf.orm.impl.ThingFactory
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

class ConverterSpec extends Specification {

    def mf = LinkedHashModelFactory.getInstance()
    def vf = SimpleValueFactory.getInstance()
    def vcr = new DefaultValueConverterRegistry()
    def classMappingFactory = new ClassMappingFactory()
    def dataMappingFactory = new DataMappingFactory()
    def propertyFactory = new PropertyFactory()
    def objectFactory = new ObjectMappingFactory()
    def thingFactory = new ThingFactory()

    def c = Spy(DelimitedConverterImpl)

    def out = new ClassPathResource("testOutput.ttl").getFile();
    def testOutput = new FileReader(out);

    def outWithBlanks = new ClassPathResource("testOutputWithBlanks.ttl").getFile();
    def testOutputWithBlanks = new FileReader(outWithBlanks);

    def setup() {
        classMappingFactory.setValueFactory(vf);
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

        c.setValueFactory(vf)
        c.setModelFactory(mf);
        c.setClassMappingFactory(classMappingFactory);
    }

    def "Convert CSV File with Multiple Object per Row and Object and Data Properties"() {
        setup:
        InputStream csv = new ClassPathResource("testFile.csv").getInputStream();
        InputStream mappingFile = new ClassPathResource("newestMapping.ttl").getInputStream();
        c.generateUuid() >>> ["abc", "bcd", "cdf", "dfg", "fgh", "ghi", "hij", "ijk", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        Model m = Values.matontoModel(Rio.parse(testOutput, "", RDFFormat.TURTLE));
        Model mapping = Values.matontoModel(Rio.parse(mappingFile, "", RDFFormat.TURTLE));
        SVConfig config = new SVConfig.SVConfigBuilder(csv, mapping).containsHeaders(true).separator((char) ',').build();
        Model convertedModel = c.convert(config);

        expect:
        convertedModel == m;
    }

    def "Convert CSV File with Multiple Object per Row and Object and Data Properties with Blank Values"() {
        setup:
        InputStream csv = new ClassPathResource("testFileWithBlanks.csv").getInputStream();
        InputStream mappingFile = new ClassPathResource("newestMapping.ttl").getInputStream();
        c.generateUuid() >>> ["abc", "cdf", "dfg", "fgh", "ghi", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        Model m = Values.matontoModel(Rio.parse(testOutputWithBlanks, "", RDFFormat.TURTLE));
        Model mapping = Values.matontoModel(Rio.parse(mappingFile, "", RDFFormat.TURTLE));
        SVConfig config = new SVConfig.SVConfigBuilder(csv, mapping).containsHeaders(true).separator((char) ',').build();
        Model convertedModel = c.convert(config);

        expect:
        convertedModel == m;
    }

    def "Test non-comma separator"() {
        setup:
        InputStream csv = new ClassPathResource("semicolonFile.csv").getInputStream();
        InputStream mappingFile = new ClassPathResource("newestMapping.ttl").getInputStream();
        c.generateUuid() >>> ["abc", "bcd", "cdf", "dfg", "fgh", "ghi", "hij", "ijk", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        Model m = Values.matontoModel(Rio.parse(testOutput, "", RDFFormat.TURTLE));
        Model mapping = Values.matontoModel(Rio.parse(mappingFile, "", RDFFormat.TURTLE));
        SVConfig config = new SVConfig.SVConfigBuilder(csv, mapping).containsHeaders(true).separator((char) ';').build();
        Model convertedModel = c.convert(config)

        expect:
        convertedModel == m;
    }

    def "Tab Separated"() {
        setup:
        InputStream csv = new ClassPathResource("tabFile.csv").getInputStream();
        InputStream mappingFile = new ClassPathResource("newestMapping.ttl").getInputStream();
        c.generateUuid() >>> ["abc", "bcd", "cdf", "dfg", "fgh", "ghi", "hij", "ijk", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        Model m = Values.matontoModel(Rio.parse(testOutput, "", RDFFormat.TURTLE));
        Model mapping = Values.matontoModel(Rio.parse(mappingFile, "", RDFFormat.TURTLE));
        SVConfig config = new SVConfig.SVConfigBuilder(csv, mapping).containsHeaders(true).separator((char) '\t').build();
        Model convertedModel = c.convert(config)

        expect:
        convertedModel == m;
    }

    def "Tab Separated with Blanks"() {
        setup:
        InputStream csv = new ClassPathResource("tabFileWithBlanks.csv").getInputStream();
        InputStream mappingFile = new ClassPathResource("newestMapping.ttl").getInputStream();
        c.generateUuid() >>> ["abc", "cdf", "dfg", "fgh", "ghi", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        Model m = Values.matontoModel(Rio.parse(testOutputWithBlanks, "", RDFFormat.TURTLE));
        Model mapping = Values.matontoModel(Rio.parse(mappingFile, "", RDFFormat.TURTLE));
        SVConfig config = new SVConfig.SVConfigBuilder(csv, mapping).containsHeaders(true).separator((char) '\t').build();
        Model convertedModel = c.convert(config)

        expect:
        convertedModel == m;
    }

    def "Mapping with default Local Name"() {
        setup:
        InputStream csv = new ClassPathResource("testFile.csv").getInputStream();
        InputStream mappingFile = new ClassPathResource("mappingNoLocalName.ttl").getInputStream();
        c.generateUuid() >>> ["abc", "bcd", "cdf", "dfg", "fgh", "ghi", "hij", "ijk", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        Model m = Values.matontoModel(Rio.parse(testOutput, "", RDFFormat.TURTLE));
        Model mapping = Values.matontoModel(Rio.parse(mappingFile, "", RDFFormat.TURTLE));
        SVConfig config = new SVConfig.SVConfigBuilder(csv, mapping).containsHeaders(true).separator((char) ',').build();
        Model convertedModel = c.convert(config)

        expect:
        convertedModel == m;
    }

    def "Without headers"() {
        setup:
        InputStream csv = new ClassPathResource("testFileNoHeaders.csv").getInputStream();
        InputStream mappingFile = new ClassPathResource("newestMapping.ttl").getInputStream();
        c.generateUuid() >>> ["abc", "bcd", "cdf", "dfg", "fgh", "ghi", "hij", "ijk", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        Model m = Values.matontoModel(Rio.parse(testOutput, "", RDFFormat.TURTLE));
        Model mapping = Values.matontoModel(Rio.parse(mappingFile, "", RDFFormat.TURTLE));
        SVConfig config = new SVConfig.SVConfigBuilder(csv, mapping).containsHeaders(false).separator((char) ',').build();
        Model convertedModel = c.convert(config);

        expect:
        convertedModel == m;
    }

    def "Convert Excel 97-2003 File with Multiple Object per Row and Object and Data Properties"() {
        setup:
        InputStream xls = new ClassPathResource("testFile.xls").getInputStream();
        InputStream mappingFile = new ClassPathResource("newestMapping.ttl").getInputStream();
        c.generateUuid() >>> ["abc", "bcd", "cdf", "dfg", "fgh", "ghi", "hij", "ijk", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        Model m = Values.matontoModel(Rio.parse(testOutput, "", RDFFormat.TURTLE));
        Model mapping = Values.matontoModel(Rio.parse(mappingFile, "", RDFFormat.TURTLE));
        ExcelConfig config = new ExcelConfig.ExcelConfigBuilder(xls, mapping).containsHeaders(true).build();
        Model convertedModel = c.convert(config);

        expect:
        convertedModel == m;
    }

    def "Convert Excel 97-2003 File with Multiple Object per Row and Object and Data Properties with Blank Values"() {
        setup:
        InputStream xls = new ClassPathResource("testFileWithBlanks.xls").getInputStream();
        InputStream mappingFile = new ClassPathResource("newestMapping.ttl").getInputStream();
        c.generateUuid() >>> ["abc", "cdf", "dfg", "fgh", "ghi", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        Model m = Values.matontoModel(Rio.parse(testOutputWithBlanks, "", RDFFormat.TURTLE));
        Model mapping = Values.matontoModel(Rio.parse(mappingFile, "", RDFFormat.TURTLE));
        ExcelConfig config = new ExcelConfig.ExcelConfigBuilder(xls, mapping).containsHeaders(true).build();
        Model convertedModel = c.convert(config);

        expect:
        convertedModel == m;
    }

    def "Convert Excel 2007 File with Multiple Object per Row and Object and Data Properties"() {
        setup:
        InputStream xls = new ClassPathResource("testFile.xlsx").getInputStream();
        InputStream mappingFile = new ClassPathResource("newestMapping.ttl").getInputStream();
        c.generateUuid() >>> ["abc", "bcd", "cdf", "dfg", "fgh", "ghi", "hij", "ijk", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        Model m = Values.matontoModel(Rio.parse(testOutput, "", RDFFormat.TURTLE))
        Model mapping = Values.matontoModel(Rio.parse(mappingFile, "", RDFFormat.TURTLE));
        ExcelConfig config = new ExcelConfig.ExcelConfigBuilder(xls, mapping).containsHeaders(true).build();
        Model convertedModel = c.convert(config);

        expect:
        convertedModel == m;
    }

    def "Convert Excel 2007 File with Multiple Object per Row and Object and Data Properties with Blank Values"() {
        setup:
        InputStream xls = new ClassPathResource("testFileWithBlanks.xlsx").getInputStream();
        InputStream mappingFile = new ClassPathResource("newestMapping.ttl").getInputStream();
        c.generateUuid() >>> ["abc", "cdf", "dfg", "fgh", "ghi", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        Model m = Values.matontoModel(Rio.parse(testOutputWithBlanks, "", RDFFormat.TURTLE))
        Model mapping = Values.matontoModel(Rio.parse(mappingFile, "", RDFFormat.TURTLE));
        ExcelConfig config = new ExcelConfig.ExcelConfigBuilder(xls, mapping).containsHeaders(true).build();
        Model convertedModel = c.convert(config);

        expect:
        convertedModel == m;
    }

    def "Test Generation of Local Name #localName Results in #result"() {
        setup:
        String[] nextLine = ["abcd","efgh","ijkl","mnop","qrst"]
        c.generateUuid() >> "12345"
        def cm = Mock(ClassMapping)

        when:
        def result2 = c.generateLocalName(cm, nextLine)

        then:
        cm.getLocalName() >>> Optional.ofNullable(localName)
        result2.get() == result

        where:
        result              | localName
        "12345"             | "\${UUID}"
        "12345/abcd"        | "\${UUID}/\${0}"
        "abcd"              | "\${0}"
        "abcd/12345"        | "\${0}/\${UUID}"
        "abcd/12345/ijkl"   | "\${0}/\${UUID}/\${2}"
        "abcd/abcd"         | "\${0}/\${0}"
        "12345"             | ""
        "12345"             | null
    }

    def "Test Generation of Local Name with missing columns results in empty optional"() {
        setup:
        String[] nextLine = ["abcd","efgh","ijkl","mnop","qrst"]
        c.generateUuid() >> "12345"
        def cm = Mock(ClassMapping)

        when:
        def result2 = c.generateLocalName(cm, nextLine)

        then:
        cm.getLocalName() >>> Optional.ofNullable("\${UUID}/\${5}/\${0}")
        !result2.isPresent()
    }

    def "With a limit set with no offset"() {
        setup:
        InputStream csv = new ClassPathResource("testFile.csv").getInputStream();
        InputStream mappingFile = new ClassPathResource("newestMapping.ttl").getInputStream();
        c.generateUuid() >>> ["abc", "bcd", "cdf", "dfg", "fgh", "ghi", "hij", "ijk", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        out = new ClassPathResource("testLimitNoOffsetOutput.ttl").getFile();
        testOutput = new FileReader(out);
        Model m = Values.matontoModel(Rio.parse(testOutput, "", RDFFormat.TURTLE));
        Model mapping = Values.matontoModel(Rio.parse(mappingFile, "", RDFFormat.TURTLE));
        SVConfig config = new SVConfig.SVConfigBuilder(csv, mapping).containsHeaders(true).separator((char) ',')
                .limit(2).build();
        Model convertedModel = c.convert(config);

        expect:
        convertedModel == m;
    }

    def "With a limit set with an offset"() {
        setup:
        InputStream csv = new ClassPathResource("testFile.csv").getInputStream();
        InputStream mappingFile = new ClassPathResource("newestMapping.ttl").getInputStream();
        c.generateUuid() >>> ["abc", "bcd", "cdf", "dfg", "fgh", "ghi", "hij", "ijk", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        out = new ClassPathResource("testLimitWithOffsetOutput.ttl").getFile();
        testOutput = new FileReader(out);
        Model m = Values.matontoModel(Rio.parse(testOutput, "", RDFFormat.TURTLE));
        Model mapping = Values.matontoModel(Rio.parse(mappingFile, "", RDFFormat.TURTLE));
        SVConfig config = new SVConfig.SVConfigBuilder(csv, mapping).containsHeaders(true).separator((char) ',')
                .limit(2).offset(1).build();
        Model convertedModel = c.convert(config);

        expect:
        convertedModel == m;
    }

    def "With an offset and headers"() {
        setup:
        InputStream csv = new ClassPathResource("testFile.csv").getInputStream();
        InputStream mappingFile = new ClassPathResource("newestMapping.ttl").getInputStream();
        c.generateUuid() >>> ["abc", "bcd", "cdf", "dfg", "fgh", "ghi", "hij", "ijk", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        out = new ClassPathResource("testOffsetOutput.ttl").getFile();
        testOutput = new FileReader(out);
        Model m = Values.matontoModel(Rio.parse(testOutput, "", RDFFormat.TURTLE));
        Model mapping = Values.matontoModel(Rio.parse(mappingFile, "", RDFFormat.TURTLE));
        SVConfig config = new SVConfig.SVConfigBuilder(csv, mapping).containsHeaders(true).separator((char) ',')
                .offset(1).build();
        Model convertedModel = c.convert(config);

        expect:
        convertedModel == m;
    }

    def "Convert CSV File with an offset and headers and blank rows"() {
        setup:
        InputStream csv = new ClassPathResource("testFileWithBlanks.csv").getInputStream();
        InputStream mappingFile = new ClassPathResource("newestMapping.ttl").getInputStream();
        c.generateUuid() >>> ["bcd", "cdf", "dfg", "fgh", "ijk", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        out = new ClassPathResource("testOffsetOutputWithBlankRows.ttl").getFile();
        testOutput = new FileReader(out);
        Model m = Values.matontoModel(Rio.parse(testOutput, "", RDFFormat.TURTLE));
        Model mapping = Values.matontoModel(Rio.parse(mappingFile, "", RDFFormat.TURTLE));
        SVConfig config = new SVConfig.SVConfigBuilder(csv, mapping).containsHeaders(true).separator((char) ',')
                .offset(2).build();
        Model convertedModel = c.convert(config);

        expect:
        convertedModel == m;
    }

    def "Convert Excel 97-2003 File with an offset and headers and blank rows"() {
        setup:
        InputStream xls = new ClassPathResource("testFileWithBlanks.xls").getInputStream();
        InputStream mappingFile = new ClassPathResource("newestMapping.ttl").getInputStream();
        c.generateUuid() >>> ["bcd", "cdf", "dfg", "fgh", "ijk", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        out = new ClassPathResource("testOffsetOutputWithBlankRows.ttl").getFile();
        testOutput = new FileReader(out);
        Model m = Values.matontoModel(Rio.parse(testOutput, "", RDFFormat.TURTLE));
        Model mapping = Values.matontoModel(Rio.parse(mappingFile, "", RDFFormat.TURTLE));
        ExcelConfig config = new ExcelConfig.ExcelConfigBuilder(xls, mapping).containsHeaders(true).offset(2).build();
        Model convertedModel = c.convert(config);

        expect:
        convertedModel == m;
    }

    def "Convert Excel 2007 File with an offset and headers and blank rows"() {
        setup:
        InputStream xls = new ClassPathResource("testFileWithBlanks.xlsx").getInputStream();
        InputStream mappingFile = new ClassPathResource("newestMapping.ttl").getInputStream();
        c.generateUuid() >>> ["bcd", "cdf", "dfg", "fgh", "ijk", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        out = new ClassPathResource("testOffsetOutputWithBlankRows.ttl").getFile();
        testOutput = new FileReader(out);
        Model m = Values.matontoModel(Rio.parse(testOutput, "", RDFFormat.TURTLE));
        Model mapping = Values.matontoModel(Rio.parse(mappingFile, "", RDFFormat.TURTLE));
        ExcelConfig config = new ExcelConfig.ExcelConfigBuilder(xls, mapping).containsHeaders(true).offset(2).build();
        Model convertedModel = c.convert(config);

        expect:
        convertedModel == m;
    }

    def "With an offset and no headers"() {
        setup:
        InputStream csv = new ClassPathResource("testFileNoHeaders.csv").getInputStream();
        InputStream mappingFile = new ClassPathResource("newestMapping.ttl").getInputStream();
        c.generateUuid() >>> ["abc", "bcd", "cdf", "dfg", "fgh", "ghi", "hij", "ijk", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        out = new ClassPathResource("testOffsetOutput.ttl").getFile();
        testOutput = new FileReader(out);
        Model m = Values.matontoModel(Rio.parse(testOutput, "", RDFFormat.TURTLE));
        Model mapping = Values.matontoModel(Rio.parse(mappingFile, "", RDFFormat.TURTLE));
        SVConfig config = new SVConfig.SVConfigBuilder(csv, mapping).containsHeaders(false).separator((char) ',')
                .offset(1).build();
        Model convertedModel = c.convert(config);

        expect:
        convertedModel == m;
    }

    def "Convert File with Missing Properties Ignored"() {
        setup:
        InputStream csv = new ClassPathResource("testPropertiesMissing.csv").getInputStream();
        InputStream mappingFile = new ClassPathResource("newestMapping.ttl").getInputStream();
        out = new ClassPathResource("testPropertiesMissingOut.ttl").getFile();
        testOutput = new FileReader(out);
        c.generateUuid() >>> ["abc", "bcd", "cdf", "dfg", "fgh", "ghi", "hij", "ijk", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        Model m = Values.matontoModel(Rio.parse(testOutput, "", RDFFormat.TURTLE));
        Model mapping = Values.matontoModel(Rio.parse(mappingFile, "", RDFFormat.TURTLE));
        SVConfig config = new SVConfig.SVConfigBuilder(csv, mapping).containsHeaders(true).separator((char) ',').build();
        Model convertedModel = c.convert(config);

        expect:
        m as Set == convertedModel as Set
    }

    def "Missing prefix uses default prefix"() {
        setup:
        def config = new SVConfig.SVConfigBuilder(getInputStream("testFile.csv"), loadModel("mapping_no-prefix.ttl"))
                .containsHeaders(true)
                .separator((char) ',')
                .build()
        def expected = loadModel("output_no-prefix.ttl")

        when:
        def actual = c.convert(config)

        then:
        c.generateUuid() >>> ["abc", "bcd", "cdf", "dfg", "fgh", "ghi", "hij", "ijk", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        expected == actual
    }

    def "Missing mapsTo throws an exception"() {
        setup:
        def config = new SVConfig.SVConfigBuilder(
                // Had to new line bc of some strange bug in spock DSL
                // See https://github.com/spockframework/spock/issues/466
                getInputStream("testFile.csv"), loadModel("mapping_no-mapsTo.ttl")
        )
                .containsHeaders(true)
                .separator((char) ',')
                .build()

        when:
        c.convert(config)

        then:
        thrown(MatOntoETLException)
    }

    def "Missing classMapping throws an exception"() {
        setup:
        def config = new SVConfig.SVConfigBuilder(
                // Had to new line bc of some strange bug in spock DSL
                // See https://github.com/spockframework/spock/issues/466
                getInputStream("testFile.csv"), loadModel("mapping_no-classMapping.ttl")
        )
                .containsHeaders(true)
                .separator((char) ',')
                .build()

        when:
        c.convert(config)

        then:
        thrown(MatOntoETLException)
    }

    private def getInputStream(String filename) {
        getClass().getClassLoader().getResourceAsStream(filename)
    }

    private def loadModel(String filename) {
        Values.matontoModel(Rio.parse(getInputStream(filename), "", RDFFormat.TURTLE))
    }
}