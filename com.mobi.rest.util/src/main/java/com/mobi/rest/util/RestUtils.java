package com.mobi.rest.util;

/*-
 * #%L
 * com.mobi.rest.util
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import static com.mobi.security.policy.api.xacml.XACML.POLICY_PERMIT_OVERRIDES;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.github.jsonldjava.core.JsonLdApi;
import com.github.jsonldjava.core.JsonLdOptions;
import com.github.jsonldjava.utils.JsonUtils;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.CompiledResourceManager;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.Modify;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.Models;
import com.mobi.persistence.utils.ParsedModel;
import com.mobi.persistence.utils.SkolemizedStatementIterable;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.rdf.orm.Thing;
import com.mobi.rest.util.jaxb.Links;
import com.mobi.security.policy.api.Decision;
import com.mobi.security.policy.api.PDP;
import com.mobi.security.policy.api.Request;
import com.mobi.web.security.util.AuthenticationProps;
import org.apache.commons.fileupload.FileItemIterator;
import org.apache.commons.fileupload.FileItemStream;
import org.apache.commons.fileupload.FileUploadException;
import org.apache.commons.fileupload.servlet.ServletFileUpload;
import org.apache.commons.fileupload.util.Streams;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.rdf4j.model.BNode;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.base.CoreDatatype;
import org.eclipse.rdf4j.model.impl.LinkedHashModel;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFHandler;
import org.eclipse.rdf4j.rio.RDFParser;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.helpers.BasicParserSettings;
import org.eclipse.rdf4j.rio.helpers.BufferedGroupingRDFHandler;
import org.eclipse.rdf4j.rio.helpers.ContextStatementCollector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.StringWriter;
import java.lang.management.GarbageCollectorMXBean;
import java.lang.management.ManagementFactory;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;
import javax.annotation.Nullable;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;

/**
 * A utility class for various actions and variables needed within the REST services.
 */
public class RestUtils {
    private static final Logger LOG = LoggerFactory.getLogger(RestUtils.class);
    private static final ObjectMapper mapper = new ObjectMapper();
    public static final String XLSX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    public static final String XLS_MIME_TYPE = "application/vnd.ms-excel";
    public static final String CSV_MIME_TYPE = "text/csv";
    public static final String TSV_MIME_TYPE = "text/tab-separated-values";
    public static final String JSON_MIME_TYPE = "application/json";
    public static final String TURTLE_MIME_TYPE = "text/turtle";
    public static final String LDJSON_MIME_TYPE = "application/ld+json";
    public static final String RDFXML_MIME_TYPE = "application/rdf+xml";
    private static final ValueFactory vf = new ValidatingValueFactory();

    /**
     * Returns the specified RDFFormat. Currently supports Turtle, TRiG, RDF/XML, and JSON-LD.
     *
     * @param format The abbreviated name of a RDFFormat.
     * @return A RDFFormat object with the requested format.
     */
    public static RDFFormat getRDFFormat(String format) {
        return switch (format.toLowerCase()) {
            case "turtle" -> RDFFormat.TURTLE;
            case "trig" -> RDFFormat.TRIG;
            case "rdf/xml" -> RDFFormat.RDFXML;
            default -> RDFFormat.JSONLD;
        };
    }

    /**
     * Returns the specified RDFFormat associated with the provided mimeType for Construct queries. Currently supports
     * text/turtle, application/rdf+xml, and application/ld+json.
     *
     * @param mimeType The mimeType to find the RDF Format for.
     * @return An RDFFormat object associated with the provided mimeType.
     */
    public static RDFFormat getRDFFormatForConstructQuery(String mimeType) {
        if (mimeType == null) { // any switch statement can't be null to prevent a NullPointerException
            return RDFFormat.JSONLD; // default value is JSON-LD
        }

        return switch (mimeType.toLowerCase()) {
            case TURTLE_MIME_TYPE -> RDFFormat.TURTLE;
            case RDFXML_MIME_TYPE -> RDFFormat.RDFXML;
            default -> RDFFormat.JSONLD;
        };
    }

    /**
     * Convert the file Extension to mime type.
     *
     * @param fileExtension fileExtension
     * @return String returns the mimeType for file extension, if null default is json
     */
    public static String convertFileExtensionToMimeType(String fileExtension) {
        if (fileExtension == null) { // any switch statement can't be null to prevent a NullPointerException
            fileExtension = "";
        }

        return switch (fileExtension) {
            case "xlsx" -> XLSX_MIME_TYPE;
            case "xls" -> XLS_MIME_TYPE;
            case "csv" -> CSV_MIME_TYPE;
            case "tsv" -> TSV_MIME_TYPE;
            case "ttl" -> TURTLE_MIME_TYPE;
            case "jsonld" -> LDJSON_MIME_TYPE;
            case "rdf" -> RDFXML_MIME_TYPE;
            default -> JSON_MIME_TYPE;
        };
    }

