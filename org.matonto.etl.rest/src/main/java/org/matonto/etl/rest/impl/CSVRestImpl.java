package org.matonto.etl.rest.impl;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.opencsv.CSVReader;
import net.sf.json.JSONObject;
import org.matonto.etl.api.csv.CSVConverter;
import org.matonto.etl.rest.CSVRest;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.core.utils.Values;
import org.matonto.rest.util.ErrorUtils;
import org.openrdf.model.Model;
import org.openrdf.model.Statement;
import org.openrdf.model.impl.LinkedHashModel;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import javax.ws.rs.core.Response;

@Component(immediate = true)
public class CSVRestImpl implements CSVRest {

    private CSVConverter csvConverter;
    private ModelFactory modelFactory;
    private final Logger logger = LoggerFactory.getLogger(CSVRestImpl.class);

    @Reference
    public void setCsvConverter(CSVConverter csvConverter) {
        this.csvConverter = csvConverter;
    }

    @Reference
    public void setModelFactory(ModelFactory modelFactory) {
        this.modelFactory = modelFactory;
    }

    @Override
    public Response upload(InputStream fileInputStream) {
        String fileName = generateUuid();
        Path filePath = Paths.get("data/tmp/" + fileName + ".csv");

        try {
            Files.copy(fileInputStream, filePath, StandardCopyOption.REPLACE_EXISTING);
            fileInputStream.close();
        } catch (FileNotFoundException e) {
            throw ErrorUtils.sendError("Error writing delimited file", Response.Status.BAD_REQUEST);
        } catch (IOException e) {
            throw ErrorUtils.sendError("Error parsing delimited file", Response.Status.BAD_REQUEST);
        }
        logger.info("Delimited File Uploaded: " + filePath);

        return Response.status(200).entity(fileName).build();
    }

    @Override
    public Response upload(InputStream fileInputStream, String fileName) {
        Path filePath = Paths.get("data/tmp/" + fileName + ".csv");
        if (!Files.exists(filePath)) {
            throw ErrorUtils.sendError("Delimited file doesn't not exist", Response.Status.BAD_REQUEST);
        }

        try {
            Files.copy(fileInputStream, filePath, StandardCopyOption.REPLACE_EXISTING);
            fileInputStream.close();
        } catch (FileNotFoundException e) {
            throw ErrorUtils.sendError("Error writing delimited file", Response.Status.BAD_REQUEST);
        } catch (IOException e) {
            throw ErrorUtils.sendError("Error parsing delimited file", Response.Status.BAD_REQUEST);
        }
        logger.info("Delimited File Uploaded: " + filePath);

        return Response.status(200).entity(fileName).build();
    }

    @Override
    public Response etlFile(String fileName, String jsonld, String mappingFileName, boolean containsHeaders) {
        if ((jsonld == null && mappingFileName == null) || (jsonld != null && mappingFileName != null)) {
            throw ErrorUtils.sendError("Must provider either a JSON-LD string or a mapping file name",
                    Response.Status.BAD_REQUEST);
        }

        Model model;
        File delimitedFile = new File("data/tmp/" + fileName + ".csv");
        if (mappingFileName != null) {
            Path mappingPath = Paths.get("data/tmp/" + mappingFileName + ".jsonld");
            try {
                model = sesameModel(csvConverter.convert(delimitedFile,
                        new File(mappingPath.toString()), containsHeaders));
            } catch (Exception e) {
                throw ErrorUtils.sendError("Error converting CSV to JSON-LD", Response.Status.BAD_REQUEST);
            }
        } else {
            InputStream in = new ByteArrayInputStream(jsonld.getBytes(StandardCharsets.UTF_8));
            Model mapping = null;
            try {
                mapping = Rio.parse(in, "", RDFFormat.JSONLD);
            } catch (IOException e) {
                e.printStackTrace();
            }
            try {
                model = sesameModel(csvConverter.convert(delimitedFile, matontoModel(mapping), containsHeaders));
            } catch (IOException e) {
                throw ErrorUtils.sendError("Error converting CSV to JSON-LD", Response.Status.BAD_REQUEST);
            }
        }

        logger.info("File mapped: " + delimitedFile.getPath());

        StringWriter sw = new StringWriter();
        Rio.write(model, sw, RDFFormat.JSONLD);
        JSONObject json = new JSONObject();
        json.put("mappingFileName", mappingFileName);
        json.put("data", sw.toString());

        return Response.status(200).entity(json.toString()).build();
    }

    @Override
    public Response getRows(String fileName, int rowEnd, String separator) {
        File file = new File("data/tmp/" + fileName + ".csv");
        int numRows = rowEnd;
        if (numRows <= 0) {
            numRows = 10;
        }

        logger.info("Getting " + numRows + " rows from " + file.getName());
        String json;
        try {
            char separatorChar = separator.charAt(0);
            json = convertRows(file, numRows, separatorChar);
        } catch (Exception e) {
            throw ErrorUtils.sendError("Error loading document", Response.Status.BAD_REQUEST);
        }

        return Response.status(200).entity(json).build();
    }

    /**
     * Converts the requested number rows of a CSV file into JSON and returns
     * them as a String.
     *
     * @param input the CSV file to convert into JSON
     * @param numRows the number of rows from the CSV file to convert
     * @param separator a character with the character to separate the columns by
     * @return a string with the JSON of the CSV rows
     * @throws IOException csv file could not be read
     */
    private String convertRows(File input, int numRows, char separator) throws IOException {
        CSVReader reader = new CSVReader(new FileReader(input), separator);
        List<String[]> csvRows = reader.readAll();
        List<String[]> returnRows = new ArrayList<>();
        for (int i = 0; i <= numRows && i < csvRows.size(); i ++) {
            returnRows.add(i, csvRows.get(i));
        }

        Gson gson = new GsonBuilder().create();
        JSONObject json = new JSONObject();
        json.put("columnNumber", returnRows.get(0).length);
        json.put("rows", gson.toJson(returnRows));

        return json.toString();
    }

    /**
     * Converts a MatOnto Model into a Sesame model.
     *
     * @param model a MatOnto Model for RDF data
     * @return a Sesame Model with RDF statements
    */
    private Model sesameModel(org.matonto.rdf.api.Model model) {
        Set<Statement> statements = model.stream()
                .map(Values::sesameStatement)
                .collect(Collectors.toSet());

        Model sesameModel = new LinkedHashModel();
        sesameModel.addAll(statements);

        return sesameModel;
    }

    /**
     * Convert Sesame model to MatOnto model.
     *
     * @param model A Sesame Model
     * @return A Matonto Model
     */
    protected org.matonto.rdf.api.Model matontoModel(org.openrdf.model.Model model) {
        Set<org.matonto.rdf.api.Statement> stmts = model.stream()
                .map(Values::matontoStatement)
                .collect(Collectors.toSet());

        return modelFactory.createModel(stmts);
    }

    /**
     * Creates a UUID string.
     *
     * @return a string with a UUID
     */
    public String generateUuid() {
        return UUID.randomUUID().toString();
    }
}
