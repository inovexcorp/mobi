package org.matonto.etl.cli.export;

import org.apache.karaf.shell.api.action.Action;
import org.apache.karaf.shell.api.action.Argument;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.Option;
import org.apache.karaf.shell.api.action.lifecycle.Reference;
import org.apache.karaf.shell.api.action.lifecycle.Service;
import org.matonto.etl.api.config.rdf.export.RecordExportConfig;
import org.matonto.etl.api.rdf.export.DatasetExportService;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;

import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;

@Command(scope = "mobi", name = "export-dataset",
        description = "Exports data from a DatasetRecord in the local catalog")
@Service
public class ExportDataset implements Action {

    // Service References

    @Reference
    private DatasetExportService exportService;

    public void setExportService(DatasetExportService exportService) {
        this.exportService = exportService;
    }

    // Command Parameters

    @Argument(name = "DatasetRecord", description = "The IRI of the DatasetRecord to export", required = true)
    String datasetParam = null;

    @Option(name = "-f", aliases = "--output-file", description = "The output file for the exported record data")
    private String filepathParam = null;

    @Option(name = "-t", aliases = "--format", description = "The output format (TRIG, NQUADS, JSONLD)")
    private String formatParam = null;

    // Implementation

    @Override
    public Object execute() throws Exception {
        OutputStream output;
        if (filepathParam != null) {
            output = new FileOutputStream(filepathParam);
        } else {
            output = System.out;
        }

        RDFFormat outputFormat;
        if (formatParam != null) {
            outputFormat = Rio.getParserFormatForMIMEType(formatParam)
                    .orElseThrow(() -> new IOException("Invalid file format."));
        } else if (filepathParam != null) {
            outputFormat = Rio.getParserFormatForFileName(filepathParam).orElse(RDFFormat.TRIG);
        } else {
            outputFormat = RDFFormat.TRIG;
        }

        RecordExportConfig config = new RecordExportConfig.Builder(output, outputFormat).build();

        exportService.export(config, datasetParam);

        return null;
    }
}
