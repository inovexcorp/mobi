package com.mobi.ontology.core.impl.owlapi.change;

/*-
 * #%L
 * com.mobi.ontology.core.impl.owlapi
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

import com.mobi.ontology.core.api.change.OntologyChangeset;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.change.OntologyChange;

import java.util.HashSet;
import java.util.Set;

public class SimpleOntologyChangeset implements OntologyChangeset {

    private Ontology ontology;
    private Set<OntologyChange> changes = new HashSet<>();

    public SimpleOntologyChangeset(Ontology ontology) {
        this.ontology = ontology;
    }

    @Override
    public Ontology getOntology() {
        return ontology;
    }

    @Override
    public Ontology applyChanges() {
        return null;
    }

    @Override
    public Set<OntologyChange> getAdditions() {
        return null;
    }

    @Override
    public Set<OntologyChange> getRemovals() {
        return null;
    }

    @Override
    public Set<OntologyChange> getModifications() {
        return null;
    }

    @Override
    public Set<OntologyChange> getChanges() {
        return changes;
    }

    @Override
    public boolean addChange(OntologyChange change) {
        return changes.add(change);
    }
}
