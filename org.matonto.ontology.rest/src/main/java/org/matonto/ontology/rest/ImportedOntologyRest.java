package org.matonto.ontology.rest;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;

import javax.annotation.security.RolesAllowed;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.core.Response;

@Path("/imported-ontologies")
@Api(value = "/imported-ontologies")
public interface ImportedOntologyRest {
    /**
     * Returns the ontology located at the provided URL and ensures that it is an Ontology Object as defined by OWLAPI.
     *
     * @param ontologyURL the String representing the resolvable URL for an ontology
     * @return OK if the provided URL is resolvable and is an Ontology Object. BAD_REQUEST if the URL is not resolvable
     *         or it is resolvable and is not an Ontology Object.
     */
    @GET
    @Path("{ontologyURL}")
    @RolesAllowed("user")
    @ApiOperation("Gets the ontology at the provided URL.")
    Response getImportedOntology(@PathParam("ontologyURL") String ontologyURL);
}
