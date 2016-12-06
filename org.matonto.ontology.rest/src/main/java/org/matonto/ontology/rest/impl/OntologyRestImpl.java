package org.matonto.ontology.rest.impl;

/*-
 * #%L
 * org.matonto.ontology.rest
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

import aQute.bnd.annotation.component.Component;
import org.glassfish.jersey.media.multipart.FormDataParam;
import org.matonto.catalog.api.ontologies.mcat.OntologyRecord;
import org.matonto.ontology.rest.OntologyRest;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.PathParam;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Response;
import java.io.InputStream;

@Component(immediate = true)
public class OntologyRestImpl implements OntologyRest {

    @Override
    public Response uploadFile(@FormDataParam("file") InputStream fileInputStream, @FormDataParam("record") OntologyRecord record) {
        return null;
    }

    @Override
    public Response saveChangesToOntology(@PathParam("ontologyId") String ontologyIdStr, @QueryParam("resourceId") String resourceIdStr, @QueryParam("resourceJson") String resourceJson) {
        return null;
    }

    @Override
    public Response getIRIsInOntology(@PathParam("ontologyId") String ontologyIdStr, @QueryParam("branchId") String branchIdStr, @QueryParam("commitId") String commitIdStr) {
        return null;
    }

    @Override
    public Response getAnnotationsInOntology(@PathParam("ontologyId") String ontologyIdStr, @QueryParam("branchId") String branchIdStr, @QueryParam("commitId") String commitIdStr) {
        return null;
    }

    @Override
    public Response addAnnotationToOntology(@PathParam("ontologyId") String ontologyIdStr, @QueryParam("annotationJson") String annotationJson, @QueryParam("branchId") String branchIdStr, @QueryParam("commitId") String commitIdStr) {
        return null;
    }

    @Override
    public Response getClassesInOntology(@PathParam("ontologyId") String ontologyIdStr, @QueryParam("branchId") String branchIdStr, @QueryParam("commitId") String commitIdStr) {
        return null;
    }

    @Override
    public Response addClassToOntology(@PathParam("ontologyId") String ontologyIdStr, @QueryParam("resourceJson") String resourceJson, @QueryParam("branchId") String branchIdStr, @QueryParam("commitId") String commitIdStr) {
        return null;
    }

    @Override
    public Response deleteClassFromOntology(@PathParam("ontologyId") String ontologyIdStr, @PathParam("classId") String classIdStr, @QueryParam("branchId") String branchIdStr, @QueryParam("commitId") String commitIdStr) {
        return null;
    }

    @Override
    public Response getDatatypesInOntology(@PathParam("ontologyId") String ontologyIdStr, @QueryParam("branchId") String branchIdStr, @QueryParam("commitId") String commitIdStr) {
        return null;
    }

    @Override
    public Response addDatatypeToOntology(@PathParam("ontologyId") String ontologyIdStr, @QueryParam("resourceJson") String resourceJson, @QueryParam("branchId") String branchIdStr, @QueryParam("commitId") String commitIdStr) {
        return null;
    }

    @Override
    public Response deleteDatatypeFromOntology(@PathParam("ontologyId") String ontologyIdStr, @PathParam("datatypeId") String datatypeIdStr, @QueryParam("branchId") String branchIdStr, @QueryParam("commitId") String commitIdStr) {
        return null;
    }

    @Override
    public Response getObjectPropertiesInOntology(@PathParam("ontologyId") String ontologyIdStr, @QueryParam("branchId") String branchIdStr, @QueryParam("commitId") String commitIdStr) {
        return null;
    }

    @Override
    public Response addObjectPropertyToOntology(@PathParam("ontologyId") String ontologyIdStr, @QueryParam("resourceJson") String resourceJson, @QueryParam("branchId") String branchIdStr, @QueryParam("commitId") String commitIdStr) {
        return null;
    }

    @Override
    public Response deleteObjectPropertyFromOntology(@PathParam("ontologyId") String ontologyIdStr, @PathParam("propertyId") String propertyIdStr, @QueryParam("branchId") String branchIdStr, @QueryParam("commitId") String commitIdStr) {
        return null;
    }

    @Override
    public Response getDataPropertiesInOntology(@PathParam("ontologyId") String ontologyIdStr, @QueryParam("branchId") String branchIdStr, @QueryParam("commitId") String commitIdStr) {
        return null;
    }

    @Override
    public Response addDataPropertyToOntology(@PathParam("ontologyId") String ontologyIdStr, @QueryParam("resourceJson") String resourceJson, @QueryParam("branchId") String branchIdStr, @QueryParam("commitId") String commitIdStr) {
        return null;
    }

    @Override
    public Response deleteDataPropertyFromOntology(@PathParam("ontologyId") String ontologyIdStr, @PathParam("propertyId") String propertyIdStr, @QueryParam("branchId") String branchIdStr, @QueryParam("commitId") String commitIdStr) {
        return null;
    }

    @Override
    public Response getNamedIndividualsInOntology(@PathParam("ontologyId") String ontologyIdStr, @QueryParam("branchId") String branchIdStr, @QueryParam("commitId") String commitIdStr) {
        return null;
    }

    @Override
    public Response addIndividualToOntology(@PathParam("ontologyId") String ontologyIdStr, @QueryParam("resourceJson") String resourceJson, @QueryParam("branchId") String branchIdStr, @QueryParam("commitId") String commitIdStr) {
        return null;
    }

    @Override
    public Response deleteIndividualFromOntology(@PathParam("ontologyId") String ontologyIdStr, @PathParam("individualId") String individualIdStr, @QueryParam("branchId") String branchIdStr, @QueryParam("commitId") String commitIdStr) {
        return null;
    }

    @Override
    public Response getIRIsInImportedOntologies(@PathParam("ontologyId") String ontologyIdStr, @QueryParam("branchId") String branchIdStr, @QueryParam("commitId") String commitIdStr) {
        return null;
    }

    @Override
    public Response getImportsClosure(@PathParam("ontologyId") String ontologyIdStr, @DefaultValue("jsonld") @QueryParam("rdfFormat") String rdfFormat, @QueryParam("branchId") String branchIdStr, @QueryParam("commitId") String commitIdStr) {
        return null;
    }

    @Override
    public Response getAnnotationsInImportedOntologies(@PathParam("ontologyId") String ontologyIdStr, @QueryParam("branchId") String branchIdStr, @QueryParam("commitId") String commitIdStr) {
        return null;
    }

    @Override
    public Response getClassesInImportedOntologies(@PathParam("ontologyId") String ontologyIdStr, @QueryParam("branchId") String branchIdStr, @QueryParam("commitId") String commitIdStr) {
        return null;
    }

    @Override
    public Response getDatatypesInImportedOntologies(@PathParam("ontologyId") String ontologyIdStr, @QueryParam("branchId") String branchIdStr, @QueryParam("commitId") String commitIdStr) {
        return null;
    }

    @Override
    public Response getObjectPropertiesInImportedOntologies(@PathParam("ontologyId") String ontologyIdStr, @QueryParam("branchId") String branchIdStr, @QueryParam("commitId") String commitIdStr) {
        return null;
    }

    @Override
    public Response getDataPropertiesInImportedOntologies(@PathParam("ontologyId") String ontologyIdStr, @QueryParam("branchId") String branchIdStr, @QueryParam("commitId") String commitIdStr) {
        return null;
    }

    @Override
    public Response getNamedIndividualsInImportedOntologies(@PathParam("ontologyId") String ontologyIdStr, @QueryParam("branchId") String branchIdStr, @QueryParam("commitId") String commitIdStr) {
        return null;
    }

    @Override
    public Response getOntologyClassHierarchy(@PathParam("ontologyId") String ontologyIdStr, @QueryParam("branchId") String branchIdStr, @QueryParam("commitId") String commitIdStr) {
        return null;
    }

    @Override
    public Response getOntologyObjectPropertyHierarchy(@PathParam("ontologyId") String ontologyIdStr, @QueryParam("branchId") String branchIdStr, @QueryParam("commitId") String commitIdStr) {
        return null;
    }

    @Override
    public Response getOntologyDataPropertyHierarchy(@PathParam("ontologyId") String ontologyIdStr, @QueryParam("branchId") String branchIdStr, @QueryParam("commitId") String commitIdStr) {
        return null;
    }

    @Override
    public Response getClassesWithIndividuals(@PathParam("ontologyId") String ontologyIdStr, @QueryParam("branchId") String branchIdStr, @QueryParam("commitId") String commitIdStr) {
        return null;
    }

    @Override
    public Response getEntityUsages(@PathParam("ontologyId") String ontologyIdStr, @PathParam("entityIri") String entityIRIStr, @QueryParam("branchId") String branchIdStr, @QueryParam("commitId") String commitIdStr) {
        return null;
    }

    @Override
    public Response getConceptHierarchy(@PathParam("ontologyId") String ontologyIdStr, @QueryParam("branchId") String branchIdStr, @QueryParam("commitId") String commitIdStr) {
        return null;
    }

    @Override
    public Response getSearchResults(@PathParam("ontologyId") String ontologyIdStr, @QueryParam("searchText") String searchText, @QueryParam("branchId") String branchIdStr, @QueryParam("commitId") String commitIdStr) {
        return null;
    }
}
