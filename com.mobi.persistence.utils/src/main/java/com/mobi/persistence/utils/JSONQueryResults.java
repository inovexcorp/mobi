package com.mobi.persistence.utils;

/*-
 * #%L
 * com.mobi.persistence.utils
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


import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.query.TupleQueryResult;
import com.mobi.rdf.api.BNode;
import com.mobi.exception.MobiException;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Literal;
import com.mobi.rdf.api.Value;

import java.util.ArrayList;
import java.util.List;

public class JSONQueryResults {

    private static ObjectMapper mapper = new ObjectMapper();

    private static ObjectNode writeValue(Value value) {
        ObjectNode result = mapper.createObjectNode();

        if (value instanceof IRI) {
            result.put("type", "uri");
            result.put("value", value.toString());
        } else if (value instanceof BNode) {
            result.put("type", "bnode");
            result.put("value", ((BNode)value).getID());
        } else if (value instanceof Literal) {
            Literal lit = (Literal)value;

            if (lit.getLanguage().isPresent()) {
                result.put("xml:lang", lit.getLanguage().get());
            }

            result.put("datatype", lit.getDatatype().stringValue());
            result.put("type", "literal");
            result.put("value", lit.getLabel());
        } else {
            throw new MobiException("Unknown Value object type: " + value.getClass());
        }

        return result;
    }

    public static List<ObjectNode> getBindings(TupleQueryResult queryResults) {
        List<ObjectNode> bindings = new ArrayList<>();
        queryResults.forEach(queryResult -> {
            ObjectNode bindingSet = mapper.createObjectNode();
            queryResult.forEach(binding -> bindingSet.set(binding.getName(), writeValue(binding.getValue())));
            bindings.add(bindingSet);
        });
        return bindings;
    }

    public static ObjectNode getResponse(TupleQueryResult queryResults) {
        ObjectNode data = mapper.createObjectNode();

        ObjectNode head = mapper.createObjectNode();
        ArrayNode vars = mapper.createArrayNode();
        queryResults.getBindingNames().forEach(vars::add);
        head.put("vars", vars);

        ObjectNode results = mapper.createObjectNode();
        ArrayNode bindings = mapper.valueToTree(getBindings(queryResults));
        results.set("bindings", bindings);

        data.set("head", head);
        data.set("results", results);

        return data;
    }
}
