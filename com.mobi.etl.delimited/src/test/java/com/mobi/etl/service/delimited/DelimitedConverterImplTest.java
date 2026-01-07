package com.mobi.etl.service.delimited;

/*-
 * #%L
 * com.mobi.etl.delimited
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.when;

import com.mobi.etl.api.config.delimited.ExcelConfig;
import com.mobi.etl.api.config.delimited.SVConfig;
import com.mobi.etl.api.exception.MobiETLException;
import com.mobi.etl.api.ontologies.delimited.ClassMapping;
import com.mobi.ontology.core.api.DataProperty;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.vocabularies.xsd.XSD;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.io.InputStream;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

public class DelimitedConverterImplTest extends OrmEnabledTestCase {
    private AutoCloseable closeable;
    private DelimitedConverterImpl converter;
    @Mock
    private OntologyManager om;
    @Mock
    private Ontology ontology;
    @Mock
    private DataProperty formulaProperty;
    @Mock
    private DataProperty densityProperty;
    @Mock
    private DataProperty latticeParameterProperty;
    @Mock
    private DataProperty sourceProperty;
    @Mock
    private DataProperty testedProperty;
    @Mock
    private DataProperty countProperty;
    @Mock
    private DataProperty dateRecordedProperty;

    private Model testOutput;
    private Model testFormulaOutput;
    private Model testOutputWithDatatypes;
    private Model testOutputWithBlanks;
    private Model testOutputWithMultiIndexUsages;
    private Model testOutputWithFormattingAndBlanks;
    private Model testOutputWithDatatypesAndInvalidValues;
    private Model testOutputLimitNoOffset;
    private Model testOutputLimitWithOffset;
    private Model testOutputOffset;
    private Model testOutputOffsetWithBlankRows;
    private Model testOutputPropertiesMissing;
    private Model testOutputNoPrefix;

    @Before
    public void setup() throws Exception {
        testOutput = loadModel("testOutput.ttl");
        testFormulaOutput = loadModel("testFormulaOutput.ttl");
        testOutputWithDatatypes = loadModel("testOutputWithDatatypes.ttl");
        testOutputWithBlanks = loadModel("testOutputWithBlanks.ttl");
        testOutputWithMultiIndexUsages = loadModel("testOutputWithMultiIndexUsages.ttl");
        testOutputWithFormattingAndBlanks = loadModel("testOutputWithFormattingAndBlanks.ttl");
        testOutputWithDatatypesAndInvalidValues = loadModel("testOutputWithDatatypesAndInvalidValues.ttl");
        testOutputLimitNoOffset = loadModel("testLimitNoOffsetOutput.ttl");
        testOutputLimitWithOffset = loadModel("testLimitWithOffsetOutput.ttl");
        testOutputOffset = loadModel("testOffsetOutput.ttl");
        testOutputOffsetWithBlankRows = loadModel("testOffsetOutputWithBlankRows.ttl");
        testOutputPropertiesMissing = loadModel("testPropertiesMissingOut.ttl");
        testOutputNoPrefix = loadModel("output_no-prefix.ttl");

        closeable = MockitoAnnotations.openMocks(this);

        converter = spy(new DelimitedConverterImpl());
        injectOrmFactoryReferencesIntoService(converter);
        converter.setOntologyManager(om);
        when(converter.generateUuid()).thenReturn("abc", "bcd", "cdf", "dfg", "fgh", "ghi", "hij", "ijk", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345");
        when(ontology.getImportsClosure()).thenReturn(Collections.singleton(ontology));
        when(ontology.getDataProperty(VALUE_FACTORY.createIRI("http://mobi.com/ontologies/uhtc/formula"))).thenReturn(Optional.of(formulaProperty));
        when(ontology.getDataPropertyRange(formulaProperty)).thenReturn(Collections.emptySet());
        when(ontology.getDataProperty(VALUE_FACTORY.createIRI("http://mobi.com/ontologies/uhtc/density"))).thenReturn(Optional.of(densityProperty));
        when(ontology.getDataPropertyRange(densityProperty)).thenReturn(Collections.singleton(VALUE_FACTORY.createIRI(XSD.DOUBLE)));
        when(ontology.getDataProperty(VALUE_FACTORY.createIRI("http://mobi.com/ontologies/uhtc/latticeParameter"))).thenReturn(Optional.of(latticeParameterProperty));
        when(ontology.getDataPropertyRange(latticeParameterProperty)).thenReturn(Collections.singleton(VALUE_FACTORY.createIRI(XSD.FLOAT)));
        when(ontology.getDataProperty(VALUE_FACTORY.createIRI("http://mobi.com/ontologies/uhtc/source"))).thenReturn(Optional.of(sourceProperty));
        when(ontology.getDataPropertyRange(sourceProperty)).thenReturn(Collections.singleton(VALUE_FACTORY.createIRI(XSD.ANYURI)));
        when(ontology.getDataProperty(VALUE_FACTORY.createIRI("http://mobi.com/ontologies/uhtc/tested"))).thenReturn(Optional.of(testedProperty));
        when(ontology.getDataPropertyRange(testedProperty)).thenReturn(Collections.singleton(VALUE_FACTORY.createIRI(XSD.BOOLEAN)));
        when(ontology.getDataProperty(VALUE_FACTORY.createIRI("http://mobi.com/ontologies/uhtc/count"))).thenReturn(Optional.of(countProperty));
        when(ontology.getDataPropertyRange(countProperty)).thenReturn(Collections.singleton(VALUE_FACTORY.createIRI(XSD.INTEGER)));
        when(ontology.getDataProperty(VALUE_FACTORY.createIRI("http://mobi.com/ontologies/uhtc/dateRecorded"))).thenReturn(Optional.of(dateRecordedProperty));
        when(ontology.getDataPropertyRange(dateRecordedProperty)).thenReturn(Collections.singleton(VALUE_FACTORY.createIRI(XSD.DATE_TIME)));
        when(om.retrieveOntology(any(), any(), any())).thenReturn(Optional.of(ontology));
    }

    @After
    public void reset() throws Exception {
        closeable.close();
    }

    @Test
    public void Convert_CSV_File_with_Multiple_Object_per_Row_and_Object_and_Data_Properties() throws Exception {
        // Setup
        SVConfig config = getSVConfigBuilder("testFile.csv", "newestMapping.ttl").containsHeaders(true).separator(',').build();

        testAndDeleteFile(config, testOutput);
    }

    @Test
    public void Convert_CSV_File_with_Multiple_Object_per_Row_and_Object_and_Data_Properties_with_Blank_Values() throws Exception {
        // Setup
        SVConfig config = getSVConfigBuilder("testFileWithBlanks.csv", "newestMapping.ttl").containsHeaders(true).separator(',').build();

        testAndDeleteFile(config, testOutputWithBlanks);
    }

    @Test
    public void Convert_CSV_File_with_Multiple_Object_per_Row_and_Object_and_Data_Properties_with_Multiple_Index_Usages() throws Exception {
        // Setup
        SVConfig config = getSVConfigBuilder("testFile.csv", "mapping_multi-props-same-index.ttl").containsHeaders(true).separator(',').build();

        testAndDeleteFile(config, testOutputWithMultiIndexUsages);
    }

    @Test
    public void Convert_CSV_File_with_Multiple_Object_per_Row_and_Object_and_Data_Properties_in_Passed_Ontologies() throws Exception {
        // Setup
        SVConfig config = getSVConfigBuilder("testFile.csv", "mappingAllDatatypes.ttl").containsHeaders(true).ontologies(Collections.singleton(ontology)).separator(',').build();

        testAndDeleteFile(config, testOutputWithDatatypes);
    }

    @Test
    public void Convert_CSV_File_with_Multiple_Object_per_Row_and_Object_and_Data_Properties_in_Source_Ontologies() throws Exception {
        // Setup
        when(om.retrieveOntology(any(), any(), any())).thenReturn(Optional.of(ontology));
        SVConfig config = getSVConfigBuilder("testFile.csv", "mappingWithSourceOntology.ttl").containsHeaders(true).separator(',').build();

        testAndDeleteFile(config,  testOutputWithDatatypes);
    }

    @Test
    public void Convert_CSV_File_with_Source_Ontologies_and_Invalid_Values_for_Range_Datatypes() throws Exception {
        // Setup
        when(om.retrieveOntology(any(), any(), any())).thenReturn(Optional.of(ontology));
        SVConfig config = getSVConfigBuilder("testFileWithInvalidValues.csv", "mappingWithSourceOntology.ttl").containsHeaders(true).separator(',').build();

        testAndDeleteFile(config, testOutputWithDatatypesAndInvalidValues);
    }

    @Test
    public void Test_non_comma_separator() throws Exception {
        // Setup
        SVConfig config = getSVConfigBuilder("semicolonFile.csv", "newestMapping.ttl").containsHeaders(true).separator(';').build();

        testAndDeleteFile(config, testOutput);
    }

    @Test
    public void Tab_Separated() throws Exception {
        // Setup
        SVConfig config = getSVConfigBuilder("tabFile.csv", "newestMapping.ttl").containsHeaders(true).separator('\t').build();

        testAndDeleteFile(config, testOutput);
    }

    @Test
    public void Tab_Separated_with_Blanks() throws Exception {
        // Setup
        SVConfig config = getSVConfigBuilder("tabFileWithBlanks.csv", "newestMapping.ttl").containsHeaders(true).separator('\t').build();

        testAndDeleteFile(config, testOutputWithBlanks);
    }

    @Test
    public void Mapping_with_default_Local_Name() throws Exception {
        // Setup
        SVConfig config = getSVConfigBuilder("testFile.csv", "mappingNoLocalName.ttl").containsHeaders(true).separator(',').build();

        testAndDeleteFile(config, testOutput);
    }

    @Test
    public void Without_headers() throws Exception {
        // Setup
        SVConfig config = getSVConfigBuilder("testFileNoHeaders.csv", "newestMapping.ttl").containsHeaders(false).separator(',').build();

        testAndDeleteFile(config, testOutput);
    }

    @Test
    public void Convert_Excel_2007_File_with_Multiple_Object_per_Row_and_Object_and_Data_Properties() throws Exception {
        // Setup
        ExcelConfig config = getExcelConfigBuilder("testFile.xlsx", "newestMapping.ttl").containsHeaders(true).build();

        testAndDeleteFile(config, testOutput);
    }

    @Test
    public void Convert_Excel_2007_File_with_Formulas() throws Exception {
        // Setup
        ExcelConfig config = getExcelConfigBuilder("formulaData.xlsx", "formulaMapping.ttl").containsHeaders(true).build();

        testAndDeleteFile(config, testFormulaOutput);
    }

    @Test
    public void Convert_Excel_2007_File_with_Multiple_Object_per_Row_and_Object_and_Data_Properties_with_Blank_Values_and_Blank_Rows() throws Exception {
        // Setup
        ExcelConfig config = getExcelConfigBuilder("testFileWithBlanks.xlsx", "newestMapping.ttl").containsHeaders(true).build();

        testAndDeleteFile(config, testOutputWithBlanks);
    }

    @Test
    public void Convert_Excel_2007_File_with_Formatting_and_Blank_Values_and_Blank_Rows() throws Exception {
        // Setup
        ExcelConfig config = getExcelConfigBuilder("testFileWithFormattingAndBlanks.xlsx", "formattedExcelMapping.ttl").containsHeaders(true).build();
        when(converter.generateUuid()).thenReturn("abc", "bcd", "cdf", "dfg", "fgh", "ghi", "hij", "ijk", "jkl", "klm", "lmn", "mno", "nop", "opq", "pqr", "qrs", "rst", "stu", "tuv", "uvw", "vwx", "wxy", "xyz", "yza", "zab", "123", "234", "345", "456", "567", "678", "789", "890", "987", "876", "765", "654", "543", "432", "321");

        testAndDeleteFile(config, testOutputWithFormattingAndBlanks);
    }

    @Test
    public void Convert_Excel_2007_File_with_Multiple_Object_per_Row_and_Object_and_Data_Properties_in_Passed_Ontologies() throws Exception {
        // Setup
        ExcelConfig config = getExcelConfigBuilder("testFile.xlsx", "mappingAllDatatypes.ttl").containsHeaders(true).ontologies(Collections.singleton(ontology)).build();

        testAndDeleteFile(config, testOutputWithDatatypes);
    }

    @Test
    public void Convert_Excel_2007_File_with_Multiple_Object_per_Row_and_Object_and_Data_Properties_in_Source_Ontologies() throws Exception {
        // Setup
        when(om.retrieveOntology(any(), any(), any())).thenReturn(Optional.of(ontology));
        ExcelConfig config = getExcelConfigBuilder("testFile.xlsx", "mappingWithSourceOntology.ttl").containsHeaders(true).build();
        testAndDeleteFile(config, testOutputWithDatatypes);
    }

    @Test
    public void Convert_Excel_2007_File_with_Source_Ontologies_and_Invalid_Values_for_Range_Datatypes() throws Exception {
        // Setup
        when(om.retrieveOntology(any(), any(), any())).thenReturn(Optional.of(ontology));
        ExcelConfig config = getExcelConfigBuilder("testFileWithInvalidValues.xlsx", "mappingWithSourceOntology.ttl").containsHeaders(true).build();

        testAndDeleteFile(config, testOutputWithDatatypesAndInvalidValues);
    }

    @Test
    public void Test_Generation_of_Local_Name__localName_Results_in__result() throws Exception {
        // Setup
        String[] nextLine = new String[]{"abcd", "efgh", "ijkl", "mnop", "qrst"};
        ClassMapping cm = mock(ClassMapping.class);
        when(converter.generateUuid()).thenReturn("12345");
        Map<String, String> tests = new HashMap<>();
        tests.put("${UUID}", "12345");
        tests.put("${UUID}/${0}", "12345/abcd");
        tests.put("${0}", "abcd");
        tests.put("${0}/${UUID}", "abcd/12345");
        tests.put("${0}/${UUID}/${2}", "abcd/12345/ijkl");
        tests.put("${0}/${0}", "abcd/abcd");
        tests.put("", "12345");
        tests.put(null, "12345");

        tests.forEach((localName, result) -> {
            when(cm.getLocalName()).thenReturn(Optional.ofNullable(localName));

            Optional<String> result2 = converter.generateLocalName(cm, nextLine);
            assertTrue(result2.isPresent());
            assertEquals(result, result2.get());
        });
    }

    @Test
    public void Test_Generation_of_Local_Name__localName_Results_in__result_when_whitespace_is_present() throws Exception {
        // Setup
        String[] nextLine = new String[]{"ab cd\t     \r\n", "efgh", "ij\tkl", "mnop", "qrst"};
        ClassMapping cm = mock(ClassMapping.class);
        when(converter.generateUuid()).thenReturn("12345");
        Map<String, String> tests = new HashMap<>();
        tests.put("${UUID}", "12345");
        tests.put("${UUID}/${0}", "12345/abcd");
        tests.put("${0}", "abcd");
        tests.put("${0}/${UUID}", "abcd/12345");
        tests.put("${0}/${UUID}/${2}", "abcd/12345/ijkl");
        tests.put("${0}/${0}", "abcd/abcd");
        tests.put("", "12345");
        tests.put(null, "12345");
        tests.forEach((localName, result) -> {
            when(cm.getLocalName()).thenReturn(Optional.ofNullable(localName));

            Optional<String> result2 = converter.generateLocalName(cm, nextLine);
            assertTrue(result2.isPresent());
            assertEquals(result, result2.get());
        });
    }

    @Test
    public void Test_Generation_of_Local_Name_with_missing_columns_results_in_empty_optional() throws Exception {
        // Setup
        String[] nextLine = new String[]{"abcd", "efgh", "ijkl", "mnop", "qrst"};
        when(converter.generateUuid()).thenReturn("12345");
        ClassMapping cm = mock(ClassMapping.class);
        when(cm.getLocalName()).thenReturn(Optional.of("\\${UUID}/\\${5}/\\${0}"));

        Optional<String> result2 = converter.generateLocalName(cm, nextLine);
        assertTrue(result2.isEmpty());
    }

    @Test
    public void With_a_limit_set_with_no_offset() throws Exception {
        // Setup
        SVConfig config = getSVConfigBuilder("testFile.csv", "newestMapping.ttl").containsHeaders(true).separator(',').limit(2L).build();

        testAndDeleteFile(config, testOutputLimitNoOffset);
    }

    @Test
    public void With_a_limit_set_with_an_offset() throws Exception {
        // Setup
        SVConfig config = getSVConfigBuilder("testFile.csv", "newestMapping.ttl").containsHeaders(true).separator(',').limit(2L).offset(1).build();

        testAndDeleteFile(config, testOutputLimitWithOffset);
    }

    @Test
    public void With_an_offset_and_headers() throws Exception {
        // Setup
        SVConfig config = getSVConfigBuilder("testFile.csv", "newestMapping.ttl").containsHeaders(true).separator(',').offset(1).build();

        testAndDeleteFile(config, testOutputOffset);
    }

    @Test
    public void Convert_CSV_File_with_an_offset_and_headers_and_blank_rows() throws Exception {
        // Setup
        SVConfig config = getSVConfigBuilder("testFileWithBlanks.csv", "newestMapping.ttl").containsHeaders(true).separator(',').offset(2).build();

        testAndDeleteFile(config, testOutputOffsetWithBlankRows);
    }

    @Test
    public void Convert_Excel_2007_File_with_an_offset_and_headers_and_blank_rows() throws Exception {
        // Setup
        ExcelConfig config = getExcelConfigBuilder("testFileWithBlanks.xlsx", "newestMapping.ttl").containsHeaders(true).offset(2).build();

        testAndDeleteFile(config, testOutputOffsetWithBlankRows);
    }

    @Test
    public void With_an_offset_and_no_headers() throws Exception {
        // Setup
        SVConfig config = getSVConfigBuilder("testFileNoHeaders.csv", "newestMapping.ttl").containsHeaders(false).separator(',').offset(1).build();

        testAndDeleteFile(config, testOutputOffset);
    }

    @Test
    public void Convert_File_with_Missing_Properties_Ignored() throws Exception {
        // Setup
        SVConfig config = getSVConfigBuilder("testPropertiesMissing.csv", "newestMapping.ttl").containsHeaders(true).separator(',').build();

        testAndDeleteFile(config, testOutputPropertiesMissing);
    }

    @Test
    public void Missing_prefix_uses_default_prefix() throws Exception {
        // Setup
        when(converter.generateUuid()).thenReturn("abc", "bcd", "cdf", "dfg", "fgh", "ghi", "hij", "ijk", "jkl", "klm", "lmn", "nop", "pqr", "rst", "tuv", "vwx", "xyz", "123", "345");
        SVConfig config = getSVConfigBuilder("testFile.csv", "mapping_no-prefix.ttl").containsHeaders(true).separator(',').build();

        testAndDeleteFile(config, testOutputNoPrefix);
    }

    @Test(expected = MobiETLException.class)
    public void Missing_mapsTo_throws_an_exception() throws Exception {
        // Setup
        SVConfig config = new SVConfig.SVConfigBuilder(getInputStream("testFile.csv"), Charset.defaultCharset(), loadModel("mapping_no-mapsTo.ttl")).containsHeaders(true).separator(',').build();

        converter.convert(config);
    }

    @Test(expected = MobiETLException.class)
    public void Missing_classMapping_throws_an_exception() throws Exception {
        // Setup
        SVConfig config = new SVConfig.SVConfigBuilder(getInputStream("testFile.csv"), Charset.defaultCharset(), loadModel("mapping_no-classMapping.ttl")).containsHeaders(true).separator(',').build();

        converter.convert(config);
    }

    private InputStream getInputStream(String filename) {
        return this.getClass().getResourceAsStream("/" + filename);
    }

    private Model loadModel(String filename) throws Exception {
        return loadModel(getInputStream(filename));
    }

    private Model loadModel(InputStream stream) throws Exception {
        return Rio.parse(stream, "", RDFFormat.TURTLE);
    }

    private SVConfig.SVConfigBuilder getSVConfigBuilder(String inputFilename, String mappingFilename) throws Exception {
        return new SVConfig.SVConfigBuilder(getInputStream(inputFilename), Charset.defaultCharset(), loadModel(mappingFilename));
    }

    private ExcelConfig.ExcelConfigBuilder getExcelConfigBuilder(String inputFilename, String mappingFilename) throws Exception {
        return new ExcelConfig.ExcelConfigBuilder(getInputStream(inputFilename), Charset.defaultCharset(), loadModel(mappingFilename));
    }

    private void testAndDeleteFile(SVConfig config, Model output) throws Exception {
        Path path = converter.convert(config);
        testAndDeleteFile(path, output);
    }

    private void testAndDeleteFile(ExcelConfig config, Model output) throws Exception {
        Path path = converter.convert(config);
        testAndDeleteFile(path, output);
    }

    private void testAndDeleteFile(Path path, Model output) throws Exception {
        try (InputStream is = Files.newInputStream(path)) {
            Model convertedModel = Rio.parse(is, RDFFormat.TURTLE);
            assertEquals(convertedModel, output);
        } finally {
            try {
                Files.delete(path);
            } catch (Exception e) {
                // Ignore
            }
        }
    }
}
