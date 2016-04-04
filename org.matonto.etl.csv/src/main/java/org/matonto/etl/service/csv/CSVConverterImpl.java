package org.matonto.etl.service.csv;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.opencsv.CSVReader;
import org.apache.commons.io.FilenameUtils;
import org.apache.log4j.Logger;
import org.apache.poi.openxml4j.exceptions.InvalidFormatException;
import org.apache.poi.ss.usermodel.*;
import org.matonto.etl.api.csv.CSVConverter;
import org.matonto.persistence.utils.Models;
import org.matonto.rdf.api.*;
import org.matonto.rdf.core.utils.Values;
import org.openrdf.rio.*;

import java.io.*;
import java.util.*;
import java.util.concurrent.locks.ReadWriteLock;
import java.util.regex.*;
import java.util.stream.Collectors;

@Component(provide = CSVConverter.class)
public class CSVConverterImpl implements CSVConverter {

    private static final Logger LOGGER = Logger.getLogger(CSVConverterImpl.class);

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
    public Model convert(File delim, File mappingFile, boolean containsHeaders)
            throws IOException, RDFParseException, InvalidFormatException {
        Model converted = parseMapping(mappingFile);
        return convert(new FileInputStream(delim), converted, containsHeaders,
                FilenameUtils.getExtension(delim.getName()));
    }

    @Override
    public Model convert(File delim, Model mappingModel, boolean containsHeaders)
            throws IOException, InvalidFormatException {
        return convert(new FileInputStream(delim), mappingModel, containsHeaders,
                FilenameUtils.getExtension(delim.getName()));
    }

    @Override
    public Model convert(InputStream delim, File mappingFile, boolean containsHeaders, String extension)
            throws IOException, InvalidFormatException {
        Model converted = parseMapping(mappingFile);
        return convert(delim, converted, containsHeaders, extension);
    }

    @Override
    public Model convert(InputStream delim, Model mappingModel, boolean containsHeaders, String extension)
            throws IOException, InvalidFormatException {
        if (extension.equals("xls") || extension.equals("xlsx")) {
            return convertExcel(delim, mappingModel, containsHeaders);
        } else {
            return convert(new InputStreamReader(delim), mappingModel, containsHeaders);
        }
    }

    private Model convertExcel(InputStream excel, Model mappingModel, boolean containsHeaders)
            throws IOException, InvalidFormatException {
        String[] nextRow;
        Model convertedRDF = modelFactory.createModel();
        ArrayList<ClassMapping> classMappings = parseClassMappings(mappingModel);

        Workbook wb = WorkbookFactory.create(excel);
        Sheet sheet = wb.getSheetAt(0);
        DataFormatter df = new DataFormatter();

        //Traverse each row and convert column into RDF
        for (Row row : sheet) {
            nextRow = new String[row.getPhysicalNumberOfCells()];
            // If headers exist, skip them
            int index = (containsHeaders) ? 0 : 1;
            for (Cell cell : row) {
                nextRow[index] = df.formatCellValue(cell);
                index++;
            }
            for (ClassMapping cm : classMappings) {
                convertedRDF.addAll(writeClassToModel(cm, nextRow));
            }
            //Reset classMappings
            for (ClassMapping cm : classMappings) {
                cm.setInstance(false);
            }
        }

        return convertedRDF;
    }

    private Model convert(Reader csv, Model mappingModel, boolean containsHeaders) throws IOException {
        char separator = getSeparator(mappingModel);
        CSVReader reader = new CSVReader(csv, separator);
        String[] nextLine;
        Model convertedRDF = modelFactory.createModel();
        ArrayList<ClassMapping> classMappings = parseClassMappings(mappingModel);

        // If headers exist, skip them
        if (containsHeaders) {
            reader.readNext();
        }

        //Traverse each row and convert column into RDF
        while ((nextLine = reader.readNext()) != null) {
            for (ClassMapping cm : classMappings) {
                convertedRDF.addAll(writeClassToModel(cm,nextLine));
            }
            //Reset classMappings
            for (ClassMapping cm : classMappings) {
                cm.setInstance(false);
            }
        }
        return convertedRDF;
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
     * Pulls the documents delimiting character from the mapping. If no separator is found, a comma is used.
     *
     * @param mappingModel The ontology mapping in an RDF Model. See MatOnto Wiki for details.
     * @return The character that is used to separate values in the document to be loaded.
     */
    public char getSeparator(Model mappingModel) {
        char separator;
        Model documentModel = mappingModel.filter(null, valueFactory.createIRI(Delimited.TYPE.stringValue()),
                valueFactory.createIRI(Delimited.DOCUMENT.stringValue()));
        if (documentModel.isEmpty()) {
            return ',';
        }
        IRI documentIRI = Models.subjectIRI(documentModel).get();
        Model separatorModel = mappingModel.filter(documentIRI,
                valueFactory.createIRI(Delimited.SEPARATOR.stringValue()), null);
        if (separatorModel.isEmpty()) {
            return ',';
        } else {
            separator = Models.objectString(separatorModel).get().charAt(0);
        }

        return separator;
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
     * Parses a Mapping file into a Model.
     *
     * @param mapping the mapping file to be parsed to a model
     * @return An RDF Model containing the data from the mapping file
     * @throws RDFParseException Thrown if there is a problem with RDF data in the file
     * @throws IOException       Thrown if there is a problem reading the file.
     */
    private Model parseMapping(File mapping) throws RDFParseException, IOException {

        String extension = mapping.getName().split("\\.")[mapping.getName().split("\\.").length - 1];
        LOGGER.info("FileName = " + mapping.getName() + "\t Extension:" + extension);
        RDFFormat mapFormat;
        mapFormat = Rio.getParserFormatForFileName(mapping.getName()).orElseThrow(IllegalArgumentException::new);
        FileReader reader = new FileReader(mapping);
        Model model;
        model = matontoModel(Rio.parse(reader, "", mapFormat));

        return model;
    }

    /**
     * Convert Sesame model to MatOnto model.
     * @param model A Sesame Model
     * @return A Matonto Model
     */
    protected Model matontoModel(org.openrdf.model.Model model) {
        Set<Statement> stmts = model.stream()
                .map(Values::matontoStatement)
                .collect(Collectors.toSet());

        return modelFactory.createModel(stmts);
    }
}