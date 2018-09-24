package com.mobi.etl.service.delimited;

/*-
 * #%L
 * com.mobi.etl.csv
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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.google.common.base.CharMatcher;
import com.mobi.etl.api.config.delimited.ExcelConfig;
import com.mobi.etl.api.config.delimited.SVConfig;
import com.mobi.etl.api.delimited.DelimitedConverter;
import com.mobi.etl.api.exception.MobiETLException;
import com.mobi.etl.api.ontologies.delimited.ClassMapping;
import com.mobi.etl.api.ontologies.delimited.ClassMappingFactory;
import com.mobi.etl.api.ontologies.delimited.Mapping;
import com.mobi.etl.api.ontologies.delimited.MappingFactory;
import com.mobi.exception.MobiException;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.core.api.propertyexpression.DataProperty;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Literal;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rest.util.CharsetUtils;
import com.mobi.vocabularies.xsd.XSD;
import com.opencsv.CSVReader;
import org.apache.commons.lang3.NotImplementedException;
import org.apache.commons.lang3.StringUtils;
import org.apache.poi.openxml4j.exceptions.InvalidFormatException;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.FormulaEvaluator;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component(provide = DelimitedConverter.class)
public class DelimitedConverterImpl implements DelimitedConverter {
    private static final Logger LOGGER = LoggerFactory.getLogger(DelimitedConverterImpl.class);
    private static final String LOCAL_NAME_PATTERN = "\\$\\{(\\d+|UUID)\\}";
    private static final String DEFAULT_PREFIX = "http://mobi.com/data/";

    private ValueFactory valueFactory;
    private ModelFactory modelFactory;
    private MappingFactory mappingFactory;
    private ClassMappingFactory classMappingFactory;
    private OntologyManager ontologyManager;

    @Reference
    public void setValueFactory(ValueFactory valueFactory) {
        this.valueFactory = valueFactory;
    }

    @Reference
    public void setModelFactory(ModelFactory modelFactory) {
        this.modelFactory = modelFactory;
    }

    @Reference
    public void setMappingFactory(MappingFactory mappingFactory) {
        this.mappingFactory = mappingFactory;
    }

    @Reference
    public void setClassMappingFactory(ClassMappingFactory classMappingFactory) {
        this.classMappingFactory = classMappingFactory;
    }

    @Reference
    public void setOntologyManager(OntologyManager ontologyManager) {
        this.ontologyManager = ontologyManager;
    }

    @Override
    public Model convert(SVConfig config) throws IOException, MobiException {
        Mapping mapping = mappingFactory.getAllExisting(config.getMapping()).stream().findFirst().orElseThrow(() ->
                new IllegalArgumentException("Missing mapping object"));
        Set<Ontology> sourceOntologies = config.getOntologies().isEmpty() ? getSourceOntologies(mapping) :
                config.getOntologies();
        byte[] data = toByteArrayOutputStream(config.getData()).toByteArray();
        Charset charset = CharsetUtils.getEncoding(new ByteArrayInputStream(data)).orElseThrow(() ->
                new MobiException("Unsupported character set"));
        CSVReader reader = new CSVReader(new InputStreamReader(new ByteArrayInputStream(data), charset),
                config.getSeparator());
        Model convertedRDF = modelFactory.createModel();
        ArrayList<ClassMapping> classMappings = parseClassMappings(config.getMapping());
        long offset = config.getOffset();
        boolean containsHeaders = config.getContainsHeaders();

        // If headers exist, skip them
        if (containsHeaders) {
            reader.readNext();
        }

        // Skip to offset point
        while (reader.getLinesRead() - (containsHeaders ? 1 : 0) < offset) {
            System.out.println(reader.getLinesRead() - (containsHeaders ? 1 : 0));
            reader.readNext();
        }

        //Traverse each row and convert column into RDF
        String[] nextLine;
        long index = config.getOffset();
        Optional<Long> limit = config.getLimit();
        while ((nextLine = reader.readNext()) != null && (!limit.isPresent() || index < limit.get() + offset)) {
            //Exporting to CSV from Excel can cause empty rows to contain columns
            //Therefore, we must ensure at least one cell has values before processing the row
            boolean rowContainsValues = false;
            for (String cell : nextLine) {
                if (!cell.isEmpty()) {
                    rowContainsValues = true;
                    writeClassMappingsToModel(convertedRDF, nextLine, classMappings, sourceOntologies);
                    break;
                }
            }
            if (!rowContainsValues) {
                LOGGER.debug(String.format("Skipping empty row number: %d", index + 1));
            }
            index++;
        }
        return convertedRDF;
    }

    @Override
    public Model convert(ExcelConfig config) throws IOException, MobiException {
        Mapping mapping = mappingFactory.getAllExisting(config.getMapping()).stream().findFirst().orElseThrow(() ->
                new IllegalArgumentException("Missing mapping object"));
        Set<Ontology> sourceOntologies = config.getOntologies().isEmpty() ? getSourceOntologies(mapping) :
                config.getOntologies();
        String[] nextRow;
        Model convertedRDF = modelFactory.createModel();
        ArrayList<ClassMapping> classMappings = parseClassMappings(config.getMapping());

        try {
            Workbook wb = WorkbookFactory.create(config.getData());
            FormulaEvaluator evaluator = wb.getCreationHelper().createFormulaEvaluator();
            Sheet sheet = wb.getSheetAt(0);
            DataFormatter df = new DataFormatter();
            boolean containsHeaders = config.getContainsHeaders();
            long offset = config.getOffset();
            Optional<Long> limit = config.getLimit();
            long lastRowNumber = -1;

            //Traverse each row and convert column into RDF
            for (Row row : sheet) {
                // If headers exist or the row is before the offset point, skip the row
                if ((containsHeaders && row.getRowNum() == 0) || row.getRowNum() - (containsHeaders ? 1 : 0) < offset
                        || (limit.isPresent() && row.getRowNum() >= limit.get() + offset)) {
                    lastRowNumber++;
                    continue;
                }
                // Logging the automatic skip of empty rows with no formatting
                while (row.getRowNum() > lastRowNumber + 1) {
                    LOGGER.debug(String.format("Skipping empty row number: %d", lastRowNumber + 1));
                    lastRowNumber++;
                }
                //getLastCellNumber instead of getPhysicalNumberOfCells so that blank values don't cause cells to shift
                nextRow = new String[row.getLastCellNum()];
                boolean rowContainsValues = false;
                for (int i = 0; i < row.getLastCellNum(); i++) {
                    nextRow[i] = df.formatCellValue(row.getCell(i), evaluator);
                    if (!rowContainsValues && !nextRow[i].isEmpty()) {
                        rowContainsValues = true;
                    }
                }
                //Skipping empty rows
                if (rowContainsValues) {
                    writeClassMappingsToModel(convertedRDF, nextRow, classMappings, sourceOntologies);
                } else {
                    LOGGER.debug(String.format("Skipping empty row number: %d", row.getRowNum()));
                }
                lastRowNumber++;
            }
        } catch (InvalidFormatException | NotImplementedException e) {
            throw new MobiException(e);
        }

        return convertedRDF;
    }

    /**
     * Processes a row of data into RDF using class mappings and adds it to the given Model.
     *
     * @param convertedRDF  the model to hold the converted data
     * @param line          the data to convert
     * @param classMappings the classMappings to use when converting the data
     */
    private void writeClassMappingsToModel(Model convertedRDF, String[] line, List<ClassMapping> classMappings,
                                           Set<Ontology> sourceOntologies) {
        // Map holds ClassMappings to instance IRIs. Modified by writeClassToModel().
        Map<com.mobi.rdf.api.Resource, IRI> mappedClasses = new HashMap<>();
        for (ClassMapping cm : classMappings) {
            convertedRDF.addAll(writeClassToModel(cm, line, mappedClasses, sourceOntologies));
        }
    }

    /**
     * Generates a UUID for use in new RDF instances. Separate method allows for testing.
     *
     * @return A String with a Universally Unique Identifier
     */
    public String generateUuid() {
        return UUID.randomUUID().toString();
    }

    /**
     * Creates a Model of RDF statements based on a class mapping and a line of data from CSV.
     *
     * @param cm            The ClassMapping object to guide the RDF creation
     * @param nextLine      The line of CSV to be mapped
     * @param mappedClasses The Map holding previously processed ClassMappings and their associated instance IRIs.
     *                      Modified by this method.
     * @return A Model of RDF based on the line of CSV data
     */
    private Model writeClassToModel(ClassMapping cm, String[] nextLine, Map<com.mobi.rdf.api.Resource, IRI> mappedClasses,
                                    Set<Ontology> sourceOntologies) {
        Model convertedRDF = modelFactory.createModel();

        IRI classInstance;
        if (mappedClasses.containsKey(cm.getResource())) {
            classInstance = mappedClasses.get(cm.getResource());
        } else {
            Optional<String> nameOptional = generateLocalName(cm, nextLine);
            if (!nameOptional.isPresent()) {
                return convertedRDF;
            }

            Iterator<String> prefixes = cm.getHasPrefix().iterator();
            if (prefixes.hasNext()) {
                classInstance = valueFactory.createIRI(prefixes.next() + nameOptional.get());
            } else {
                classInstance = valueFactory.createIRI(DEFAULT_PREFIX + nameOptional.get());
            }
        }

        Set<com.mobi.rdf.api.Resource> mapsTo = cm.getMapsTo_resource();
        mapsTo.forEach(resource ->
                        convertedRDF.add(classInstance,
                                valueFactory.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI), resource));
        if (mapsTo.isEmpty()) {
            throw new MobiETLException("Invalid mapping configuration. Missing mapsTo property on "
                    + cm.getResource());
        }

        mappedClasses.put(cm.getResource(), classInstance);

        cm.getDataProperty().forEach(dataMapping -> {
            // Default datatype is xsd:string
            final IRI[] datatype = {valueFactory.createIRI(XSD.STRING)};
            Iterator<Value> datatypeIterator = dataMapping.getDatatypeSpec().iterator();
            int columnIndex = dataMapping.getColumnIndex().iterator().next();
            com.mobi.rdf.api.Resource prop = dataMapping.getHasProperty_resource().iterator().next();

            // If the column exists
            if (columnIndex < nextLine.length && columnIndex >= 0) {
                // If the value is not empty
                if (!StringUtils.isEmpty(nextLine[columnIndex])) {
                    // Determine the datatype for the data property range
                    if (datatypeIterator.hasNext()) {
                        datatype[0] = (IRI) datatypeIterator.next();
                    } else {
                        sourceOntologies.stream()
                                .filter(ontology -> ontology.getDataProperty((IRI) prop).isPresent())
                                .findFirst()
                                .ifPresent(ontology -> {
                                    DataProperty dataProperty = ontology.getDataProperty((IRI) prop).get();
                                    ontology.getDataPropertyRange(dataProperty).stream()
                                            .findFirst()
                                            .ifPresent(resource -> datatype[0] = (IRI) resource);
                                });
                    }
                    Literal literal = valueFactory.createLiteral(nextLine[columnIndex], datatype[0]);
                    // Only add literal if valid with the datatype
                    if (isValidValue(literal, datatype[0])) {
                        convertedRDF.add(classInstance, (IRI) prop, literal);
                    } else {
                        LOGGER.warn(String.format("Column value %s not valid for range type %s of %s: %s",
                                literal.stringValue(), datatype[0].stringValue(), classInstance.stringValue(),
                                prop.stringValue()));
                    }
                } // else don't create a stmt for blank values
            } else {
                LOGGER.warn(String.format("Column %d missing for %s: %s",
                        columnIndex, classInstance.stringValue(), prop.stringValue()));
            }
        });

        cm.getObjectProperty().forEach(objectMapping -> {
            ClassMapping targetClassMapping;
            Iterator<ClassMapping> classMappingIterator = objectMapping.getClassMapping().iterator();
            if (classMappingIterator.hasNext()) {
                targetClassMapping = classMappingIterator.next();
            } else {
                throw new MobiETLException("Invalid mapping configuration. Missing classMapping property on "
                        + objectMapping.getResource());
            }

            com.mobi.rdf.api.Resource prop = objectMapping.getHasProperty_resource().iterator().next();

            IRI targetIri;
            if (mappedClasses.containsKey(targetClassMapping.getResource())) {
                targetIri = mappedClasses.get(targetClassMapping.getResource());
            } else {
                Optional<String> targetNameOptional = generateLocalName(targetClassMapping, nextLine);
                if (!targetNameOptional.isPresent()) {
                    return;
                } else {
                    targetIri = valueFactory.createIRI(targetClassMapping.getHasPrefix().iterator().next()
                            + targetNameOptional.get());
                    mappedClasses.put(targetClassMapping.getResource(), targetIri);
                }
            }

            convertedRDF.add(classInstance, valueFactory.createIRI(prop.stringValue()), targetIri);
        });

        return convertedRDF;
    }

    /**
     * Generates a local name for RDF Instances. If no local name is configured in the ClassMapping, a random UUID
     * is generated.
     *
     * @param cm          That ClassMapping from which to retrieve the local name template if it exists
     * @param currentLine The current line in the CSV file in case data is used in the Local Name
     * @return The local name portion of a IRI used in RDF data
     */
    Optional<String> generateLocalName(ClassMapping cm, String[] currentLine) {
        Optional<String> nameOptional = cm.getLocalName();

        if (!nameOptional.isPresent() || nameOptional.get().trim().isEmpty()) {
            //Only generate UUIDs when necessary. If you really have to waste a UUID go here: http://wasteaguid.info/
            return Optional.of(generateUuid());
        }

        Pattern pat = Pattern.compile(LOCAL_NAME_PATTERN);
        Matcher mat = pat.matcher(nameOptional.get());
        StringBuffer result = new StringBuffer();
        while (mat.find()) {
            if ("UUID".equals(mat.group(1))) {
                //Once again, only generate UUIDs when necessary
                mat.appendReplacement(result, generateUuid());
            } else {
                int colIndex = Integer.parseInt(mat.group(1));
                if (colIndex < currentLine.length && colIndex >= 0) {
                    //remove whitespace
                    String replacement = CharMatcher.WHITESPACE.removeFrom(currentLine[colIndex]);
                    if (LOGGER.isDebugEnabled() && !replacement.equals(currentLine[colIndex])) {
                        LOGGER.debug(String.format("Local name for IRI was converted from \"%s\" to \"%s\" in order to"
                                + "remove whitespace.", currentLine[colIndex], replacement));
                    }
                    mat.appendReplacement(result, replacement);
                } else {
                    LOGGER.warn(String.format("Missing data for local name from column %d", colIndex));
                    return Optional.empty();
                }
            }
        }
        mat.appendTail(result);
        return Optional.of(result.toString());
    }

    /**
     * Parse the data from the Mapping File into ClassMapping POJOs
     *
     * @param mappingModel The Mapping File used to parse CSV data in a Model
     * @return An ArrayList of ClassMapping Objects created from the mapping model.
     */
    private ArrayList<ClassMapping> parseClassMappings(Model mappingModel) {
        ArrayList<ClassMapping> classMappings = new ArrayList<>();

        Model classMappingModel = mappingModel.filter(null,
                valueFactory.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI),
                valueFactory.createIRI(ClassMapping.TYPE));
        classMappingModel.subjects().forEach(cmSubject -> {
            classMappingFactory.getExisting(cmSubject, mappingModel).ifPresent(classMappings::add);
        });

        return classMappings;
    }

    /**
     * Creates a ByteArrayOutputStream from an InputStream so it can be reused.
     *
     * @param in the InputStream to convert
     * @return a ByteArrayOutputStream with the contents of the InputStream
     * @throws IOException if a error occurs when accessing the InputStream contents
     */
    private ByteArrayOutputStream toByteArrayOutputStream(InputStream in) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        byte[] buffer = new byte[1024];
        int read;
        while ((read = in.read(buffer, 0, buffer.length)) != -1) {
            baos.write(buffer, 0, read);
            baos.flush();
        }
        return baos;
    }

    private Set<Ontology> getSourceOntologies(Mapping mapping) {
        Optional<com.mobi.rdf.api.Resource> recordIRI = mapping.getSourceRecord_resource();
        Optional<com.mobi.rdf.api.Resource> branchIRI = mapping.getSourceBranch_resource();
        Optional<com.mobi.rdf.api.Resource> commitIRI = mapping.getSourceCommit_resource();
        if (recordIRI.isPresent() && branchIRI.isPresent() && commitIRI.isPresent()) {
            Optional<Ontology> ontology = ontologyManager.retrieveOntology(recordIRI.get(), branchIRI.get(),
                    commitIRI.get());
            if (ontology.isPresent()) {
                return ontology.get().getImportsClosure();
            }
        }
        return Collections.emptySet();
    }

    private boolean isValidValue(Literal literal, IRI datatype) {
        try {
            switch (datatype.stringValue()) {
                case XSD.INT:
                case XSD.INTEGER:
                    literal.intValue();
                    return true;
                case XSD.BOOLEAN:
                    literal.booleanValue();
                    return true;
                case XSD.DOUBLE:
                    literal.doubleValue();
                    return true;
                case XSD.FLOAT:
                    literal.floatValue();
                    return true;
                case XSD.LONG:
                    literal.longValue();
                    return true;
                case XSD.SHORT:
                    literal.shortValue();
                    return true;
                case XSD.BYTE:
                    literal.byteValue();
                    return true;
                case XSD.DATE:
                case XSD.DATE_TIME:
                case XSD.DATE_TIME_STAMP:
                case XSD.TIME:
                    literal.dateTimeValue();
                    return true;
                case XSD.ANYURI:
                    valueFactory.createIRI(literal.stringValue());
                    return true;
                default:
                    return true;
            }
        } catch (Exception ex) {
            return false;
        }
    }
}
