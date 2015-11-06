package org.matonto.etl.rest;

import io.swagger.annotations.ApiModelProperty;
import org.openrdf.query.algebra.Str;
import org.openrdf.query.algebra.evaluation.function.rdfterm.UUID;
import io.swagger.annotations.ApiModel;

/**
 * Created by bryan on 11/2/15.
 */
@ApiModel(description = "Represents an user of the system")
public class Rest {

    @ApiModelProperty(value = "The name of the user", required = true)
    public String generateUUID(){
        return java.util.UUID.randomUUID().toString();
    }
}
