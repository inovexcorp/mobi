package com.mobi.dataset.api.builder;

/*-
 * #%L
 * com.mobi.dataset.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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


import com.mobi.dataset.ontology.dataset.MobiDataset_Thing;
import com.mobi.rdf.api.BNode;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;

public class OntologyIdentifier {
    private Resource recordId;
    private Resource branchId;
    private Resource commitId;
    private BNode node;
    private Model statements;

    public OntologyIdentifier(String recordId, String branchId, String commitId, ValueFactory vf, ModelFactory mf) {
        this.recordId = vf.createIRI(recordId);
        this.branchId = vf.createIRI(branchId);
        this.commitId = vf.createIRI(commitId);
        this.node = vf.createBNode();
        statements = mf.createModel();
        statements.add(this.node, vf.createIRI(MobiDataset_Thing.linksToRecord_IRI), this.recordId);
        statements.add(this.node, vf.createIRI(MobiDataset_Thing.linksToBranch_IRI), this.branchId);
        statements.add(this.node, vf.createIRI(MobiDataset_Thing.linksToCommit_IRI), this.commitId);
    }

    public OntologyIdentifier(Resource recordId, Resource branchId, Resource commitId, ValueFactory vf, ModelFactory mf) {
        this.recordId = recordId;
        this.branchId = branchId;
        this.commitId = commitId;
        this.node = vf.createBNode();
        statements = mf.createModel();
        statements.add(this.node, vf.createIRI(MobiDataset_Thing.linksToRecord_IRI), this.recordId);
        statements.add(this.node, vf.createIRI(MobiDataset_Thing.linksToBranch_IRI), this.branchId);
        statements.add(this.node, vf.createIRI(MobiDataset_Thing.linksToCommit_IRI), this.commitId);
    }

    public Resource getRecordId() {
        return recordId;
    }

    public Resource getBranchId() {
        return branchId;
    }

    public Resource getCommitId() {
        return commitId;
    }

    public BNode getNode() {
        return node;
    }

    public Model getStatements() {
        return statements;
    }
}
