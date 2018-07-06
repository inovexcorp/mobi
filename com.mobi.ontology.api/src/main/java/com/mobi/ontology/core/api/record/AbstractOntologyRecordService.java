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
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.mergerequest.MergeRequestManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
import com.mobi.catalog.api.ontologies.mcat.CatalogFactory;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.CommitFactory;
import com.mobi.catalog.api.record.AbstractVersionedRDFRecordService;
import com.mobi.catalog.api.record.RecordService;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.api.record.config.VersionedRDFRecordCreateSettings;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecord;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecordFactory;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Resource;
import com.mobi.repository.api.RepositoryConnection;

import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;

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
        T record = createRecordObject(config, issued, modified);
        Branch masterBranch = createMasterBranch(record);
        conn.begin();
        utilsService.addObject(record, conn);
        utilsService.addObject(masterBranch, conn);
        Set<Resource> processedCommits = new HashSet<>();
        Resource headIRI = utilsService.getHeadCommitIRI(masterBranch);
        for (Resource commitId : utilsService.getCommitChain(headIRI, false, conn)) {

            if (processedCommits.contains(commitId)) {
                break;
            } else {
                processedCommits.add(commitId);
            }
            Commit commit = utilsService.getExpectedObject(commitId, commitFactory, conn);
            commit.setBaseCommit((Commit) VersionedRDFRecordCreateSettings.INITIAL_COMMIT_DATA);
            Difference revisionChanges = utilsService.getRevisionChanges(commitId, conn);
            revisionChanges.getAdditions();
        }
        IRI newOntologyId = OntologyManager.createOntologyId();
        validateOntology(newOntologyId);
        utilsService.addObject(newOntologyId, conn);
        conn.commit();
        return record;
    }

    private void validateOntology(IRI newOntologyId) {
        //TODO: Validate that an ontology with the passed in ontology IRI does not exist already
        if(OntologyManager.ontologyIriExists(newOntologyId)){
            throw new IllegalArgumentException("Ontology IRI:  " + newOntologyId + " already exists.");
        }
    }
}
