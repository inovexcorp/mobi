package org.matonto.etl.api.rdf.export;

import org.matonto.etl.api.config.rdf.export.BaseExportConfig;

import java.io.IOException;

public interface DatasetExportService {

    void export(BaseExportConfig config, String datasetRecord) throws IOException;
}
