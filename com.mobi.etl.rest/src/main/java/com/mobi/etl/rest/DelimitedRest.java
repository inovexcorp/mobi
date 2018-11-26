package com.mobi.etl.rest;

/*-
 * #%L
 * com.mobi.etl.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
import org.glassfish.jersey.media.multipart.FormDataParam;

import java.io.InputStream;
import javax.annotation.security.RolesAllowed;
import javax.ws.rs.*;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;


@Path("/delimited-files")
@Api( value = "/delimited-files" )
public interface DelimitedRest {

    /**
     * Uploads a delimited document to the temp directory.
     *
     * @param fileInputStream an InputStream of a delimited document passed as form data
     * @param fileDetail information about the file being uploaded, including the name
     * @return a Response with the name of the file created on the server
    */
    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @RolesAllowed("user")
    @ApiOperation("Upload delimited file sent as form data.")
    Response upload(@FormDataParam("delimitedFile") InputStream fileInputStream,
                    @FormDataParam("delimitedFile") FormDataContentDisposition fileDetail);

    /**
     * Replaces an uploaded delimited document in the temp directory with another
     * delimited file.
     *
     * @param fileInputStream an InputStream of a delimited document passed as form data
     * @param fileName the name of the uploaded file on the server to replace
     * @return a Response with the name of the file replaced on the server
     */
    @PUT
    @Path("{documentName}")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @RolesAllowed("user")
    @ApiOperation("Replace an uploaded delimited file with another")
    Response upload(@FormDataParam("delimitedFile") InputStream fileInputStream,
                    @PathParam("documentName") String fileName);

    /**
     * Retrieves a preview of the first specified number of rows of an uploaded
     * delimited document using the specified separator. The file must be present
     * in the data/tmp/ directory.
     *
     * @param fileName the name of the delimited document in the data/tmp/ directory
     * @param rowEnd the number of rows to retrieve from the delimited document. NOTE:
     *               the default number of rows is 10
     * @param separator the character the columns are separated by
     * @return a Response with a JSON array. Each element in the array is a row in the
     *         document. The row is an array of strings which are the cells in the row
     *         in the document.
     */
    @GET
    @Path("{documentName}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gather rows from an uploaded delimited document.")
    Response getRows(@PathParam("documentName") String fileName,
                     @DefaultValue("10") @QueryParam("rowCount") int rowEnd,
                     @DefaultValue(",") @QueryParam("separator") String separator);

    /**
     * Maps the data in an uploaded delimited document into RDF in the requested format
     * using a JSON-LD mapping string. The file must be present in the data/tmp/ directory.
     *
     * @param fileName the name of the delimited document in the data/tmp/ directory
     * @param jsonld a mapping in JSON-LD
     * @param format the RDF serialization to use if getting a preview
     * @param containsHeaders whether the delimited file has headers
     * @param separator the character the columns are separated by if it is a CSV
     * @return a Response with a JSON object containing the mapping file name and a
     *      string containing the converted data in the requested format
    */
    @POST
    @Path("{documentName}/map-preview")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces({MediaType.APPLICATION_JSON, MediaType.TEXT_PLAIN})
    @RolesAllowed("user")
    @ApiOperation("ETL an uploaded delimited document using mapping JSON-LD")
    Response etlFilePreview(@PathParam("documentName") String fileName,
                    @FormDataParam("jsonld") String jsonld,
                    @DefaultValue("jsonld") @QueryParam("format") String format,
                    @DefaultValue("true") @QueryParam("containsHeaders") boolean containsHeaders,
                    @DefaultValue(",") @QueryParam("separator") String separator);

    /**
     * Maps the data in an uploaded delimited document into RDF in the requested format
     * using a MappingRecord's Mapping and downloads the result in a file with the requested
     * name. The file must be present in the data/tmp/ directory.
     *
     * @param fileName the name of the delimited document in the data/tmp/ directory
     * @param mappingRecordIRI the id of the MappingRecord
     * @param format the RDF serialization to use
     * @param containsHeaders whether the delimited file has headers
     * @param separator the character the columns are separated by if it is a CSV
     * @param downloadFileName the name for the downloaded file
     * @return a Response with the converted data in the requested format to download
     */
    @GET
    @Path("{documentName}/map")
    @Produces({MediaType.APPLICATION_OCTET_STREAM, "text/*", "application/*"})
    @RolesAllowed("user")
    @ApiOperation("ETL an uploaded delimited document using an uploaded Mapping file and download the data")
    Response etlFile(@PathParam("documentName") String fileName,
                     @QueryParam("mappingRecordIRI") String mappingRecordIRI,
                     @DefaultValue("jsonld") @QueryParam("format") String format,
                     @DefaultValue("true") @QueryParam("containsHeaders") boolean containsHeaders,
                     @DefaultValue(",") @QueryParam("separator") String separator,
                     @QueryParam("fileName") String downloadFileName);

    /**
     * Maps the data in an uploaded delimited document into RDF using a MappingRecord's Mapping and
     * adds it to the system default named graph of the requested DatasetRecord's Dataset. The
     * file must be present in the data/tmp/ directory.
     *
     * @param fileName the name of the delimited document in the data/tmp/ directory
     * @param mappingRecordIRI the id of the MappingRecord
     * @param datasetRecordIRI the id of the DatasetRecord
     * @param containsHeaders whether the delimited file has headers
     * @param separator the character the columns are separated by if it is a CSV
     * @return a Response indicating the success of the request
     */
    @POST
    @Path("{documentName}/map")
    @RolesAllowed("user")
    @ApiOperation("ETL an uploaded delimited document using an uploaded Mapping file and load data into a Dataset")
    Response etlFile(@PathParam("documentName") String fileName,
                     @QueryParam("mappingRecordIRI") String mappingRecordIRI,
                     @QueryParam("datasetRecordIRI") String datasetRecordIRI,
                     @DefaultValue("true") @QueryParam("containsHeaders") boolean containsHeaders,
                     @DefaultValue(",") @QueryParam("separator") String separator);

    /**
     * Maps the data in an uploaded delimited document into RDF using a MappingRecord's Mapping and
     * adds it as a commit onto the specified OntologyRecord. The file must be present in the data/tmp/ directory.
     *
     * @param fileName the name of the delimited document in the data/tmp/ directory
     * @param mappingRecordIRI the id of the MappingRecord
     * @param ontologyRecordIRI the id of the DatasetRecord
     * @param branchIRI the id of the BranchRecord
     * @param update whether to treat the mapped data as an update or new additions
     * @param containsHeaders whether the delimited file has headers
     * @param separator the character the columns are separated by if it is a CSV
     * @return a Response indicating the success of the request
     */
    @POST
    @Path("{documentName}/map-to-ontology")
    @RolesAllowed("user")
    @ApiOperation("ETL an uploaded delimited document using an uploaded Mapping file and commit it to an"
            + " OntologyRecord")
    Response etlFileOntology(@Context ContainerRequestContext context,
                             @PathParam("documentName") String fileName,
                             @QueryParam("mappingRecordIRI") String mappingRecordIRI,
                             @QueryParam("ontologyRecordIRI") String ontologyRecordIRI,
                             @QueryParam("branchIRI") String branchIRI,
                             @QueryParam("update") boolean update,
                             @DefaultValue("true") @QueryParam("containsHeaders") boolean containsHeaders,
                             @DefaultValue(",") @QueryParam("separator") String separator);
}
