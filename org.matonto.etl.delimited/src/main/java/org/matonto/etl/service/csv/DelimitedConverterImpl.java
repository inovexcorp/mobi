package org.matonto.etl.service.csv;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.opencsv.CSVReader;
import org.apache.log4j.Logger;
import org.apache.poi.openxml4j.exceptions.InvalidFormatException;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.util.IOUtils;
import org.matonto.etl.api.config.SVConfig;
import org.matonto.etl.api.config.ExcelConfig;
import org.matonto.etl.api.delimited.DelimitedConverter;
import org.matonto.exception.MatOntoException;
import org.matonto.persistence.utils.Models;
import org.matonto.rdf.api.*;
import org.matonto.rest.util.CharsetUtils;

import java.io.*;
import java.nio.charset.Charset;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component(provide = DelimitedConverter.class)
public class DelimitedConverterImpl implements DelimitedConverter {
    private static final Logger LOGGER = Logger.getLogger(DelimitedConverterImpl.class);

    private ValueFactory valueFactory;
    private ModelFactory modelFactory;

    @Reference
    public void setValueFactory(ValueFactory valueFactory) {
        this.valueFactory = valueFactory;
    }

    @Reference
    public void setModelFactory(ModelFactory modelFactory) {
        this.modelFactory = modelFactory;
    }

    @Override
    public Model convert(SVConfig config) throws IOException, MatOntoException {
        return convertSV(config.getData(), config.getMapping(), config.getContainsHeaders(),
                config.getSeparator(), config.getLimit(), config.getOffset());
    }

    @Override
    public Model convert(ExcelConfig config) throws IOException, MatOntoException {
        return convertExcel(config.getData(), config.getMapping(), config.getContainsHeaders(), config.getLimit(),
                config.getOffset());
    }

    private Model convertSV(InputStream sv, Model mappingModel, boolean containsHeaders, char separator,
                            Optional<Long> limit, long offset) throws IOException, MatOntoException {
        ByteArrayOutputStream out = toByteArrayOutputStream(sv);
        Optional<Charset> charsetOpt = CharsetUtils.getEncoding(IOUtils.toByteArray(
                new ByteArrayInputStream(out.toByteArray())));
        if (!charsetOpt.isPresent()) {
            throw new MatOntoException("Unsupported character set");
        }
        CSVReader reader = new CSVReader(new InputStreamReader(
                new ByteArrayInputStream(out.toByteArray()), charsetOpt.get()), separator);
        String[] nextLine;
        Model convertedRDF = modelFactory.createModel();
        ArrayList<ClassMapping> classMappings = parseClassMappings(mappingModel);
        long index = offset;

        // If headers exist, skip them
        if (containsHeaders) {
            reader.readNext();
        }

        // Skip to offset point
        while (reader.getLinesRead() - (containsHeaders ? 1 : 0) < offset) {
            reader.readNext();
        }

        //Traverse each row and convert column into RDF
        while ((nextLine = reader.readNext()) != null && (!limit.isPresent() || index < limit.get() + offset)) {
            writeClassMappingsToModel(convertedRDF, nextLine, classMappings);
            index++;
        }
        return convertedRDF;
    }

