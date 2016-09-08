package org.matonto.etl.service.delimited;

/*-
 * #%L
 * org.matonto.etl.csv
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
import com.opencsv.CSVReader;
import org.apache.log4j.Logger;
import org.apache.poi.openxml4j.exceptions.InvalidFormatException;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.matonto.etl.api.config.ExcelConfig;
import org.matonto.etl.api.config.SVConfig;
import org.matonto.etl.api.delimited.DelimitedConverter;
import org.matonto.etl.api.ontologies.delimited.ClassMapping;
import org.matonto.etl.api.ontologies.delimited.ClassMappingFactory;
import org.matonto.etl.api.ontologies.delimited.Property;
import org.matonto.exception.MatOntoException;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.orm.Thing;
import org.matonto.rest.util.CharsetUtils;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component(provide = DelimitedConverter.class)
public class DelimitedConverterImpl implements DelimitedConverter {
    private static final Logger LOGGER = Logger.getLogger(DelimitedConverterImpl.class);
    private static final String LOCAL_NAME_PATTERN = "\\$\\{(\\d+|UUID)\\}";
    private static final String DEFAULT_PREFIX = "http://matonto.org/data/";

    private ValueFactory valueFactory;
    private ModelFactory modelFactory;
    private ClassMappingFactory classMappingFactory;

    @Reference
    public void setValueFactory(ValueFactory valueFactory) {
        this.valueFactory = valueFactory;
    }

    @Reference
    public void setModelFactory(ModelFactory modelFactory) {
        this.modelFactory = modelFactory;
    }

    @Reference
    public void setClassMappingFactory(ClassMappingFactory classMappingFactory) {
        this.classMappingFactory = classMappingFactory;
    }

    @Override
    public Model convert(SVConfig config) throws IOException, MatOntoException {
        byte[] data = toByteArrayOutputStream(config.getData()).toByteArray();
        Charset charset = CharsetUtils.getEncoding(new ByteArrayInputStream(data)).orElseThrow(() ->
                new MatOntoException("Unsupported character set"));
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
            writeClassMappingsToModel(convertedRDF, nextLine, classMappings);
            index++;
        }
        return convertedRDF;
    }

    @Override
    public Model convert(ExcelConfig config) throws IOException, MatOntoException {
        String[] nextRow;
        Model convertedRDF = modelFactory.createModel();
        ArrayList<ClassMapping> classMappings = parseClassMappings(config.getMapping());

        try {
            Workbook wb = WorkbookFactory.create(config.getData());
            Sheet sheet = wb.getSheetAt(0);
            DataFormatter df = new DataFormatter();
            boolean containsHeaders = config.getContainsHeaders();
            long offset = config.getOffset();
            Optional<Long> limit = config.getLimit();

            //Traverse each row and convert column into RDF
            for (Row row : sheet) {
                // If headers exist or the row is before the offset point, skip the row
                if ((containsHeaders && row.getRowNum() == 0) || row.getRowNum() - (containsHeaders ? 1 : 0) < offset
                        || (limit.isPresent() && row.getRowNum() >= limit.get() + offset)) {
                    continue;
                }
                nextRow = new String[row.getPhysicalNumberOfCells()];
                int cellIndex = 0;
                for (Cell cell : row) {
                    nextRow[cellIndex] = df.formatCellValue(cell);
                    cellIndex++;
                }
                writeClassMappingsToModel(convertedRDF, nextRow, classMappings);
            }
        } catch (InvalidFormatException e) {
            throw new MatOntoException(e);
        }

        return convertedRDF;
    }
    
    /**
     * Processes a row of data into RDF using class mappings and adds it to the given Model.
     *
     * @param convertedRDF the model to hold the converted data
     * @param line the data to convert
     * @param classMappings the classMappings to use when converting the data
     */
    private void writeClassMappingsToModel(Model convertedRDF, String[] line, List<ClassMapping> classMappings) {
        // Map holds ClassMappings to instance IRIs. Modified by writeClassToModel().
        Map<Resource, IRI> mappedClasses = new HashMap<>();
        for (ClassMapping cm : classMappings) {
            convertedRDF.addAll(writeClassToModel(cm, line, mappedClasses));
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
     * @param cm       The ClassMapping object to guide the RDF creation
     * @param nextLine The line of CSV to be mapped
     * @param mappedClasses The Map holding previously processed ClassMappings and their associated instance IRIs.
     *                      Modified by this method.
     * @return A Model of RDF based on the line of CSV data
     */
    private Model writeClassToModel(ClassMapping cm, String[] nextLine, Map<Resource, IRI> mappedClasses) {
        Model convertedRDF = modelFactory.createModel();

        Optional<String> nameOptional = generateLocalName(cm, nextLine);
        if (!nameOptional.isPresent()) {
            return convertedRDF;
        }

        IRI classInstance;
        Iterator<String> prefixes = cm.getHasPrefix().iterator();
        if (prefixes.hasNext()) {
            classInstance = valueFactory.createIRI(prefixes.next() + nameOptional.get());
        } else {
            classInstance = valueFactory.createIRI(DEFAULT_PREFIX + nameOptional.get());
        }

        Resource mapsToResource;
        Iterator<Thing> mapsTo = cm.getMapsTo().iterator();
        if (mapsTo.hasNext()) {
            mapsToResource = mapsTo.next().getResource();
        } else {

        }

        convertedRDF.add(classInstance, valueFactory.createIRI(org.matonto.ontologies.rdfs.Resource.type_IRI), cm.getMapsTo().iterator().next().getResource());
        mappedClasses.put(cm.getResource(), classInstance);

        cm.getDataProperty().forEach(dataMapping -> {
            int columnIndex = dataMapping.getColumnIndex().iterator().next();
            Property prop = dataMapping.getHasProperty().iterator().next();

            if (columnIndex < nextLine.length && columnIndex >= 0) {
                convertedRDF.add(classInstance, valueFactory.createIRI(prop.getResource().stringValue()),
                        valueFactory.createLiteral(nextLine[columnIndex]));
            } else {
                LOGGER.warn(String.format("Column %d missing for %s: %s",
                        columnIndex, classInstance.stringValue(), prop.getResource().stringValue()));
            }
        });

        cm.getObjectProperty().forEach(objectMapping -> {
            // TODO: Handle hasNext()
            ClassMapping targetClassMapping = objectMapping.getClassMapping().iterator().next();
            Property prop = objectMapping.getHasProperty().iterator().next();

            IRI targetIri;
            if (mappedClasses.containsKey(targetClassMapping.getResource())) {
                targetIri = mappedClasses.get(targetClassMapping.getResource());
            } else {
                Optional<String> targetNameOptional = generateLocalName(targetClassMapping, nextLine);
                if (!targetNameOptional.isPresent()) {
                    return;
                } else {
                    targetIri = valueFactory.createIRI(targetClassMapping.getHasPrefix().iterator().next() + targetNameOptional.get());
                    mappedClasses.put(targetClassMapping.getResource(), targetIri);
                }
            }

            convertedRDF.add(classInstance, valueFactory.createIRI(prop.getResource().stringValue()), targetIri);
        });

        return convertedRDF;
    }

    /**
     * Generates a local name for RDF Instances. If no local name is configured in the ClassMapping, a random UUID
     * is generated.
     *
     * @param cm That ClassMapping from which to retrieve the local name template if it exists
     * @param currentLine The current line in the CSV file in case data is used in the Local Name
     * @return The local name portion of a IRI used in RDF data
     */
    Optional<String> generateLocalName(ClassMapping cm, String[] currentLine) {
        Optional<String> nameOptional = cm.getLocalName();

        if (!nameOptional.isPresent() || nameOptional.get().equals("")) {
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
                    mat.appendReplacement(result, currentLine[colIndex]);
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

        Model classMappingModel = mappingModel.filter(null, valueFactory.createIRI(org.matonto.ontologies.rdfs.Resource.type_IRI),
                valueFactory.createIRI(ClassMapping.TYPE));

        for (Resource classMappingResource : classMappingModel.subjects()) {
            ClassMapping classMapping = classMappingFactory.getExisting(classMappingResource, mappingModel);
            classMappings.add(classMapping);
        }

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
}
