package org.matonto.etl.service.delimited

import org.matonto.etl.api.config.ExcelConfig;

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
import org.matonto.etl.api.config.SVConfig
import org.matonto.ontologies.delimited.ClassMappingFactory
import org.matonto.ontologies.delimited.DataMappingFactory
import org.matonto.ontologies.delimited.ObjectMappingFactory
import org.matonto.ontologies.delimited.PropertyFactory;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.matonto.rdf.core.utils.Values
import org.matonto.rdf.orm.conversion.impl.DefaultValueConverterRegistry
import org.matonto.rdf.orm.conversion.impl.DoubleValueConverter
import org.matonto.rdf.orm.conversion.impl.FloatValueConverter
import org.matonto.rdf.orm.conversion.impl.IRIValueConverter
import org.matonto.rdf.orm.conversion.impl.IntegerValueConverter
import org.matonto.rdf.orm.conversion.impl.ResourceValueConverter
import org.matonto.rdf.orm.conversion.impl.ShortValueConverter
import org.matonto.rdf.orm.conversion.impl.StringValueConverter
import org.matonto.rdf.orm.conversion.impl.ValueValueConverter
import org.matonto.rdf.orm.impl.ThingFactory;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.springframework.core.io.ClassPathResource;
import spock.lang.Specification;

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
    def r = new FileReader(out);

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
        "12345/_/abcd"      | "\${UUID}/\${5}/\${0}"
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