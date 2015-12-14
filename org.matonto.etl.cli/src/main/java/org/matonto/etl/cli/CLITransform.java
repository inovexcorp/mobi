package org.matonto.etl.cli;

import org.apache.karaf.shell.api.action.Action;
import org.apache.karaf.shell.api.action.Argument;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.Option;
import org.apache.log4j.Logger;
import org.matonto.etl.api.csv.CSVConverter;

import java.io.File;

@Command(scope = "matonto", name = "transform", description = "Transforms CSV Files to RDF using a mapping file")
public class CLITransform implements Action{

    @Argument(index = 0, name = "Delimited File", description = "The path of the File to be transformed", required = true)
    String file = null;

    @Argument(index = 1, name = "Mapping File", description = "The path of the mapping file to be used", required = true)
    String mappingFileLocation = null;

    @Option(name="-o", aliases = "--outputFile", description = "The output file to use. (Required if no repository given")
    String outputFile = null;

    @Option(name="-r", aliases = "--repositoryID", description = "The repository to store the resulting triples. (Required if no output file given)")
    String repositoryID = null;

    private static final Logger LOGGER = Logger.getLogger(CLIImporter.class);

    private CSVConverter csvConverter;
    public CSVConverter getCsvConverter(){return csvConverter;}
    public void setCsvConverter(CSVConverter csvConverter){this.csvConverter = csvConverter;}

    @Override
    public Object execute() throws Exception {
        LOGGER.info("Importing CSV");

        File newFile = new File(file);
        File mappingFile = new File(mappingFileLocation);
        if(newFile.exists() && mappingFile.exists()) {
            try {
                if(outputFile != null)
                    csvConverter.exportCSV(newFile, mappingFile, new File(outputFile));
                if(repositoryID != null)
                    csvConverter.importCSV(newFile, mappingFile, repositoryID);
            } catch (Exception e){
                System.out.println(e.getMessage());
                LOGGER.error(e.toString());
            }
        }else{
            System.out.println("Files do not exist.");
        }

        return null;
    }
}
