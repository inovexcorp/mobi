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
import org.apache.commons.lang3.StringUtils;
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
import org.matonto.exception.MatOntoException;
import org.matonto.ontologies.delimited.ClassMappingFactory;
import org.matonto.ontologies.delimited.Property;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rest.util.CharsetUtils;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.HashMap;
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
//        ArrayList<ClassMapping> classMappings = parseClassMappings(config.getMapping());
        ArrayList<org.matonto.ontologies.delimited.ClassMapping> classMappings = parseClassMappings2(config.getMapping());
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
            writeClassMappingsToModel2(convertedRDF, nextLine, classMappings);
            index++;
        }
        return convertedRDF;
    }

    @Override
    public Model convert(ExcelConfig config) throws IOException, MatOntoException {
        String[] nextRow;
        Model convertedRDF = modelFactory.createModel();
//        ArrayList<ClassMapping> classMappings = parseClassMappings(config.getMapping());
        ArrayList<org.matonto.ontologies.delimited.ClassMapping> classMappings = parseClassMappings2(config.getMapping());

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
                writeClassMappingsToModel2(convertedRDF, nextRow, classMappings);
            }
        } catch (InvalidFormatException e) {
            throw new MatOntoException(e);
        }

        return convertedRDF;
    }

    private void writeClassMappingsToModel2(Model convertedRDF, String[] line, List<org.matonto.ontologies.delimited.ClassMapping> classMappings) {
        // Write each classMapping to the model
        Map<Resource, IRI> mappedClasses = new HashMap<>();
        for (org.matonto.ontologies.delimited.ClassMapping cm : classMappings) {
            convertedRDF.addAll(writeClassToModel2(cm, line, mappedClasses));
        }
//        //Reset classMappings
//        for (org.matonto.ontologies.delimited.ClassMapping cm : classMappings) {
//            cm.setInstance(false);
//        }
    }

