package org.matonto.etl.service.csv;

import org.apache.log4j.Logger;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.opencsv.CSVReader;
import org.matonto.etl.api.csv.CSVConverter;
import org.openrdf.model.*;
import org.openrdf.model.impl.*;
import org.openrdf.repository.*;
import org.openrdf.rio.*;
import java.io.*;
import java.util.*;
import java.util.regex.*;

@Component(provide= CSVConverter.class)
public class CSVConverterImpl implements CSVConverter {

    private Repository repository;

    private static final Logger logger = Logger.getLogger(CSVConverterImpl.class);

    ValueFactory vf = new ValueFactoryImpl();
    Map<URI, ClassMapping> uriToObject;

    @Reference(target = "(repositorytype=memory)")
    public void setRepository(Repository repository) {
        this.repository = repository;
    }

    /**
     * Import a CSV file and load it into the MatOnto Framework
     *
     * @param csv         The csv file to be loaded
     * @param mappingFile A mapping file to map the CSV data to MatOnto Ontologies. See the MatOnto Wiki for details
     * @param repoID      The repository ID for where to load the RDF
     * @throws RDFParseException   Thrown if there is a problem parsing the mapping file
     * @throws IOException         Thrown if there is a problem reading one of the files given
     * @throws RepositoryException Thrown when the service cannot connect to the MatOnto Repository
     */
    public void importCSV(File csv, File mappingFile, String repoID) throws RDFParseException, IOException, RepositoryException {
        importCSV(csv, parseMapping(mappingFile), repoID);
    }

    /**
     * Import a CSV fild and load it into the MatOnto Framework. Mappings are already in an RDF Model
     *
     * @param csv          The csv file to be loaded
     * @param mappingModel The mapping of CSV to MatOnto Ontologies in an RDF Model. See the MatOnto Wiki for details
     * @param repoID       The repository ID for where to load the RDF
     * @throws IOException         Thrown if there is a problem reading a given file
     * @throws RepositoryException Thrown if there is a problem loading data into the repository
     */
    public void importCSV(File csv, Model mappingModel, String repoID) throws IOException, RepositoryException {
        Model converted = convert(csv, mappingModel);

        //Import Converted using rdf.importer
        if (!repository.isInitialized())
            repository.initialize();
        RepositoryConnection con = repository.getConnection();
        con.add(converted);
    }

    /**
     * Converts a CSV to RDF using a mapping file. Returns the RDF data as a Model
     *
     * @param csv         The CSV file to be loaded
     * @param mappingFile The mapping file in RDF Format. See the MatOnto Wiki for details
     * @return A Model of RDF data converted from CSV
     * @throws IOException       Thrown if there is a problem readin the files given
     * @throws RDFParseException Thrown if there is an issue parsing the RDF mapping file
     */
    public Model convert(File csv, File mappingFile) throws IOException, RDFParseException {
        Model converted = parseMapping(mappingFile);
        return convert(csv, converted);
    }

    /**
     * Generates a UUID for use in new RDF instances. Separate method allows for testing
     *
     * @return A String with a Universally Unique Identifier
     */
    public String generateUUID() {
        return UUID.randomUUID().toString();
    }

    /**
     * Pulls the documnets delimiting character from the mapping. If no separator is found, a comma is used
     *
     * @param mappingModel The ontology mapping in an RDF Model. See MatOnto Wiki for details.
     * @return The character that is used to separate values in the document to be loaded.
     */
    public char getSeparator(Model mappingModel) {
        char separator;
        Model documentModel = mappingModel.filter(null, Delimited.TYPE.uri(), Delimited.DOCUMENT.uri());
        if (documentModel.isEmpty())
            return ',';
        URI documentURI = (URI) documentModel.subjects().toArray()[0];
        Model separatorModel = mappingModel.filter(documentURI, Delimited.SEPARATOR.uri(), null);
        if (separatorModel.isEmpty())
            return ',';
        else
            separator = separatorModel.objectString().charAt(0);

        return separator;
    }

