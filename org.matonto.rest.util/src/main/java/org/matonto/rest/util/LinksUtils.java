package org.matonto.rest.util;


import org.apache.http.NameValuePair;
import org.apache.http.client.utils.URLEncodedUtils;
import org.apache.http.message.BasicNameValuePair;
import org.matonto.rest.util.jaxb.Links;

import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.List;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.core.UriInfo;

public class LinksUtils {

    private static String buildQueryString(MultivaluedMap<String, String> queryParams, int start) {
        List<NameValuePair> params = new ArrayList<>();

        queryParams.forEach( (key, values) -> {
            if (key.equals("start")) {
                params.add(new BasicNameValuePair(key, String.valueOf(start)));
            } else {
                params.add(new BasicNameValuePair(key, values.get(0)));
            }
        });

        return URLEncodedUtils.format(params, '&', Charset.forName("UTF-8"));
    }

    /**
     * Creates the Links that will be used to get the next and previous page of results in the PaginatedResults based
     * off of the provided details.
     *
     * @param uriInfo the request URI information.
     * @param size the number of results returned.
     * @param limit the maximum number of results returned.
     * @param start the starting index of the results.
     * @return Links for the provided details.
     */
    public static Links buildLinks(UriInfo uriInfo, int size, int totalSize, int limit, int start) {
        String path = uriInfo.getPath();

        Links links = new Links();
        links.setBase(uriInfo.getBaseUri().toString());
        links.setSelf(uriInfo.getAbsolutePath().toString());
        links.setContext(path);

        if (size == limit && totalSize - (start + limit) > 0) {
            String next = path + "?" + buildQueryString(uriInfo.getQueryParameters(), start + limit);
            links.setNext(next);
        }

        if (start != 0) {
            String prev = path + "?" + buildQueryString(uriInfo.getQueryParameters(), start - limit);
            links.setPrev(prev);
        }

        return links;
    }
}
