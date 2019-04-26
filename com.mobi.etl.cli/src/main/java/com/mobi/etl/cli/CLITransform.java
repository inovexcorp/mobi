package com.mobi.etl.cli;

/*-
 * #%L
 * com.mobi.etl.cli
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

import com.mobi.catalog.api.builder.Difference;
import com.mobi.etl.api.config.delimited.ExcelConfig;
import com.mobi.etl.api.config.delimited.SVConfig;
import com.mobi.etl.api.config.rdf.ImportServiceConfig;
import com.mobi.etl.api.config.rdf.export.RDFExportConfig;
import com.mobi.etl.api.delimited.DelimitedConverter;
import com.mobi.etl.api.delimited.MappingManager;
import com.mobi.etl.api.ontology.OntologyImportService;
import com.mobi.etl.api.rdf.RDFImportService;
import com.mobi.etl.api.rdf.export.RDFExportService;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.jaas.engines.RdfEngine;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ValueFactory;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.karaf.shell.api.action.Action;
import org.apache.karaf.shell.api.action.Argument;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.Completion;
import org.apache.karaf.shell.api.action.Option;
import org.apache.karaf.shell.api.action.lifecycle.Reference;
import org.apache.karaf.shell.api.action.lifecycle.Service;
import org.apache.karaf.shell.support.completers.FileCompleter;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.OutputStream;

@Command(scope = "mobi", name = "transform", description = "Transforms CSV Files to RDF using a mapping file")
@Service
public class CLITransform implements Action {

    // Service References

    @Reference
    private DelimitedConverter converter;

    void setDelimitedConverter(DelimitedConverter delimitedConverter) {
        this.converter = delimitedConverter;
    }

    @Reference
    private RDFImportService rdfImportService;

    void setRdfImportService(RDFImportService rdfImportService) {
        this.rdfImportService = rdfImportService;
    }

    @Reference
    private RDFExportService rdfExportService;

    void setRdfExportService(RDFExportService rdfExportService) {
        this.rdfExportService = rdfExportService;
    }

    @Reference
    private ValueFactory vf;

    void setValueFactory(ValueFactory valueFactory) {
        this.vf = valueFactory;
    }

    @Reference
    private MappingManager mappingManager;

    void setMappingManager(MappingManager mappingManager) {
        this.mappingManager = mappingManager;
    }

    @Reference
    private OntologyImportService ontologyImportService;

    void setOntologyImportService(OntologyImportService ontologyImportService) {
        this.ontologyImportService = ontologyImportService;
    }

    @Reference
    private EngineManager engineManager;

    void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
    }

    // Command Parameters

    @Completion(FileCompleter.class)
    @Argument(name = "Delimited File", description = "The path of the File to be transformed", required = true)
    private String file = null;
    
    @Argument(index = 1, name = "Mapping Record", description = "The IRI of the Mapping Record. NOTE: Any % symbols as "
            + "a result of URL encoding must be escaped.", required = true)
    private String mappingRecordIRI = null;

    @Completion(FileCompleter.class)
    @Option(name = "-o", aliases = "--outputFile", description = "The output file to use. (Required if no dataset "
            + "given)")
    private String outputFile = null;

    @Option(name = "-d", aliases = "--dataset",
            description = "The dataset in which to store the resulting triples. (Required if no output file given)." +
                    "NOTE: Any % symbols as a result of URL encoding must be escaped.")
    private String dataset = null;

    @Option(name = "-ont", aliases = "--ontology",
            description = "The ontology in which to store the resulting triples. (Required if no output file given)." +
                    "NOTE: Any % symbols as a result of URL encoding must be escaped.")
    private String ontology = null;

    @Option(name = "-b", aliases = "--branch",
            description = "The branch for the ontology in which to store the resulting triples. (defaults to MASTER)")
    private String branch = null;

    @Option(name = "-u", aliases = "--update",
            description = "Calculate the differences between the mapped data and the data on the head of the ontology" +
                    "branch. (defaults to false)")
    private boolean update = false;

    @Option(name = "-h", aliases = "--headers", description = "The file contains headers.")
    private boolean containsHeaders = false;

    @Option(name = "-s", aliases = "--separator", description = "The separator character for the delimited file if it "
            + "is an SV.")
    private String separator = ",";

    private static final Logger LOGGER = LoggerFactory.getLogger(CLITransform.class);

    // Implementation

    @Override
    public Object execute() throws Exception {
        LOGGER.info("Importing CSV");

        File newFile = new File(file);

        if (!newFile.exists()) {
            String msg = "Delimited input file does not exist.";
            LOGGER.error(msg);
            System.out.println(msg);
            return null;
        }

        if (outputFile == null && dataset == null && ontology == null) {
            System.out.println("No output file, dataset, or ontology provided. Please supply one or more options.");
            return null;
        }

        try {
            String extension = FilenameUtils.getExtension(newFile.getName());

            Model mapping = mappingManager.retrieveMapping(vf.createIRI(mappingRecordIRI))
                    .orElseThrow(() -> new IllegalArgumentException("Mapping record not found"))
                    .getModel();

            Model model;
            if (extension.equals("xls") || extension.equals("xlsx")) {
                ExcelConfig config = new ExcelConfig.ExcelConfigBuilder(new FileInputStream(newFile), mapping)
                        .containsHeaders(containsHeaders).build();
                model = converter.convert(config);
            } else {
                SVConfig config = new SVConfig.SVConfigBuilder(new FileInputStream(newFile), mapping)
                        .containsHeaders(containsHeaders).separator(separator.charAt(0)).build();
                model = converter.convert(config);
            }

            if (dataset != null) {
                ImportServiceConfig config = new ImportServiceConfig.Builder().dataset(vf.createIRI(dataset))
                        .printOutput(true)
                        .logOutput(true)
                        .build();
                rdfImportService.importModel(config, model);
            }

            if (outputFile != null) {
                OutputStream output = new FileOutputStream(outputFile);
                RDFFormat outputFormat = Rio.getParserFormatForFileName(outputFile).orElse(RDFFormat.TRIG);
                RDFExportConfig config = new RDFExportConfig.Builder(output, outputFormat).build();
                rdfExportService.export(config, model);
            }

            if (ontology != null) {
                IRI ontologyIri = vf.createIRI(ontology);
                User adminUser = engineManager.retrieveUser(RdfEngine.ENGINE_NAME, "admin").get();
                String commitMsg = "Mapping data from " + mappingRecordIRI;

                Difference difference;
                if (StringUtils.isEmpty(branch)) {
                    difference = ontologyImportService.importOntology(ontologyIri, update, model, adminUser, commitMsg);
                } else {
                    IRI branchIri = vf.createIRI(branch);
                    difference = ontologyImportService.importOntology(ontologyIri, branchIri, update, model, adminUser, commitMsg);
                }

                if (difference.getAdditions() == null && difference.getDeletions() == null) {
                    System.out.println("Ontology transform complete. No commit required.");
                } else {
                    int additionSize = difference.getAdditions() != null ? difference.getAdditions().size() : 0;
                    int deletionSize = difference.getDeletions() != null ? difference.getDeletions().size() : 0;
                    System.out.println("Ontology transform complete. " + (additionSize + deletionSize) + " statements changed.");
                }
            }
        } catch (Exception e) {
            System.out.println(e.getMessage());
            LOGGER.error("Unspecified error in transformation.", e);
        }

        return null;
    }
}
