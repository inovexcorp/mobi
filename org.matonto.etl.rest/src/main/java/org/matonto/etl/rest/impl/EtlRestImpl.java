package org.matonto.etl.rest.impl;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.opencsv.CSVReader;
import org.openrdf.model.Model;
import org.openrdf.model.impl.LinkedHashModel;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import javax.ws.rs.core.Response;
import javax.ws.rs.WebApplicationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.matonto.etl.api.csv.CSVConverter;
import org.matonto.etl.rest.EtlRest;
import org.matonto.rdf.core.utils.Values;

import java.io.*;
import java.util.*;
import java.util.stream.Collectors;

@Component(immediate = true)
public class EtlRestImpl implements EtlRest {

    private CSVConverter csvConverter;
    private final Logger LOG = LoggerFactory.getLogger(EtlRestImpl.class);

    @Reference
    public void setCsvConverter(CSVConverter csvConverter) {
        this.csvConverter = csvConverter;
    }

    @Override
    public Response upload(String fileName, InputStream fileInputStream) {
        // fileName is required
        if (fileName == null || fileName.length() == 0) {
            throw sendError("Uploaded fileName is missing", Response.Status.BAD_REQUEST);            
        }

        OutputStream out = null;
        try {
            out = new FileOutputStream("data/tmp/" + fileName);

            // Transfer bytes from in to out
            byte[] buf = new byte[1024];
            int len;
            while ((len = fileInputStream.read(buf)) > 0) {
                out.write(buf, 0, len);
            }
            fileInputStream.close();
            out.close();
        } catch (FileNotFoundException e) {
            throw sendError("Error writing delimited file", Response.Status.BAD_REQUEST);
        } catch(IOException e){
            throw sendError("Error parsing delimited file", Response.Status.BAD_REQUEST);
        }
        LOG.info("Delimited File Uploaded: data/tmp/" + fileName);

        return Response.status(200).entity("Successfully uploaded file to data/tmp/" + fileName).build();
    }

    @Override
    public Response etlFile(String fileName, InputStream mappingInputStream) {
        LOG.info("ETL File: data/tmp/" + fileName);

        try {
            OutputStream out = new FileOutputStream("data/tmp/mappingFile.jsonld");

            // Transfer bytes from in to out
            byte[] buf = new byte[1024];
            int len;
            while ((len = mappingInputStream.read(buf)) > 0) {
                out.write(buf, 0, len);
            }
            mappingInputStream.close();
            out.close();
        } catch (Exception e) {
            throw sendError("Error parsing mapping file", Response.Status.BAD_REQUEST);
        }

        Model m = new LinkedHashModel();
        try {
            m = sesameModel(csvConverter.convert(new File("data/tmp/" + fileName), new File("data/tmp/mappingFile.jsonld")));
        } catch (Exception e){
            throw sendError("Error converting CSV to JSON-LD", Response.Status.BAD_REQUEST);
        } 

        StringWriter sw = new StringWriter();
        Rio.write(m, sw, RDFFormat.JSONLD);

        return Response.status(200).entity(sw.toString()).build();
    }

    @Override
    public Response getRows(String fileName, int rowEnd) {
        File file = new File("data/tmp/" + fileName);
        String json = "";
        LOG.info("Getting " + rowEnd + " rows from " + fileName);
        if (rowEnd == 0) {
            rowEnd = 10;
        }
        try {
            CSVReader reader = new CSVReader(new FileReader(file));
            List<String[]> csvRows = reader.readAll();
            List<String[]> returnRows = new ArrayList<String[]>();
            for(int i = 0; i <= rowEnd && i < csvRows.size(); i ++){
                returnRows.add(i, csvRows.get(i));
            }

            Gson gson = new GsonBuilder().create();
            json = gson.toJson(returnRows);
        } catch (Exception e){
            throw sendError("Error loading document", Response.Status.BAD_REQUEST);
        }

        return Response.status(200).entity(json).build();
    }

    /**
     * Converts a Matonto Model into a Sesame model. 
     *
     * @param m a Matonto Model for RDF data
     * @return a Sesame Model with RDF statements
    */
    private Model sesameModel(org.matonto.rdf.api.Model m){
        Set<org.openrdf.model.Statement> stmts = m.stream()
                .map(Values::sesameStatement)
                .collect(Collectors.toSet());

        Model sesameModel = new LinkedHashModel();
        sesameModel.addAll(stmts);

        return sesameModel;
    }

    /**
     * Logs the HTTP error and throws a WebApplicationException with the error status 
     * and message.
     *
     * @param msg the message to be displayed about the error
     * @param status the HTTP status code for the error
     * @return a WebApplicationException with the HTTP error status and message
    */
    private WebApplicationException sendError(String msg, Response.Status status) throws WebApplicationException {
        LOG.error(String.format("%d: %s", status.getStatusCode(), msg));
        return new WebApplicationException(msg, status);
    }
}
