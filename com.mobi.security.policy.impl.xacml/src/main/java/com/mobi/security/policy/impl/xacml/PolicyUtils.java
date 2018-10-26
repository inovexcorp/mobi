package com.mobi.security.policy.impl.xacml;

/*-
 * #%L
 * com.mobi.security.policy.impl.xacml
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

import com.mobi.exception.MobiException;
import com.mobi.persistence.utils.Bindings;
import com.mobi.persistence.utils.QueryResults;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Resource;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.security.policy.api.xacml.PolicyQueryParams;
import org.apache.commons.io.IOUtils;

import java.io.IOException;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public class PolicyUtils {
    private static final String BINDING_VALUES = "%BINDINGVALUES";
    private static final String FILTERS = "%FILTERS";
    private static final String RESOURCES_BINDING = "resources";
    private static final String RESOURCES_PROP = "relatedResource";
    private static final String SUBJECTS_BINDING = "subjects";
    private static final String SUBJECTS_PROP = "relatedSubject";
    private static final String ACTIONS_BINDING = "actions";
    private static final String ACTIONS_PROP = "relatedAction";
    private static final String POLICY_ID_BINDING = "policyId";
    private static String policyQuery;

    static {
        try {
            policyQuery = IOUtils.toString(
                    BalanaPolicyManager.class.getResourceAsStream("/find-policies.rq"),
                    "UTF-8"
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    public static List<Resource> findPolicies(PolicyQueryParams params, Repository repository) {
        StringBuilder values = new StringBuilder(" ");
        StringBuilder filters = new StringBuilder(" ");
        setBindings(params.getResourceIRIs(), RESOURCES_BINDING, RESOURCES_PROP, values, filters);
        setBindings(params.getSubjectIRIs(), SUBJECTS_BINDING, SUBJECTS_PROP, values, filters);
        setBindings(params.getActionIRIs(), ACTIONS_BINDING, ACTIONS_PROP, values, filters);

        try (RepositoryConnection conn = repository.getConnection()) {
            String queryStr = policyQuery.replace(BINDING_VALUES, values.toString())
                    .replace(FILTERS, filters.toString());
            return QueryResults.asList(conn.prepareTupleQuery(queryStr).evaluate()).stream()
                    .map(bindings -> Bindings.requiredResource(bindings, POLICY_ID_BINDING))
                    .collect(Collectors.toList());
        }
    }

    private static void setBindings(Set<IRI> iris, String variableName, String propertyName, StringBuilder values,
                             StringBuilder filters) {
        if (iris.size() > 0) {
            filters.append("?").append(POLICY_ID_BINDING).append(" :").append(propertyName).append(" ?")
                    .append(variableName).append(". ");
            if (iris.size() > 1) {
                String iriStr = String.join(" ", iris.stream().map(iri -> "<" + iri + ">")
                        .collect(Collectors.toList()));
                values.append("VALUES ?").append(variableName).append(" {").append(iriStr).append("} ");
            } else if (iris.size() == 1) {
                values.append("BIND (<").append(iris.iterator().next()).append("> as ?").append(variableName)
                        .append(") ");
            }
        }
    }

}
