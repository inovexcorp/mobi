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

import static com.mobi.persistence.utils.Models.vf;
import static junit.framework.TestCase.assertEquals;
import static junit.framework.TestCase.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.mobi.exception.MobiException;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.workflows.api.ontologies.actions.HTTPRequestAction;
import com.mobi.workflows.api.ontologies.actions.Header;
import org.apache.http.NameValuePair;
import org.apache.http.message.BasicNameValuePair;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.impl.SimpleValueFactory;
import org.junit.Before;
import org.junit.Test;

import java.io.IOException;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public class DaguHTTPRequestActionHandlerTest extends OrmEnabledTestCase {

    private String uuidString;
    private final DaguHTTPRequestActionHandler actionHandler = new DaguHTTPRequestActionHandler();
    private HTTPRequestAction requestAction;
    IRI mockIRI = vf.createIRI("http://example.com/workflows/B/action");

    private String yamlString;

    @Before
    public void setUp() throws IOException {
        // Mock HTTPRequestAction
        requestAction = mock(HTTPRequestAction.class);
        when(requestAction.getHasHttpUrl()).thenReturn(Optional.of("http://example.com"));
        when(requestAction.getHasHttpMethod()).thenReturn(Optional.of("GET"));
        when(requestAction.getHasHttpBody()).thenReturn(Optional.of("Sample body"));
        when(requestAction.getHasHttpMediaType()).thenReturn(Optional.of("application/json"));
        when(requestAction.getHasHttpTimeout()).thenReturn(Optional.of(30));
        IRI actionIri = SimpleValueFactory.getInstance().createIRI("http://example.com/workflows/B/action");
        when(requestAction.getResource()).thenReturn(actionIri);
        UUID uuid = UUID.randomUUID();
        uuidString = 'r'+ uuid.toString().replace("-","");
        yamlString = "- name: {{hasActionIri}} HTTP Request\n" +
                "  executor:\n" +
                "    type: http\n" +
                "    config:\n" +
                "      silent: true\n" +
                "  command: {{hasHttpMethod}} {{hasHttpUrl}}\n" +
                "  script: |\n" +
                "    {\n" +
                "      \"timeout\": {{hasHttpTimeout}},\n" +
                "      \"headers\": {\n" +
                "      {{hasHeader}}\n" +
                "      {{hasHttpMediaType}}\n" +
                "    },\n" +
                "      \"query\": {\n" +
                "        {{hasQueryParams}}\n" +
                "      },\n" +
                "      \"body\": \"{{hasHttpBody}}\"\n" +
                "    }\n" +
                "  output: RESULT\n" +
                "- name: {{hasActionIri}} output\n" +
                "  depends:\n" +
                "    - {{hasActionIri}} HTTP Request\n" +
                "  command: echo $RESULT";
        yamlString = yamlString.replaceAll("RESULT", uuidString);
    }

    @Test
    public void testYamlEscapeFormatting_NoSpecialCharacters() {
        String input = "This is a test string";
        String result = actionHandler.yamlEscapeFormatting(input);

        assertEquals(input, result);
    }

    @Test
    public void testYamlEscapeFormatting_WithDoubleQuotes() {
        String input = "This string contains \"double quotes\"";
        String result = actionHandler.yamlEscapeFormatting(input);

        assertEquals("This string contains \\\"double quotes\\\"", result);
    }

    @Test
    public void testYamlEscapeFormatting_WithManyEscapedBackslashes() {
        String input = "This string contains \\\\\\\"backslashes\\\\\\\"";
        String result = actionHandler.yamlEscapeFormatting(input);

        assertEquals("This string contains \\\"backslashes\\\"", result);
    }

    @Test
    public void testYamlEscapeFormatting_WithManyUnevenBackslashes() {
        String input = "This string contains \\\"backslashes\\\\\\\"";
        String result = actionHandler.yamlEscapeFormatting(input);

        assertEquals("This string contains \\\"backslashes\\\"", result);
    }

    @Test
    public void testYamlEscapeFormatting_WithSingleQuotes() {
        String input = "This string contains \"backslashes\"";
        String result = actionHandler.yamlEscapeFormatting(input);

        assertEquals("This string contains \\\"backslashes\\\"", result);
    }

    @Test
    public void testYamlEscapeFormatting_WithNewLine() {
        String input = "This string contains\n a new line";
        String result = actionHandler.yamlEscapeFormatting(input);

        assertEquals("This string contains a new line", result);
    }

    @Test
    public void testFormatQueryParam_WithBasicValues() {
        NameValuePair queryParam = new BasicNameValuePair("key1", "value1");
        String result = actionHandler.formatQueryParam(queryParam);

        assertEquals("\"key1\": \"value1\"", result);
    }

    @Test
    public void testFormatQueryParam_WithSpecialCharacters() {
        NameValuePair queryParam = new BasicNameValuePair("key2", "value with \\backslashes\\ and \"quotes\"");
        String result = actionHandler.formatQueryParam(queryParam);

        assertEquals("\"key2\": \"value with \\backslashes\\ and \\\"quotes\\\"\"", result);
    }

    @Test
    public void testFormatHeader_WithNameAndValue() {
        Header header = mock(Header.class);
        when(header.getHasHeaderName()).thenReturn(Optional.of("Content-Type"));
        when(header.getHasHeaderValue()).thenReturn(Optional.of("application/json"));

        String result = actionHandler.formatHeader(header);

        assertEquals("\"Content-Type\": \"application/json\"", result);
    }

    @Test
    public void testFormatHeader_WithEmptyNameAndValue() {
        Header header = mock(Header.class);
        when(header.getHasHeaderName()).thenReturn(Optional.of(""));
        when(header.getHasHeaderValue()).thenReturn(Optional.of(""));

        String result = actionHandler.formatHeader(header);

        assertEquals("\"\": \"\"", result);
    }

    @Test
    public void testFormatHeader_WithSpecialCharacters() {
        Header header = mock(Header.class);
        when(header.getHasHeaderName()).thenReturn(Optional.of("Authorization"));
        when(header.getHasHeaderValue()).thenReturn(Optional.of("Bearer token123\""));
        
        String result = actionHandler.formatHeader(header);

        assertEquals("\"Authorization\": \"Bearer token123\\\"\"", result);
    }

    @Test(expected = MobiException.class)
    public void testFillTemplate_NoHttpUrl() {
        HTTPRequestAction action = mock(HTTPRequestAction.class);
        when(action.getHasHttpUrl()).thenReturn(Optional.empty());

        String yamlString = "Sample YAML string";

        actionHandler.fillTemplate(yamlString, action);
    }

    @Test(expected = MobiException.class)
    public void testFillTemplate_NoHttpMethod() {
        HTTPRequestAction action = mock(HTTPRequestAction.class);
        when(action.getHasHttpMethod()).thenReturn(Optional.empty());

        String yamlString = "Sample YAML string";

        actionHandler.fillTemplate(yamlString, action);
    }

    @Test
    public void testFillTemplate_NoHeaders_NoQueryParams() {
        when(requestAction.getHasHeader()).thenReturn(Collections.emptySet());

        String expectedYaml = "- name: http://example.com/workflows/B/action HTTP Request\n" +
                "  executor:\n" +
                "    type: http\n" +
                "    config:\n" +
                "      silent: true\n" +
                "  command: GET http://example.com\n" +
                "  script: |\n" +
                "    {\n" +
                "      \"timeout\": 30,\n" +
                "      \"headers\": {\n" +
                "      \n" +
                "      \"Content-Type\": \"application/json\"\n" +
                "    },\n" +
                "      \"query\": {\n" +
                "        \n" +
                "      },\n" +
                "      \"body\": \"Sample body\"\n" +
                "    }\n" +
                "  output: RESULT\n" +
                "- name: http://example.com/workflows/B/action output\n" +
                "  depends:\n" +
                "    - http://example.com/workflows/B/action HTTP Request\n" +
                "  command: echo $RESULT";
        expectedYaml = expectedYaml.replaceAll("RESULT", uuidString);

        String result = actionHandler.fillTemplate(yamlString, requestAction);
        assertEquals(expectedYaml, result);
    }

    @Test
    public void testFillTemplate_WithOneHeader() {
        // Create a mock header
        Header header = mock(Header.class);
        when(header.getHasHeaderName()).thenReturn(Optional.of("Authorization"));
        when(header.getHasHeaderValue()).thenReturn(Optional.of("Bearer token123"));
        Set<Header> headers = Collections.singleton(header);

        when(requestAction.getHasHeader()).thenReturn(headers);

        String result = actionHandler.fillTemplate(yamlString, requestAction);

        String expectedYaml = "- name: http://example.com/workflows/B/action HTTP Request\n" +
                "  executor:\n" +
                "    type: http\n" +
                "    config:\n" +
                "      silent: true\n" +
                "  command: GET http://example.com\n" +
                "  script: |\n" +
                "    {\n" +
                "      \"timeout\": 30,\n" +
                "      \"headers\": {\n" +
                "      \"Authorization\": \"Bearer token123\",\n" +
                "      \"Content-Type\": \"application/json\"\n" +
                "    },\n" +
                "      \"query\": {\n" +
                "        \n" +
                "      },\n" +
                "      \"body\": \"Sample body\"\n" +
                "    }\n" +
                "  output: RESULT\n" +
                "- name: http://example.com/workflows/B/action output\n" +
                "  depends:\n" +
                "    - http://example.com/workflows/B/action HTTP Request\n" +
                "  command: echo $RESULT";
        expectedYaml = expectedYaml.replaceAll("RESULT", uuidString);

        assertEquals(expectedYaml, result);
    }

    @Test
    public void testFillTemplate_WithMultipleHeaders() {
        // Create mock headers
        Header header1 = mock(Header.class);
        when(header1.getHasHeaderName()).thenReturn(Optional.of("Authorization"));
        when(header1.getHasHeaderValue()).thenReturn(Optional.of("Bearer token123"));
        Header header2 = mock(Header.class);
        when(header2.getHasHeaderName()).thenReturn(Optional.of("X-Custom-Header"));
        when(header2.getHasHeaderValue()).thenReturn(Optional.of("CustomValue"));

        // Create a linked hash set containing the mock headers, ensuring order of headers in YAML
        Set<Header> headers = new LinkedHashSet<>();
        headers.add(header1);
        headers.add(header2);

        when(requestAction.getHasHeader()).thenReturn(headers);

        String result = actionHandler.fillTemplate(yamlString, requestAction);

        String expectedYaml = "- name: http://example.com/workflows/B/action HTTP Request\n" +
                "  executor:\n" +
                "    type: http\n" +
                "    config:\n" +
                "      silent: true\n" +
                "  command: GET http://example.com\n" +
                "  script: |\n" +
                "    {\n" +
                "      \"timeout\": 30,\n" +
                "      \"headers\": {\n" +
                "      \"Authorization\": \"Bearer token123\",\n" +
                "        \"X-Custom-Header\": \"CustomValue\",\n" +
                "      \"Content-Type\": \"application/json\"\n" +
                "    },\n" +
                "      \"query\": {\n" +
                "        \n" +
                "      },\n" +
                "      \"body\": \"Sample body\"\n" +
                "    }\n" +
                "  output: RESULT\n" +
                "- name: http://example.com/workflows/B/action output\n" +
                "  depends:\n" +
                "    - http://example.com/workflows/B/action HTTP Request\n" +
                "  command: echo $RESULT";
        expectedYaml = expectedYaml.replaceAll("RESULT", uuidString);

        assertEquals(expectedYaml, result);
    }

    @Test
    public void testFillTemplate_WithNoHeaders_OneQueryParam() {
        when(requestAction.getHasHeader()).thenReturn(Collections.emptySet());

        // Mock the HTTP URL with one query parameter
        when(requestAction.getHasHttpUrl()).thenReturn(Optional.of("http://example.com?key=value"));
        String result = actionHandler.fillTemplate(yamlString, requestAction);

        assertTrue(result.contains("\"query\": {\n        \"key\": \"value\"\n      }"));
    }

    @Test
    public void testFillTemplate_WithNoHeaders_MultipleQueryParams() {
        when(requestAction.getHasHeader()).thenReturn(Collections.emptySet());

        // Mock the HTTP URL with multiple query parameters
        when(requestAction.getHasHttpUrl()).thenReturn(Optional.of("http://example.com?key1=value1&key2=value2"));
        String result = actionHandler.fillTemplate(yamlString, requestAction);

        assertTrue(result.contains("\"query\": {\n        \"key1\": \"value1\",\n        \"key2\": \"value2\"\n      }"));
    }

    @Test
    public void testFillTemplate_WithNoHeaders_Port() {
        when(requestAction.getHasHeader()).thenReturn(Collections.emptySet());

        // Mock the HTTP URL with a port specified
        when(requestAction.getHasHttpUrl()).thenReturn(Optional.of("http://example.com:8443"));
        String result = actionHandler.fillTemplate(yamlString, requestAction);

        assertTrue(result.contains("http://example.com:8443"));
    }
}