//    /**
//     * Converts a line of data into RDF using class mappings and adds it to the given Model.
//     * Resets the class mappings after iterating through class mappings so there are no
//     * duplicate class instances for the line.
//     *
//     * @param convertedRDF the model to hold the converted data
//     * @param line the data to convert
//     * @param classMappings the classMappings to use when converting the data
//     */
//    private void writeClassMappingsToModel(Model convertedRDF, String[] line, List<ClassMapping> classMappings) {
//        // Write each classMapping to the model
//        for (ClassMapping cm : classMappings) {
//            convertedRDF.addAll(writeClassToModel(cm, line));
//        }
//        //Reset classMappings
//        for (ClassMapping cm : classMappings) {
//            cm.setInstance(false);
//        }
//    }

    /**
     * Generates a UUID for use in new RDF instances. Separate method allows for testing.
     *
     * @return A String with a Universally Unique Identifier
     */
    public String generateUuid() {
        return UUID.randomUUID().toString();
    }

    Model writeClassToModel2(org.matonto.ontologies.delimited.ClassMapping cm, String[] nextLine, Map<Resource, IRI> mappedClasses) {
        Model convertedRDF = modelFactory.createModel();
        //Generate new IRI if an instance of the class mapping has not been created in this row.
//        cm = createInstance(cm, nextLine);
        //If there isn't enough data to create the local name, don't create the instance
//        if (!cm.isInstance()) {
//            return convertedRDF;
//        }

        // TODO: Handle hasNext()
        IRI classInstance = valueFactory.createIRI(cm.getHasPrefix().iterator().next() + generateLocalName(cm.getLocalName(), nextLine));
        convertedRDF.add(classInstance, valueFactory.createIRI(Delimited.TYPE.stringValue()), cm.getMapsTo().iterator().next().getResource());
        mappedClasses.put(cm.getResource(), classInstance);

        cm.getDataProperty().forEach(dataMapping -> {
            int columnIndex = dataMapping.getColumnIndex().iterator().next();
            Property prop = dataMapping.getHasProperty().iterator().next();
            convertedRDF.add(classInstance, valueFactory.createIRI(prop.getResource().stringValue()), valueFactory.createLiteral(nextLine[columnIndex]));
            // TODO: index out of bounds?
        });

//        //Create the data properties
//        Map<Integer, String> dataProps = cm.getDataProperties();
//        for (Integer i : dataProps.keySet()) {
//            IRI property = valueFactory.createIRI(dataProps.get(i));
//            try {
//                convertedRDF.add(classInstance, property, valueFactory.createLiteral(nextLine[i]));
//            } catch (ArrayIndexOutOfBoundsException e) {
//                //Cell does not contain any data. No need to throw exception.
//                LOGGER.info("Missing data for " + classInstance + ": " + property);
//            }
//        }

        cm.getObjectProperty().forEach(objectMapping -> {
            org.matonto.ontologies.delimited.ClassMapping targetClassMapping = objectMapping.getClassMapping().iterator().next();
            Property prop = objectMapping.getHasProperty().iterator().next();

            IRI targetIri;
            if (mappedClasses.containsKey(targetClassMapping.getResource())) {
                targetIri = mappedClasses.get(targetClassMapping.getResource());
            } else {
                targetIri = valueFactory.createIRI(targetClassMapping.getHasPrefix().iterator().next() + generateLocalName(targetClassMapping.getLocalName(), nextLine));
                mappedClasses.put(targetClassMapping.getResource(), targetIri);
            }

            convertedRDF.add(classInstance, valueFactory.createIRI(prop.getResource().stringValue()), targetIri);
        });

//        //Create the object properties
//        Map<ClassMapping, String> objectProps = cm.getObjectProperties();
//        for (ClassMapping objectMapping : objectProps.keySet()) {
//            objectMapping = createInstance(objectMapping, nextLine);
//
//            //If there isn't enough data to create the local name, don't create the instance
//            IRI property = valueFactory.createIRI(objectProps.get(objectMapping));
//            if (objectMapping.isInstance()) {
//                convertedRDF.add(classInstance, property, objectMapping.getIri());
//            }
//
//        }

        return convertedRDF;
    }

//    /**
//     * Writes RDF statements based on a class mapping and a line of data from CSV.
//     *
//     * @param cm       The ClassMapping object to guide the RDF creation
//     * @param nextLine The line of CSV to be mapped
//     * @return A Model of RDF based on the line of CSV data
//     */
//    Model writeClassToModel(ClassMapping cm, String[] nextLine) {
//        Model convertedRDF = modelFactory.createModel();
//        //Generate new IRI if an instance of the class mapping has not been created in this row.
//        cm = createInstance(cm, nextLine);
//        //If there isn't enough data to create the local name, don't create the instance
//        if (!cm.isInstance()) {
//            return convertedRDF;
//        }
//
//        IRI classInstance = cm.getIri();
//        convertedRDF.add(classInstance, valueFactory.createIRI(Delimited.TYPE.stringValue()),
//                valueFactory.createIRI(cm.getMapping()));
//        //Create the data properties
//        Map<Integer, String> dataProps = cm.getDataProperties();
//        for (Integer i : dataProps.keySet()) {
//            IRI property = valueFactory.createIRI(dataProps.get(i));
//            try {
//                convertedRDF.add(classInstance, property, valueFactory.createLiteral(nextLine[i]));
//            } catch (ArrayIndexOutOfBoundsException e) {
//                //Cell does not contain any data. No need to throw exception.
//                LOGGER.info("Missing data for " + classInstance + ": " + property);
//            }
//        }
//
//        //Create the object properties
//        Map<ClassMapping, String> objectProps = cm.getObjectProperties();
//        for (ClassMapping objectMapping : objectProps.keySet()) {
//            objectMapping = createInstance(objectMapping, nextLine);
//
//            //If there isn't enough data to create the local name, don't create the instance
//            IRI property = valueFactory.createIRI(objectProps.get(objectMapping));
//            if (objectMapping.isInstance()) {
//                convertedRDF.add(classInstance, property, objectMapping.getIri());
//            }
//
//        }
//
//        return convertedRDF;
//    }

