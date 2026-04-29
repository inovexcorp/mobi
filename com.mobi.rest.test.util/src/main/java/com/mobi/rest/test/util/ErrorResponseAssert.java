package com.mobi.rest.test.util;

/*-
 * #%L
 * com.mobi.rest.test.util
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

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.util.Objects;
import javax.ws.rs.core.Response;

/**
 * Shared assertion utilities for validating REST error responses that follow the ErrorObjectSchema format.
 * Error responses are expected to have a JSON body with the structure:
 * <pre>
 * {
 *   "error": "ExceptionClassName",
 *   "errorMessage": "Human-readable message",
 *   "errorDetails": ["Detail 1", "Detail 2"]
 * }
 * </pre>
 */
public class ErrorResponseAssert {

    private static final ObjectMapper mapper = new ObjectMapper();

    /**
     * Parses the response entity as a JSON ObjectNode.
     *
     * @param response the JAX-RS Response
     * @return the parsed ObjectNode
     * @throws Exception if the response body cannot be parsed as JSON
     */
    public static ObjectNode getResponse(Response response) {
        try {
            return mapper.readValue(response.readEntity(String.class), ObjectNode.class);
        } catch (Exception e) {
            throw new AssertionError("Failed to parse error response as JSON: " + e.getMessage(), e);
        }
    }

    /**
     * Asserts that the response has the expected HTTP status code, error type, and error message
     * following the ErrorObjectSchema format.
     *
     * @param response          the JAX-RS Response to validate
     * @param expectedStatus    the expected HTTP status code (e.g., 400, 404, 500)
     * @param expectedErrorType the expected exception class name (e.g., "IllegalArgumentException")
     * @param expectedMessage   the expected error message string
     */
    public static void assertErrorResponse(Response response, int expectedStatus,
            String expectedErrorType, String expectedMessage) {
        check(expectedStatus == response.getStatus(),
                "HTTP status: expected " + expectedStatus + " but was " + response.getStatus());
        ObjectNode body = getResponse(response);
        assertErrorBody(body, expectedErrorType, expectedMessage);
    }

    /**
     * Asserts that the response has the expected HTTP status code and error type, without checking
     * the specific error message.
     *
     * @param response          the JAX-RS Response to validate
     * @param expectedStatus    the expected HTTP status code
     * @param expectedErrorType the expected exception class name
     */
    public static void assertErrorType(Response response, int expectedStatus,
            String expectedErrorType) {
        check(expectedStatus == response.getStatus(),
                "HTTP status: expected " + expectedStatus + " but was " + response.getStatus());
        ObjectNode body = getResponse(response);
        checkNotNull(body.get("error"), "Response body missing 'error' field");
        check(expectedErrorType.equals(body.get("error").asText()),
                "Error type: expected '" + expectedErrorType + "' but was '" + body.get("error").asText() + "'");
        checkNotNull(body.get("errorMessage"), "Response body missing 'errorMessage' field");
        checkNotNull(body.get("errorDetails"), "Response body missing 'errorDetails' field");
        check(body.get("errorDetails").isArray(), "'errorDetails' should be an array");
    }

    /**
     * Asserts that the response has the expected HTTP status code and that the error message
     * contains the given substring.
     *
     * @param response          the JAX-RS Response to validate
     * @param expectedStatus    the expected HTTP status code
     * @param expectedErrorType the expected exception class name
     * @param messageSubstring  a substring that the error message should contain
     */
    public static void assertErrorContains(Response response, int expectedStatus,
            String expectedErrorType, String messageSubstring) {
        check(expectedStatus == response.getStatus(),
                "HTTP status: expected " + expectedStatus + " but was " + response.getStatus());
        ObjectNode body = getResponse(response);
        checkNotNull(body.get("error"), "Response body missing 'error' field");
        check(expectedErrorType.equals(body.get("error").asText()),
                "Error type: expected '" + expectedErrorType + "' but was '" + body.get("error").asText() + "'");
        String actualMessage = body.get("errorMessage").asText();
        check(actualMessage.contains(messageSubstring),
                "Error message should contain '" + messageSubstring + "' but was '" + actualMessage + "'");
    }

    private static void assertErrorBody(ObjectNode body, String expectedErrorType, String expectedMessage) {
        checkNotNull(body.get("error"), "Response body missing 'error' field");
        checkNotNull(body.get("errorMessage"), "Response body missing 'errorMessage' field");
        checkNotNull(body.get("errorDetails"), "Response body missing 'errorDetails' field");
        check(expectedErrorType.equals(body.get("error").asText()),
                "Error type: expected '" + expectedErrorType + "' but was '" + body.get("error").asText() + "'");
        check(expectedMessage.equals(body.get("errorMessage").asText()),
                "Error message: expected '" + expectedMessage + "' but was '" + body.get("errorMessage").asText() + "'");
        check(body.get("errorDetails").isArray(), "'errorDetails' should be an array");
    }

    private static void check(boolean condition, String message) {
        if (!condition) {
            throw new AssertionError(message);
        }
    }

    private static void checkNotNull(Object value, String message) {
        if (value == null) {
            throw new AssertionError(message);
        }
    }
}
