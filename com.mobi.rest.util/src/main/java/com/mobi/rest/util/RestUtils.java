package com.mobi.rest.util;

/*-
 * #%L
 * com.mobi.rest.util
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

import com.mobi.persistence.utils.SkolemizedStatementIterable;
import com.mobi.persistence.utils.StatementIterable;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.Model;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.web.security.util.AuthenticationProps;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.RDFHandler;
import org.openrdf.rio.Rio;
import org.openrdf.rio.helpers.BufferedGroupingRDFHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.StringWriter;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import javax.annotation.Nullable;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Response;

public class RestUtils {

    private static final Logger LOG = LoggerFactory.getLogger(RestUtils.class);

    /**
     * Encodes the passed string using percent encoding for use in a URL.
     *
     * @param str The string to be encoded.
     * @return The URL encoded version of the passed string.
     */
    public static String encode(String str) {
        String encoded = null;
        try {
            encoded = URLEncoder.encode(str, "UTF-8").replaceAll("%28", "(")
                    .replaceAll("%29", ")")
                    .replaceAll("\\+", "%20")
                    .replaceAll("%27", "'")
                    .replaceAll("%21", "!")
                    .replaceAll("%7E", "~");
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }
        return encoded;
    }

    /**
     * Returns the specified RDFFormat. Currently supports Turtle, RDF/XML, and JSON-LD.
     *
     * @param format The abbreviated name of a RDFFormat.
     * @return A RDFFormat object with the requested format.
     */
    public static RDFFormat getRDFFormat(String format) {
        switch (format.toLowerCase()) {
            case "turtle":
                return RDFFormat.TURTLE;
            case "rdf/xml":
                return RDFFormat.RDFXML;
            case "jsonld":
            default:
                return RDFFormat.JSONLD;
        }
    }

    /**
     * Converts a {@link Model} into a string containing RDF in the specified RDFFormat.
     *
     * @param model  A {@link Model} of RDF to convert.
     * @param format The RDFFormat the RDF should be serialized into.
     * @param transformer The SesameTransformer for model conversions.
     * @return A String of the serialized RDF from the Model.
     */
    public static String modelToString(Model model, RDFFormat format, SesameTransformer transformer) {
        long start = System.currentTimeMillis();
        try {
            StringWriter sw = new StringWriter();
            Rio.write(new StatementIterable(model, transformer), sw, format);
            return sw.toString();
        } finally {
            LOG.trace("modelToString took {}ms", System.currentTimeMillis() - start);
        }
    }

    /**
     * Converts a {@link Model} into a string containing RDF in the format specified by the passed string.
     *
     * @param model  A {@link Model} of RDF to convert.
     * @param format The abbreviated name of a RDFFormat.
     * @param transformer The SesameTransformer for model conversions.
     * @return A String of the serialized RDF from the Model.
     */
    public static String modelToString(Model model, String format, SesameTransformer transformer) {
        return modelToString(model, getRDFFormat(format), transformer);
    }

    /**
     * Converts a {@link Model} into a skolemized string containing RDF in the specified RDFFormat.
     *
     * @param model  A {@link Model} of RDF to convert.
     * @param format The RDFFormat the RDF should be serialized into.
     * @param transformer The SesameTransformer for model conversions.
     * @param service The BNodeService for skolemization.
     * @return A skolemized String of the serialized RDF from the Model.
     */
    public static String modelToSkolemizedString(Model model, RDFFormat format, SesameTransformer transformer,
                                                 BNodeService service) {
        long start = System.currentTimeMillis();
        try {
            StringWriter sw = new StringWriter();
            Rio.write(new SkolemizedStatementIterable(model, transformer, service), sw, format);
            return sw.toString();
        } finally {
            LOG.trace("modelToSkolemizedString took {}ms", System.currentTimeMillis() - start);
        }
    }

    /**
     * Converts a {@link Model} into a skolemized string containing RDF in the format specified by the passed string.
     *
     * @param model  A {@link Model} of RDF to convert.
     * @param format The abbreviated name of a RDFFormat.
     * @param transformer The SesameTransformer for model conversions.
     * @param service The BNodeService for skolemization.
     * @return A skolemized String of the serialized RDF from the Model.
     */
    public static String modelToSkolemizedString(Model model, String format, SesameTransformer transformer,
                                                 BNodeService service) {
        return modelToSkolemizedString(model, getRDFFormat(format), transformer, service);
    }

    /**
     * Converts a {@link Model} into a string containing grouped RDF in the specified RDFFormat.
     *
     * @param model  A {@link Model} of RDF to convert.
     * @param format The RDFFormat the RDF should be serialized into.
     * @param transformer The SesameTransformer for model conversions.
     * @return A String of the serialized grouped RDF from the Model.
     */
    public static String groupedModelToString(Model model, RDFFormat format, SesameTransformer transformer) {
        long start = System.currentTimeMillis();
        try {
            StringWriter sw = new StringWriter();
            RDFHandler rdfWriter = new BufferedGroupingRDFHandler(Rio.createWriter(format, sw));
            Rio.write(new StatementIterable(model, transformer), rdfWriter);
            return sw.toString();
        } finally {
            LOG.trace("groupedModelToString took {}ms", System.currentTimeMillis() - start);
        }
    }

    /**
     * Converts a {@link Model} into a string containing grouped RDF in the format specified by the passed string.
     *
     * @param model  A {@link Model} of RDF to convert.
     * @param format The abbreviated name of a RDFFormat.
     * @param transformer The SesameTransformer for model conversions.
     * @return A String of the serialized grouped RDF from the Model.
     */
    public static String groupedModelToString(Model model, String format, SesameTransformer transformer) {
        return groupedModelToString(model, getRDFFormat(format), transformer);
    }

    /**
     * Converts a {@link Model} into a skolemized string containing grouped RDF in the specified RDFFormat.
     *
     * @param model  A {@link Model} of RDF to convert.
     * @param format The RDFFormat the RDF should be serialized into.
     * @param transformer The SesameTransformer for model conversions.
     * @param service The BNodeService for skolemization.
     * @return A skolemized String of the serialized grouped RDF from the Model.
     */
    public static String groupedModelToSkolemizedString(Model model, RDFFormat format, SesameTransformer transformer,
                                                        BNodeService service) {
        long start = System.currentTimeMillis();
        try {
            StringWriter sw = new StringWriter();
            RDFHandler rdfWriter = new BufferedGroupingRDFHandler(Rio.createWriter(format, sw));
            Rio.write(new SkolemizedStatementIterable(model, transformer, service), rdfWriter);
            return sw.toString();
        } finally {
            LOG.trace("groupedModelToSkolemizedString took {}ms", System.currentTimeMillis() - start);
        }
    }

    /**
     * Converts a {@link Model} into a skolemized string containing grouped RDF in the format specified by the passed
     * string.
     *
     * @param model  A {@link Model} of RDF to convert.
     * @param format The abbreviated name of a RDFFormat.
     * @param transformer The SesameTransformer for model conversions.
     * @param service The BNodeService for skolemization.
     * @return A skolemized String of the serialized grouped RDF from the Model.
     */
    public static String groupedModelToSkolemizedString(Model model, String format, SesameTransformer transformer,
                                                        BNodeService service) {
        return groupedModelToSkolemizedString(model, getRDFFormat(format), transformer, service);
    }

    /**
     * Converts a JSON-LD string into a {@link Model}.
     *
     * @param jsonld A string of JSON-LD.
     * @param transformer The SesameTransformer for model conversions.
     * @return A Model containing the RDF from the JSON-LD string.
     */
    public static Model jsonldToModel(String jsonld, SesameTransformer transformer) {
        try {
            return transformer.mobiModel(Rio.parse(IOUtils.toInputStream(jsonld), "", RDFFormat.JSONLD));
        } catch (Exception e) {
            throw ErrorUtils.sendError("Invalid JSON-LD", Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Converts a JSON-LD string into a deskolemized {@link Model}.
     *
     * @param jsonld      A string of JSON-LD.
     * @param transformer The SesameTransformer for model conversions.
     * @param service     The BNodeService for skolemization.
     * @return A deskolemized Model containing the RDF from the JSON-LD string.
     */
    public static Model jsonldToDeskolemizedModel(String jsonld, SesameTransformer transformer, BNodeService service) {
        return service.deskolemize(jsonldToModel(jsonld, transformer));
    }

    /**
     * Converts a {@link Model} into a JSON-LD string.
     *
     * @param model A {@link Model} containing RDF.
     * @param transformer The SesameTransformer for model conversions.
     * @return A JSON-LD string containing the converted RDF from the Model.
     */
    public static String modelToJsonld(Model model, SesameTransformer transformer) {
        return modelToString(model, "jsonld", transformer);
    }

    /**
     * Converts a {@link Model} into a skolemized JSON-LD string.
     *
     * @param model A {@link Model} containing RDF.
     * @param transformer The SesameTransformer for model conversions.
     * @return A skolemized JSON-LD string containing the converted RDF from the Model.
     */
    public static String modelToSkolemizedJsonld(Model model, SesameTransformer transformer, BNodeService service) {
        return modelToSkolemizedString(model, "jsonld", transformer, service);
    }

    /**
     * Returns the file extension for the specified RDFFormat. Currently supports Turtle, RDF/XML, OWL/XML, and JSON-LD.
     *
     * @param format The abbreviated name of a RDFFormat.
     * @return The default file extension for the requested format.
     */
    public static String getRDFFormatFileExtension(String format) {
        switch (format.toLowerCase()) {
            case "turtle":
                return RDFFormat.TURTLE.getDefaultFileExtension();
            case "rdf/xml":
                return RDFFormat.RDFXML.getDefaultFileExtension();
            case "owl/xml":
                return "owx";
            case "jsonld":
            default:
                return RDFFormat.JSONLD.getDefaultFileExtension();
        }
    }

    /**
     * Returns the MIME type for the specified RDFFormat. Currently supports Turtle, RDF/XML, OWL/XML, and JSON-LD.
     *
     * @param format The abbreviated name of a RDFFormat.
     * @return THe default MIME type for the requested format.
     */
    public static String getRDFFormatMimeType(String format) {
        switch (format.toLowerCase()) {
            case "turtle":
                return RDFFormat.TURTLE.getDefaultMIMEType();
            case "rdf/xml":
                return RDFFormat.RDFXML.getDefaultMIMEType();
            case "owl/xml":
                return "application/owl+xml";
            case "jsonld":
            default:
                return RDFFormat.JSONLD.getDefaultMIMEType();
        }
    }

    /**
     * Retrieves the User associated with a Request using the passed EngineManager. If the User cannot be found,
     * throws a 401 Response.
     *
     * @param context       The context of a Request.
     * @param engineManager The EngineManager to use when attempting to retrieve the User.
     * @return The User who made the Request if found; throws a 401 otherwise.
     */
    public static User getActiveUser(ContainerRequestContext context, EngineManager engineManager) {
        return engineManager.retrieveUser(getActiveUsername(context)).orElseThrow(() ->
                ErrorUtils.sendError("User not found", Response.Status.UNAUTHORIZED));
    }

    /**
     * Retrieves the username associated with a Request. If the username cannot be found, throws a 401 Response.
     *
     * @param context The context of a Request.
     * @return The username of the User who made the Request if found; throws a 401 otherwise.
     */
    public static String getActiveUsername(ContainerRequestContext context) {
        Object result = context.getProperty(AuthenticationProps.USERNAME);
        if (result == null) {
            throw ErrorUtils.sendError("Missing username", Response.Status.UNAUTHORIZED);
        } else {
            return result.toString();
        }
    }

    /**
     * Tests for the existence and value of a string, assumed to be from a REST parameter.
     *
     * @param param        The string parameter to check
     * @param errorMessage The error message to send if parameter is not set
     */
    public static void checkStringParam(@Nullable String param, String errorMessage) {
        if (StringUtils.isBlank(param)) {
            throw ErrorUtils.sendError(errorMessage, Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Retrieves a single Entity object from a JSON-LD string and returns it as a JSONObject. Looks within the first
     * context object if present.
     *
     * @param json A JSON-LD string
     * @return The first object representing a single Entity present in the JSON-LD array.
     */
    public static JSONObject getObjectFromJsonld(String json) {
        JSONArray array = JSONArray.fromObject(json);
        JSONObject firstObject = Optional.ofNullable(array.optJSONObject(0)).orElse(new JSONObject());
        if (firstObject.containsKey("@graph")) {
            firstObject = Optional.ofNullable(firstObject.getJSONArray("@graph").optJSONObject(0))
                    .orElse(new JSONObject());
        }
        return firstObject;
    }

    /**
     * Retrieves a single entity object, of the type specified, from a JSON-LD string and returns it as a
     * {@link JSONObject}.
     *
     * @param json A JSON-LD string
     * @param type The entity type that is required.
     * @return The first object representing the specified type of entity present in the JSON-LD.
     */
    public static JSONObject getTypedObjectFromJsonld(String json, String type) {
        long start = System.currentTimeMillis();
        try {
            List<JSONObject> objects = new ArrayList<>();
            JSONArray array = JSONArray.fromObject(json);

            array.forEach(o -> objects.add(JSONObject.fromObject(o)));

            for (JSONObject o : objects) {
                if (o.isArray()) {
                    o = getTypedObjectFromJsonld(o.toString(), type);
                } else if (o.containsKey("@graph")) {
                    o = getTypedObjectFromJsonld(JSONArray.fromObject(o.get("@graph")).toString(), type);
                }
                if (o != null && o.containsKey("@type") && JSONArray.fromObject(o.get("@type")).contains(type)) {
                    return o;
                }
            }
            return null;
        } finally {
            LOG.trace("getTypedObjectFromJsonld took {}ms", System.currentTimeMillis() - start);
        }
    }
}
