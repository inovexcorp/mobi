package com.mobi.security.policy.impl.core.pip;

/*-
 * #%L
 * com.mobi.security.policy.pip.impl
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

import static com.mobi.persistence.utils.ResourceUtils.decode;

import com.mobi.repository.api.OsgiRepository;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import com.mobi.security.policy.api.AttributeDesignator;
import com.mobi.security.policy.api.PIP;
import com.mobi.security.policy.api.Request;
import com.mobi.security.policy.api.exception.MissingAttributeException;
import com.mobi.security.policy.api.exception.ProcessingException;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

/**
 * The MobiPIP only supports searching for attributes on the Subject and Resource by using the IDs as subjects
 * and the attribute ID as a predicates in a SPARQL query. Can do property path queries by looking for a specific
 * namespace and parsing the property path string from within parenthesis in the attribute ID. Does not process
 * the attributes on the Request itself.
 */
@Component(immediate = true)
public class MobiPIP implements PIP {

    static final String PROP_PATH_NAMESPACE = "http://mobi.com/policy/prop-path";
    private static final String PROP_PATH_QUERY = "SELECT ?value WHERE { ?sub %s ?value .}";

    final ValueFactory vf = new ValidatingValueFactory();

    @Reference(target = "(id=system)")
    OsgiRepository repo;

    @Override
    public List<Literal> findAttribute(AttributeDesignator attributeDesignator, Request request)
            throws MissingAttributeException, ProcessingException {
        IRI attributeId = attributeDesignator.attributeId();
        IRI category = attributeDesignator.category();
        List<IRI> pathSources;
        if (category.equals(request.getSubjectCategory())) {
            pathSources = request.getSubjectIds();
        } else if (category.equals(request.getResourceCategory())) {
            pathSources = request.getResourceIds();
        } else {
            return Collections.emptyList();
        }
        List<Literal> literals = new ArrayList<>();
        try (RepositoryConnection conn = repo.getConnection()) {
            for (IRI pathSource : pathSources) {
                if (attributeId.stringValue().startsWith(PROP_PATH_NAMESPACE)) {
                    int firstIdx = attributeId.stringValue().lastIndexOf("(") + 1;
                    int lastIdx = attributeId.stringValue().lastIndexOf(")");
                    String path = decode(attributeId.stringValue().substring(firstIdx, lastIdx));
                    TupleQuery query = conn.prepareTupleQuery(String.format(PROP_PATH_QUERY, path));
                    query.setBinding("sub", pathSource);
                    literals.addAll(StreamSupport.stream(query.evaluate().spliterator(), false)
                            .map(bindings -> bindings.getBinding("value").getValue())
                            .map(value -> {
                                if (Literal.class.isAssignableFrom(value.getClass())) {
                                    return (Literal) value;
                                } else {
                                    return vf.createLiteral(value.stringValue());
                                }
                            })
                            .collect(Collectors.toList()));
                } else {
                    literals.addAll(StreamSupport.stream(conn.getStatements(pathSource, attributeId, null).spliterator(), false)
                            .map(Statement::getObject)
                            .map(value -> value instanceof Literal ? (Literal) value
                                    : vf.createLiteral(value.stringValue()))
                            .collect(Collectors.toList()));
                }
            }
            return literals;
        }
    }
}