    /**
     * Converts a CSV to RDF using a mapping file. Returns the RDF data as a Model
     *
     * @param csv          The CSV file to be loaded
     * @param mappingModel An RDF Model of the mapping to CSV. See MatOnto Wiki for details.
     * @return A Model of RDF data converted from CSV
     * @throws IOException Thrown if there is a problem readin the files given
     */
    public Model convert(File csv, Model mappingModel) throws IOException {
        char separator = getSeparator(mappingModel);
        CSVReader reader = new CSVReader(new FileReader(csv), separator);
        String[] nextLine;

        Model convertedRDF = new LinkedHashModel();

        ArrayList<ClassMapping> classMappings = parseClassMappings(mappingModel);

        //Skip headers
        reader.readNext();
        //Traverse each row and convert column into RDF
        while ((nextLine = reader.readNext()) != null) {
            String uuid = generateUUID();
            for (ClassMapping cm : classMappings) {
                convertedRDF.addAll(writeClassToModel(cm, uuid, nextLine));
            }
        }
        return convertedRDF;
    }

    /**
     * Writes RDF statements based on a class mapping and a line of data from CSV
     *
     * @param cm       The ClassMapping object to guide the RDF creation
     * @param uuid     A UUID to use when creating new instances
     * @param nextLine The line of CSV to be mapped
     * @return A Model of RDF based on the line of CSV data
     */
    Model writeClassToModel(ClassMapping cm, String uuid, String[] nextLine) {
        Model convertedRDF = new LinkedHashModel();
        String classLocalName = generateLocalName(cm.getLocalName(), uuid, nextLine);

        //If there isn't enough data to create the local name, don't create the instance
        if (classLocalName.equals("_"))
            return convertedRDF;

        String cmURI = cm.getPrefix() + classLocalName;

        URI classInstance = vf.createURI(cmURI);
        convertedRDF.add(classInstance, Delimited.TYPE.uri(), vf.createURI(cm.getMapping()));
        //Create the data properties
        Map<Integer, String> dataProps = cm.getDataProperties();
        for (Integer i : dataProps.keySet()) {
            URI property = vf.createURI(dataProps.get(i));
            try {
                convertedRDF.add(classInstance, property, vf.createLiteral("" + nextLine[i - 1]));
            } catch (ArrayIndexOutOfBoundsException e) {
                //Cell does not contain any data. No need to throw exception.
                logger.warn("Missing data for " + classInstance + ": " + property);
            }
        }

        //Create the object properties
        Map<ClassMapping, String> objectProps = cm.getObjectProperties();
        for (ClassMapping objectMapping : objectProps.keySet()) {
            String localName = generateLocalName(objectMapping.getLocalName(), uuid, nextLine);

            String omURI = objectMapping.getPrefix() + localName;

            //If there isn't enough data to create the local name, don't create the instance
            URI property = vf.createURI(objectProps.get(objectMapping));
            if (!localName.equals("_"))
                convertedRDF.add(classInstance, property, vf.createURI(omURI));
        }

        return convertedRDF;
    }

    /**
     * Generates a local name for RDF Instances
     *
     * @param localNameTemplate The local name template given in the mapping file. See MatOnto Wiki for details
     * @param uuid              A Universally Unique IDentifier to use when building the local name
     * @param currentLine       The current line in the CSV file in case data is used in the Local Name
     * @return The local name portion of a URI used in RDF data
     */
    String generateLocalName(String localNameTemplate, String uuid, String[] currentLine) {
        if (localNameTemplate == null || localNameTemplate.equals(""))
            return uuid;
        Pattern p = Pattern.compile("(\\$\\{)(\\d+|UUID)(\\})");
        Matcher m = p.matcher(localNameTemplate);
        StringBuffer result = new StringBuffer();
        while (m.find()) {
            if (m.group(2).equals("UUID"))
                m.appendReplacement(result, uuid);
            else {
                int colIndex = Integer.parseInt(m.group(2));
                try {
                    m.appendReplacement(result, currentLine[colIndex - 1]);
                } catch (ArrayIndexOutOfBoundsException e) {
                    m.appendReplacement(result, "_");
                }
            }
        }
        m.appendTail(result);
        return result.toString();
    }