    /**
     * Converts a {@link Model} into a string containing RDF in the specified RDFFormat.
     *
     * @param model  A {@link Model} of RDF to convert.
     * @param format The RDFFormat the RDF should be serialized into.
     * @return A String of the serialized RDF from the Model.
     */
    public static String modelToString(Model model, RDFFormat format) {
        long start = System.currentTimeMillis();
        try {
            StringWriter sw = new StringWriter();
            Rio.write(model, sw, format);
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
     * @return A String of the serialized RDF from the Model.
     */
    public static String modelToString(Model model, String format) {
        return modelToString(model, getRDFFormat(format));
    }

    /**
     * Gets a {@link Model} of the provided {@link InputStream}. Deterministically skolemizes any BNode in the model.
     *
     * @param fileInputStream The {@link InputStream} to process.
     * @param fileExtension The extension of the file associated with the fileInputStream.
     * @param bNodesMap The {@link Map} of BNodes to their deterministically skolemized IRIs. Will be populated in
     *                  method.
     * @param modelFactory The {@link ModelFactory} used to create the model.
     * @param bNodeService The {@link BNodeService} used for skolemization.
     * @return A {@link Model} with deterministically skolemized BNodes.
     * @throws IOException When an error occurs processing the {@link InputStream}
     */
    public static Model getUploadedModel(InputStream fileInputStream, String fileExtension, Map<BNode, IRI> bNodesMap,
                                         ModelFactory modelFactory, BNodeService bNodeService)
            throws IOException {
        // Load uploaded ontology into a skolemized model
        ParsedModel parsedModel = Models.createSkolemizedModel(fileExtension, fileInputStream,
                modelFactory, bNodeService, bNodesMap);

        if ("trig".equalsIgnoreCase(parsedModel.getRdfFormatName())) {
            throw new IllegalArgumentException("TriG data is not supported for upload changes.");
        }

        return parsedModel.getModel();
    }

    /**
     * Gets a {@link Model} from the provided Record/Branch/Commit in the Catalog.
     * Deterministically skolemizes any
     * BNode in the model.
     *
     * @param recordId  The {@link Resource} of the recordId.
     * @param branchId  The {@link Resource} of the branchId.
     * @param commitId  The {@link Resource} of the commitId.
     * @param bNodesMap The {@link Map} of BNodes to their deterministically
     *                  skolemized IRIs. Will be populated in
     *                  method.
     * @param conn      A RepositoryConnection for lookup.
     * @return A {@link Model} with deterministically skolemized BNodes.
     */
    public static Model getCurrentModel(Resource recordId, Resource branchId, Resource commitId,
            Map<BNode, IRI> bNodesMap, RepositoryConnection conn, BNodeService bNodeService,
            CompiledResourceManager compiledResourceManager) {
        // Load existing ontology into a skolemized model
        return bNodeService.deterministicSkolemize(
                compiledResourceManager.getCompiledResource(recordId, branchId, commitId, conn), bNodesMap);
    }

    /**
     * Gets the Resource for the InProgressCommit associated with the provided User and the Record identified by the
     * provided Resource. If that User does not have an InProgressCommit, a new one will be created and that Resource
     * will be returned.
     *
     * @param user     the User with the InProgressCommit
     * @param recordId the Resource identifying the Record with the InProgressCommit
     * @param conn     A repository connection for lookup.
     * @param commitManager  The {@link CommitManager} instance for managing commits.
     * @param configProvider The {@link CatalogConfigProvider} instance for providing catalog configurations.
     * @return a Resource which identifies the InProgressCommit associated with the User for the Record
     */
    public static Resource getInProgressCommitIRI(User user, Resource recordId, RepositoryConnection conn,
            CommitManager commitManager, CatalogConfigProvider configProvider) {
        Optional<InProgressCommit> optional = commitManager.getInProgressCommitOpt(configProvider.getLocalCatalogIRI(),
                recordId, user, conn);
        if (optional.isPresent()) {
            return optional.get().getResource();
        } else {
            InProgressCommit inProgressCommit = commitManager.createInProgressCommit(user);
            commitManager.addInProgressCommit(configProvider.getLocalCatalogIRI(), recordId, inProgressCommit, conn);
            return inProgressCommit.getResource();
        }
    }

    /**
     * Calculates the garbage collection time in milliseconds.
     *
     * @return The total garbage collection time.
     */
    public static long getGarbageCollectionTime() {
        long collectionTime = 0;
        for (GarbageCollectorMXBean garbageCollectorMXBean : ManagementFactory.getGarbageCollectorMXBeans()) {
            collectionTime += garbageCollectorMXBean.getCollectionTime();
        }
        return collectionTime;
    }

    /**
     * Converts a {@link Model} into a skolemized string containing RDF in the specified RDFFormat.
     *
     * @param model   A {@link Model} of RDF to convert.
     * @param format  The RDFFormat the RDF should be serialized into.
     * @param service The BNodeService for skolemization.
     * @return A skolemized String of the serialized RDF from the Model.
     */
    public static String modelToSkolemizedString(Model model, RDFFormat format, BNodeService service) {
        long start = System.currentTimeMillis();
        try {
            StringWriter sw = new StringWriter();
            Rio.write(new SkolemizedStatementIterable(model, service), sw, format);
            return sw.toString();
        } finally {
            LOG.trace("modelToSkolemizedString took {}ms", System.currentTimeMillis() - start);
        }
    }

    /**
     * Converts a {@link Model} into a skolemized string containing RDF in the format specified by the passed string.
     *
     * @param model   A {@link Model} of RDF to convert.
     * @param format  The abbreviated name of a RDFFormat.
     * @param service The BNodeService for skolemization.
     * @return A skolemized String of the serialized RDF from the Model.
     */
    public static String modelToSkolemizedString(Model model, String format, BNodeService service) {
        return modelToSkolemizedString(model, getRDFFormat(format), service);
    }

    /**
     * Writes a {@link Model} to an output stream.
     *
     * @param model  A {@link Model} of RDF to convert.
     * @param format The RDFFormat the RDF should be serialized into
     * @param os     The output stream the model should be written to.
     */
    public static void groupedModelToOutputStream(Model model, RDFFormat format, OutputStream os) {
        RDFHandler handler = new BufferedGroupingRDFHandler(Rio.createWriter(format, os));
        Rio.write(model, handler);
    }

    /**
     * Converts a {@link Model} into a string containing grouped RDF in the specified RDFFormat.
     *
     * @param model  A {@link Model} of RDF to convert.
     * @param format The RDFFormat the RDF should be serialized into.
     * @return A String of the serialized grouped RDF from the Model.
     */
    public static String groupedModelToString(Model model, RDFFormat format) {
        long start = System.currentTimeMillis();
        try {
            StringWriter sw = new StringWriter();
            RDFHandler rdfWriter = new BufferedGroupingRDFHandler(Rio.createWriter(format, sw));
            Rio.write(model, rdfWriter);
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
     * @return A String of the serialized grouped RDF from the Model.
     */
    public static String groupedModelToString(Model model, String format) {
        return groupedModelToString(model, getRDFFormat(format));
    }

    /**
     * Converts a {@link Model} into a skolemized string containing grouped RDF in the specified RDFFormat.
     *
     * @param model   A {@link Model} of RDF to convert.
     * @param format  The RDFFormat the RDF should be serialized into.
     * @param service The BNodeService for skolemization.
     * @return A skolemized String of the serialized grouped RDF from the Model.
     */
    public static String groupedModelToSkolemizedString(Model model, RDFFormat format, BNodeService service) {
        long start = System.currentTimeMillis();
        try {
            StringWriter sw = new StringWriter();
            RDFHandler rdfWriter = new BufferedGroupingRDFHandler(Rio.createWriter(format, sw));
            Rio.write(new SkolemizedStatementIterable(model, service), rdfWriter);
            return sw.toString();
        } finally {
            LOG.trace("groupedModelToSkolemizedString took {}ms", System.currentTimeMillis() - start);
        }
    }

    /**
     * Converts a {@link Model} into a skolemized string containing grouped RDF in the format specified by the passed
     * string.
     *
     * @param model   A {@link Model} of RDF to convert.
     * @param format  The abbreviated name of a RDFFormat.
     * @param service The BNodeService for skolemization.
     * @return A skolemized String of the serialized grouped RDF from the Model.
     */
    public static String groupedModelToSkolemizedString(Model model, String format, BNodeService service) {
        return groupedModelToSkolemizedString(model, getRDFFormat(format), service);
    }

    public static class ValidatingStatementCollector extends ContextStatementCollector {

        public ValidatingStatementCollector() {
            super(vf);
        }

        public ValidatingStatementCollector(Collection<Statement> statements) {
            super(statements, vf);
        }

        public ValidatingStatementCollector(Collection<Statement> statements, Map<String, String> namespaces) {
            super(statements, namespaces, vf);
        }
    }

    /**
     * Converts a JSON-LD string into a {@link Model}.
     *
     * @param jsonld A string of JSON-LD.
     * @return A Model containing the RDF from the JSON-LD string.
     */
    public static Model jsonldToModel(String jsonld) {
        long start = System.currentTimeMillis();
        try {
            Model model = new LinkedHashModel();
            RDFParser rdfParser = Rio.createParser(RDFFormat.JSONLD);
            rdfParser.setValueFactory(vf);
            rdfParser.setRDFHandler(new ValidatingStatementCollector(model));

            rdfParser.getParserConfig().set(BasicParserSettings.PRESERVE_BNODE_IDS, true);
            rdfParser.parse(IOUtils.toInputStream(jsonld, StandardCharsets.UTF_8));

            JsonLdApi api = new JsonLdApi(JsonUtils.fromString(jsonld), new JsonLdOptions());
            api.toRDF();
            Map<String, String> map = api.getBlankNodeIdentifierMap();

            Map<String, String> inversedMap = map.entrySet()
                    .stream()
                    .collect(Collectors.toMap(Map.Entry::getValue, Map.Entry::getKey));
            Model updatedModel = new LinkedHashModel();
            model.forEach(statement -> {
                Resource sub = statement.getSubject();
                IRI pred = statement.getPredicate();
                Value obj = statement.getObject();
                Resource cont = statement.getContext();

                if (sub instanceof BNode) {
                    BNode bNode = (BNode) sub;
                    String bNodeVal = "_:" + bNode.stringValue();
                    if (inversedMap.containsKey(bNodeVal)) {
                        sub = vf.createBNode(inversedMap.get(bNodeVal).replace("_:", ""));
                    }
                }
                if (obj instanceof BNode) {
                    BNode bNode = (BNode) obj;
                    String bNodeVal = "_:" + bNode.stringValue();
                    if (inversedMap.containsKey(bNodeVal)) {
                        obj = vf.createBNode(inversedMap.get(bNodeVal).replace("_:", ""));
                    }
                }
                updatedModel.add(sub, pred, obj, cont);
            });
            return updatedModel;
        } catch (Exception e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.BAD_REQUEST);
        } finally {
            LOG.trace("jsonldToModel took {}ms", System.currentTimeMillis() - start);
        }
    }

    /**
     * Converts a JSON-LD string into a deskolemized {@link Model}.
     *
     * @param jsonld  A string of JSON-LD.
     * @param service The BNodeService for skolemization.
     * @return A deskolemized Model containing the RDF from the JSON-LD string.
     */
    public static Model jsonldToDeskolemizedModel(String jsonld, BNodeService service) {
        return service.deskolemize(jsonldToModel(jsonld));
    }

    /**
     * Converts a {@link Model} into a JSON-LD string.
     *
     * @param model A {@link Model} containing RDF.
     * @return A JSON-LD string containing the converted RDF from the Model.
     */
    public static String modelToJsonld(Model model) {
        return modelToString(model, "jsonld");
    }

    /**
     * Converts a {@link Model} into a skolemized JSON-LD string.
     *
     * @param model A {@link Model} containing RDF.
     * @return A skolemized JSON-LD string containing the converted RDF from the Model.
     */
    public static String modelToSkolemizedJsonld(Model model, BNodeService service) {
        return modelToSkolemizedString(model, "jsonld", service);
    }

    /**
     * Converts a {@link Model} into a TRiG string.
     *
     * @param model A {@link Model} containing RDF.
     * @return A TRiG string containing the converted RDF from the Model.
     */
    public static String modelToTrig(Model model) {
        return modelToString(model, "trig");
    }

    /**
     * Returns the file extension for the specified RDFFormat. Currently supports Turtle, RDF/XML, OWL/XML, and JSON-LD.
     *
     * @param format The abbreviated name of a RDFFormat.
     * @return The default file extension for the requested format.
     */
    public static String getRDFFormatFileExtension(String format) {
        return switch (format.toLowerCase()) {
            case "turtle" -> RDFFormat.TURTLE.getDefaultFileExtension();
            case "rdf/xml" -> RDFFormat.RDFXML.getDefaultFileExtension();
            case "trig" -> RDFFormat.TRIG.getDefaultFileExtension();
            case "owl/xml" -> "owx";
            default -> RDFFormat.JSONLD.getDefaultFileExtension();
        };
    }

    /**
     * Returns the MIME type for the specified RDFFormat. Currently supports Turtle, RDF/XML, OWL/XML, and JSON-LD.
     *
     * @param format The abbreviated name of a RDFFormat.
     * @return The default MIME type for the requested format.
     */
    public static String getRDFFormatMimeType(String format) {
        return switch (format.toLowerCase()) {
            case "turtle" -> RDFFormat.TURTLE.getDefaultMIMEType();
            case "rdf/xml" -> RDFFormat.RDFXML.getDefaultMIMEType();
            case "trig" -> RDFFormat.TRIG.getDefaultMIMEType();
            case "owl/xml" -> "application/owl+xml";
            default -> RDFFormat.JSONLD.getDefaultMIMEType();
        };
    }

    /**
     * Retrieves the User associated with a Request using the passed EngineManager. If the User cannot be found, throws
     * a 401 Response.
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
     * Retrieves the User associated with a Request using the passed EngineManager. If the User cannot be found, throws
     * a 401 Response.
     *
     * @param servletRequest The servletRequest of a Request.
     * @param engineManager  The EngineManager to use when attempting to retrieve the User.
     * @return The User who made the Request if found; throws a 401 otherwise.
     */
    public static User getActiveUser(HttpServletRequest servletRequest, EngineManager engineManager) {
        return engineManager.retrieveUser(getActiveUsername(servletRequest)).orElseThrow(() ->
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
     * Retrieves the username associated with a Request. If the username cannot be found, throws a 401 Response.
     *
     * @param servletRequest The servletRequest of a Request.
     * @return The username of the User who made the Request if found; throws a 401 otherwise.
     */
    public static String getActiveUsername(HttpServletRequest servletRequest) {
        Object result = servletRequest.getAttribute(AuthenticationProps.USERNAME);
        if (result == null) {
            throw ErrorUtils.sendError("Missing username", Response.Status.UNAUTHORIZED);
        } else {
            return result.toString();
        }
    }

    /**
     * Retrieves the User associated with a Request using the passed EngineManager. If the User cannot be found, returns
     * an empty Optional.
     *
     * @param servletRequest The servletRequest of a Request.
     * @param engineManager  The EngineManager to use when attempting to retrieve the User.
     * @return An Optional containing the User who made the Request if found; otherwise empty
     */
    public static Optional<User> optActiveUser(HttpServletRequest servletRequest, EngineManager engineManager) {
        return optActiveUsername(servletRequest).flatMap(engineManager::retrieveUser);
    }

    /**
     * Retrieves the User associated with a Request using the passed EngineManager. If the User cannot be found, returns
     * an empty Optional.
     *
     * @param context       The context of a Request.
     * @param engineManager The EngineManager to use when attempting to retrieve the User.
     * @return An Optional containing the User who made the Request if found; otherwise empty
     */
    public static Optional<User> optActiveUser(ContainerRequestContext context, EngineManager engineManager) {
        return optActiveUsername(context).flatMap(engineManager::retrieveUser);
    }

    /**
     * Retrieves the username associated with a Request. If the username cannot be found, returns an empty Optional.
     *
     * @param servletRequest The servletRequest of a Request.
     * @return An Optional with the username associated with the Request if found; otherwise empty
     */
    public static Optional<String> optActiveUsername(HttpServletRequest servletRequest) {
        return Optional.ofNullable(servletRequest.getAttribute(AuthenticationProps.USERNAME)).map(Object::toString);
    }

    /**
     * Retrieves the username associated with a Request. If the username cannot be found, returns an empty Optional.
     *
     * @param context The context of a Request.
     * @return An Optional with the username associated with the Request if found; otherwise empty
     */
    public static Optional<String> optActiveUsername(ContainerRequestContext context) {
        return Optional.ofNullable(context.getProperty(AuthenticationProps.USERNAME)).map(Object::toString);
    }

    /**
     * Tests for the existence and value of a string, assumed to be from a REST parameter.
     *
     * @param param        The string parameter to check
     * @param errorMessage The error message to send if parameter is not set
     */
    public static void checkStringParam(@Nullable String param, String errorMessage) {
        if (StringUtils.isBlank(param)) {
            throw RestUtils.getErrorObjBadRequest(new IllegalArgumentException(errorMessage));
        }
    }

    /**
     * Retrieves a single Entity object from a JSON-LD string and returns it as a ObjectNode. Looks within the first
     * context object if present.
     *
     * @param json A JSON-LD string
     * @return The first object representing a single Entity present in the JSON-LD array.
     */
    public static ObjectNode getObjectFromJsonld(String json) {
        JsonNode jsonNode;
        try {
            jsonNode = mapper.readTree(json);
        } catch (IOException e) {
            throw new MobiException(e);
        }
        JsonNode firstObject = jsonNode.get(0);
        if (firstObject == null) {
            return mapper.createObjectNode();
        } else if (firstObject.has("@graph")) {
            firstObject = firstObject.get("@graph").get(0);
            if (firstObject == null) {
                return mapper.createObjectNode();
            }
        }
        return (ObjectNode) firstObject;
    }

    /**
     * Creates an {@link ArrayNode} from a String containing JSON.
     *
     * @param json A String containing JSON
     * @return An ArrayNode of the parsed JSON
     */
    public static ArrayNode getArrayNodeFromJson(String json) {
        try {
            return mapper.readValue(json, ArrayNode.class);
        } catch (JsonProcessingException e) {
            throw new MobiException(e);
        }
    }

    /**
     * Creates an {@link ObjectNode} from a String containing JSON.
     *
     * @param json A String containing JSON
     * @return An ObjectNode of the parsed JSON
     */
    public static ObjectNode getObjectNodeFromJson(String json) {
        try {
            return mapper.readValue(json, ObjectNode.class);
        } catch (JsonProcessingException e) {
            throw new MobiException(e);
        }
    }

    public static boolean arrayContains(ArrayNode array, String value) {
        Stream<JsonNode> nodeStream = StreamSupport.stream(array.spliterator(), false);
        return nodeStream.anyMatch(node -> node.asText().equals(value));
    }

    /**
     * Retrieves a single entity object, of the type specified, from a JSON-LD string and returns it as a
     * {@link JsonNode}.
     *
     * @param json A JSON-LD string
     * @param type The entity type that is required.
     * @return The first object representing the specified type of entity present in the JSON-LD.
     */
    public static JsonNode getTypedObjectFromJsonld(String json, String type) {
        long start = System.currentTimeMillis();
        JsonNode arrayNode;
        try {
            arrayNode = mapper.readTree(json);

            for (JsonNode o : arrayNode) {
                if (o.isArray()) {
                    o = getTypedObjectFromJsonld(o.toString(), type);
                } else if (o.has("@graph")) {
                    o = getTypedObjectFromJsonld(o.get("@graph").toString(), type);
                }
                if (o != null && o.has("@type")
                        && mapper.convertValue(o.get("@type"), ArrayList.class).contains(type)) {
                    return o;
                }
            }
            return null;
        } catch (IOException e) {
            throw new MobiException(e);
        } finally {
            LOG.trace("getTypedObjectFromJsonld took {}ms", System.currentTimeMillis() - start);
        }
    }

    /**
     * Creates an {@link IRI} with the provided {@code requestId}.
     *
     * @param requestId The {@link String} representation of an IRI
     * @param vf        The {@link ValueFactory} used to create an IRI
     * @return An object representing the IRI; throws a 400 if the {@code requestId} is invalid
     */
    public static IRI createIRI(String requestId, ValueFactory vf) {
        try {
            return vf.createIRI(requestId);
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Converts a Thing into a JsonNode by the first object of a specific type in the JSON-LD serialization of the
     * Thing's Model.
     *
     * @param thing The Thing to convert into a JsonNode.
     * @param type  The type of the {@link Thing} passed in.
     * @return The JsonNode with the JSON-LD of the Thing entity from its Model.
     */
    public static JsonNode thingToObjectNode(Thing thing, String type) {
        return getTypedObjectFromJsonld(modelToString(thing.getModel(), RDFFormat.JSONLD), type);
    }

    /**
     * Converts a Thing into a skolemized JsonNode by the first object of a specific type in the JSON-LD serialization
     * of the Thing's Model.
     *
     * @param thing        The Thing to convert into a JsonNode.
     * @param type         The type of the {@link Thing} passed in.
     * @param bNodeService The {@link BNodeService} to use.
     * @return The JsonNode with the JSON-LD of the Thing entity from its Model.
     */
    public static JsonNode thingToSkolemizedObjectNode(Thing thing, String type, BNodeService bNodeService) {
        return getTypedObjectFromJsonld(
                modelToSkolemizedString(thing.getModel(), RDFFormat.JSONLD, bNodeService), type);
    }

    /**
     * Creates a {@link Response} for a page of a sorted limited offset {@link Set} of {@link Thing}s based on the
     * return type of the passed function using the passed full {@link Set} of
     * {@link org.eclipse.rdf4j.model.Resource}s.
     *
     * @param <T>            A class that extends {@link Thing}.
     * @param uriInfo        The URI information of the request.
     * @param things         The {@link Set} of {@link Thing}s.
     * @param sortIRI        The property {@link IRI} to sort the {@link Set} of {@link Thing}s by.
     * @param offset         The number of {@link Thing}s to skip.
     * @param limit          The size of the page of {@link Thing}s to the return.
     * @param asc            Whether the sorting should be ascending or descending.
     * @param filterFunction A {@link Function} to filter the {@link Set} of {@link Thing}s.
     * @param type           The type of the {@link Thing} to be returned
     * @param bNodeService   The {@link BNodeService} to use.
     * @return A {@link Response} with a page of {@link Thing}s that has been filtered, sorted, and limited and headers
     *      for the total size and links to the next and prev pages if present.
     */
    public static <T extends Thing> Response createPaginatedThingResponse(UriInfo uriInfo, Set<T> things,
                                                                                 IRI sortIRI, int offset, int limit,
                                                                                 boolean asc,
                                                                                 Function<T, Boolean> filterFunction,
                                                                                 String type,
                                                                                 BNodeService bNodeService) {
        long start = System.currentTimeMillis();
        try {
            if (offset > things.size()) {
                throw ErrorUtils.sendError("Offset exceeds total size", Response.Status.BAD_REQUEST);
            }
            Comparator<T> comparator = Comparator.comparing(dist -> dist.getProperty(sortIRI)
                    .orElse(vf.createLiteral("")).stringValue());

            Stream<T> stream = things.stream();

            if (!asc) {
                comparator = comparator.reversed();
            }

            if (filterFunction != null) {
                stream = stream.filter(filterFunction::apply);
            }

            List<T> filteredThings = stream.toList();
            List<T> result = filteredThings.stream()
                    .sorted(comparator)
                    .skip(offset)
                    .limit(limit)
                    .collect(Collectors.toList());

            return createPaginatedResponse(uriInfo, result, filteredThings.size(), limit, offset, type,
                    bNodeService);
        } finally {
            LOG.trace("createPaginatedThingResponse took {}ms", System.currentTimeMillis() - start);
        }
    }

    /**
     * Creates a Response for a list of paginated Things based on the passed URI information, page of items, the total
     * number of Things, the limit for each page, and the offset for the current page. Sets the "X-Total-Count" header
     * to the total size and the "Links" header to the next and prev URLs if present.
     *
     * @param <T>       A class that extends Thing
     * @param uriInfo   The URI information of the request.
     * @param items     The limited and sorted Collection of items for the current page
     * @param totalSize The total number of items.
     * @param limit     The limit for each page.
     * @param offset    The offset for the current page.
     * @param type      The type of the {@link Thing} to be returned
     * @return A Response with the current page of Things and headers for the total size and links to the next and prev
     *      pages if present.
     */
    public static <T extends Thing> Response createPaginatedResponse(UriInfo uriInfo, Collection<T> items,
                                                                     int totalSize, int limit, int offset,
                                                                     String type) {
        return createPaginatedResponse(uriInfo, items, totalSize, limit, offset, type, null);
    }

    /**
     * Creates a Response for a list of paginated Things based on the passed URI information, page of items, the total
     * number of Things, the limit for each page, and the offset for the current page. Sets the "X-Total-Count" header
     * to the total size and the "Links" header to the next and prev URLs if present.
     *
     * @param <T>          A class that extends Thing
     * @param uriInfo      The URI information of the request.
     * @param items        The limited and sorted Collection of items for the current page
     * @param totalSize    The total number of items.
     * @param limit        The limit for each page.
     * @param offset       The offset for the current page.
     * @param type         The type of the {@link Thing} to be returned
     * @param bNodeService The {@link BNodeService} to use.
     * @return A Response with the current page of Things and headers for the total size and links to the next and prev
     *      pages if present.
     */
    public static <T extends Thing> Response createPaginatedResponse(UriInfo uriInfo, Collection<T> items,
                                                                            int totalSize, int limit,
                                                                            int offset, String type,
                                                                            BNodeService bNodeService) {
        ArrayNode results;
        long start = System.currentTimeMillis();

        try {
            if (bNodeService == null) {
                results = mapper.valueToTree(items.stream()
                        .map(thing -> thingToObjectNode(thing, type))
                        .collect(Collectors.toList()));
            } else {
                results = mapper.valueToTree(items.stream()
                        .map(thing -> thingToSkolemizedObjectNode(thing, type, bNodeService))
                        .collect(Collectors.toList()));
            }
            return createPaginatedResponse(uriInfo, results, totalSize, limit, offset);
        } finally {
            LOG.trace("createPaginatedResponse took {}ms", System.currentTimeMillis() - start);
        }
    }

    /**
     * Creates a Response for a list of paginated Things based on the passed URI information, page of items, the total
     * number of Things, the limit for each page, and the offset for the current page. Sets the "X-Total-Count" header
     * to the total size and the "Links" header to the next and prev URLs if present.
     *
     * @param uriInfo   The URI information of the request.
     * @param items     The limited and sorted Collection of items for the current page
     * @param totalSize The total number of items.
     * @param limit     The limit for each page.
     * @param offset    The offset for the current page.
     * @return A Response with the current page of Things and headers for the total size and links to the next and prev
     *      pages if present.
     */
    public static Response createPaginatedResponse(UriInfo uriInfo, ArrayNode items, int totalSize, int limit,
                                                   int offset) {
        long start = System.currentTimeMillis();
        try {
            LinksUtils.validateParams(limit, offset);
            Links links = LinksUtils.buildLinks(uriInfo, items.size(), totalSize, limit, offset);
            Response.ResponseBuilder response = Response.ok(items.toString()).header("X-Total-Count", totalSize);
            if (links.getNext() != null) {
                response = response.link(links.getBase() + links.getNext(), "next");
            }
            if (links.getPrev() != null) {
                response = response.link(links.getBase() + links.getPrev(), "prev");
            }
            return response.build();
        } finally {
            LOG.trace("createPaginatedResponseWithJson took {}ms", System.currentTimeMillis() - start);
        }
    }

    /**
     * Validates the sort property IRI, offset, and limit parameters for pagination. The sort IRI string must be a valid
     * sort property. The offset must be greater than or equal to 0. The limit must be postitive. If any parameters are
     * invalid, throws a 400 Response.
     *
     * @param sortIRI The sort property string to test.
     * @param offset  The offset for the paginated response.
     * @param limit   The limit of the paginated response.
     */
    public static void validatePaginationParams(String sortIRI, Set<String> sortResources, int limit, int offset) {
        if (sortIRI != null && !sortResources.contains(sortIRI)) {
            throw ErrorUtils.sendError("Invalid sort property IRI", Response.Status.BAD_REQUEST);
        }
        LinksUtils.validateParams(limit, offset);
    }

    /**
     * Creates a JSON error object containing the error message.
     *
     * @param throwable The {@link Throwable} to create a JSON error object from.
     * @return A {@link ObjectNode} JSON object.
     */
    public static ObjectNode createJsonErrorObject(Throwable throwable) {
        return createJsonErrorObject(throwable, null);
    }

    /**
     * Creates a JSON error object containing the error message and a list of the error details.
     *
     * @param throwable The {@link Throwable} to create a JSON error object from.
     * @param delimiter A String delimiter used to separate the error details
     * @return A {@link ObjectNode} JSON object.
     */
    public static ObjectNode createJsonErrorObject(Throwable throwable, String delimiter) {
        ObjectNode objectNode = mapper.createObjectNode();
        ArrayNode arrayNode = mapper.createArrayNode();
        objectNode.put("error", throwable.getClass().getSimpleName());

        String errorMessage = throwable.getMessage();

        if (delimiter == null) {
            objectNode.put("errorMessage", errorMessage);
        } else if (errorMessage != null && errorMessage.contains(delimiter)) {
            String[] errorMessages = errorMessage.split(delimiter);
            objectNode.put("errorMessage", errorMessages[0].trim());

            String[] errorMessagesSlice = Arrays.copyOfRange(errorMessages, 1, errorMessages.length);

            for (String currentErrorMessage : errorMessagesSlice) {
                arrayNode.add(currentErrorMessage.trim());
            }
        } else {
            objectNode.put("errorMessage", errorMessage);
        }

        objectNode.set("errorDetails", arrayNode);

        return objectNode;
    }

    /**
     * Creates a {@link MobiWebException} containing a 400 response with the error message and error details provided
     * in the body of the response.
     *
     * @param throwable The {@link Throwable} to create a JSON error object from.
     * @return A {@link MobiWebException} of a 400 with error information in the body.
     */
    public static MobiWebException getErrorObjBadRequest(Throwable throwable) {
        ObjectNode objectNode = createJsonErrorObject(throwable, Models.ERROR_OBJECT_DELIMITER);
        Response response = Response
                .status(Response.Status.BAD_REQUEST)
                .type(MediaType.APPLICATION_JSON_TYPE)
                .entity(objectNode.toString())
                .build();
        return ErrorUtils.sendError(throwable, throwable.getMessage(), response);
    }

    /**
     * Creates a {@link MobiWebException} containing a 401 response with the error message and error details provided
     * in the body of the response.
     *
     * @param throwable The {@link Throwable} to create a JSON error object from.
     * @return A {@link MobiWebException} of a 401 with error information in the body.
     */
    public static MobiWebException getErrorObjUnauthorized(Throwable throwable) {
        ObjectNode objectNode = createJsonErrorObject(throwable, Models.ERROR_OBJECT_DELIMITER);
        Response response = Response
                .status(Response.Status.UNAUTHORIZED)
                .type(MediaType.APPLICATION_JSON_TYPE)
                .entity(objectNode.toString())
                .build();
        return ErrorUtils.sendError(throwable, throwable.getMessage(), response);
    }

    /**
     * Creates a {@link MobiWebException} containing a 404 response with the error message and error details provided
     * in the body of the response.
     *
     * @param throwable The {@link Throwable} to create a JSON error object from.
     * @return A {@link MobiWebException} of a 404 with error information in the body.
     */
    public static MobiWebException getErrorObjNotFound(Throwable throwable) {
        ObjectNode objectNode = createJsonErrorObject(throwable, Models.ERROR_OBJECT_DELIMITER);
        Response response = Response
                .status(Response.Status.NOT_FOUND)
                .type(MediaType.APPLICATION_JSON_TYPE)
                .entity(objectNode.toString())
                .build();
        return ErrorUtils.sendError(throwable, throwable.getMessage(), response);
    }

    /**
     * Creates a {@link MobiWebException} containing a 500 response with the error message provided in the body of the
     * response.
     *
     * @param throwable The {@link Throwable} to create a JSON error object from.
     * @return A {@link MobiWebException} of a 500 with error information in the body.
     */
    public static MobiWebException getErrorObjInternalServerError(Throwable throwable) {
        ObjectNode objectNode = createJsonErrorObject(throwable, Models.ERROR_OBJECT_DELIMITER);
        return getErrorObjInternalServerError(throwable, objectNode);
    }

    /**
     * Creates a {@link MobiWebException} containing a 500 response with the error message provided in the body of the
     * response.
     *
     * @param throwable The {@link Throwable} to create a JSON error object from.
     * @param overrideObjectNode The {@link ObjectNode} entity error object node
     * @return A {@link MobiWebException} of a 500 with error information in the body.
     */
    public static MobiWebException getErrorObjInternalServerError(Throwable throwable, ObjectNode overrideObjectNode) {
        Response response = Response
                .status(Response.Status.INTERNAL_SERVER_ERROR)
                .type(MediaType.APPLICATION_JSON_TYPE)
                .entity(overrideObjectNode.toString())
                .build();
        return ErrorUtils.sendError(throwable, throwable.getMessage(), response);
    }

    /**
     * Retrieves the multipart/form-data containing file information from the provided {@link HttpServletRequest}.
     * Uses the provided map to determine the form data fields. The key in the fields map represents the field name to
     * populate in the return map. The value in the fields map is a list containing the Class of the field. If more than
     * one class is present in the list, the first will be used as the Collection and the second as the parameterized
     * type for the Collection.
     *
     * @param servletRequest The {@link HttpServletRequest} used to retrieve form data from.
     * @param fields         A {@link Map} of field name to the Class of the field.
     * @return A map of the field name to the corresponding form data field Object.
     */
    public static Map<String, Object> getFormData(HttpServletRequest servletRequest,
                                                  Map<String, List<Class<?>>> fields) {
        try {
            Map<String, Object> parsedValues = new HashMap<>();
            Set<String> fieldNames = fields.keySet();
            ServletFileUpload upload = new ServletFileUpload();
            FileItemIterator iter = upload.getItemIterator(servletRequest);
            while (iter.hasNext()) {
                FileItemStream item = iter.next();
                String name = item.getFieldName();
                try (InputStream stream = item.openStream()) {
                    if (item.isFormField()) {
                        if (fieldNames.contains(name)) {
                            List<Class<?>> classes = fields.get(name);
                            if (classes.size() > 1) {
                                // Is a Collection of Type
                                Class<?> collectionClass = classes.get(0);
                                Class<?> typeClass = classes.get(1);
                                if (!parsedValues.containsKey(name)) {
                                    if (collectionClass == Set.class) {
                                        parsedValues.put(name, new HashSet<>());
                                    } else if (collectionClass == List.class) {
                                        parsedValues.put(name, new ArrayList<>());
                                    } else {
                                        throw new MobiException("Invalid parent class type. Must provide collection.");
                                    }
                                }
                                Collection<Object> collection = (Collection<Object>) parsedValues.get(name);
                                collection.add(getValue(typeClass, stream));
                                parsedValues.put(name, collection);
                            } else {
                                // Is a single type
                                Object value = getValue(classes.get(0), stream);
                                parsedValues.put(name, value);
                            }
                        } else {
                            LOG.debug("Non default field '{}' provided.", name);
                        }
                    } else {
                        // This is the file stream
                        parsedValues.put(item.getFieldName(),
                                new FileUpload(item.getName(), Models.toByteArrayInputStream(stream)));
                    }
                }
            }
            return parsedValues;
        } catch (FileUploadException | IOException e) {
            throw new IllegalStateException("Error parsing form data", e);
        }
    }

    private static Object getValue(Class<?> clazz, InputStream stream) throws IOException {
        try {
            if (clazz == String.class) {
                return Streams.asString(stream);
            }
            if (clazz == Integer.class) {
                return Integer.parseInt(Streams.asString(stream));
            }
            if (clazz == Boolean.class) {
                return Boolean.parseBoolean(Streams.asString(stream));
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("Could not parse field for type " + clazz, e);
        }
        throw new IllegalArgumentException("Field must be a String/Integer/Boolean");
    }

    /**
     * Determines whether the User with the passed username is an admin.
     *
     * @param username The username of a User
     * @return true if the identified User is an admin; false otherwise
     */
    public static boolean isAdminUser(String username, EngineManager engineManager) {
        return engineManager.getUserRoles(username).stream()
                .map(Thing::getResource)
                .anyMatch(resource -> resource.stringValue().contains("admin"));
    }

    /**
     * Executes an XACML request to determine with the {@link com.mobi.catalog.api.ontologies.mcat.Branch} with the
     * provided IRI from the {@link VersionedRDFRecord} with the provided IRI can be modified by the provided
     * {@link User}.
     *
     * @param user The {@link User} attempting to execute the Modify action
     * @param branchId The IRI string of the Branch in question
     * @param recordIRI The IRI string of the parent VersionedRDFRecord for the Branch
     * @param pdp The PDP service to use to execute the request
     * @return The `{@link Decision} from the XACML request
     */
    public static Decision isBranchModifiable(User user, IRI branchId, IRI recordIRI, PDP pdp) {
        IRI subjectId = (IRI) user.getResource();
        IRI actionId = vf.createIRI(Modify.TYPE);
        Map<String, Literal> attributes = new HashMap<>();
        attributes.put(VersionedRDFRecord.branch_IRI, vf.createLiteral(branchId.stringValue()));
        Request request = pdp.createRequest(Collections.singletonList(subjectId), new HashMap<>(),
                Collections.singletonList(recordIRI), new HashMap<>(), Collections.singletonList(actionId), attributes);

        com.mobi.security.policy.api.Response response = pdp.evaluate(request,
                vf.createIRI(POLICY_PERMIT_OVERRIDES));

        return response.getDecision();
    }

    /**
     * Converts a tuple query ResultSet into List of ObjectNodes which have properties for each specified binding.
     * Converts literal bindings into the appropriate data types and IRIs into strings.
     *
     * @param result The query results to turn into a list of object nodes
     * @param displayBindings The specific query bindings that should be included in the generated ObjectNodes
     * @return List of ObjectNodes
     */
    public static List<ObjectNode> convertToObjectNodes(TupleQueryResult result, Collection<String> displayBindings) {
        List<ObjectNode> records = new ArrayList<>();
        result.forEach(bindings -> {
            ObjectNode recordObjectNode = mapper.createObjectNode();
            for (String key: displayBindings) {
                Value value = bindings.getValue(key);
                if (value == null) {
                    recordObjectNode.set(key, null);
                } else if (value.isLiteral()) {
                    Literal literal = (Literal) value;
                    if (literal.getDatatype().equals(CoreDatatype.XSD.BOOLEAN.getIri())) {
                        recordObjectNode.put(key, literal.booleanValue());
                    } else if (literal.getDatatype().equals(CoreDatatype.XSD.FLOAT.getIri())) {
                        recordObjectNode.put(key, literal.floatValue());
                    } else if (literal.getDatatype().equals(CoreDatatype.XSD.DOUBLE.getIri())) {
                        recordObjectNode.put(key, literal.doubleValue());
                    } else if (literal.getDatatype().equals(CoreDatatype.XSD.DECIMAL.getIri())) {
                        recordObjectNode.put(key, literal.decimalValue());
                    } else if (literal.getDatatype().equals(CoreDatatype.XSD.INTEGER.getIri())) {
                        recordObjectNode.put(key, literal.integerValue());
                    } else if (literal.getDatatype().equals(CoreDatatype.XSD.LONG.getIri())) {
                        recordObjectNode.put(key, literal.longValue());
                    } else {
                        recordObjectNode.put(key, literal.stringValue());
                    }
                } else {
                    recordObjectNode.put(key, value.stringValue());
                }
            }
            records.add(recordObjectNode);
        });
        return records;
    }

    /**
     * Checks if the provided exception contains an HTML response in its message.
     * If an HTML response is detected, it extracts the content of the title tag
     * from the message and throws a new exception of the same type as the original exception
     * with that information. If the title tag is not found or there is no HTML in the message,
     * it returns the original exception.
     *
     * @param error The exception whose message is to be checked for HTML content.
     *          It is expected to possibly contain an HTML response.
     * @param <T> A {@link Class} that extends {@link Exception}.
     * @return A re-wrapped {@link Exception} of the original exception unless there's no HTML in the message.
     */
    public static <T extends Exception> T parseExceptionForHTML(T error) {
        String message = error.getMessage();
        if (message != null && message.contains("<html>")) {
            String startTag = "<title>";
            String endTag = "</title>";

            // Find the starting position of the content
            int startIndex = message.indexOf(startTag);
            if (startIndex != -1) {
                startIndex += startTag.length(); // Move the index to the end of the start tag

                // Find the ending position of the content
                int endIndex = message.indexOf(endTag, startIndex);

                if (endIndex != -1) {
                    // Extract the substring between the start and end indices
                    String titleContent = message.substring(startIndex, endIndex);
                    try {
                        return (T) error.getClass().getDeclaredConstructor(String.class).newInstance(titleContent);
                    } catch (Exception reflectionException) {
                        throw new RuntimeException("Failed to create exception of type " + error.getClass().getName(),
                                reflectionException);
                    }
                }
            }
        }
        return error;
    }
}
