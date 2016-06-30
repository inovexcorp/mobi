package org.matonto.etl.cli;

import org.apache.commons.io.FilenameUtils;
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

import org.apache.karaf.shell.api.action.Action;
import org.apache.karaf.shell.api.action.Argument;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.Option;
import org.apache.karaf.shell.api.action.lifecycle.Reference;
import org.apache.karaf.shell.api.action.lifecycle.Service;
import org.apache.log4j.Logger;
import org.matonto.etl.api.config.ExcelConfig;
import org.matonto.etl.api.config.SVConfig;
import org.matonto.etl.api.delimited.DelimitedConverter;
import org.matonto.etl.api.rdf.RDFExportService;
import org.matonto.etl.api.rdf.RDFImportService;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.core.utils.Values;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;

import java.io.File;
import java.io.FileInputStream;

@Command(scope = "matonto", name = "transform", description = "Transforms CSV Files to RDF using a mapping file")
@Service
public class CLITransform implements Action {

    @Argument(index = 0, name = "Delimited File",
            description = "The path of the File to be transformed", required = true)
    String file = null;

    @Argument(index = 1, name = "Mapping File",
            description = "The path of the mapping file to be used", required = true)
    String mappingFileLocation = null;

    @Option(name = "-o", aliases = "--outputFile",
            description = "The output file to use. (Required if no repository given")
    String outputFile = null;

    @Option(name = "-r", aliases = "--repositoryID",
            description = "The repository to store the resulting triples. (Required if no output file given)")
    String repositoryID = null;

    private static final Logger LOGGER = Logger.getLogger(CLITransform.class);

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

    @Override
    public Object execute() throws Exception {
        LOGGER.info("Importing CSV");

        File newFile = new File(file);
        File mappingFile = new File(mappingFileLocation);

        if (!newFile.exists() && !mappingFile.exists()) {
            System.out.println("Files do not exist.");
            return null;
        }

        if (outputFile == null && repositoryID == null) {
            System.out.println("No output file or output repository given. Please supply one or more option.");
            return null;
        }

        try {
            String extension = FilenameUtils.getExtension(newFile.getName());
            Model mapping = Values.matontoModel(Rio.parse(new FileInputStream(mappingFile), "", RDFFormat.TURTLE));
            Model model;
            if (extension.equals("xls") || extension.equals("xlsx")) {
                ExcelConfig config = new ExcelConfig.Builder(new FileInputStream(newFile), mapping)
                        .containsHeaders(true).build();
                model = converter.convert(config);
            } else {
                SVConfig config = new SVConfig.Builder(new FileInputStream(newFile), mapping)
                        .containsHeaders(true).separator((char) ',').build();
                model = converter.convert(config);
            }

            if (repositoryID != null) {
                rdfImportService.importModel(repositoryID, model);
            }

            if (outputFile != null) {
                rdfExportService.exportToFile(model, outputFile);
            }
        } catch (Exception e) {
            System.out.println(e.getMessage());
            LOGGER.error(e);
        }

        return null;
    }

}
