package org.matonto.etl.rest.impl;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import net.sf.json.JSONObject;
import com.opencsv.CSVReader;
import org.matonto.etl.api.csv.CSVConverter;
import org.matonto.etl.rest.EtlRest;
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
public class EtlRestImpl implements EtlRest {

    private CSVConverter csvConverter;
    private final Logger logger = LoggerFactory.getLogger(EtlRestImpl.class);

    @Reference
    public void setCsvConverter(CSVConverter csvConverter) {
        this.csvConverter = csvConverter;
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
    public Response etlFile(String fileName, InputStream mappingInputStream) {
        String mappingFileName = generateUuid();
        Path mappingPath = Paths.get("data/tmp/" + mappingFileName + ".jsonld");

        try {
            Files.copy(mappingInputStream, mappingPath, StandardCopyOption.REPLACE_EXISTING);
            mappingInputStream.close();
        } catch (Exception e) {
            throw ErrorUtils.sendError("Error parsing mapping file", Response.Status.BAD_REQUEST);
        }
        logger.info("Mapping File Uploaded: " + mappingPath);

        Model model;
        File delimitedFile = new File("data/tmp/" + fileName + ".csv");
        try {
            model = sesameModel(csvConverter.convert(delimitedFile, new File(mappingPath.toString())));
        } catch (Exception e) {
            throw ErrorUtils.sendError("Error converting CSV to JSON-LD", Response.Status.BAD_REQUEST);
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
    public Response getRows(String fileName, int rowEnd) {
        File file = new File("data/tmp/" + fileName + ".csv");
        int numRows = rowEnd;
        if (numRows <= 0) {
            numRows = 10;
        }

        logger.info("Getting " + numRows + " rows from " + file.getName());
        String json;
        try {
            json = convertRows(file, numRows);
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
     * @return a string with the JSON of the CSV rows
     * @throws IOException csv file could not be read
     */
    private String convertRows(File input, int numRows) throws IOException {
        CSVReader reader = new CSVReader(new FileReader(input));
        List<String[]> csvRows = reader.readAll();
        List<String[]> returnRows = new ArrayList<>();
        for (int i = 0; i <= numRows && i < csvRows.size(); i ++) {
            returnRows.add(i, csvRows.get(i));
        }

        Gson gson = new GsonBuilder().create();
        return gson.toJson(returnRows);
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
     * Creates a UUID string.
     *
     * @return a string with a UUID
     */
    public String generateUuid() {
        return UUID.randomUUID().toString();
    }
}
