package org.matonto.etl.cli;

/*-
 * #%L
 * org.matonto.etl.cli
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

import org.apache.commons.io.FilenameUtils;
import org.apache.karaf.shell.api.action.Action;
import org.apache.karaf.shell.api.action.Argument;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.Option;
import org.apache.karaf.shell.api.action.lifecycle.Reference;
import org.apache.karaf.shell.api.action.lifecycle.Service;
import org.matonto.etl.api.config.delimited.ExcelConfig;
import org.matonto.etl.api.config.rdf.export.RDFExportConfig;
import org.matonto.etl.api.config.rdf.ImportServiceConfig;
import org.matonto.etl.api.config.delimited.SVConfig;
import org.matonto.etl.api.delimited.DelimitedConverter;
import org.matonto.etl.api.rdf.export.RDFExportService;
import org.matonto.etl.api.rdf.RDFImportService;
import org.matonto.persistence.utils.api.SesameTransformer;
import org.matonto.rdf.api.Model;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.Optional;

@Command(scope = "mobi", name = "transform", description = "Transforms CSV Files to RDF using a mapping file")
@Service
public class CLITransform implements Action {

    @Argument(index = 0, name = "Delimited File",
            description = "The path of the File to be transformed", required = true)
    String file = null;

    @Argument(index = 1, name = "Mapping File",
            description = "The path of the mapping file to be used", required = true)
    String mappingFileLocation = null;

    @Option(name = "-o", aliases = "--outputFile",
            description = "The output file to use. (Required if no repository given)")
    String outputFile = null;

    @Option(name = "-r", aliases = "--repositoryID",
            description = "The repository to store the resulting triples. (Required if no output file given)")
    String repositoryID = null;

    @Option(name = "-h", aliases = "--headers",
            description = "Whether or not the file contains headers.")
    boolean containsHeaders = false;

    @Option(name = "-s", aliases = "--separator",
            description = "The separator character for the delimited file if it is an SV.")
    String separator = ",";

    private static final Logger LOGGER = LoggerFactory.getLogger(CLITransform.class);

    @Reference
    private DelimitedConverter converter;

    public void setDelimitedConverter(DelimitedConverter delimitedConverter) {
        this.converter = delimitedConverter;
    }

    @Reference
    private RDFImportService rdfImportService;

    protected void setRdfImportService(RDFImportService rdfImportService) {
        this.rdfImportService = rdfImportService;
    }

    @Reference
    private RDFExportService rdfExportService;

    protected void setRdfExportService(RDFExportService rdfExportService) {
        this.rdfExportService = rdfExportService;
    }

    @Reference
    private SesameTransformer transformer;

    protected void setSesameTransformer(SesameTransformer transformer) {
        this.transformer = transformer;
    }

    @Override
    public Object execute() throws Exception {
        LOGGER.info("Importing CSV");

        File newFile = new File(file);
        File mappingFile = new File(mappingFileLocation);

        if (!newFile.exists()) {
            String msg = "Delimited input file does not exist.";
            LOGGER.error(msg);
            System.out.println(msg);
            return null;
        }

        if (!mappingFile.exists()) {
            String msg = "Mapping input file does not exist.";
            LOGGER.error(msg);
            System.out.println(msg);
            return null;
        }

        if (outputFile == null && repositoryID == null) {
            System.out.println("No output file or output repository given. Please supply one or more option.");
            return null;
        }

        try {
            String extension = FilenameUtils.getExtension(newFile.getName());
            Optional<RDFFormat> format = Rio.getParserFormatForFileName(mappingFile.getName());
            if (!format.isPresent()) {
                throw new Exception("Mapping file is not in a correct RDF format.");
            }
            Model mapping = transformer.matontoModel(Rio.parse(new FileInputStream(mappingFile), "", format.get()));
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

            if (repositoryID != null) {
                ImportServiceConfig config = new ImportServiceConfig.Builder().repository(repositoryID)
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
