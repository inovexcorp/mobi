package com.mobi.ontology.impl.core.record;

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.catalog.api.CatalogProvUtils;
import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.mergerequest.MergeRequestManager;
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
import com.mobi.catalog.api.ontologies.mcat.CatalogFactory;
import com.mobi.catalog.api.ontologies.mcat.CommitFactory;
import com.mobi.catalog.api.record.RecordService;
import com.mobi.catalog.api.versioning.VersioningManager;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecord;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecordFactory;
import com.mobi.ontology.core.api.record.AbstractOntologyRecordService;
import com.mobi.ontology.utils.cache.OntologyCache;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.security.policy.api.xacml.XACMLPolicyManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component(
        immediate = true,
        provide = { RecordService.class, SimpleOntologyRecordService.class }
)
public class SimpleOntologyRecordService extends AbstractOntologyRecordService<OntologyRecord> {

    private OntologyCache ontologyCache;

    private final Logger log = LoggerFactory.getLogger(SimpleOntologyRecordService.class);

    @Reference
    void setUtilsService(CatalogUtilsService utilsService) {
        this.utilsService = utilsService;
    }

    @Reference
    void setProvUtils(CatalogProvUtils provUtils) {
        this.provUtils = provUtils;
    }

    @Reference
    public void setOntologyCache(OntologyCache ontologyCache) {
        this.ontologyCache = ontologyCache;
    }

    @Reference
    void setVf(ValueFactory valueFactory) {
        this.valueFactory = valueFactory;
    }

    @Reference
    void setCatalogFactory(CatalogFactory catalogFactory) {
        this.catalogFactory = catalogFactory;
    }

    @Reference
    void setRecordFactory(OntologyRecordFactory recordFactory) {
        this.recordFactory = recordFactory;
    }

    @Reference
    void setCommitFactory(CommitFactory commitFactory) {
        this.commitFactory = commitFactory;
    }

    @Reference
    void setBranchFactory(BranchFactory branchFactory) {
        this.branchFactory = branchFactory;
    }

    @Reference
    void setMergeRequestManager(MergeRequestManager mergeRequestManager) {
        this.mergeRequestManager = mergeRequestManager;
    }

    @Reference
    void setOntologyManager(OntologyManager ontologyManager) {
        this.ontologyManager = ontologyManager;
    }

    @Reference
    void setPolicyManager(XACMLPolicyManager xacmlPolicyManager) {
        this.xacmlPolicyManager = xacmlPolicyManager;
    }

    @Reference
    void setVersioningManager(VersioningManager versioningManager) {
        this.versioningManager = versioningManager;
    }

    @Reference
    void setModelFactory(ModelFactory modelFactory) {
        this.modelFactory = modelFactory;
    }

    @Reference
    void setCatalogConfigProvider(CatalogConfigProvider configProvider) {
        this.configProvider = configProvider;
    }

    @Reference
    void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
    }

    @Activate
    public void activate() {
        checkForMissingPolicies();
    }

    @Override
    public Class<OntologyRecord> getType() {
        return OntologyRecord.class;
    }

    @Override
    public String getTypeIRI() {
        return OntologyRecord.TYPE;
    }

    @Override
    protected void deleteRecord(OntologyRecord record, RepositoryConnection conn) {
        long start = getStartTime();
        deleteRecordObject(record, conn);
        deletePolicies(record, conn);
        deleteVersionedRDFData(record, conn);
        clearOntologyCache(record);
        logTrace("deleteOntology(recordId)", start);
    }

    /**
     * Clears cached ontologies related to the provided {@link OntologyRecord} and clears other cached ontologies that
     * import the {@link OntologyRecord}.
     *
     * @param record The {@link OntologyRecord} to remove from the OntologyCache
     */
    protected void clearOntologyCache(OntologyRecord record) {
        ontologyCache.clearCache(record.getResource());
        record.getOntologyIRI().ifPresent(ontologyCache::clearCacheImports);
    }

    private long getStartTime() {
        return log.isTraceEnabled() ? System.currentTimeMillis() : 0L;
    }

    private void logTrace(String methodName, Long start) {
        if (log.isTraceEnabled()) {
            log.trace(String.format(methodName + " complete in %d ms", System.currentTimeMillis() - start));
        }
    }
}