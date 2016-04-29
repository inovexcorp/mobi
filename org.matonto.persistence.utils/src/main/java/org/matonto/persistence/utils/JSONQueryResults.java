package org.matonto.persistence.utils;


import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.matonto.query.TupleQueryResult;
import org.matonto.rdf.api.BNode;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Literal;
import org.matonto.rdf.api.Value;

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

            // TODO: create a Literals class to determine if it is a language literal

            result.put("type", "literal");
            result.put("value", lit.getLabel());
        }

        return result;
    }

    public static JSONObject getResults(TupleQueryResult queryResults) {
        JSONObject data = new JSONObject();

        JSONObject head = new JSONObject();
        JSONArray vars = new JSONArray();
        queryResults.getBindingNames().forEach(vars::add);
        head.put("vars", vars);

        JSONObject results = new JSONObject();
        JSONArray bindings = new JSONArray();
        queryResults.forEach(queryResult -> {
            JSONObject bindingSet = new JSONObject();
            queryResult.forEach(binding -> bindingSet.put(binding.getName(), writeValue(binding.getValue())));
            bindings.add(bindingSet);
        });
        results.put("bindings", bindings);

        data.put("head", head);
        data.put("results", results);

        return data;
    }
}
