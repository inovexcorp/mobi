package com.mobi.catalog.impl;

/*-
 * #%L
 * com.mobi.catalog.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import org.eclipse.rdf4j.model.Resource;

import java.util.LinkedHashMap;

/**
 * POJO to help with tracking the Base and Aux chains of a branch merge. Keeps track of the merge commit and the
 * originating branching commit. Keeps sorted maps of the different commits to their corresponding revision.
 */
public class MergeChains {
    private Resource mergeCommit;
    private Resource branchingCommit;
    private boolean auxMasterMergeIntoBranch = false;
    private boolean conflictMerge = false;
    private LinkedHashMap<Resource, Resource> auxCommitToRevision = new LinkedHashMap<>();
    private LinkedHashMap<Resource, Resource> baseCommitToRevision = new LinkedHashMap<>();
    public MergeChains(Resource mergeCommit) {
        this.mergeCommit = mergeCommit;
    }

    public Resource getMergeCommit() {
        return mergeCommit;
    }

    public boolean isAuxMasterMergeIntoBranch() {
        return auxMasterMergeIntoBranch;
    }

    public void setAuxMasterMergeIntoBranch(boolean auxMasterMergeIntoBranch) {
        this.auxMasterMergeIntoBranch = auxMasterMergeIntoBranch;
    }

    public boolean isConflictMerge() {
        return conflictMerge;
    }

    public void setConflictMerge(boolean conflictMerge) {
        this.conflictMerge = conflictMerge;
    }

    public void setMergeCommit(Resource mergeCommit) {
        this.mergeCommit = mergeCommit;
    }

    public Resource getBranchingCommit() {
        return branchingCommit;
    }

    public void setBranchingCommit(Resource branchingCommit) {
        this.branchingCommit = branchingCommit;
    }

    public LinkedHashMap<Resource, Resource> getAuxCommitToRevision() {
        return auxCommitToRevision;
    }

    public void setAuxCommitToRevision(LinkedHashMap<Resource, Resource> auxCommitToRevision) {
        this.auxCommitToRevision = auxCommitToRevision;
    }

    public LinkedHashMap<Resource, Resource> getBaseCommitToRevision() {
        return baseCommitToRevision;
    }

    public void setBaseCommitToRevision(LinkedHashMap<Resource, Resource> baseCommitToRevision) {
        this.baseCommitToRevision = baseCommitToRevision;
    }
}
