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


import com.mobi.query.TupleQueryResult;
import com.mobi.rdf.api.BNode;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import com.mobi.exception.MobiException;
import com.mobi.query.TupleQueryResult;
import com.mobi.rdf.api.BNode;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Literal;
import com.mobi.rdf.api.Value;

import java.util.ArrayList;
import java.util.List;

public class JSONQueryResults {

    private static JSONObject writeValue(Value value) {
        JSONObject result = new JSONObject();

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

    public static List<JSONObject> getBindings(TupleQueryResult queryResults) {
        List<JSONObject> bindings = new ArrayList<>();
        queryResults.forEach(queryResult -> {
            JSONObject bindingSet = new JSONObject();
            queryResult.forEach(binding -> bindingSet.put(binding.getName(), writeValue(binding.getValue())));
            bindings.add(bindingSet);
        });
        return bindings;
    }

    public static JSONObject getResponse(TupleQueryResult queryResults) {
        JSONObject data = new JSONObject();

        JSONObject head = new JSONObject();
        JSONArray vars = new JSONArray();
        queryResults.getBindingNames().forEach(vars::add);
        head.put("vars", vars);

        JSONObject results = new JSONObject();
        JSONArray bindings = JSONArray.fromObject(getBindings(queryResults));
        results.put("bindings", bindings);

        data.put("head", head);
        data.put("results", results);

        return data;
    }
}
