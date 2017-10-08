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

import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.Value;

public interface SesameTransformer {

    org.openrdf.model.Model sesameModel(Model model);

    Model matontoModel(org.openrdf.model.Model model);

    org.openrdf.model.Statement sesameStatement(Statement statement);

    Statement matontoStatement(org.openrdf.model.Statement statement);

    org.openrdf.model.Resource sesameResource(Resource resource);

    Resource matontoResource(org.openrdf.model.Resource resource);

    org.openrdf.model.IRI sesameIRI(IRI iri);

    IRI matontoIRI(org.openrdf.model.IRI sesameURI);

    org.openrdf.model.Value sesameValue(Value value);

    Value matontoValue(org.openrdf.model.Value value);
}
