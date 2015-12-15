package org.matonto.etl.cli;

import java.io.File;
import java.io.IOException;

import org.apache.karaf.shell.api.action.Argument;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.Option;
import org.apache.karaf.shell.api.action.Action;
import org.apache.karaf.shell.api.action.lifecycle.Service;
import org.apache.log4j.Logger;
import org.openrdf.repository.RepositoryException;
import org.matonto.etl.api.rdf.RDFImportService;
import org.matonto.etl.api.csv.CSVConverter;
import org.openrdf.rio.RDFParseException;

@Command(scope = "matonto", name = "import", description = "Imports objects to a repository")
public class CLIImporter implements Action {

    //Command Line Arguments and Options


    @Argument(index = 0, name = "RepositoryID", description = "The id of the repository the file will be imported to", required = true)
    String repositoryId = null;

    @Argument(index = 1, name = "ImportFile", description = "The file to be imported into the repository", required = true)
    String file = null;

    @Option( name = "-c", aliases = "--continueOnError", description = "If true, continue parsing even if there is an error on a line.")
    boolean continueOnError = false;
    private static final Logger LOGGER = Logger.getLogger(CLIImporter.class);

    //Services Preparation
    private RDFImportService importService;
    public RDFImportService getImportService() {return importService;}
    public void setImportService(RDFImportService importService) {this.importService = importService;}

    @Override
    public Object execute() throws Exception {

        LOGGER.info("Importing RDF");
        try{
            File newFile = new File(file);
            importService.importFile(repositoryId, newFile, continueOnError);
        }catch(IOException e){
            System.out.println(e.getMessage());
            LOGGER.error(e.toString());
        }

        return null;
    }

}
