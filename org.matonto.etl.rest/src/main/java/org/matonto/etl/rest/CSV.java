package org.matonto.etl.rest;

import org.matonto.etl.api.csv.CSVConverter;

import java.io.File;

/**
 * Created by bryan on 11/13/15.
 */
public class CSV {

    CSVConverter csvConverter;

    public CSVConverter getCsvConverter(){return csvConverter;}
    public void setCsvConverter(CSVConverter csvConverter){this.csvConverter = csvConverter;}
    public String test(){
        try {
            csvConverter.convert(new File(""), new File(""));
        }catch(Exception e){
            return e.getMessage();
        }
        return "No exception. Strange";
    }
}
