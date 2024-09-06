package com.mobi.dataset.impl.record;

/*-
 * #%L
 * com.mobi.dataset.impl.record
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import com.mobi.dataset.api.record.DatasetRecordService;
import com.mobi.dataset.ontology.dataset.DatasetRecord;
import com.mobi.dataset.ontology.dataset.DatasetRecordFactory;
import org.eclipse.rdf4j.model.Resource;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

@Component(
        immediate = true,
        service = { RecordService.class, DatasetRecordService.class, SimpleDatasetRecordService.class }
)
public class SimpleDatasetRecordService extends DatasetRecordService<DatasetRecord> {
    public static final String DCTERMS_PUBLISHER = "http://purl.org/dc/terms/publisher";

    @Reference
    DatasetRecordFactory datasetRecordFactory;

    @Activate
    void start() {
        this.recordFactory = this.datasetRecordFactory;
    }

    @Override
    public Class<DatasetRecord> getType() {
        return DatasetRecord.class;
    }

    @Override
    public String getTypeIRI() {
        return DatasetRecord.TYPE;
    }

    @Override
    public void overwritePolicyDefault(DatasetRecord datasetRecord) {
        String publisherIri = datasetRecord.getProperty(vf.createIRI(DCTERMS_PUBLISHER))
                .orElseThrow(() -> new IllegalArgumentException("Publisher target does not exist.")).stringValue();
        Resource publisher = vf.createIRI(publisherIri);
        writePolicies(publisher, datasetRecord.getResource());
    }
}
