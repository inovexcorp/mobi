package org.matonto.etl.api.rdf.export;

import org.matonto.etl.api.config.rdf.export.BaseExportConfig;

import java.io.IOException;

public interface DatasetExportService {

    /**
     * Exports triples from the specified DatasetRecord's Dataset to the specified File optionally restricted
     * based on the passed Configuration.
     *
     * @param config The configuration for the export with the file path, RDF format, and optional restrictions
     * @param datasetRecordID The ID of the DatasetRecord with the target Dataset
     * @return A File with the result of the export
     * @throws IOException Thrown if there is an error writing to the file or the RDF format could not be determined
     *      from the file name
     * @throws IllegalArgumentException Thrown if the DatasetRecord does not exist
     */
    void export(BaseExportConfig config, String datasetRecord) throws IOException;
}
