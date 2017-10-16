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
import spock.lang.Specification

class SimpleOntologyAdditionSpec extends Specification {

    def "test"() {
        setup:
        def ontology = Mock(Ontology)
        def annotation = Mock(Annotation)

        when:
        def addition = new SimpleOntologyAddition<Annotation>(ontology, annotation)

        then:
        addition.getChangedObject() instanceof Annotation
    }
}
