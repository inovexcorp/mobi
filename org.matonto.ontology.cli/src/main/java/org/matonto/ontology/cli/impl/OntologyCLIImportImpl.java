package org.matonto.ontology.cli.impl;

/*-
 * #%L
 * org.matonto.ontology.cli
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

import org.apache.karaf.shell.api.action.Action;
import org.apache.karaf.shell.api.action.Argument;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.lifecycle.Reference;
import org.apache.karaf.shell.api.action.lifecycle.Service;
import org.matonto.ontology.core.api.Ontology;
import org.matonto.ontology.core.api.OntologyManager;
import org.matonto.ontology.core.utils.MatontoOntologyException;
import org.matonto.rdf.api.IRI;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileNotFoundException;


@Command(scope = "matonto", name = "importOntology", description = "Imports ontology to a repository")
@Service
public class OntologyCLIImportImpl implements Action {
    @Reference
    private static OntologyManager manager;
    private static final Logger LOG = LoggerFactory.getLogger(OntologyCLIImportImpl.class);

    protected void setOntologyManager(final OntologyManager ontoManager) {
        manager = ontoManager;
    }

    protected void unsetOntologyManager(final OntologyManager ontoManager) {
        manager = null;
    }

    protected OntologyManager getOntologyManager() {
        return manager;
    }


    //Command Line Arguments and Options
    @Argument(index = 0, name = "ImportFile", description = "The file to be imported into the repository",
            required = true, multiValued = false)
    String fromFile = null;

    @Override
    public Object execute() throws Exception {
        if (manager == null) {
            throw new IllegalStateException("Ontology manager is null");
        }
        boolean persisted = false;
        String errorMsg = null;

        try {
            persisted = importOntology();
        } catch (MatontoOntologyException ex) {
            errorMsg = ex.getMessage();
        }

        if (persisted) {
            System.out.println("Succesful file import.");
        } else {
            System.out.println("Unsuccessful file import. " + errorMsg);
        }
        return null;
    }


    private boolean importOntology() throws MatontoOntologyException, FileNotFoundException {
        boolean persisted = false;

        System.out.println("Importing ontology file...");

        File newFile = new File(fromFile);
        if (newFile.exists()) {
            Ontology ontology = manager.createOntology(newFile);
            persisted = manager.storeOntology(ontology);
        } else {
            System.out.println("File does not exist.");
        }
        return persisted;
    }

}
