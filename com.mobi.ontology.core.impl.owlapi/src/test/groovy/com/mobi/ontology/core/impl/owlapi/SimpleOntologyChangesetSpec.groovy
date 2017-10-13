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
package com.mobi.ontology.core.impl.owlapi

import com.mobi.ontology.core.api.Annotation
import com.mobi.ontology.core.api.Ontology
import com.mobi.ontology.core.impl.owlapi.change.SimpleOntologyAddition
import com.mobi.ontology.core.impl.owlapi.change.SimpleOntologyChangeset
import spock.lang.Specification

class SimpleOntologyChangesetSpec extends Specification {

    def "getOntology() returns the correct Ontology"() {
        setup:
        def ontology = Mock(Ontology)

        when:
        def changeset = new SimpleOntologyChangeset(ontology)

        then:
  //      1 * ontology.equals(ontology) >> true
        changeset.getOntology() == ontology
    }

    def "addChange() increments the changes count"() {
        setup:
        def ontology = Mock(Ontology)
        def annotation = Mock(Annotation)

        when:
        def change = new SimpleOntologyAddition<Annotation>(ontology, annotation)
        def changeset = new SimpleOntologyChangeset(ontology)
        changeset.addChange(change)

        then:
        changeset.getChanges().size() == 1
    }
}
