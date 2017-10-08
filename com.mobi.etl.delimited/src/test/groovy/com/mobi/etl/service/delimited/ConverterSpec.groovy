package com.mobi.etl.service.delimited

import com.mobi.etl.api.config.delimited.ExcelConfig
import com.mobi.etl.api.config.delimited.SVConfig
import com.mobi.etl.api.exception.MobiETLException
import com.mobi.etl.api.ontologies.delimited.ClassMapping
import com.mobi.etl.api.ontologies.delimited.ClassMappingFactory
import com.mobi.etl.api.ontologies.delimited.DataMappingFactory
import com.mobi.etl.api.ontologies.delimited.MappingFactory
import com.mobi.etl.api.ontologies.delimited.ObjectMappingFactory
import com.mobi.etl.api.ontologies.delimited.PropertyFactory
import com.mobi.rdf.orm.conversion.impl.DefaultValueConverterRegistry
import com.mobi.rdf.orm.conversion.impl.DoubleValueConverter
import com.mobi.rdf.orm.conversion.impl.FloatValueConverter
import com.mobi.rdf.orm.conversion.impl.IRIValueConverter
import com.mobi.rdf.orm.conversion.impl.IntegerValueConverter
import com.mobi.rdf.orm.conversion.impl.ResourceValueConverter
import com.mobi.rdf.orm.conversion.impl.ShortValueConverter
import com.mobi.rdf.orm.conversion.impl.StringValueConverter
import com.mobi.rdf.orm.conversion.impl.ValueValueConverter
import com.mobi.etl.api.ontologies.delimited.*
import com.mobi.ontology.core.api.Ontology
import com.mobi.ontology.core.api.OntologyManager
import com.mobi.ontology.core.api.propertyexpression.DataProperty
import com.mobi.rdf.api.Model
import com.mobi.rdf.core.impl.sesame.LinkedHashModelFactory
import com.mobi.rdf.core.impl.sesame.SimpleValueFactory
import com.mobi.rdf.core.utils.Values
import com.mobi.rdf.orm.conversion.impl.*
import com.mobi.rdf.orm.impl.ThingFactory
import com.mobi.vocabularies.xsd.XSD
import org.openrdf.rio.RDFFormat
import org.openrdf.rio.Rio
import org.springframework.core.io.ClassPathResource
import spock.lang.Specification

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

class ConverterSpec extends Specification {

    def mf = LinkedHashModelFactory.getInstance()
    def vf = SimpleValueFactory.getInstance()
    def vcr = new DefaultValueConverterRegistry()
    def mappingFactory = new MappingFactory()
    def classMappingFactory = new ClassMappingFactory()
    def dataMappingFactory = new DataMappingFactory()
    def propertyFactory = new PropertyFactory()
    def objectFactory = new ObjectMappingFactory()
    def thingFactory = new ThingFactory()

    def c = Spy(DelimitedConverterImpl)
    def om = Mock(OntologyManager)
    def ontology = Mock(Ontology)
    def formulaProperty = Mock(DataProperty)
    def densityProperty = Mock(DataProperty)
    def latticeParameterProperty = Mock(DataProperty)
    def sourceProperty = Mock(DataProperty)
    def testedProperty = Mock(DataProperty)
    def countProperty = Mock(DataProperty)
    def dateRecordedProperty = Mock(DataProperty)

    /* Test Output Models */
    def testOutput = loadModel("testOutput.ttl")
    def testFormulaOutput = loadModel("testFormulaOutput.ttl")
    def testOutputWithDatatypes = loadModel("testOutputWithDatatypes.ttl")
    def testOutputWithBlanks = loadModel("testOutputWithBlanks.ttl")
    def testOutputWithMultiIndexUsages = loadModel("testOutputWithMultiIndexUsages.ttl")
    def testOutputWithFormattingAndBlanks = loadModel("testOutputWithFormattingAndBlanks.ttl")
    def testOutputWithDatatypesAndInvalidValues = loadModel("testOutputWithDatatypesAndInvalidValues.ttl")
    def testOutputLimitNoOffset = loadModel("testLimitNoOffsetOutput.ttl")
    def testOutputLimitWithOffset = loadModel("testLimitWithOffsetOutput.ttl")
    def testOutputOffset = loadModel("testOffsetOutput.ttl")
    def testOutputOffsetWithBlankRows = loadModel("testOffsetOutputWithBlankRows.ttl")
    def testOutputPropertiesMissing = loadModel("testPropertiesMissingOut.ttl")
    def testOutputNoPrefix = loadModel("output_no-prefix.ttl")

