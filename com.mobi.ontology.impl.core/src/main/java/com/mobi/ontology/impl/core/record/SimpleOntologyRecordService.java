package com.mobi.ontology.impl.core.record;

/*-
 * #%L
 * com.mobi.ontology.impl.core
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

import com.mobi.catalog.api.record.RecordService;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecord;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecordFactory;
import com.mobi.ontology.core.api.record.AbstractOntologyRecordService;
import com.mobi.ontology.utils.cache.OntologyCache;
import com.mobi.repository.api.RepositoryConnection;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component(
        immediate = true,
        service = { RecordService.class, SimpleOntologyRecordService.class }
)
public class SimpleOntologyRecordService extends AbstractOntologyRecordService<OntologyRecord> {

    private final Logger log = LoggerFactory.getLogger(SimpleOntologyRecordService.class);

    @Reference
    public OntologyCache ontologyCache;

    @Reference
    public OntologyRecordFactory ontologyRecordFactory;

    @Activate
    public void activate() {
        this.recordFactory = ontologyRecordFactory;
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
        deleteVersionedRDFData(record, conn);
        deleteRecordObject(record, conn);
        deletePolicies(record, conn);
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