//    /**
//     * Creates a URI for the class mapping based off of a given line in a delimited file
//     * @param cm the class mapping object to create a URI for
//     * @param dataLine a Line in the delimited file
//     * @return An updated class mapping with setInstance true if it not already, and a URI created.
//     */
//    private ClassMapping createInstance(ClassMapping cm, String[] dataLine) {
//        if (!cm.isInstance()) {
//            String classLocalName = generateLocalName(cm.getLocalName(), dataLine);
//            cm.setIRI(valueFactory.createIRI(cm.getPrefix() + classLocalName));
//            if (!"_".equals(classLocalName)) {
//                cm.setInstance(true);
//            }
//        }
//
//        return cm;
//    }

    /**
     * Generates a local name for RDF Instances
     *
     * @param localNameTemplate The local name template given in the mapping file. See MatOnto Wiki for details
     * @param currentLine       The current line in the CSV file in case data is used in the Local Name
     * @return The local name portion of a IRI used in RDF data
     */
    String generateLocalName(String localNameTemplate, String[] currentLine) {
        if (StringUtils.isEmpty(localNameTemplate)) {
            //Only generate UUIDs when necessary. If you really have to waste a UUID go here: http://wasteaguid.info/
            return generateUuid();
        }
        Pattern pat = Pattern.compile(LOCAL_NAME_PATTERN);
        Matcher mat = pat.matcher(localNameTemplate);
        StringBuffer result = new StringBuffer();
        while (mat.find()) {
            if ("UUID".equals(mat.group(1))) {
                //Once again, only generate UUIDs when necessary
                mat.appendReplacement(result, generateUuid());
            } else {
                int colIndex = Integer.parseInt(mat.group(1));
                try {
                    mat.appendReplacement(result, currentLine[colIndex]);
                } catch (ArrayIndexOutOfBoundsException e) {
                    LOGGER.info("Data not available for local name. Using '_'");
                    mat.appendReplacement(result, "_");
                }
            }
        }
        mat.appendTail(result);
        return result.toString();
    }

    private ArrayList<org.matonto.ontologies.delimited.ClassMapping> parseClassMappings2(Model mappingModel) {
        ArrayList<org.matonto.ontologies.delimited.ClassMapping> classMappings = new ArrayList<>();

        Model classMappingModel = mappingModel.filter(null, valueFactory.createIRI(Delimited.TYPE.stringValue()),
                valueFactory.createIRI(Delimited.CLASS_MAPPING_OBJ.stringValue()));

        for (Resource classMappingResource : classMappingModel.subjects()) {
            org.matonto.ontologies.delimited.ClassMapping classMapping = classMappingFactory.getExisting(classMappingResource, mappingModel);
            classMappings.add(classMapping);
        }

        return classMappings;
    }

