package org.matonto.etl.api.rdf.export;

import org.matonto.etl.api.config.rdf.export.BaseExportConfig;

import java.io.IOException;

public interface DatasetExportService {

    /**
     * Exports data from the specified DatasetRecord's Dataset based on the passed Configuration.
     *
     * @param config The configuration for the export
     * @param datasetRecord The Resource ID of the DatasetRecord to export
     * @throws IllegalArgumentException Thrown if the DatasetRecord does not exist
     */
    void export(BaseExportConfig config, String datasetRecord) throws IOException;
}
