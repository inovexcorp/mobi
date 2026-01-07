package com.mobi.ontology.cli;

/*-
 * #%L
 * com.mobi.ontology.cli
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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

import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.core.api.owl2shacl.OWL2SHACL;
import com.mobi.repository.api.RepositoryManager;
import org.apache.commons.lang3.StringUtils;
import org.apache.karaf.shell.api.action.Action;
import org.apache.karaf.shell.api.action.Argument;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.Option;
import org.apache.karaf.shell.api.action.lifecycle.Reference;
import org.apache.karaf.shell.api.action.lifecycle.Service;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Command(scope = "mobi", name = "owl2shacl", description = "Converts an OWL ontology into a SHACL shapes graph")
@Service
public class OWL2SHACLCLI implements Action {
    private static final Logger LOGGER = LoggerFactory.getLogger(OWL2SHACLCLI.class);
    private final ValueFactory vf = new ValidatingValueFactory();

    protected static final Map<String, RDFFormat> formats;

    static {
        formats = new HashMap<>();
        formats.put("ttl", RDFFormat.TURTLE);
        formats.put("trig", RDFFormat.TRIG);
        formats.put("trix", RDFFormat.TRIX);
        formats.put("rdf/xml", RDFFormat.RDFXML);
        formats.put("jsonld", RDFFormat.JSONLD);
        formats.put("n3", RDFFormat.N3);
        formats.put("nquads", RDFFormat.NQUADS);
        formats.put("ntriples", RDFFormat.NTRIPLES);
    }

    @Reference
    private RepositoryManager repositoryManager;

    public void setRepositoryManager(RepositoryManager repositoryManager) {
        this.repositoryManager = repositoryManager;
    }

    @Reference
    private OntologyManager ontologyManager;

    public void setOntologyManager(OntologyManager ontologyManager) {
        this.ontologyManager = ontologyManager;
    }

    @Argument(name = "Ontology Record", description = "The IRI of the OntologyRecord containing an OWL ontology to "
            + "converted to a SHACL shapes graph", required = true)
    private String ontologyRecordId = null;

    @Option(name = "-f", aliases = "--output-file", description = "The output file for the converted shapes graph")
    private String filepathParam = null;

    @Option(name = "-t", aliases = "--format", description = "The output format (ttl, trig, trix, rdf/xml, jsonld, "
            + "n3, nquads, ntriples)")
    private String formatParam = null;

    @Override
    public Object execute() throws Exception {
        if (StringUtils.isEmpty(ontologyRecordId)) {
            String msg = "Ontology Record IRI is required";
            LOGGER.error(msg);
            System.out.println(msg);
            return null;
        }

        Optional<Ontology> ontologyOptional = ontologyManager.retrieveOntology(vf.createIRI(ontologyRecordId));
        if (ontologyOptional.isEmpty()) {
            String msg = "Ontology Record IRI " + ontologyRecordId + " could not be found";
            LOGGER.error(msg);
            System.out.println(msg);
            return null;
        }
        Ontology ontology = ontologyOptional.get();

        OutputStream output = getOutput();
        RDFFormat outputFormat = getFormat();

        OWL2SHACL.convertOWLToSHACL(ontology.asModel(), repositoryManager, output, outputFormat);

        return null;
    }

    protected OutputStream getOutput() throws IOException {
        if (filepathParam != null) {
            return new FileOutputStream(filepathParam);
        } else {
            return System.out;
        }
    }

    protected RDFFormat getFormat() throws IOException {
        if (formatParam != null && formats.containsKey(formatParam)) {
            return formats.get(formatParam);
        } else if (filepathParam != null) {
            return Rio.getParserFormatForFileName(filepathParam).orElse(RDFFormat.TRIG);
        } else {
            return RDFFormat.TURTLE;
        }
    }
}