    def setup() {
        mappingFactory.setValueFactory(vf)
        mappingFactory.setValueConverterRegistry(vcr)
        classMappingFactory.setValueFactory(vf)
        classMappingFactory.setValueConverterRegistry(vcr)
        dataMappingFactory.setValueFactory(vf)
        dataMappingFactory.setValueConverterRegistry(vcr)
        propertyFactory.setValueFactory(vf)
        propertyFactory.setValueConverterRegistry(vcr)
        objectFactory.setValueFactory(vf)
        objectFactory.setValueConverterRegistry(vcr)
        thingFactory.setValueFactory(vf)
        thingFactory.setValueConverterRegistry(vcr)

        vcr.registerValueConverter(mappingFactory)
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
        c.setModelFactory(mf)
        c.setOntologyManager(om)
        c.setMappingFactory(mappingFactory)
        c.setClassMappingFactory(classMappingFactory)
        c.generateUuid() >>> ["abc", "bcd", "cdf", "dfg", "fgh", "ghi", "hij", "ijk", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        ontology.getImportsClosure() >> Collections.singleton(ontology)
        ontology.getDataProperty(vf.createIRI("http://mobi.com/ontologies/uhtc/formula")) >> Optional.of(formulaProperty)
        ontology.getDataPropertyRange(formulaProperty) >> Collections.emptySet()
        ontology.getDataProperty(vf.createIRI("http://mobi.com/ontologies/uhtc/density")) >> Optional.of(densityProperty)
        ontology.getDataPropertyRange(densityProperty) >> Collections.singleton(vf.createIRI(XSD.DOUBLE))
        ontology.getDataProperty(vf.createIRI("http://mobi.com/ontologies/uhtc/latticeParameter")) >> Optional.of(latticeParameterProperty)
        ontology.getDataPropertyRange(latticeParameterProperty) >> Collections.singleton(vf.createIRI(XSD.FLOAT))
        ontology.getDataProperty(vf.createIRI("http://mobi.com/ontologies/uhtc/source")) >> Optional.of(sourceProperty)
        ontology.getDataPropertyRange(sourceProperty) >> Collections.singleton(vf.createIRI(XSD.ANYURI))
        ontology.getDataProperty(vf.createIRI("http://mobi.com/ontologies/uhtc/tested")) >> Optional.of(testedProperty)
        ontology.getDataPropertyRange(testedProperty) >> Collections.singleton(vf.createIRI(XSD.BOOLEAN))
        ontology.getDataProperty(vf.createIRI("http://mobi.com/ontologies/uhtc/count")) >> Optional.of(countProperty)
        ontology.getDataPropertyRange(countProperty) >> Collections.singleton(vf.createIRI(XSD.INTEGER))
        ontology.getDataProperty(vf.createIRI("http://mobi.com/ontologies/uhtc/dateRecorded")) >> Optional.of(dateRecordedProperty)
        ontology.getDataPropertyRange(dateRecordedProperty) >> Collections.singleton(vf.createIRI(XSD.DATE_TIME))
    }

    def "Convert CSV File with Multiple Object per Row and Object and Data Properties"() {
        setup:
        SVConfig config = getSVConfigBuilder("testFile.csv", "newestMapping.ttl")
                .containsHeaders(true)
                .separator((char) ',')
                .build()
        Model convertedModel = c.convert(config)

        expect:
        convertedModel == testOutput
    }

    def "Convert CSV File with Multiple Object per Row and Object and Data Properties with Blank Values"() {
        setup:
        SVConfig config = getSVConfigBuilder("testFileWithBlanks.csv", "newestMapping.ttl")
                .containsHeaders(true)
                .separator((char) ',')
                .build()
        Model convertedModel = c.convert(config)

        expect:
        convertedModel == testOutputWithBlanks
    }

    def "Convert CSV File with Multiple Object per Row and Object and Data Properties with Multiple Index Usages"() {
        setup:
        SVConfig config = getSVConfigBuilder("testFile.csv", "mapping_multi-props-same-index.ttl")
                .containsHeaders(true)
                .separator((char) ',')
                .build()
        Model convertedModel = c.convert(config)

        expect:
        convertedModel == testOutputWithMultiIndexUsages
    }

    def "Convert CSV File with Multiple Object per Row and Object and Data Properties in Passed Ontologies"() {
        setup:
        SVConfig config = getSVConfigBuilder("testFile.csv", "mappingAllDatatypes.ttl")
                .containsHeaders(true)
                .ontologies(Collections.singleton(ontology))
                .separator((char) ',')
                .build()
        Model convertedModel = c.convert(config)

        expect:
        convertedModel == testOutputWithDatatypes
    }

    def "Convert CSV File with Multiple Object per Row and Object and Data Properties in Source Ontologies"() {
        setup:
        om.retrieveOntology(*_) >> Optional.of(ontology)
        SVConfig config = getSVConfigBuilder("testFile.csv", "mappingWithSourceOntology.ttl")
                .containsHeaders(true)
                .separator((char) ',')
                .build()
        Model convertedModel = c.convert(config)

        expect:
        convertedModel == testOutputWithDatatypes
    }

    def "Convert CSV File with Source Ontologies and Invalid Values for Range Datatypes"() {
        setup:
        om.retrieveOntology(*_) >> Optional.of(ontology)
        SVConfig config = getSVConfigBuilder("testFileWithInvalidValues.csv", "mappingWithSourceOntology.ttl")
                .containsHeaders(true)
                .separator((char) ',')
                .build()
        Model convertedModel = c.convert(config)

        expect:
        convertedModel == testOutputWithDatatypesAndInvalidValues
    }

    def "Test non-comma separator"() {
        setup:
        SVConfig config = getSVConfigBuilder("semicolonFile.csv", "newestMapping.ttl")
                .containsHeaders(true)
                .separator((char) ';')
                .build()
        Model convertedModel = c.convert(config)

        expect:
        convertedModel == testOutput
    }

    def "Tab Separated"() {
        setup:
        SVConfig config = getSVConfigBuilder("tabFile.csv", "newestMapping.ttl")
                .containsHeaders(true)
                .separator((char) '\t')
                .build()
        Model convertedModel = c.convert(config)

        expect:
        convertedModel == testOutput
    }

    def "Tab Separated with Blanks"() {
        setup:
        SVConfig config = getSVConfigBuilder("tabFileWithBlanks.csv", "newestMapping.ttl")
                .containsHeaders(true)
                .separator((char) '\t')
                .build()
        Model convertedModel = c.convert(config)

        expect:
        convertedModel == testOutputWithBlanks
    }

    def "Mapping with default Local Name"() {
        setup:
        SVConfig config = getSVConfigBuilder("testFile.csv", "mappingNoLocalName.ttl")
                .containsHeaders(true)
                .separator((char) ',')
                .build()
        Model convertedModel = c.convert(config)

        expect:
        convertedModel == testOutput
    }

    def "Without headers"() {
        setup:
        SVConfig config = getSVConfigBuilder("testFileNoHeaders.csv", "newestMapping.ttl")
                .containsHeaders(false)
                .separator((char) ',')
                .build()
        Model convertedModel = c.convert(config)

        expect:
        convertedModel == testOutput
    }

    def "Convert Excel 97-2003 File with Multiple Object per Row and Object and Data Properties"() {
        setup:
        ExcelConfig config = getExcelConfigBuilder("testFile.xls", "newestMapping.ttl")
                .containsHeaders(true)
                .build()
        Model convertedModel = c.convert(config)

        expect:
        convertedModel == testOutput
    }

    def "Convert Excel 97-2003 File with Formulas"() {
        setup:
        ExcelConfig config = getExcelConfigBuilder("formulaData.xls", "formulaMapping.ttl")
                .containsHeaders(true)
                .build()
        Model convertedModel = c.convert(config)

        expect:
        convertedModel == testFormulaOutput
    }

    def "Convert Excel 97-2003 File with Multiple Object per Row and Object and Data Properties with Blank Values"() {
        setup:
        ExcelConfig config = getExcelConfigBuilder("testFileWithBlanks.xls", "newestMapping.ttl")
                .containsHeaders(true)
                .build()
        Model convertedModel = c.convert(config)

        expect:
        convertedModel == testOutputWithBlanks
    }

    def "Convert Excel 97-2003 File with Multiple Object per Row and Object and Data Properties in Passed Ontologies"() {
        setup:
        ExcelConfig config = getExcelConfigBuilder("testFile.xls", "mappingAllDatatypes.ttl")
                .containsHeaders(true)
                .ontologies(Collections.singleton(ontology))
                .build()
        Model convertedModel = c.convert(config)

        expect:
        convertedModel == testOutputWithDatatypes
    }

    def "Convert Excel 97-2003 File with Multiple Object per Row and Object and Data Properties in Source Ontologies"() {
        setup:
        om.retrieveOntology(*_) >> Optional.of(ontology)
        ExcelConfig config = getExcelConfigBuilder("testFile.xls", "mappingWithSourceOntology.ttl")
                .containsHeaders(true)
                .build()
        Model convertedModel = c.convert(config)

        expect:
        convertedModel == testOutputWithDatatypes
    }

    def "Convert Excel 97-2003 File with Source Ontologies and Invalid Values for Range Datatypes"() {
        setup:
        om.retrieveOntology(*_) >> Optional.of(ontology)
        ExcelConfig config = getExcelConfigBuilder("testFileWithInvalidValues.xls", "mappingWithSourceOntology.ttl")
                .containsHeaders(true)
                .build()
        Model convertedModel = c.convert(config)

        expect:
        convertedModel == testOutputWithDatatypesAndInvalidValues
    }

    def "Convert Excel 2007 File with Multiple Object per Row and Object and Data Properties"() {
        setup:
        ExcelConfig config = getExcelConfigBuilder("testFile.xlsx", "newestMapping.ttl")
                .containsHeaders(true)
                .build()
        Model convertedModel = c.convert(config)

        expect:
        convertedModel == testOutput
    }

    def "Convert Excel 2007 File with Formulas"() {
        setup:
        ExcelConfig config = getExcelConfigBuilder("formulaData.xlsx", "formulaMapping.ttl")
                .containsHeaders(true)
                .build()
        Model convertedModel = c.convert(config)

        expect:
        convertedModel == testFormulaOutput
    }

    def "Convert Excel 2007 File with Multiple Object per Row and Object and Data Properties with Blank Values and Blank Rows"() {
        setup:
        ExcelConfig config = getExcelConfigBuilder("testFileWithBlanks.xlsx", "newestMapping.ttl")
                .containsHeaders(true)
                .build()
        Model convertedModel = c.convert(config)

        expect:
        convertedModel == testOutputWithBlanks
    }

    def "Convert Excel 2007 File with Formatting and Blank Values and Blank Rows"() {
        setup:
        ExcelConfig config = getExcelConfigBuilder("testFileWithFormattingAndBlanks.xlsx", "formattedExcelMapping.ttl")
                .containsHeaders(true)
                .build()

        when:
        Model convertedModel = c.convert(config)
        then:
        c.generateUuid() >>> ["abc", "bcd", "cdf", "dfg", "fgh", "ghi", "hij", "ijk", "jkl", "klm", "lmn", "mno", "nop",
                              "opq", "pqr", "qrs", "rst", "stu", "tuv", "uvw", "vwx", "wxy", "xyz", "yza", "zab", "123",
                              "234" , "345" , "456" , "567" , "678" , "789" , "890" , "987" , "876" , "765" , "654" ,
                              "543" , "432" , "321"]

        expect:
        convertedModel == testOutputWithFormattingAndBlanks
    }

    def "Convert Excel 2007 File with Multiple Object per Row and Object and Data Properties in Passed Ontologies"() {
        setup:
        ExcelConfig config = getExcelConfigBuilder("testFile.xlsx", "mappingAllDatatypes.ttl")
                .containsHeaders(true)
                .ontologies(Collections.singleton(ontology))
                .build()
        Model convertedModel = c.convert(config)

        expect:
        convertedModel == testOutputWithDatatypes
    }

    def "Convert Excel 2007 File with Multiple Object per Row and Object and Data Properties in Source Ontologies"() {
        setup:
        om.retrieveOntology(*_) >> Optional.of(ontology)
        ExcelConfig config = getExcelConfigBuilder("testFile.xlsx", "mappingWithSourceOntology.ttl")
                .containsHeaders(true)
                .build()
        Model convertedModel = c.convert(config)

        expect:
        convertedModel == testOutputWithDatatypes
    }

    def "Convert Excel 2007 File with Source Ontologies and Invalid Values for Range Datatypes"() {
        setup:
        om.retrieveOntology(*_) >> Optional.of(ontology)
        ExcelConfig config = getExcelConfigBuilder("testFileWithInvalidValues.xlsx", "mappingWithSourceOntology.ttl")
                .containsHeaders(true)
                .build()
        Model convertedModel = c.convert(config)

        expect:
        convertedModel == testOutputWithDatatypesAndInvalidValues
    }

    def "Test Generation of Local Name #localName Results in #result"() {
        setup:
        String[] nextLine = ["abcd","efgh","ijkl","mnop","qrst"]
        def cm = Mock(ClassMapping)

        when:
        def result2 = c.generateLocalName(cm, nextLine)

        then:
        c.generateUuid() >> "12345"
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

    def "Test Generation of Local Name #localName Results in #result when whitespace is present"() {
        setup:
        String[] nextLine = ["ab cd\t     \r\n","efgh","ij\tkl","mnop","qrst"]
        def cm = Mock(ClassMapping)

        when:
        def result2 = c.generateLocalName(cm, nextLine)

        then:
        c.generateUuid() >> "12345"
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
        SVConfig config = getSVConfigBuilder("testFile.csv", "newestMapping.ttl")
                .containsHeaders(true)
                .separator((char) ',')
                .limit(2)
                .build()
        Model convertedModel = c.convert(config)

        expect:
        convertedModel == testOutputLimitNoOffset
    }

    def "With a limit set with an offset"() {
        setup:
        SVConfig config = getSVConfigBuilder("testFile.csv", "newestMapping.ttl")
                .containsHeaders(true)
                .separator((char) ',')
                .limit(2)
                .offset(1)
                .build()
        Model convertedModel = c.convert(config)

        expect:
        convertedModel == testOutputLimitWithOffset
    }

    def "With an offset and headers"() {
        setup:
        SVConfig config = getSVConfigBuilder("testFile.csv", "newestMapping.ttl")
                .containsHeaders(true)
                .separator((char) ',')
                .offset(1)
                .build()
        Model convertedModel = c.convert(config)

        expect:
        convertedModel == testOutputOffset
    }

    def "Convert CSV File with an offset and headers and blank rows"() {
        setup:
        SVConfig config = getSVConfigBuilder("testFileWithBlanks.csv", "newestMapping.ttl")
                .containsHeaders(true)
                .separator((char) ',')
                .offset(2)
                .build()
        Model convertedModel = c.convert(config)

        expect:
        convertedModel == testOutputOffsetWithBlankRows
    }

    def "Convert Excel 97-2003 File with an offset and headers and blank rows"() {
        setup:
        ExcelConfig config = getExcelConfigBuilder("testFileWithBlanks.xls", "newestMapping.ttl")
                .containsHeaders(true)
                .offset(2)
                .build()
        Model convertedModel = c.convert(config)

        expect:
        convertedModel == testOutputOffsetWithBlankRows
    }

    def "Convert Excel 2007 File with an offset and headers and blank rows"() {
        setup:
        ExcelConfig config = getExcelConfigBuilder("testFileWithBlanks.xlsx", "newestMapping.ttl")
                .containsHeaders(true)
                .offset(2)
                .build()
        Model convertedModel = c.convert(config)

        expect:
        convertedModel == testOutputOffsetWithBlankRows
    }

    def "With an offset and no headers"() {
        setup:
        SVConfig config = getSVConfigBuilder("testFileNoHeaders.csv", "newestMapping.ttl")
                .containsHeaders(false)
                .separator((char) ',')
                .offset(1)
                .build()
        Model convertedModel = c.convert(config)

        expect:
        convertedModel == testOutputOffset
    }

    def "Convert File with Missing Properties Ignored"() {
        setup:
        SVConfig config = getSVConfigBuilder("testPropertiesMissing.csv", "newestMapping.ttl")
                .containsHeaders(true)
                .separator((char) ',')
                .build()
        Model convertedModel = c.convert(config)

        expect:
        convertedModel == testOutputPropertiesMissing
    }

    def "Missing prefix uses default prefix"() {
        setup:
        c.generateUuid() >>> ["abc", "bcd", "cdf", "dfg", "fgh", "ghi", "hij", "ijk", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345"]
        SVConfig config = getSVConfigBuilder("testFile.csv", "mapping_no-prefix.ttl")
                .containsHeaders(true)
                .separator((char) ',')
                .build()
        Model convertedModel = c.convert(config)

        expect:
        convertedModel == testOutputNoPrefix
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
        thrown(MobiETLException)
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
        thrown(MobiETLException)
    }

    private def getInputStream(String filename) {
        new ClassPathResource(filename).getInputStream()
    }

    private def loadModel(String filename) {
        loadModel(getInputStream(filename))
    }

    private def loadModel(InputStream stream) {
        Values.matontoModel(Rio.parse(stream, "", RDFFormat.TURTLE))
    }

    private def getSVConfigBuilder(String inputFilename, String mappingFilename) {
        new SVConfig.SVConfigBuilder(getInputStream(inputFilename), loadModel(mappingFilename))
    }

    private def getExcelConfigBuilder(String inputFilename, String mappingFilename) {
        new ExcelConfig.ExcelConfigBuilder(getInputStream(inputFilename), loadModel(mappingFilename))
    }
}
