package com.mobi.ontology.core.impl.owlapi;

/*-
 * #%L
 * com.mobi.ontology.core.impl.owlapi
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

import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.rdf.api.Resource;
import org.semanticweb.owlapi.model.IRI;
import org.semanticweb.owlapi.model.OWLOntologyIRIMapper;

import java.util.Optional;
import javax.annotation.Nullable;

public class MobiOntologyIRIMapper implements OWLOntologyIRIMapper {
    private OntologyManager manager;

    public static final String protocol = "matonto:";
    public static final String standardProtocol = "https:";

    public MobiOntologyIRIMapper(OntologyManager manager) {
        this.manager = manager;
    }

    @Nullable
    @Override
    public IRI getDocumentIRI(IRI ontologyIRI) {
        Optional<Resource> recordId = manager.getOntologyRecordResource(SimpleOntologyValues.matontoIRI(ontologyIRI));
        return recordId.map(resource -> IRI.create(resource.stringValue().replace(standardProtocol, protocol))).orElse(null);
    }
}
