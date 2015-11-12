package org.matonto.etl.rest;

import org.matonto.etl.api.csv.CSVConverter;
import io.swagger.annotations.ApiModel;

import java.util.UUID;

/**
 * Created by bryan on 11/12/15.
 */
public class Test {

    /**
     * Gets a random string
     *
     * @return a uuid
     */
    public String generateUUID(){
        return UUID.randomUUID().toString();
    }

}
