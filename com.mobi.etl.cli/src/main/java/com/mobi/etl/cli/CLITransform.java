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

import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.etl.api.config.delimited.ExcelConfig;
import com.mobi.etl.api.config.delimited.SVConfig;
import com.mobi.etl.api.config.rdf.ImportServiceConfig;
import com.mobi.etl.api.config.rdf.export.RDFExportConfig;
import com.mobi.etl.api.delimited.DelimitedConverter;
import com.mobi.etl.api.rdf.RDFImportService;
import com.mobi.etl.api.rdf.export.RDFExportService;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import org.apache.commons.io.FilenameUtils;
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
    private CatalogManager catalogManager;

    void setCatalogManager(CatalogManager catalogManager) {
        this.catalogManager = catalogManager;
    }

    // Command Parameters

    @Completion(FileCompleter.class)
    @Argument(name = "Delimited File", description = "The path of the File to be transformed", required = true)
    private String file = null;
    
    @Argument(index = 1, name = "Mapping Record", description = "The IRI of the Mapping Record", required = true)
    private String mappingRecordIRI = null;

    @Completion(FileCompleter.class)
    @Option(name = "-o", aliases = "--outputFile", description = "The output file to use. (Required if no dataset "
            + "given)")
    private String outputFile = null;

    @Option(name = "-d", aliases = "--dataset",
            description = "The dataset to store the resulting triples. (Required if no output file given)")
    private String dataset = null;

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

        if (outputFile == null && dataset == null) {
            System.out.println("No output file or dataset provided. Please supply one or more option.");
            return null;
        }

        try {
            String extension = FilenameUtils.getExtension(newFile.getName());

            Branch masterBranch = catalogManager.getMasterBranch(catalogManager.getLocalCatalog().getResource(), vf.createIRI(mappingRecordIRI));
            Resource headCommit = masterBranch.getHead_resource()
                    .orElseThrow(() -> new IllegalStateException("Mapping record master branch does not have a head commit."));
            Model mapping = catalogManager.getCompiledResource(headCommit);

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
        } catch (Exception e) {
            System.out.println(e.getMessage());
            LOGGER.error("Unspecified error in transformation.", e);
        }

        return null;
    }
}