    private Model convertExcel(InputStream excel, Model mappingModel, boolean containsHeaders, Optional<Long> limit,
                               long offset) throws IOException, MatOntoException {
        String[] nextRow;
        Model convertedRDF = modelFactory.createModel();
        ArrayList<ClassMapping> classMappings = parseClassMappings(mappingModel);

        try {
            Workbook wb = WorkbookFactory.create(excel);
            Sheet sheet = wb.getSheetAt(0);
            DataFormatter df = new DataFormatter();

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
     * Converts a line of data into RDF using class mappings and adds it to the given Model.
     * Resets the class mappings after iterating through class mappings so there are no
     * duplicate class instances for the line.
     *
     * @param convertedRDF the model to hold the converted data
     * @param line the data to convert
     * @param classMappings the classMappings to use when converting the data
     */
    private void writeClassMappingsToModel(Model convertedRDF, String[] line, List<ClassMapping> classMappings) {
        // Write each classMapping to the model
        for (ClassMapping cm : classMappings) {
            convertedRDF.addAll(writeClassToModel(cm, line));
        }
        //Reset classMappings
        for (ClassMapping cm : classMappings) {
            cm.setInstance(false);
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
     * Writes RDF statements based on a class mapping and a line of data from CSV.
     *
     * @param cm       The ClassMapping object to guide the RDF creation
     * @param nextLine The line of CSV to be mapped
     * @return A Model of RDF based on the line of CSV data
     */
    Model writeClassToModel(ClassMapping cm, String[] nextLine) {
        Model convertedRDF = modelFactory.createModel();
        //Generate new IRI if an instance of the class mapping has not been created in this row.
        cm = createInstance(cm, nextLine);
        //If there isn't enough data to create the local name, don't create the instance
        if (!cm.isInstance()) {
            return convertedRDF;
        }

        IRI classInstance = cm.getIri();
        convertedRDF.add(classInstance, valueFactory.createIRI(Delimited.TYPE.stringValue()),
                valueFactory.createIRI(cm.getMapping()));
        //Create the data properties
        Map<Integer, String> dataProps = cm.getDataProperties();
        for (Integer i : dataProps.keySet()) {
            IRI property = valueFactory.createIRI(dataProps.get(i));
            try {
                convertedRDF.add(classInstance, property, valueFactory.createLiteral(nextLine[i]));
            } catch (ArrayIndexOutOfBoundsException e) {
                //Cell does not contain any data. No need to throw exception.
                LOGGER.info("Missing data for " + classInstance + ": " + property);
            }
        }

        //Create the object properties
        Map<ClassMapping, String> objectProps = cm.getObjectProperties();
        for (ClassMapping objectMapping : objectProps.keySet()) {
            objectMapping = createInstance(objectMapping, nextLine);

            //If there isn't enough data to create the local name, don't create the instance
            IRI property = valueFactory.createIRI(objectProps.get(objectMapping));
            if (objectMapping.isInstance()) {
                convertedRDF.add(classInstance, property, objectMapping.getIri());
            }

        }

        return convertedRDF;
    }

    /**
     * Creates a URI for the class mapping based off of a given line in a delimited file
     * @param cm the class mapping object to create a URI for
     * @param dataLine a Line in the delimited file
     * @return An updated class mapping with setInstance true if it not already, and a URI created.
     */
    private ClassMapping createInstance(ClassMapping cm, String[] dataLine) {
        if (!cm.isInstance()) {
            String classLocalName = generateLocalName(cm.getLocalName(), dataLine);
            cm.setIRI(valueFactory.createIRI(cm.getPrefix() + classLocalName));
            if (!"_".equals(classLocalName)) {
                cm.setInstance(true);
            }
        }

        return cm;
    }

    /**
     * Generates a local name for RDF Instances
     *
     * @param localNameTemplate The local name template given in the mapping file. See MatOnto Wiki for details
     * @param currentLine       The current line in the CSV file in case data is used in the Local Name
     * @return The local name portion of a IRI used in RDF data
     */
    String generateLocalName(String localNameTemplate, String[] currentLine) {
        if ("".equals(localNameTemplate) || localNameTemplate == null) {
            //Only generate UUIDs when necessary. If you really have to waste a UUID go here: http://wasteaguid.info/
            return generateUuid();
        }
        Pattern pat = Pattern.compile("(\\$\\{)(\\d+|UUID)(\\})");
        Matcher mat = pat.matcher(localNameTemplate);
        StringBuffer result = new StringBuffer();
        while (mat.find()) {
            if ("UUID".equals(mat.group(2))) {
                //Once again, only generate UUIDs when necessary
                mat.appendReplacement(result, generateUuid());
            } else {
                int colIndex = Integer.parseInt(mat.group(2));
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

    /**
     * Parse the data from the Mapping File into ClassMapping POJOs
     *
     * @param mappingModel The Mapping File used to parse CSV data in a Model
     * @return An ArrayList of ClassMapping Objects created from the mapping model.
     */
    private ArrayList<ClassMapping> parseClassMappings(Model mappingModel) {
        ArrayList<ClassMapping> classMappings = new ArrayList<>();

        Model classMappingModel = mappingModel.filter(null, valueFactory.createIRI(Delimited.TYPE.stringValue()),
                valueFactory.createIRI(Delimited.CLASS_MAPPING_OBJ.stringValue()));

        //Holds Reference to ClassMapping Object from IRI of ClassMapping in Model.
        //Used to join Object Properties
        Map<IRI,ClassMapping> uriToObject = new LinkedHashMap<>();

        for (Resource classMappingReource : classMappingModel.subjects()) {
            LOGGER.warn("Parsing mappings");
            ClassMapping classMapping;

            IRI classMappingIRI = valueFactory.createIRI(classMappingReource.stringValue());

            if (uriToObject.containsKey(classMappingIRI)) {
                classMapping = uriToObject.get(classMappingIRI);
            } else {
                classMapping = new ClassMapping();
                uriToObject.put(classMappingIRI, classMapping);
            }

            //Parse the properties from the Class Mappings

            //Prefix
            Model prefixModel = mappingModel.filter(classMappingIRI,
                    valueFactory.createIRI(Delimited.HAS_PREFIX.stringValue()), null);
            if (!prefixModel.isEmpty()) {
                classMapping.setPrefix(Models.objectString(prefixModel).get());
            }

            //Class that the Class Mapping Maps to
            Model mapsToModel = mappingModel.filter(classMappingIRI,
                    valueFactory.createIRI(Delimited.MAPS_TO.stringValue()), null);
            if (!mapsToModel.isEmpty()) {
                classMapping.setMapping(Models.objectString(mapsToModel).get());
            }

            //Local Name
            Model localNameModel = mappingModel.filter(classMappingIRI,
                    valueFactory.createIRI(Delimited.LOCAL_NAME.stringValue()), null);
            if (!localNameModel.isEmpty()) {
                classMapping.setLocalName(Models.objectString(localNameModel).get());
            }

            //Parse the data properties
            Model dataPropertyModel = mappingModel.filter(classMappingIRI,
                    valueFactory.createIRI(Delimited.DATA_PROPERTY.stringValue()), null);
            dataPropertyModel.objects().forEach(dataProperty -> {
                Model propertyModel = mappingModel.filter((IRI) dataProperty,
                        valueFactory.createIRI(Delimited.HAS_PROPERTY.stringValue()), null);
                String property = Models.objectString(propertyModel).get();

                Model indexModel = mappingModel.filter((IRI) dataProperty,
                        valueFactory.createIRI(Delimited.COLUMN_INDEX.stringValue()), null);
                Integer columnIndexInt = Integer.parseInt(Models.objectLiteral(indexModel).get().stringValue());

                classMapping.addDataProperty(columnIndexInt, property);
            });

            //Parse the object properties
            Model objectPropertyModel = mappingModel.filter(classMappingIRI,
                    valueFactory.createIRI(Delimited.OBJECT_PROPERTY.stringValue()), null);
            objectPropertyModel.forEach(s -> {

                Model propertyModel = mappingModel.filter((IRI) s.getObject(),
                        valueFactory.createIRI(Delimited.HAS_PROPERTY.stringValue()), null);
                String property = Models.objectString(propertyModel).get();

                Model classModel = mappingModel.filter((IRI) s.getObject(),
                        valueFactory.createIRI(Delimited.CLASS_MAPPING_PROP.stringValue()), null);
                IRI objectMappingResultIRI = Models.objectIRI(classModel).get();

                if (uriToObject.containsKey(objectMappingResultIRI)) {
                    classMapping.addObjectProperty(uriToObject.get(objectMappingResultIRI), property);
                } else {
                    ClassMapping objectMappingResult = new ClassMapping();
                    classMapping.addObjectProperty(objectMappingResult, property);
                    uriToObject.put(objectMappingResultIRI, objectMappingResult);
                }
            });


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
        int read = 0;
        while ((read = in.read(buffer, 0, buffer.length)) != -1) {
            baos.write(buffer, 0, read);
            baos.flush();
        }
        return baos;
    }
}