package com.mobi.catalog.api.record;

import com.mobi.catalog.api.record.config.RecordExportConfig;
import com.mobi.rdf.api.IRI;

public interface RecordService {
    /**
     * Fill out later!!
     * @param record
     * @param config
     */
    void export(IRI iriRecord, RecordExportConfig config);


}
