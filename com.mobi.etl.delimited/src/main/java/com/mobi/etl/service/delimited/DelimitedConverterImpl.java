package com.mobi.etl.service.delimited;

/*-
 * #%L
 * com.mobi.etl.csv
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import static com.google.common.base.CharMatcher.whitespace;
import static com.mobi.etl.api.delimited.ExcelUtils.getCellText;

import com.mobi.etl.api.config.delimited.ExcelConfig;
import com.mobi.etl.api.config.delimited.SVConfig;
import com.mobi.etl.api.delimited.DelimitedConverter;
import com.mobi.etl.api.exception.MobiETLException;
import com.mobi.etl.api.ontologies.delimited.ClassMapping;
import com.mobi.etl.api.ontologies.delimited.ClassMappingFactory;
import com.mobi.etl.api.ontologies.delimited.Mapping;
import com.mobi.etl.api.ontologies.delimited.MappingFactory;
import com.mobi.exception.MobiException;
import com.mobi.ontology.core.api.DataProperty;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.vocabularies.xsd.XSD;
import com.opencsv.CSVParser;
import com.opencsv.CSVParserBuilder;
import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import com.opencsv.exceptions.CsvValidationException;
import org.apache.commons.lang3.StringUtils;
import org.dhatim.fastexcel.reader.Cell;
import org.dhatim.fastexcel.reader.ReadableWorkbook;
import org.dhatim.fastexcel.reader.ReadingOptions;
import org.dhatim.fastexcel.reader.Sheet;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.WriterConfig;
import org.eclipse.rdf4j.rio.helpers.TurtleWriterSettings;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component(service = DelimitedConverter.class)
public class DelimitedConverterImpl implements DelimitedConverter {
    private static final Logger LOGGER = LoggerFactory.getLogger(DelimitedConverterImpl.class);
    private static final String LOCAL_NAME_PATTERN = "\\$\\{(\\d+|UUID)}";
    private static final String DEFAULT_PREFIX = "http://mobi.com/data/";

    private final ValueFactory valueFactory = new ValidatingValueFactory();
    private final ModelFactory modelFactory = new DynamicModelFactory();
    private MappingFactory mappingFactory;
    private ClassMappingFactory classMappingFactory;
    private OntologyManager ontologyManager;

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
    public Path convert(SVConfig config) throws IOException, MobiException {
        Mapping mapping = mappingFactory.getAllExisting(config.getMapping()).stream().findFirst().orElseThrow(() ->
                new IllegalArgumentException("Missing mapping object"));
        Set<Ontology> sourceOntologies = config.getOntologies().isEmpty() ? getSourceOntologies(mapping) :
                config.getOntologies();

        RDFFormat format = config.getFormat();
        Path path = Files.createTempFile(UUID.randomUUID().toString(), "." + format.getDefaultFileExtension());
        OutputStream convertedOutput = Files.newOutputStream(path);

        ArrayList<ClassMapping> classMappings = parseClassMappings(config.getMapping());
        long offset = config.getOffset();
        boolean containsHeaders = config.getContainsHeaders();

        CSVParser parser = new CSVParserBuilder().withSeparator(config.getSeparator()).build();
        try (CSVReader reader = new CSVReaderBuilder(new InputStreamReader(config.getData(), config.getCharset()))
                .withCSVParser(parser).build()) {
            // If headers exist, skip them
            if (containsHeaders) {
                reader.readNext();
            }

            // Skip to offset point
            while (reader.getLinesRead() - (containsHeaders ? 1 : 0) < offset) {
                reader.readNext();
            }

            //Traverse each row and convert column into RDF
            String[] nextLine;
            long index = config.getOffset();
            Optional<Long> limit = config.getLimit();
            while ((nextLine = reader.readNext()) != null && (limit.isEmpty() || index < limit.get() + offset)) {
                //Exporting to CSV from Excel can cause empty rows to contain columns
                //Therefore, we must ensure at least one cell has values before processing the row
                boolean rowContainsValues = false;
                for (String cell : nextLine) {
                    if (!cell.isEmpty()) {
                        rowContainsValues = true;
                        writeClassMappingsToModel(convertedOutput, nextLine, classMappings, sourceOntologies, format);
                        break;
                    }
                }
                if (!rowContainsValues) {
                    LOGGER.debug("Skipping empty row number: {}", index + 1);
                }
                index++;
            }
        } catch (CsvValidationException e) {
            throw new IllegalStateException("Error reading csv.", e);
        }

        return path;
    }

    @Override
    public Path convert(ExcelConfig config) throws IOException, MobiException {
        Mapping mapping = mappingFactory.getAllExisting(config.getMapping()).stream().findFirst().orElseThrow(() ->
                new IllegalArgumentException("Missing mapping object"));
        Set<Ontology> sourceOntologies = config.getOntologies().isEmpty() ? getSourceOntologies(mapping) :
                config.getOntologies();
        RDFFormat format = config.getFormat();
        Path path = Files.createTempFile(UUID.randomUUID().toString(), "." + format.getDefaultFileExtension());
        OutputStream convertedRDF = Files.newOutputStream(path);
        ArrayList<ClassMapping> classMappings = parseClassMappings(config.getMapping());

        convertExcel(config, convertedRDF, sourceOntologies, classMappings, format);

        return path;
    }

    private void convertExcel(ExcelConfig config, OutputStream convertedRDF, Set<Ontology> sourceOntologies,
                              ArrayList<ClassMapping> classMappings, RDFFormat format) throws IOException {
        // Arguments will extract cell formatting and mark a cell as in error if it could not be parsed
        ReadingOptions readingOptions = new ReadingOptions(true, true);
        try (ReadableWorkbook wb = new ReadableWorkbook(config.getData(), readingOptions)) {
            Sheet sheet = wb.getFirstSheet();
            boolean containsHeaders = config.getContainsHeaders();
            long offset = config.getOffset();
            Optional<Long> limit = config.getLimit();
            AtomicLong lastRowNumber = new AtomicLong(-1);

            //Traverse each row and convert column into RDF
            sheet.openStream().forEach(row -> {
                int zeroBasedRowNum = row.getRowNum() - 1;
                // If headers exist or the row is before the offset point, skip the row
                if ((containsHeaders && zeroBasedRowNum == 0)
                        || zeroBasedRowNum - (containsHeaders ? 1 : 0) < offset
                        || (limit.isPresent() && zeroBasedRowNum >= limit.get() + offset)
                        || row.getPhysicalCellCount() < 0) {
                    lastRowNumber.getAndIncrement();
                    return;
                }
                // Logging the automatic skip of empty rows with no formatting
                while (row.getRowNum() > lastRowNumber.get() + 1) {
                    LOGGER.debug("Skipping empty row number: {}", lastRowNumber.get() + 1);
                    lastRowNumber.getAndIncrement();
                }
                // getCellCount instead of getPhysicalCellCount so that blank values don't cause cells to shift
                String[] cells = new String[row.getCellCount()];
                boolean rowContainsValues = false;
                for (int i = 0; i < row.getCellCount(); i++) {
                    Cell cell = row.getCell(i);
                    cells[i] = getCellText(cell);
                    if (!rowContainsValues && !cells[i].isEmpty()) {
                        rowContainsValues = true;
                    }
                }
                // Skipping empty rows
                if (rowContainsValues) {
                    writeClassMappingsToModel(convertedRDF, cells, classMappings, sourceOntologies, format);
                } else {
                    LOGGER.debug("Skipping empty row number: {}", row.getRowNum());
                }
                lastRowNumber.getAndIncrement();
            });
        }
    }

    /**
     * Processes a row of data into RDF using class mappings and adds it to the given Model.
     *
     * @param convertedOutput  the OutputStream to hold the converted data
     * @param line          the data to convert
     * @param classMappings the classMappings to use when converting the data
     */
    private void writeClassMappingsToModel(OutputStream convertedOutput, String[] line, List<ClassMapping> classMappings,
                                           Set<Ontology> sourceOntologies, RDFFormat format) {
        // Map holds ClassMappings to instance IRIs. Modified by writeClassToModel().
        Map<Resource, IRI> mappedClasses = new HashMap<>();
        WriterConfig writerConfig = new WriterConfig();
        writerConfig.set(TurtleWriterSettings.ABBREVIATE_NUMBERS, false);
        for (ClassMapping cm : classMappings) {
            Rio.write(writeClassToModel(cm, line, mappedClasses, sourceOntologies), convertedOutput, format,
                    writerConfig);
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
    private Model writeClassToModel(ClassMapping cm, String[] nextLine, Map<Resource, IRI> mappedClasses,
                                    Set<Ontology> sourceOntologies) {
        Model convertedRDF = modelFactory.createEmptyModel();

        IRI classInstance;
        if (mappedClasses.containsKey(cm.getResource())) {
            classInstance = mappedClasses.get(cm.getResource());
        } else {
            Optional<String> nameOptional = generateLocalName(cm, nextLine);
            if (nameOptional.isEmpty()) {
                return convertedRDF;
            }

            Iterator<String> prefixes = cm.getHasPrefix().iterator();
            if (prefixes.hasNext()) {
                classInstance = valueFactory.createIRI(prefixes.next() + nameOptional.get());
            } else {
                classInstance = valueFactory.createIRI(DEFAULT_PREFIX + nameOptional.get());
            }
        }

        Set<Resource> mapsTo = cm.getMapsTo_resource();
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
            final IRI[] datatype = {org.eclipse.rdf4j.model.vocabulary.XSD.STRING};
            Optional<Resource> datatypeOpt = dataMapping.getDatatypeSpec_resource();
            Optional<Value> languageOpt = dataMapping.getLanguageSpec();
            int columnIndex = dataMapping.getColumnIndex().iterator().next();
            Resource prop = dataMapping.getHasProperty_resource().iterator().next();

            // If the column exists
            if (columnIndex < nextLine.length && columnIndex >= 0) {
                // If the value is not empty
                if (!StringUtils.isEmpty(nextLine[columnIndex])) {
                    // Determine the datatype for the data property range
                    Literal literal = null;
                    if (languageOpt.isPresent()) {
                        datatype[0] = valueFactory.createIRI("http://www.w3.org/1999/02/22-rdf-syntax-ns#langString");
                        literal = valueFactory.createLiteral(nextLine[columnIndex], languageOpt.get().stringValue());
                    } else {
                        if (datatypeOpt.isPresent()) {
                            datatype[0] = (IRI) datatypeOpt.get();
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
                        try {
                            // Validate URIs specifically
                            if (Objects.equals(datatype[0].stringValue(), XSD.ANYURI)) {
                                valueFactory.createIRI(nextLine[columnIndex]);
                            }
                            // Transform any potential boolean values to lowercase as ValidatingValueFactory doesn't
                            // accept uppercase TRUE and FALSE
                            if (Objects.equals(datatype[0].stringValue(), XSD.BOOLEAN)) {
                                literal = valueFactory.createLiteral(nextLine[columnIndex].toLowerCase(), datatype[0]);
                            } else {
                                literal = valueFactory.createLiteral(nextLine[columnIndex], datatype[0]);
                            }
                        } catch (IllegalArgumentException ex) {
                            LOGGER.warn("Column value {} not valid for range type {} of {}: {}",
                                    nextLine[columnIndex], datatype[0].stringValue(), classInstance.stringValue(),
                                    prop.stringValue());
                        }
                    }
                    // Only add literal if valid with the datatype
                    if (literal != null) {
                        convertedRDF.add(classInstance, (IRI) prop, literal);
                    }
                } // else don't create a stmt for blank values
            } else {
                LOGGER.warn("Column {} missing for {}: {}",
                        columnIndex, classInstance.stringValue(), prop.stringValue());
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

            Resource prop = objectMapping.getHasProperty_resource().iterator().next();

            IRI targetIri;
            if (mappedClasses.containsKey(targetClassMapping.getResource())) {
                targetIri = mappedClasses.get(targetClassMapping.getResource());
            } else {
                Optional<String> targetNameOptional = generateLocalName(targetClassMapping, nextLine);
                if (targetNameOptional.isEmpty()) {
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

        if (nameOptional.isEmpty() || nameOptional.get().trim().isEmpty()) {
            //Only generate UUIDs when necessary. If you really have to waste a UUID go here: http://wasteaguid.info/
            return Optional.of(generateUuid());
        }

        Pattern pat = Pattern.compile(LOCAL_NAME_PATTERN);
        Matcher mat = pat.matcher(nameOptional.get());
        StringBuilder result = new StringBuilder();
        while (mat.find()) {
            if ("UUID".equals(mat.group(1))) {
                //Once again, only generate UUIDs when necessary
                mat.appendReplacement(result, generateUuid());
            } else {
                int colIndex = Integer.parseInt(mat.group(1));
                if (colIndex < currentLine.length && colIndex >= 0) {
                    //remove whitespace
                    String replacement = whitespace().removeFrom(currentLine[colIndex]);
                    if (LOGGER.isDebugEnabled() && !replacement.equals(currentLine[colIndex])) {
                        LOGGER.debug("Local name for IRI was converted from \"{}\" to \"{}\" in order to"
                                + "remove whitespace.", currentLine[colIndex], replacement);
                    }
                    mat.appendReplacement(result, replacement);
                } else {
                    LOGGER.warn("Missing data for local name from column {}", colIndex);
                    return Optional.empty();
                }
            }
        }
        mat.appendTail(result);
        String resultStr = result.toString();
        return resultStr.isEmpty() ? Optional.empty() : Optional.of(resultStr);
    }

    /**
     * Parse the data from the Mapping File into ClassMapping POJOs.
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


    private Set<Ontology> getSourceOntologies(Mapping mapping) {
        Optional<Resource> recordIRI = mapping.getSourceRecord_resource();
        Optional<Resource> branchIRI = mapping.getSourceBranch_resource();
        Optional<Resource> commitIRI = mapping.getSourceCommit_resource();
        if (recordIRI.isPresent() && branchIRI.isPresent() && commitIRI.isPresent()) {
            Optional<Ontology> ontology = ontologyManager.retrieveOntology(recordIRI.get(), branchIRI.get(),
                    commitIRI.get());
            if (ontology.isPresent()) {
                return ontology.get().getImportsClosure();
            }
        }
        return Collections.emptySet();
    }
}
