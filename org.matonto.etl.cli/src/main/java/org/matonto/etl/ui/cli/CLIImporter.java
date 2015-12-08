package org.matonto.etl.ui.cli;

import java.io.File;
import java.io.IOException;

import org.apache.karaf.shell.api.action.Argument;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.Option;
import org.apache.karaf.shell.api.action.Action;
import org.apache.log4j.Logger;
import org.openrdf.repository.RepositoryException;
import org.matonto.etl.api.rdf.RDFImportService;
import org.matonto.etl.api.csv.CSVConverter;
import org.openrdf.rio.RDFParseException;

@Command(scope = "matonto", name = "import", description = "Imports objects to a repository")
public class CLIImporter implements Action {
    
    //Command Line Arguments and Options
    @Argument(index = 0, name = "DataType", description = "The data type being imported. Supported data types are: RDF and CSV", required = true)
    String dataType = null;

    @Argument(index = 1, name = "RepositoryID", description = "The id of the repository the file will be imported to", required = true, multiValued = false)
    String repositoryId = null;

    @Argument(index = 2, name = "ImportFile", description = "The file to be imported into the repository", required = true, multiValued = false)
    String file = null;

    @Argument(index = 3, name="CSV/XML Mapping File", description = "The mapping file for the import of CSV or XML Files", required = false, multiValued = false)
    String mappingFileLocation = null;

    @Option (name = "-t", aliases = "--fileType", description = "Specify the file type if the one given is unsupported by Sesame.", required = false, multiValued = false)
    String fileType = null;

    @Option( name = "-c", aliases = "--continueOnError", description = "If true, continue parsing even if there is an error on a line.", required = false, multiValued = false)
    boolean continueOnError = false;
    private static final Logger LOGGER = Logger.getLogger(CLIImporter.class);

    //Services Preparation
    private RDFImportService importService;
    private CSVConverter csvConverter;

    public RDFImportService getImportService() {return importService;}
    public CSVConverter getCsvConverter(){return csvConverter;}

    public void setImportService(RDFImportService importService) {this.importService = importService;}
    public void setCsvConverter(CSVConverter csvConverter){this.csvConverter = csvConverter;}
    
    @Override
    public Object execute() throws Exception {

        if("rdf".equalsIgnoreCase(dataType))
            importRDF();
        else if("csv".equalsIgnoreCase(dataType))
            importCSV();
        else{
            System.out.println("Invalid Data Type Selection. Supported options are:\n csv\n rdf");
        }

        return null;
    }

    public void importRDF(){
        LOGGER.info("Importing RDF");
        try{
            File newFile = new File(file);
            importService.importFile(repositoryId, newFile, continueOnError);
        }catch(Exception e){
            throw new RuntimeException(e);
        }
    }

    public void importCSV(){
        LOGGER.info("Importing CSV");

        File newFile = new File(file);
        File mappingFile = new File(mappingFileLocation);
        if(newFile.exists() && mappingFile.exists()) {
            try {
                csvConverter.importCSV(newFile, mappingFile, repositoryId);
            } catch (RDFParseException e) {
                e.printStackTrace();
            } catch (IOException e) {
                System.out.println("Unable to load files.");
                LOGGER.error(e.toString());
            } catch(RepositoryException e){
                System.out.println("Unable to connect to repository");
                LOGGER.error(e.toString());
            }
        }else{
            System.out.println("Files do not exist.");
        }

    }

}
