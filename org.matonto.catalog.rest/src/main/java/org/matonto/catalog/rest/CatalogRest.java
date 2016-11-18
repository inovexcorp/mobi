package org.matonto.catalog.rest;

/*-
 * #%L
 * org.matonto.catalog.rest
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
import org.glassfish.jersey.media.multipart.FormDataParam;
import org.matonto.catalog.api.ontologies.mcat.*;

import javax.annotation.security.RolesAllowed;
import javax.ws.rs.*;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.*;

@Path("/catalogs")
@Api(value = "/catalogs")
public interface CatalogRest {

    /**
     * Retrieves a list of the Catalogs (two) available in the system. These Catalogs will be the distributed and
     * local Catalog which contain different Records depending on the situation.
     *
     * @param catalogType The type of Catalog you want back (local or distributed).
     * @return The list of Catalogs within the repository.
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves the distributed and local Catalogs.")
    Response getCatalogs(@QueryParam("type") String catalogType);

    /**
     * Retrieves the specified Catalog based on the provided ID.
     *
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @return The specific Catalog from the repository.
     */
    @GET
    @Path("{catalogId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves the Catalog specified by the provided ID.")
    Response getCatalog(@PathParam("catalogId") String catalogId);

    /**
     * Retrieves a list of all the Records in the Catalog. An optional type parameter filters the returned Records.
     * Parameters can be passed to control paging.
     *
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param sort The field with sort order specified.
     * @param recordType The type of Records you want to get back (unversioned, versioned, ontology, mapping, or
     *                   dataset).
     * @param offset The offset for the page.
     * @param limit The number of Records to return in one page.
     * @param searchText The String used to filter out Records.
     * @return The list of Records that match the search criteria.
     */
    @GET
    @Path("{catalogId}/records")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves the Records in the Catalog.")
    Response getRecords(@PathParam("catalogId") String catalogId,
                        @QueryParam("sort") String sort,
                        @QueryParam("type") String recordType,
                        @DefaultValue("0") @QueryParam("offset") int offset,
                        @DefaultValue("100") @QueryParam("limit") int limit,
                        @QueryParam("searchText") String searchText);

    /**
     * Creates a new Record in the repository. Returns a Response indicating whether it was created successfully.
     *
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param newRecord The new Record which you want to add to the catalog.
     * @param <T> An Object which extends the Record class.
     * @return A Response indicating whether the Record was created successfully.
     */
    @POST
    @Path("{catalogId}/records")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Creates a new Record in the Catalog.")
    <T extends Record> Response createRecord(@PathParam("catalogId") String catalogId,
                                             T newRecord);

    /**
     * Returns a Record with the provided ID.
     *
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId The String representing the Record ID. NOTE: Assumes ID represents an IRI unless String begins
     *                 with "_:".
     * @return A Record with the provided ID.
     */
    @GET
    @Path("{catalogId}/records/{recordId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves the Catalog record by its ID.")
    Response getRecord(@PathParam("catalogId") String catalogId,
                       @PathParam("recordId") String recordId);

    /**
     * Deletes a Record from the repository. Returns a Response which indicates whether or not the requested Record was
     * deleted.
     *
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId The String representing the Record ID. NOTE: Assumes ID represents an IRI unless String begins
     *                 with "_:".
     * @return A Response indicating whether or not the Record was deleted.
     */
    @DELETE
    @Path("{catalogId}/records/{recordId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Deletes the Catalog Record by its ID.")
    Response deleteRecord(@PathParam("catalogId") String catalogId,
                          @PathParam("recordId") String recordId);

    /**
     * Updates a Record based on the ID contained within the provided Catalog using the modifications from the provided
     * newRecord. It returns a Response indicating whether the Record was correctly updated.
     *
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId The String representing the Record ID. NOTE: Assumes ID represents an IRI unless String begins
     *                 with "_:".
     * @param newRecord The Record containing the new values which will replace the existing Record.
     * @param <T> An Object which extends the Record class.
     * @return A Response indicating whether or not the Record was updated.
     */
    @PUT
    @Path("{catalogId}/records/{recordId}")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Updates the Catalog Record by its ID using the provided Record.")
    <T extends Record> Response updateRecord(@PathParam("catalogId") String catalogId,
                                             @PathParam("recordId") String recordId,
                                             T newRecord);

    /**
     * Retrieves a list of all the Distributions associated with a specific UnversionedRecord. Parameters can be passed
     * to control paging.
     *
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId The String representing the UnversionedRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param sort The field with sort order specified.
     * @param offset The offset for the page.
     * @param limit The number of Distributions to return in one page.
     * @return A Response with a list of all the Distributions of the requested UnversionedRecord.
     */
    @GET
    @Path("{catalogId}/records/{recordId}/distributions")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves the list of Distributions associated with an UnversionedRecord.")
    Response getUnversionedDistributions(@PathParam("catalogId") String catalogId,
                                         @PathParam("recordId") String recordId,
                                         @QueryParam("sort") String sort,
                                         @DefaultValue("0") @QueryParam("offset") int offset,
                                         @DefaultValue("100") @QueryParam("limit") int limit);

    /**
     * Creates a new Distribution for the provided UnversionedRecord. Returns a Response indicating whether it was
     * saved or not.
     *
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId The String representing the UnversionedRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param newDistribution The Distribution that you want to add to the specific Record.
     * @return A Response indicating if the new Distribution was created successfully.
     */
    @POST
    @Path("{catalogId}/records/{recordId}/distributions")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Creates a new Distribution for the provided UnversionedRecord.")
    Response createUnversionedDistribution(@PathParam("catalogId") String catalogId,
                                           @PathParam("recordId") String recordId,
                                           Distribution newDistribution);

    /**
     * Returns the Distribution of the UnversionedRecord identified using the provided IDs.
     *
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId The String representing the UnversionedRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param distributionId The String representing the Distribution ID. NOTE: Assumes ID represents an IRI unless
     *                       String begins with "_:".
     * @return The Distribution that was identified by the provided IDs.
     */
    @GET
    @Path("{catalogId}/records/{recordId}/distributions/{distributionId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets a specific Distribution of an UnversionedRecord.")
    Response getUnversionedDistribution(@PathParam("catalogId") String catalogId,
                                        @PathParam("recordId") String recordId,
                                        @PathParam("distributionId") String distributionId);

    /**
     * Deletes a specific Distribution identified by the provided IDs. Returns a Response indicating whether it was
     * successfully deleted.
     *
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId The String representing the UnversionedRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param distributionId The String representing the Distribution ID. NOTE: Assumes ID represents an IRI unless
     *                       String begins with "_:".
     * @return A Response indicating if the Distribution was deleted.
     */
    @DELETE
    @Path("{catalogId}/records/{recordId}/distributions/{distributionId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Deletes a specific Distribution of an UnversionedRecord.")
    Response deleteUnversionedDistribution(@PathParam("catalogId") String catalogId,
                                           @PathParam("recordId") String recordId,
                                           @PathParam("distributionId") String distributionId);

    /**
     * Updates a specific Distribution for an UnversionedRecord identified by the provided IDs using the modifications
     * in the provided newDistribution. Returns a Response indicating whether it was successfully updated.
     *
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId The String representing the UnversionedRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param distributionId The String representing the Distribution ID. NOTE: Assumes ID represents an IRI unless
     *                       String begins with "_:".
     * @return A Response indicating if the Distribution was updated.
     */
    @PUT
    @Path("{catalogId}/records/{recordId}/distributions/{distributionId}")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Updates a specific Distribution of an UnversionedRecord.")
    Response updateUnversionedDistribution(@PathParam("catalogId") String catalogId,
                                           @PathParam("recordId") String recordId,
                                           @PathParam("distributionId") String distributionId,
                                           Distribution newDistribution);

    /**
     * Gets the latest Version of a VersionedRecord identified by the provided IDs.
     *
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId The String representing the VersionedRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @return The latest Version for the identified VersionedRecord.
     */
    @GET
    @Path("{catalogId}/records/{recordId}/versions/latest")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets the latest Version of a VersionedRecord.")
    Response getLatestVersion(@PathParam("catalogId") String catalogId,
                              @PathParam("recordId") String recordId);

    /**
     * Gets a list of all Versions for a VersionedRecord. Parameters can be passed to control paging.
     *
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId The String representing the VersionedRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param sort The field with sort order specified.
     * @param offset The offset for the page.
     * @param limit The number of Versions to return in one page.
     * @return A list of all the Versions associated with a VersionedRecord.
     */
    @GET
    @Path("{catalogId}/records/{recordId}/versions")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets a list of Versions for a VersionedRecord.")
    Response getVersions(@PathParam("catalogId") String catalogId,
                         @PathParam("recordId") String recordId,
                         @QueryParam("sort") String sort,
                         @DefaultValue("0") @QueryParam("offset") int offset,
                         @DefaultValue("100") @QueryParam("limit") int limit);

    /**
     * Creates a Version for the identified VersionedRecord and stores it in the repository. This Version will become
     * the latest Version for the identified VersionedRecord. Returns a Response identifying whether the Version was
     * created successfully.
     *
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId The String representing the VersionedRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param newVersion The Version which you wish to add to the identified VersionedRecord.
     * @param <T> An Object which extends the Version class.
     * @return A Response indicating whether the Version was saved or not.
     */
    @POST
    @Path("{catalogId}/records/{recordId}/versions")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Creates a Version for the identified VersionedRecord.")
    <T extends Version> Response createVersion(@PathParam("catalogId") String catalogId,
                                               @PathParam("recordId") String recordId,
                                               T newVersion);

    /**
     * Gets a specific Version identified by the provided IDs.
     *
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId The String representing the VersionedRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param versionId The String representing the Version ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param <T> An Object which extends the Version class.
     * @return The requested Version.
     */
    @GET
    @Path("{catalogId}/records/{recordId}/versions/{versionId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets a specific Version for the identified VersionedRecord.")
    Response getVersion(@PathParam("catalogId") String catalogId,
                        @PathParam("recordId") String recordId,
                        @PathParam("versionId") String versionId);

    /**
     * Removes a specific Version from a VersionedRecord. If that Version happens to be the latest Version, the latest
     * Version will be updated to be the previous Version. Returns a Response identifying whether the Version was
     * deleted.
     *
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId The String representing the VersionedRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param versionId The String representing the Version ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @return A Response indicating whether the Version was deleted.
     */
    @DELETE
    @Path("{catalogId}/records/{recordId}/versions/{versionId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Deletes a specific Version from the identified VersionedRecord.")
    Response deleteVersion(@PathParam("catalogId") String catalogId,
                           @PathParam("recordId") String recordId,
                           @PathParam("versionId") String versionId);

    /**
     * Updates the Version identified by the provided IDs using the modifications in the provided newVersion. Returns a
     * Response identifying whether the Version was updated.
     *
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId The String representing the VersionedRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param versionId The String representing the Version ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param newVersion The Version which will replace the existing Version identified in the repository.
     * @param <T> An Object which extends the Version class.
     * @return A Response indicating whether the Version was updated.
     */
    @PUT
    @Path("{catalogId}/records/{recordId}/versions/{versionId}")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Updates a specific Version of the identified VersionedRecord.")
    <T extends Version> Response updateVersion(@PathParam("catalogId") String catalogId,
                                               @PathParam("recordId") String recordId,
                                               @PathParam("versionId") String versionId,
                                               T newVersion);

    /**
     * Retrieves a list of all the Distributions associated with a specific Version. Parameters can be passed to control
     * paging.
     *
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId The String representing the VersionedRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param versionId The String representing the Version ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param sort The field with sort order specified.
     * @param offset The offset for the page.
     * @param limit The number of Distributions to return in one page.
     * @return Returns a list of Distributions for the identified Version.
     */
    @GET
    @Path("{catalogId}/records/{recordId}/versions/{versionId}/distributions")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets the list of all Distributions for the identified Version.")
    Response getVersionedDistributions(@PathParam("catalogId") String catalogId,
                                       @PathParam("recordId") String recordId,
                                       @PathParam("versionId") String versionId,
                                       @QueryParam("sort") String sort,
                                       @DefaultValue("0") @QueryParam("offset") int offset,
                                       @DefaultValue("100") @QueryParam("limit") int limit);

    /**
     * Creates a new Distribution for the identified Version. Returns a Response identifying whether the Distribution
     * was created.
     *
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId The String representing the VersionedRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param versionId The String representing the Version ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param newDistribution A Distribution which will be stored in the repository.
     * @return A Response indicating whether the Distribution was created or not.
     */
    @POST
    @Path("{catalogId}/records/{recordId}/versions/{versionId}/distributions")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Creates a Distribution for the identified Version.")
    Response createVersionedDistribution(@PathParam("catalogId") String catalogId,
                                         @PathParam("recordId") String recordId,
                                         @PathParam("versionId") String versionId,
                                         Distribution newDistribution);

    /**
     * Gets a specific Distribution for the Version identified by the IDs.
     *
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId The String representing the VersionedRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param versionId The String representing the Version ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param distributionId The String representing the Distribution ID. NOTE: Assumes ID represents an IRI unless
     *                       String begins with "_:".
     * @return The Distribution for the Version identified by the IDs.
     */
    @GET
    @Path("{catalogId}/records/{recordId}/versions/{versionId}/distributions/{distributionId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets a specific Distribution for the identified Version.")
    Response getVersionedDistribution(@PathParam("catalogId") String catalogId,
                                      @PathParam("recordId") String recordId,
                                      @PathParam("versionId") String versionId,
                                      @PathParam("distributionId") String distributionId);

    /**
     * Deletes the Distribution from the Version identified by the IDs. Returns a Response identifying whether the
     * Distribution was deleted.
     *
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId The String representing the VersionedRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param versionId The String representing the Version ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param distributionId The String representing the Distribution ID. NOTE: Assumes ID represents an IRI unless
     *                       String begins with "_:".
     * @return A Response identifying whether the Distribution was deleted.
     */
    @DELETE
    @Path("{catalogId}/records/{recordId}/versions/{versionId}/distributions/{distributionId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Deletes a specific Distribution of the identified Version.")
    Response deleteVersionedDistribution(@PathParam("catalogId") String catalogId,
                                         @PathParam("recordId") String recordId,
                                         @PathParam("versionId") String versionId,
                                         @PathParam("distributionId") String distributionId);

    /**
     * Updates the specified Distribution with the modifications in the provided newDistribution. Returns a Response
     * identifying whether the Distribution was updated or not.
     *
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId The String representing the VersionedRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param versionId The String representing the Version ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param distributionId The String representing the Distribution ID. NOTE: Assumes ID represents an IRI unless
     *                       String begins with "_:".
     * @param newDistribution The Distribution with the modifications made.
     * @return A Response identifying whether the Distribution was updated.
     */
    @PUT
    @Path("{catalogId}/records/{recordId}/versions/{versionId}/distributions/{distributionId}")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Updates a specific Distribution of the identified Version.")
    Response updateVersionedDistribution(@PathParam("catalogId") String catalogId,
                                         @PathParam("recordId") String recordId,
                                         @PathParam("versionId") String versionId,
                                         @PathParam("distributionId") String distributionId,
                                         Distribution newDistribution);

    /**
     * Gets the Commit associated with the identified Version using the provided IDs.
     *
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId The String representing the VersionedRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param versionId The String representing the Version ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @return The Commit associated with the identified Version.
     */
    @GET
    @Path("{catalogId}/records/{recordId}/versions/{versionId}/commit")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets the Commit associated with the identified Version.")
    Response getVersionCommit(@PathParam("catalogId") String catalogId,
                              @PathParam("recordId") String recordId,
                              @PathParam("versionId") String versionId);

    /**
     * Gets the master Branch of a VersionedRDFRecord identified by the provided IDs.
     *
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId The String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @return The master Branch for the identified VersionedRDFRecord.
     */
    @GET
    @Path("{catalogId}/records/{recordId}/branches/master")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets the master Branch of a VersionedRDFRecord.")
    Response getMasterBranch(@PathParam("catalogId") String catalogId,
                             @PathParam("recordId") String recordId);

    /**
     * Gets a list of Branches associated with a VersionedRDFRecord identified by the provided IDs.
     *
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId The String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param sort The field with sort order specified.
     * @param offset The offset for the page.
     * @param limit The number of Branches to return in one page.
     * @return A list of Branches for the identified VersionedRDFRecord.
     */
    @GET
    @Path("{catalogId}/records/{recordId}/branches")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets list of Branches associated with a specific VersionedRDFRecord.")
    Response getBranches(@PathParam("catalogId") String catalogId,
                         @PathParam("recordId") String recordId,
                         @QueryParam("sort") String sort,
                         @DefaultValue("0") @QueryParam("offset") int offset,
                         @DefaultValue("100") @QueryParam("limit") int limit);

    /**
     * Creates a Branch for a VersionedRDFRecord identified by the IDs. Returns a Response identifying whether the
     * Branch was successfully created.
     *
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId The String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param newBranch The Branch which you wish to add to the VersionedRDFRecord.
     * @return A Response identifying whether the Branch was created.
     */
    @POST
    @Path("{catalogId}/records/{recordId}/branches")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Creates a branch for a specific VersionedRDFRecord.")
    Response createBranch(@PathParam("catalogId") String catalogId,
                          @PathParam("recordId") String recordId,
                          Branch newBranch);

    /**
     * Gets a specific Branch of a VersionedRDFRecord identified by the provided IDs.
     *
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId The String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param branchId The String representing the Branch ID. NOTE: Assumes ID represents an IRI unless String begins
     *                 with "_:".
     * @return The identified Branch for the specific VersionedRDFRecord.
     */
    @GET
    @Path("{catalogId}/records/{recordId}/branches/{branchId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Get a specific Branch for a specific VersionedRDFRecord.")
    Response getBranch(@PathParam("catalogId") String catalogId,
                       @PathParam("recordId") String recordId,
                       @PathParam("branchId") String branchId);

    /**
     * Deletes a specific Branch of a VersionedRDFRecord. Returns a Response identifying whether the Branch was
     * successfully deleted.
     *
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId The String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param branchId The String representing the Branch ID. NOTE: Assumes ID represents an IRI unless String begins
     *                 with "_:".
     * @return A Response identifying whether the Branch was deleted.
     */
    @DELETE
    @Path("{catalogId}/records/{recordId}/branches/{branchId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Deletes a specific Branch for a specific VersionedRDFRecord.")
    Response deleteBranch(@PathParam("catalogId") String catalogId,
                          @PathParam("recordId") String recordId,
                          @PathParam("branchId") String branchId);

    /**
     * Updates the specified Branch using the modifications in the provided newBranch. Returns a Response identifying
     * whether the Branch was updated or not.
     *
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId The String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param branchId The String representing the Branch ID. NOTE: Assumes ID represents an IRI unless String begins
     *                 with "_:".
     * @param newBranch The Branch with the modifications that you want to save for the specified Branch.
     * @return A Response identifying whether the Branch was successfully updated.
     */
    @PUT
    @Path("{catalogId}/records/{recordId}/branches/{branchId}")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Updates a specific Branch for a specific VersionedRDFRecord.")
    Response updateBranch(@PathParam("catalogId") String catalogId,
                          @PathParam("recordId") String recordId,
                          @PathParam("branchId") String branchId,
                          Branch newBranch);

    /**
     * Gets the head Commit associated with a Branch.
     *
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId The String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param branchId The String representing the Branch ID. NOTE: Assumes ID represents an IRI unless String begins
     *                 with "_:".
     * @return A Response with the Commit which is the head of the identified Branch.
     */
    @GET
    @Path("{catalogId}/records/{recordId}/branches/{branchId}/head")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets the head Commit for a specific Branch.")
    Response getHead(@PathParam("catalogId") String catalogId,
                     @PathParam("recordId") String recordId,
                     @PathParam("branchId") String branchId);

    /**
     * Gets a Set of Commits associated with the Branch identified by the provided IDs which represents the Commit
     * chain for that Branch.
     *
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId The String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param branchId The String representing the Branch ID. NOTE: Assumes ID represents an IRI unless String begins
     *                 with "_:".
     * @return A list of Commits for the identified Branch which represents the Commit chain.,
     */
    @GET
    @Path("{catalogId}/records/{recordId}/branches/{branchId}/commits")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets the Commit chain for a specific Branch.")
    Response getCommitChain(@PathParam("catalogId") String catalogId,
                            @PathParam("recordId") String recordId,
                            @PathParam("branchId") String branchId);

    /**
     * Creates a new Commit in the repository for a specific Branch using the InProgressCommit associated with the user
     * making this request. The head Commit is updated to be this new Commit. Returns a Response indicating whether it
     * was created successfully.
     *
     * @param context The context of the request.
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId The String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param branchId The String representing the Branch ID. NOTE: Assumes ID represents an IRI unless String begins
     *                 with "_:".
     * @return A Response indicating whether the Commit was successfully added to the Branch.
     */
    @POST
    @Path("{catalogId}/records/{recordId}/branches/{branchId}/commits")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Creates a Commit for a specific Branch and sets it to be the new head Commit.")
    Response createBranchCommit(@Context ContainerRequestContext context,
                                @PathParam("catalogId") String catalogId,
                                @PathParam("recordId") String recordId,
                                @PathParam("branchId") String branchId);

    /**
     * Gets the Commit identified by the provided IDs.
     *
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId The String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param branchId The String representing the Branch ID. NOTE: Assumes ID represents an IRI unless String begins
     *                 with "_:".
     * @param commitId The String representing the Commit ID. NOTE: Assumes ID represents an IRI unless String begins
     *                 with "_:".
     * @return A Response with the Commit identified by the provided IDs.
     */
    @GET
    @Path("{catalogId}/records/{recordId}/branches/{branchId}/commits/{commitId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets a specific Commit on a specific Branch.")
    Response getBranchCommit(@PathParam("catalogId") String catalogId,
                             @PathParam("recordId") String recordId,
                             @PathParam("branchId") String branchId,
                             @PathParam("commitId") String commitId);

    /**
     * Gets the Conflicts between the Commit identified by the provided IDs in the path and the Commit identified by the
     * query parameter. For this comparison to be done, the Commits must have an ancestor Commit in common.
     *
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId The String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param branchId The String representing the Branch ID. NOTE: Assumes ID represents an IRI unless String begins
     *                 with "_:".
     * @param leftId The String representing the left Commit ID. NOTE: Assumes ID represents an IRI unless String begins
     *               with "_:".
     * @param rightId The String representing the right Commit ID. NOTE: Assumes ID represents an IRI unless String
     *                begins with "_:".
     * @return A Response with the list of Conflicts between the identified Commits.
     */
    @GET
    @Path("{catalogId}/records/{recordId}/branches/{branchId}/commits/{commitId}/conflicts")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets a list of Conflicts found between the two provided Commits.")
    Response getConflicts(@PathParam("catalogId") String catalogId,
                          @PathParam("recordId") String recordId,
                          @PathParam("branchId") String branchId,
                          @PathParam("commitId") String leftId,
                          @QueryParam("commitId") String rightId);


    /**
     * Performs a merge between the two Commits identified by the provided IDs. The addition and deletion statements
     * that are required to resolve any conflicts will be used to create the merged Commit. Returns a Response
     * indicating whether the Commits were merged successfully.
     *
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId The String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param branchId The String representing the Branch ID. NOTE: Assumes ID represents an IRI unless String begins
     *                 with "_:".
     * @param leftId The String representing the left Commit ID. NOTE: Assumes ID represents an IRI unless String begins
     *               with "_:".
     * @param rightId The String representing the right Commit ID. NOTE: Assumes ID represents an IRI unless String
     *                begins with "_:".
     * @param additionsJson The String of JSON-LD that corresponds to the statements that were added to the entity.
     * @param deletionsJson The String of JSON-LD that corresponds to the statements that were deleted in the entity.
     * @return A Response indicating whether the Commits were successfully merged.
     */
    @POST
    @Path("{catalogId}/records/{recordId}/branches/{branchId}/commits/{commitId}/conflicts/resolution")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @RolesAllowed("user")
    @ApiOperation("Merges the two commits identified by the provided IDs.")
    Response merge(@PathParam("catalogId") String catalogId,
                   @PathParam("recordId") String recordId,
                   @PathParam("branchId") String branchId,
                   @PathParam("commitId") String leftId,
                   @QueryParam("commitId") String rightId,
                   @FormDataParam("additions") String additionsJson,
                   @FormDataParam("deletions") String deletionsJson);

    /**
     * Gets the Commit identified by the provided IDs and returns the compiled Resource following the Commit chain
     * which terminates at the identified Commit.
     *
     * @param context The context of the request.
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId The String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param branchId The String representing the Branch ID. NOTE: Assumes ID represents an IRI unless String begins
     *                 with "_:".
     * @param commitId The String representing the Commit ID. NOTE: Assumes ID represents an IRI unless String begins
     *                 with "_:".
     * @param rdfFormat the desired RDF return format. NOTE: Optional param - defaults to "jsonld".
     * @param apply A boolean value identifying whether the InProgressCommit associated with identified Record should be
     *              applied to the result.
     * @return A Response the compiled Resource for the entity at the specific Commit.
     */
    @GET
    @Path("{catalogId}/records/{recordId}/branches/{branchId}/commits/{commitId}/resource")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets the compiled resource for a the entity identified by a specific Commit.")
    Response getCompiledResource(@Context ContainerRequestContext context,
                                 @PathParam("catalogId") String catalogId,
                                 @PathParam("recordId") String recordId,
                                 @PathParam("branchId") String branchId,
                                 @PathParam("commitId") String commitId,
                                 @DefaultValue("jsonld") @QueryParam("rdfFormat") String rdfFormat,
                                 @DefaultValue("false") @QueryParam("applyInProgressCommit") boolean apply);

    /**
     * Gets the Commit identified by the provided IDs and creates an OutputStream of the compiled Resource following the
     * Commit chain which terminates at the identified Commit.
     *
     * @param context The context of the request.
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId The String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param branchId The String representing the Branch ID. NOTE: Assumes ID represents an IRI unless String begins
     *                 with "_:".
     * @param commitId The String representing the Commit ID. NOTE: Assumes ID represents an IRI unless String begins
     *                 with "_:".
     * @param rdfFormat the desired RDF return format. NOTE: Optional param - defaults to "jsonld".
     * @param apply A boolean value identifying whether the InProgressCommit associated with the identified Record and
     *              User making the request should be applied to the result.
     * @return A Response with the compiled Resource for the entity at the specific Commit to download.
     */
    @GET
    @Path("{catalogId}/records/{recordId}/branches/{branchId}/commits/{commitId}/resource")
    @Produces({MediaType.APPLICATION_OCTET_STREAM, "text/*", "application/*"})
    @RolesAllowed("user")
    @ApiOperation("Gets the compiled resource for a the entity identified by a specific Commit.")
    Response downloadCompiledResource(@Context ContainerRequestContext context,
                                      @PathParam("catalogId") String catalogId,
                                      @PathParam("recordId") String recordId,
                                      @PathParam("branchId") String branchId,
                                      @PathParam("commitId") String commitId,
                                      @DefaultValue("jsonld") @QueryParam("rdfFormat") String rdfFormat,
                                      @DefaultValue("false") @QueryParam("applyInProgressCommit") boolean apply);

    /**
     * Creates a new InProgressCommit in the repository for the user making this request. Returns a Response indicating
     * whether it was created successfully.
     *
     * @param context The context of the request.
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId The String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param newInProgressCommit The new InProgressCommit which you wish to add to the repository.
     * @return A Response indicating whether the InProgressCommit was created successfully.
     */
    @POST
    @Path("{catalogId}/records/{recordId}/in-progress-commit")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Creates a InProgressCommit linked to a specific VersionedRDFRecord.")
    Response createInProgressCommit(@Context ContainerRequestContext context,
                                    @PathParam("catalogId") String catalogId,
                                    @PathParam("recordId") String recordId,
                                    InProgressCommit newInProgressCommit);

    /**
     * Retrieves the current changes the user making the request has made in the InProgressCommit identified by the
     * provided IDs.
     *
     * @param context The context of the request.
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId The String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param rdfFormat the desired RDF return format. NOTE: Optional param - defaults to "jsonld".
     * @return A Response with the changes from the specific InProgressCommit.
     */
    @GET
    @Path("{catalogId}/records/{recordId}/in-progress-commit")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets the changes made in the User's current InProgressCommit for a specific VersionedRDFRecord.")
    Response getInProgressCommit(@Context ContainerRequestContext context,
                                 @PathParam("catalogId") String catalogId,
                                 @PathParam("recordId") String recordId,
                                 @DefaultValue("jsonld") @QueryParam("rdfFormat") String rdfFormat);

    /**
     * Deletes the InProgressCommit identified by the provided IDs and associated with the User making the request from
     * the repository. Returns a Response which indicates whether or not the requested InProgressCommit was deleted.
     *
     * @param context The context of the request.
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId The String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @return A Response indicating whether the InProgressCommit was deleted successfully.
     */
    @DELETE
    @Path("{catalogId}/records/{recordId}/in-progress-commit")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Deletes the changes made in the User's current InProgressCommit for a specific VersionedRDFRecord.")
    Response deleteInProgressCommit(@Context ContainerRequestContext context,
                                    @PathParam("catalogId") String catalogId,
                                    @PathParam("recordId") String recordId);

    /**
     * Updates the InProgressCommit for a user identified by the provided IDs using the statements found in the provided
     * form data. Returns a Response indicating whether it was successfully updated.
     *
     * @param context The context of the request.
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId The String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param additionsJson The String of JSON-LD that corresponds to the statements that were added to the entity.
     * @param deletionsJson The String of JSON-LD that corresponds to the statements that were deleted in the entity.
     * @return A Response indicating whether or not the InProgressCommit was updated.
     */
    @PUT
    @Path("{catalogId}/records/{recordId}/in-progress-commit")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @RolesAllowed("user")
    @ApiOperation("Updates the changes made in the User's current InProgressCommit for a specific VersionedRDFRecord.")
    Response updateInProgressCommit(@Context ContainerRequestContext context,
                                    @PathParam("catalogId") String catalogId,
                                    @PathParam("recordId") String recordId,
                                    @FormDataParam("additions") String additionsJson,
                                    @FormDataParam("deletions") String deletionsJson);
}
