package org.matonto.ontology.rest.impl;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import org.matonto.ontology.core.api.OntologyManager;
import org.matonto.ontology.core.utils.MatontoOntologyException;
import org.matonto.ontology.rest.ImportedOntologyRest;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rest.util.ErrorUtils;

import javax.ws.rs.core.Response;

@Component(immediate = true)
public class ImportedOntologyRestImpl implements ImportedOntologyRest {

    private ValueFactory valueFactory;
    private OntologyManager ontologyManager;

    @Reference
    public void setValueFactory(ValueFactory valueFactory) {
        this.valueFactory = valueFactory;
    }

    @Reference
    public void setOntologyManager(OntologyManager ontologyManager) {
        this.ontologyManager = ontologyManager;
    }

    @Override
    public Response getImportedOntology(String ontologyURL) {
        try {
            ontologyManager.createOntology(valueFactory.createIRI(ontologyURL));
            return Response.ok().build();
        } catch (MatontoOntologyException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.BAD_REQUEST);
        }
    }
}