    /**
     * Parse the data from the Mapping File into ClassMapping POJOs
     *
     * @param mappingModel The Mapping File used to parse CSV data in a Model
     * @return An ArrayList of ClassMapping Objects created from the mapping model.
     */
    private ArrayList<ClassMapping> parseClassMappings(Model mappingModel) {
        ArrayList<ClassMapping> classMappings = new ArrayList<ClassMapping>();

        Model classMappingModel = mappingModel.filter(null, Delimited.TYPE.uri(), vf.createURI("http://matonto.org/ontologies/delimited/ClassMapping"));
        uriToObject = new LinkedHashMap<URI, ClassMapping>();
        for (Resource classMappingURI : classMappingModel.subjects()) {

            ClassMapping classMapping;

            if (uriToObject.containsKey(classMappingURI)) {
                classMapping = uriToObject.get(classMappingURI);
            } else {
                classMapping = new ClassMapping();
                uriToObject.put((URI) classMappingURI, classMapping);
            }

            Model prefixModel = mappingModel.filter(classMappingURI, Delimited.HAS_PREFIX.uri(), null);

            //Parse each property
            if (!prefixModel.isEmpty())
                classMapping.setPrefix(prefixModel.objectString());
            Model mapsToModel = mappingModel.filter(classMappingURI, Delimited.MAPS_TO.uri(), null);
            if (!mapsToModel.isEmpty())
                classMapping.setMapping(mapsToModel.objectString());
            Model localNameModel = mappingModel.filter(classMappingURI, Delimited.LOCAL_NAME.uri(), null);
            if (!localNameModel.isEmpty())
                classMapping.setLocalName(localNameModel.objectString());

            //Parse the data properties
            Model dataPropertyModel = mappingModel.filter(classMappingURI, Delimited.DATA_PROPERTY.uri(), null);
            for (Statement s : dataPropertyModel) {
                Model propertyModel = mappingModel.filter((URI) s.getObject(), Delimited.HAS_PROPERTY.uri(), null);
                String property = propertyModel.objectString();
                Model indexModel = mappingModel.filter((URI) s.getObject(), Delimited.COLUMN_INDEX.uri(), null);
                Integer columnIndexInt = Integer.parseInt(indexModel.objectLiteral().stringValue());
                classMapping.addDataProperty(columnIndexInt, property);
            }

            //Parse the object properties
            Model objectPropertyModel = mappingModel.filter(classMappingURI, Delimited.OBJECT_PROPERTY.uri(), null);
            for (Statement s : objectPropertyModel) {
                Model propertyModel = mappingModel.filter((URI) s.getObject(), Delimited.HAS_PROPERTY.uri(), null);
                String property = propertyModel.objectString();
                Model classModel = mappingModel.filter((URI) s.getObject(), Delimited.CLASS_MAPPING_PROP.uri(), null);
                URI objectMappingResultURI = classModel.objectURI();

                if (uriToObject.containsKey(objectMappingResultURI))
                    classMapping.addObjectProperty(uriToObject.get(objectMappingResultURI), property);
                else {
                    ClassMapping objectMappingResult = new ClassMapping();
                    classMapping.addObjectProperty(objectMappingResult, property);
                    uriToObject.put(objectMappingResultURI, objectMappingResult);
                }
            }
            classMappings.add(classMapping);
        }
        return classMappings;
    }

    /**
     * Parses a Mapping file into a Model
     *
     * @param mapping the maping file to be parsed to a model
     * @return An RDF Model containing the data from the mapping file
     * @throws RDFParseException Thrown if there is a problem with RDF data in the file
     * @throws IOException       Thrown if there is a problem reading the file.
     */
    private Model parseMapping(File mapping) throws RDFParseException, IOException {
        RDFFormat mapFormat = Rio.getParserFormatForFileName(mapping.getName());
        FileReader r = new FileReader(mapping);
        Model m;
        m = Rio.parse(r, "", mapFormat);

        return m;
    }
}