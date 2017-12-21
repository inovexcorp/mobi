package com.mobi.persistence.utils.api;

/*-
 * #%L
 * com.mobi.ontology.utils
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

import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.Value;

public interface SesameTransformer {

    org.eclipse.rdf4j.model.Model sesameModel(Model model);

    Model mobiModel(org.eclipse.rdf4j.model.Model model);

    org.eclipse.rdf4j.model.Statement sesameStatement(Statement statement);

    Statement mobiStatement(org.eclipse.rdf4j.model.Statement statement);

    org.eclipse.rdf4j.model.Resource sesameResource(Resource resource);

    Resource mobiResource(org.eclipse.rdf4j.model.Resource resource);

    org.eclipse.rdf4j.model.IRI sesameIRI(IRI iri);

    IRI mobiIRI(org.eclipse.rdf4j.model.IRI sesameURI);

    org.eclipse.rdf4j.model.Value sesameValue(Value value);

    Value mobiValue(org.eclipse.rdf4j.model.Value value);
}
