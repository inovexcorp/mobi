package com.mobi.catalog.impl.record;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.catalog.api.CatalogProvUtils;
import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.ontologies.mcat.CatalogFactory;
import com.mobi.catalog.api.ontologies.mcat.VersionedRecord;
import com.mobi.catalog.api.ontologies.mcat.VersionedRecordFactory;
import com.mobi.catalog.api.record.AbstractRecordService;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.RepositoryConnection;

@Component
public class SimpleVersionedRecordService extends AbstractRecordService<VersionedRecord> {

    @Reference
    void setCatalogFactory(CatalogFactory catalogFactory) {
        this.catalogFactory = catalogFactory;
    }

    @Reference
    void setUtilsService(CatalogUtilsService utilsService) {
        this.utilsService = utilsService;
    }

    @Reference
    void setProvUtils(CatalogProvUtils provUtils) {
        this.provUtils = provUtils;
    }

    @Reference
    void setVf(ValueFactory valueFactory) {
        this.valueFactory = valueFactory;
    }

    @Reference
    void setRecordFactory(VersionedRecordFactory recordFactory) {
        this.recordFactory = recordFactory;
    }

    @Override
    public Class<VersionedRecord> getType() {
        return VersionedRecord.class;
    }

    @Override
    public String getTypeIRI() {
        return VersionedRecord.TYPE;
    }

    @Override
    protected void deleteRecord(VersionedRecord record, RepositoryConnection conn) {
        recordFactory.getExisting(record.getResource(), record.getModel())
                .ifPresent(versionedRecord -> {
                    versionedRecord.getVersion_resource()
                            .forEach(resource -> utilsService.removeVersion(versionedRecord.getResource(), resource, conn));
                    deleteRecordObject(record, conn);
                });
    }
}
