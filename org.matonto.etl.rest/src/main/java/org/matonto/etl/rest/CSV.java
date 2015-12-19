package org.matonto.etl.rest;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.opencsv.CSVReader;
import org.apache.log4j.Logger;
import org.matonto.etl.api.csv.CSVConverter;
import org.openrdf.model.Model;
import org.openrdf.model.impl.LinkedHashModel;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;

import java.io.*;
import java.util.*;

public class CSV{

    CSVConverter csvConverter;

    public CSVConverter getCsvConverter(){return csvConverter;}
    public void setCsvConverter(CSVConverter csvConverter){this.csvConverter = csvConverter;}
    private static final Logger logger = Logger.getLogger(CSV.class);

    /**
     * Uploads a delimited document to the data/tmp/ directory.
     * @param inputStream A ByteArrayInputStream of a delimited document
     */
    public void upload(ByteArrayInputStream inputStream, String fileName) {


        OutputStream out = null;
        try {
            out = new FileOutputStream("data/tmp/" + fileName);

            // Transfer bytes from in to out
            byte[] buf = new byte[1024];
            int len;
            while ((len = inputStream.read(buf)) > 0) {
                out.write(buf, 0, len);
            }
            inputStream.close();
            out.close();
        } catch (FileNotFoundException e) {
            throw new RuntimeException("Error writing file");
        } catch(IOException e){
            throw new RuntimeException("Error parsing file");
        }

    }

    /**
     * ETL an uploaded file using a JSONLD Mapping File.
     * @param mappingJSON the mapping file in JSONLD format
     * @param fileName The name of the uploaded file
     * @return A JSONLD String of the converted file
     */
    public String etlFile(ByteArrayInputStream mappingJSON, String fileName){
        try{
            OutputStream out = new FileOutputStream("data/tmp/mappingFile.jsonld");

            // Transfer bytes from in to out
            byte[] buf = new byte[1024];
            int len;
            while ((len = mappingJSON.read(buf)) > 0) {
                out.write(buf, 0, len);
            }
            mappingJSON.close();
            out.close();
        }catch(Exception e) {
            throw new RuntimeException("Error Parsing Mapping File");
        }
        Model m = new LinkedHashModel();
        try{
            m = csvConverter.convert(new File("data/tmp/" + fileName),new File("data/tmp/mappingFile.jsonld"));
        }catch(Exception e){
            throw new RuntimeException(e);
        }
        StringWriter sw = new StringWriter();
        Rio.write(m,sw, RDFFormat.JSONLD);

        return sw.toString();
    }

    /**
     * Return a preview of the given delimited file. File must be present in the data/tmp/ directory
     * @param fileName The name of the file to preview
     * @param rowEnd The number of lines to show in the preview
     * @return A JSON Array. Each element in the array is a row in the document. The Row is an array of strings.
     * The strings are each a cell in the row.
     */
    public String getRows(String fileName, int rowEnd){
        File file = new File("data/tmp/" + fileName);
        String json = "";
        logger.info("File: " + fileName + " End: " + rowEnd);
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
        }catch(Exception e){
            throw new RuntimeException("Error Loading Document");
        }
        return json;
    }

}
