package org.matonto.etl.cli;

import java.io.File;
import org.apache.karaf.shell.api.action.Argument;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.Action;
import org.apache.karaf.shell.api.action.Option;
import org.apache.karaf.shell.api.action.lifecycle.Service;
import org.matonto.etl.api.rdf.RDFExportService;

@Command(scope = "matonto", name = "export", description="Exports objects from a repository")
public class CLIExporter implements Action {

    private RDFExportService exportService;

    @Argument(index = 0, name = "repId", description = "The id of the repository the file will be imported to", required = true)
    String repositoryId = null;

    @Argument(index = 1, name = "file", description = "The file to be imported into the repository", required = true)
    File file = null;

    @Option( name = "-subj", aliases="--subject", description = "A subject that all exported triples will be restricted to.")
    String subj = null;

    @Option(name = "-pred", aliases = "--predicate", description = "A predicate that all exported triples will be restricted to.")
    String predicate = null;

    @Option(name = "-objIRI", aliases = "--objectIRI", description = "An object that all exported triples will be restricted to. Takes precedence over ObjectLiteral")
    String objIRI = null;

    @Option(name = "-objLit", aliases = "--objectLiteral", description = "An object literal that all exported triples will be restricted to. ObjectIRI takes precedence")
    String objLit = null;

    public RDFExportService getExportService() {
        return exportService;
    }

    public void setExportService(RDFExportService exportService) {
        this.exportService = exportService;
    }

    @Override
    public Object execute() throws Exception {

        exportService.exportToFile(repositoryId, file, subj, predicate, objIRI, objLit);

        return null;
    }

}
