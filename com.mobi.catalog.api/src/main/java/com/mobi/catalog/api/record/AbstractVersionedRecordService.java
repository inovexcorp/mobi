package com.mobi.catalog.api.record;

import com.mobi.catalog.api.ontologies.mcat.VersionedRecord;
import com.mobi.repository.api.RepositoryConnection;

public abstract class AbstractVersionedRecordService <T extends VersionedRecord>
        extends AbstractRecordService<T> implements RecordService<T> {

    @Override
    protected void deleteRecord(T record, RepositoryConnection conn) {
        recordFactory.getExisting(record.getResource(), record.getModel())
                .ifPresent(versionedRecord -> {
                    versionedRecord.getVersion_resource()
                            .forEach(resource -> utilsService.removeVersion(versionedRecord.getResource(), resource, conn));
                    deleteRecordObject(record, conn);
                });
    }
}
