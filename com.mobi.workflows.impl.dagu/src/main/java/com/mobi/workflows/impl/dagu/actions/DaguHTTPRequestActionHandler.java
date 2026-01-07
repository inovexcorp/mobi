package com.mobi.workflows.impl.dagu.actions;

/*-
 * #%L
 * com.mobi.workflows.impl.dagu
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import com.mobi.workflows.api.action.ActionDefinition;
import com.mobi.workflows.api.action.ActionHandler;
import com.mobi.workflows.api.ontologies.actions.HTTPRequestAction;
import com.mobi.workflows.api.ontologies.actions.Header;
import org.apache.commons.io.IOUtils;
import org.apache.http.NameValuePair;
import org.apache.http.client.utils.URIBuilder;
import org.osgi.service.component.annotations.Component;

import java.io.IOException;
import java.io.InputStream;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Component(
        immediate = true,
        service = {ActionHandler.class, DaguHTTPRequestActionHandler.class })
public class DaguHTTPRequestActionHandler implements ActionHandler<HTTPRequestAction> {

    @Override
    public ActionDefinition createDefinition(HTTPRequestAction action) {
        String yamlContent;
        try (InputStream is = DaguHTTPRequestActionHandler.class
                .getResourceAsStream("/HTTPRequestActionTemplate.yaml")) {
            yamlContent = IOUtils.toString(Objects.requireNonNull(is), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new MobiException("Error parsing YAML " + e);
        }
        yamlContent = fillTemplate(yamlContent, action);
        return new DaguActionDefinition(yamlContent, action);
    }

    @Override
    public String getTypeIRI() {
        return HTTPRequestAction.TYPE;
    }

    @Override
    public URL getShaclDefinition() {
        return ActionHandler.class.getResource("/actionOntology.ttl");
    }

    /**
     * Fills placeholders in a YAML string template with values from an HTTPRequestAction object.
     *
     * @param yamlString The YAML string template containing placeholders.
     * @param action     The HTTPRequestAction object providing values to replace placeholders.
     * @return A YAML string with placeholders replaced by actual values from the action.
     * @throws MobiException If an error occurs during URL parsing, if the HTTP URL is not present in the action,
     *                       or if any required value (such as HTTP method) is missing.
     */
    protected String fillTemplate(String yamlString, HTTPRequestAction action) {
        // Populate YAML replacements map with request values
        Map<String, String> replacements = new HashMap<>();
        String httpUrl = action.getHasHttpUrl().orElseThrow(() ->
                new MobiException("HTTP URL for Dagu Request not present"));
        String hasQueryParams = "";
        try {
            URIBuilder builder = new URIBuilder(httpUrl);
            List<NameValuePair> queryParams = builder.getQueryParams();
            httpUrl = builder.removeQuery().build().toString();

            if (queryParams != null && !queryParams.isEmpty()) {
                hasQueryParams = queryParams.stream()
                        .map(this::formatQueryParam)
                        .collect(Collectors.joining(",\n        "));
            }
        } catch (URISyntaxException e) {
            throw new MobiException("Error parsing URL " + e);
        }
        replacements.put("{{hasHttpUrl}}", httpUrl);
        replacements.put("{{hasQueryParams}}", hasQueryParams);
        String httpMethod = action.getHasHttpMethod().orElseThrow(() ->
                new MobiException("HTTP Method for Dagu Request not present"));
        replacements.put("{{hasHttpMethod}}", httpMethod);

        String httpBody = yamlEscapeFormatting(action.getHasHttpBody().orElse(""));
        replacements.put("{{hasHttpBody}}", httpBody);
        String httpMediaType = action.getHasHttpMediaType().isPresent()
                ? "\"Content-Type\": \"" + action.getHasHttpMediaType().get() + "\"" : "";
        replacements.put("{{hasHttpMediaType}}", httpMediaType);
        String httpTimeout = action.getHasHttpTimeout().orElse(30).toString();
        replacements.put("{{hasHttpTimeout}}", httpTimeout);
        String actionIri = action.getResource().toString();
        replacements.put("{{hasActionIri}}", actionIri);
        String hasHeaders = action.getHasHeader().stream().map(this::formatHeader).collect(Collectors
                .joining(",\n        "));
        if (!hasHeaders.isBlank()) {
            hasHeaders = hasHeaders.concat(",");
        }
        replacements.put("{{hasHeader}}", hasHeaders);
        // Generate uuid for individual step
        UUID uuid = UUID.randomUUID();
        String uuidString = uuid.toString().replace("-", "");
        replacements.put("{{hasRandomId}}", 'r' + uuidString);

        // Make replacements in yaml file, then return updated yaml string
        for (Map.Entry<String, String> entry : replacements.entrySet()) {
            yamlString = yamlString.replace(entry.getKey(), entry.getValue());
        }
        return yamlString;
    }

    /**
     * Formats a header into a string representation suitable for inclusion in a JSON-like format.
     * If the header name or value is not present, empty strings will be used.
     *
     * @param header The header to be formatted.
     * @return A string representing the header in the format: "name": "value".
     *         If the header name or value is empty, the corresponding field will be an empty string.
     */
    protected String formatHeader(Header header) {
        String name = header.getHasHeaderName().orElse("");
        String value = header.getHasHeaderValue().orElse("");
        return "\"" + name + "\": \"" + yamlEscapeFormatting(value) + "\"";
    }

    /**
     * Formats a query parameter in the form of a {@link NameValuePair} into a formatted JSON-like string of the form:
     * "key": "value".
     *
     * @param queryParam The pair of a name of a query parameter and its value
     * @return A string representing the query parameter in the format: "key": "value".
     */
    protected String formatQueryParam(NameValuePair queryParam) {
        String key = queryParam.getName();
        String value = queryParam.getValue();
        return "\"" + key + "\": \"" + yamlEscapeFormatting(value) + "\"";
    }

    /**
     * Escapes special characters in the given string value for formatting purposes.
     * This method escapes double quotes ("), ensuring they are preceded by a single backslash (\").
     * It also reduces multiple consecutive backslashes to a single backslash.
     *
     * @param value the string value to be escaped
     * @return the escaped string value
     */
    protected String yamlEscapeFormatting(String value) {
        // Remove new lines from string
        value = value.replaceAll("\\n", "");

        // If there is a quotation mark without a prefixed backslash, add one
        String escapedValue = value.replaceAll("(?<!\\\\)\"", "\\\\\"");

        // Reduce multiple backslashes to one
        escapedValue = escapedValue.replaceAll("\\\\{2,}", "\\\\");

        return escapedValue;
    }
}
