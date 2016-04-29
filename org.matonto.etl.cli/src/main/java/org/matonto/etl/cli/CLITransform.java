package org.matonto.etl.cli;

import org.apache.karaf.shell.api.action.Action;
import org.apache.karaf.shell.api.action.Argument;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.Option;
import org.apache.karaf.shell.api.action.lifecycle.Reference;
import org.apache.karaf.shell.api.action.lifecycle.Service;
import org.apache.log4j.Logger;
import org.matonto.etl.api.csv.CSVConverter;
import org.matonto.etl.api.rdf.RDFExportService;
import org.matonto.etl.api.rdf.RDFImportService;
import org.matonto.rdf.api.Model;

import java.io.File;

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
    private CSVConverter csvConverter;

    public void setCSVConverter(CSVConverter csvConverter) {
        this.csvConverter = csvConverter;
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
            Model model = csvConverter.convert(newFile, mappingFile, true, (char) ',');

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
