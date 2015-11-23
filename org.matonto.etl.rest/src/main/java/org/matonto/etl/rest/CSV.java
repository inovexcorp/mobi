package org.matonto.etl.rest;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.opencsv.CSVReader;
import org.apache.log4j.Logger;
import org.matonto.etl.api.csv.CSVConverter;
import java.io.*;
import java.util.*;

public class CSV{

    CSVConverter csvConverter;

    public CSVConverter getCsvConverter(){return csvConverter;}
    public void setCsvConverter(CSVConverter csvConverter){this.csvConverter = csvConverter;}
    private static final Logger logger = Logger.getLogger(CSV.class);
    private String fileName = "";


    public String upload(ByteArrayInputStream inputStream){
        File file = new File("data.csv");
        StringBuilder s = new StringBuilder();
        try{
           OutputStream out = new FileOutputStream("data/tmp/" + fileName);

        // Transfer bytes from in to out
            byte[] buf = new byte[1024];
            int len;
            while ((len = inputStream.read(buf)) > 0) {
                out.write(buf, 0, len);
            }
            inputStream.close();
            out.close();
        }catch(Exception e){
            throw new RuntimeException("Error Saving Document");
        }
        logger.info(s.toString());
        return s.toString();
    }

    public void setFileName(String fileName){this.fileName = fileName;}

    public void setMappingModel(String mappingJSON){

    }

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
            for(int i = 0; i < rowEnd && i < csvRows.size(); i ++){
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
