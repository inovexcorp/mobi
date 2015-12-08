package org.matonto.etl.ui.cli;

import java.io.File;
import org.apache.karaf.shell.api.action.Argument;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.Action;
import org.matonto.etl.api.rdf.RDFExportService;

@Command(scope = "matonto", name = "export", description="Exports objects from a repository")
public class CLIExporter implements Action {

    private RDFExportService exportService;

    @Argument(index = 0, name = "repId", description = "The id of the repository the file will be imported to", required = true, multiValued = false)
    String repositoryId = null;

    @Argument(index = 1, name = "file", description = "The file to be imported into the repository", required = true, multiValued = false)
    File file = null;

    @Argument(index = 2, name = "fileType", description = "The file's type", required = false, multiValued = false)
    String fileType = null;

    @Argument(index = 3, name = "subject", description = "A subject that all exported triples will be restricted to.", required = false, multiValued = false)
    String subj = null;

    @Argument(index = 4, name = "predicate", description = "A predicate that all exported triples will be restricted to.", required = false, multiValued = false)
    String predicate = null;

    @Argument(index = 5, name = "object", description = "An object that all exported triples will be restricted to.", required = false, multiValued = false)
    String obj = null;


    public RDFExportService getExportService() {
        return exportService;
    }

    public void setExportService(RDFExportService exportService) {
        this.exportService = exportService;
    }

    @Override
    public Object execute() throws Exception {

        if(fileType == null){
            exportService.exportToFile(repositoryId, file);
        }
        else{
            exportService.exportToFile(repositoryId, file, fileType, subj, predicate, obj);
        }

        return null;
    }

}
