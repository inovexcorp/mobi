package org.matonto.persistence.utils;


import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.matonto.query.TupleQueryResult;

public class JSONQueryResults {

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
            queryResult.forEach(binding -> bindingSet.put(binding.getName(), binding.getValue().stringValue()));
            bindings.add(bindingSet);
        });
        results.put("bindings", bindings);

        data.put("head", head);
        data.put("results", results);
        return data;
    }
}
