package com.mobi.ontology.core.api.record;

/*-
 * #%L
 * com.mobi.ontology.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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

import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.mergerequest.MergeRequestManager;
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
import com.mobi.catalog.api.ontologies.mcat.CatalogFactory;
import com.mobi.catalog.api.ontologies.mcat.CommitFactory;
import com.mobi.catalog.api.record.AbstractVersionedRDFRecordService;
import com.mobi.catalog.api.record.RecordService;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecord;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecordFactory;
import com.mobi.repository.api.RepositoryConnection;

import java.time.OffsetDateTime;

public abstract class AbstractOntologyRecordService<T extends OntologyRecord>
        extends AbstractVersionedRDFRecordService<T> implements RecordService<T> {

    protected OntologyRecordFactory recordFactory;
    protected CatalogFactory catalogFactory;
    protected CommitFactory commitFactory;
    protected BranchFactory branchFactory;
    protected MergeRequestManager mergeRequestManager;
    protected CatalogUtilsService utilsService;

    @Override
    public T createRecord(RecordOperationConfig config, OffsetDateTime issued, OffsetDateTime modified,
                          RepositoryConnection conn) {
        // TODO: Do other things + add the ontologyIRI predicate to the record
    }

    private void validateOntology() {
        //TODO: Validate that an ontology with the passed in ontology IRI does not exist already
    }
}
