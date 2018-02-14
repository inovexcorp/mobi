package com.mobi.security.policy.pip.impl;

/*-
 * #%L
 * com.mobi.security.policy.pip.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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

import static com.mobi.rest.util.RestUtils.decode;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.exception.MobiException;
import com.mobi.persistence.utils.Bindings;
import com.mobi.persistence.utils.RepositoryResults;
import com.mobi.query.api.TupleQuery;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Literal;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.security.policy.api.AttributeDesignator;
import com.mobi.security.policy.api.PIP;
import com.mobi.security.policy.api.Request;
import com.mobi.security.policy.api.exception.MissingAttributeException;
import com.mobi.security.policy.api.exception.ProcessingException;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component(immediate = true, provide = {PIP.class, MobiPIP.class})
public class MobiPIP implements PIP {

    private String PROP_PATH_NAMESPACE = "http://mobi.com/policy/prop-path";
    private String PROP_PATH_QUERY = "SELECT ?value\nWHERE {\n?sub %s ?value .\n}";

    private Repository repo;
    private ValueFactory vf;

    @Reference(target = "(id=system)")
    public void setRepo(Repository repo) {
        this.repo = repo;
    }

    @Reference
    public void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    @Override
    public List<Literal> findAttribute(AttributeDesignator attributeDesignator, Request request)
            throws MissingAttributeException, ProcessingException {
        IRI attributeId = attributeDesignator.attributeId();
        IRI category = attributeDesignator.category();
        IRI sub;
        switch (category.stringValue()) {
            case "urn:oasis:names:tc:xacml:1.0:subject-category:access-subject":
                Map<String, Literal> subjectAttrs = request.getSubjectAttrs();
                if (subjectAttrs.containsKey(attributeId.stringValue())) {
                    return Collections.singletonList(subjectAttrs.get(attributeId.stringValue()));
                }
                sub = request.getSubjectId();
                break;
            case "urn:oasis:names:tc:xacml:3.0:attribute-category:resource":
                Map<String, Literal> resourceAttrs = request.getResourceAttrs();
                if (resourceAttrs.containsKey(attributeId.stringValue())) {
                    return Collections.singletonList(resourceAttrs.get(attributeId.stringValue()));
                }
                sub = request.getResourceId();
                break;
            case "urn:oasis:names:tc:xacml:3.0:attribute-category:action":
                Map<String, Literal> actionAttrs = request.getActionAttrs();
                if (actionAttrs.containsKey(attributeId.stringValue())) {
                    return Collections.singletonList(actionAttrs.get(attributeId.stringValue()));
                }
                throw new MissingAttributeException("Cannot find attribute " + attributeId + " on the Action");
            case "urn:oasis:names:tc:xacml:3.0:attribute-category:environment":
                if (attributeId.stringValue().equals("urn:oasis:names:tc:xacml:1.0:environment:current-dateTime")) {
                    return Collections.singletonList(vf.createLiteral(request.getRequestTime()));
                }
                throw new MissingAttributeException("Cannot find attribute " + attributeId + " on the Environment");
            default:
                throw new MissingAttributeException("Category " + category + " not supported");
        }

        try (RepositoryConnection conn = repo.getConnection()) {
            if (attributeId.stringValue().startsWith(PROP_PATH_NAMESPACE)) {
                int firstIdx = attributeId.stringValue().lastIndexOf("(") + 1;
                int lastIdx = attributeId.stringValue().lastIndexOf(")");
                String path = decode(attributeId.stringValue().substring(firstIdx, lastIdx));
                TupleQuery query = conn.prepareTupleQuery(String.format(PROP_PATH_QUERY, path));
                query.setBinding("sub", sub);
                List<Literal> result = new ArrayList<>();
                query.evaluate().forEach(bindings -> {
                    Literal value;
                    try {
                        value = Bindings.requiredLiteral(bindings, "value");
                    } catch (IllegalStateException e) {
                        value = vf.createLiteral(Bindings.requiredResource(bindings, "value").stringValue());
                    }
                    result.add(value);
                });
                return result;
            } else {
                List<Statement> statements = RepositoryResults.asList(conn.getStatements(sub, attributeId, null));
                if (statements.size() == 0) {
                    return Collections.emptyList();
                }
                return statements.stream()
                        .map(Statement::getObject)
                        .map(value -> value instanceof Literal ? (Literal) value : vf.createLiteral(value.stringValue()))
                        .collect(Collectors.toList());
            }
        } catch (MobiException e) {
            throw new ProcessingException(e);
        }
    }
}