//    /**
//     * Parse the data from the Mapping File into ClassMapping POJOs
//     *
//     * @param mappingModel The Mapping File used to parse CSV data in a Model
//     * @return An ArrayList of ClassMapping Objects created from the mapping model.
//     */
//    private ArrayList<ClassMapping> parseClassMappings(Model mappingModel) {
//        ArrayList<ClassMapping> classMappings = new ArrayList<>();
//
//        Model classMappingModel = mappingModel.filter(null, valueFactory.createIRI(Delimited.TYPE.stringValue()),
//                valueFactory.createIRI(Delimited.CLASS_MAPPING_OBJ.stringValue()));
//
//        //Holds Reference to ClassMapping Object from IRI of ClassMapping in Model.
//        //Used to join Object Properties
//        Map<IRI,ClassMapping> uriToObject = new LinkedHashMap<>();
//
//        for (Resource classMappingReource : classMappingModel.subjects()) {
//            LOGGER.warn("Parsing mappings");
//            ClassMapping classMapping;
//
//            IRI classMappingIRI = valueFactory.createIRI(classMappingReource.stringValue());
//
//            if (uriToObject.containsKey(classMappingIRI)) {
//                classMapping = uriToObject.get(classMappingIRI);
//            } else {
//                classMapping = new ClassMapping();
//                uriToObject.put(classMappingIRI, classMapping);
//            }
//
//            //Parse the properties from the Class Mappings
//
//            //Prefix
//            Model prefixModel = mappingModel.filter(classMappingIRI,
//                    valueFactory.createIRI(Delimited.HAS_PREFIX.stringValue()), null);
//            if (!prefixModel.isEmpty()) {
//                // TODO: Throw exception when missing
//                classMapping.setPrefix(Models.objectString(prefixModel).get());
//            }
//
//            //Class that the Class Mapping Maps to
//            Model mapsToModel = mappingModel.filter(classMappingIRI,
//                    valueFactory.createIRI(Delimited.MAPS_TO.stringValue()), null);
//            if (!mapsToModel.isEmpty()) {
//                // TODO: Throw exception when missing
//                classMapping.setMapping(Models.objectString(mapsToModel).get());
//            }
//
//            //Local Name
//            Model localNameModel = mappingModel.filter(classMappingIRI,
//                    valueFactory.createIRI(Delimited.LOCAL_NAME.stringValue()), null);
//            if (!localNameModel.isEmpty()) {
//                // TODO: Throw exception when missing
//                classMapping.setLocalName(Models.objectString(localNameModel).get());
//            }
//
//            //Parse the data properties
//            Model dataPropertyModel = mappingModel.filter(classMappingIRI,
//                    valueFactory.createIRI(Delimited.DATA_PROPERTY.stringValue()), null);
//            dataPropertyModel.objects().forEach(dataProperty -> {
//                Model propertyModel = mappingModel.filter((IRI) dataProperty,
//                        valueFactory.createIRI(Delimited.HAS_PROPERTY.stringValue()), null);
//                // TODO: Throw exception when missing
//                String property = Models.objectString(propertyModel).get();
//
//                Model indexModel = mappingModel.filter((IRI) dataProperty,
//                        valueFactory.createIRI(Delimited.COLUMN_INDEX.stringValue()), null);
//                Integer columnIndexInt = Integer.parseInt(Models.objectLiteral(indexModel).get().stringValue());
//
//                classMapping.addDataProperty(columnIndexInt, property);
//            });
//
//            //Parse the object properties
//            Model objectPropertyModel = mappingModel.filter(classMappingIRI,
//                    valueFactory.createIRI(Delimited.OBJECT_PROPERTY.stringValue()), null);
//            objectPropertyModel.forEach(s -> {
//
//                Model propertyModel = mappingModel.filter((IRI) s.getObject(),
//                        valueFactory.createIRI(Delimited.HAS_PROPERTY.stringValue()), null);
//                // TODO: Throw exception when missing
//                String property = Models.objectString(propertyModel).get();
//
//                Model classModel = mappingModel.filter((IRI) s.getObject(),
//                        valueFactory.createIRI(Delimited.CLASS_MAPPING_PROP.stringValue()), null);
//                // TODO: Throw exception when missing
//                IRI objectMappingResultIRI = Models.objectIRI(classModel).get();
//
//                if (uriToObject.containsKey(objectMappingResultIRI)) {
//                    classMapping.addObjectProperty(uriToObject.get(objectMappingResultIRI), property);
//                } else {
//                    ClassMapping objectMappingResult = new ClassMapping();
//                    classMapping.addObjectProperty(objectMappingResult, property);
//                    uriToObject.put(objectMappingResultIRI, objectMappingResult);
//                }
//            });
//
//
//            classMappings.add(classMapping);
//        }
//        return classMappings;
//    }

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
