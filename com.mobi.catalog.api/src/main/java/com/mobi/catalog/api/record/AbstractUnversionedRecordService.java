package com.mobi.catalog.api.record;

import com.mobi.catalog.api.ontologies.mcat.UnversionedRecord;
import com.mobi.repository.api.RepositoryConnection;

public abstract class AbstractUnversionedRecordService <T extends UnversionedRecord>
        extends AbstractRecordService<T> implements RecordService<T> {

    @Override
    protected void deleteRecord(T record, RepositoryConnection conn) {
        recordFactory.getExisting(record.getResource(), record.getModel())
                .ifPresent(unversionedRecord -> {
                    unversionedRecord.getUnversionedDistribution_resource().forEach(resource ->
                            utilsService.remove(resource, conn));
                    deleteRecordObject(record, conn);
                });
    }
}
