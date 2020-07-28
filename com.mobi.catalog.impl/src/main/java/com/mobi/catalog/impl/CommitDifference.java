package com.mobi.catalog.impl;

/*-
 * #%L
 * com.mobi.catalog.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2020 iNovex Information Systems, Inc.
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

import com.mobi.rdf.api.Statement;

import java.util.ArrayList;
import java.util.List;

public class CommitDifference {
    List<Statement> additions;
    List<Statement> deletions;

    public CommitDifference(List<Statement> additions, List<Statement> deletions) {
        setAdditions(additions);
        setDeletions(deletions);
    }

    public CommitDifference() {
        setAdditions(new ArrayList<>());
        setDeletions(new ArrayList<>());
    }

    public static CommitDifference combine(List<CommitDifference> additionsAndDeletions) {
        CommitDifference combined = new CommitDifference();
        additionsAndDeletions.forEach( (commitDifference) -> {
            combined.addAdditions(commitDifference.getAdditions());
            combined.addDeletions(commitDifference.getDeletions());
        });
        return combined;
    }

    public void addAdditions(List<Statement> additions) {
        this.additions.addAll(additions);
    }

    public void addDeletions(List<Statement> deletions) {
        this.deletions.addAll(deletions);
    }

    public void addAddition(Statement addition) {
        this.additions.add(addition);
    }

    public void addDeletion(Statement deletion) {
        this.deletions.add(deletion);
    }

    public List<Statement> getAdditions() {
        return additions;
    }

    public List<Statement> getDeletions() {
        return deletions;
    }

    public void setAdditions(List<Statement> additions) {
        this.additions = additions;
    }

    public void setDeletions(List<Statement> deletions) {
        this.deletions = deletions;
    }
}
