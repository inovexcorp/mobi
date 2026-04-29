package com.mobi.rest.security;

/*-
 * #%L
 * com.mobi.rest.security
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

import static com.mobi.security.policy.api.xacml.XACML.POLICY_PERMIT_OVERRIDES;
import static com.mobi.web.security.util.AuthenticationProps.ANON_USER;

import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.Bindings;
import com.mobi.persistence.utils.Models;
import com.mobi.repository.api.OsgiRepository;
import com.mobi.rest.security.annotations.ActionAttributes;
import com.mobi.rest.security.annotations.ActionId;
import com.mobi.rest.security.annotations.AttributeValue;
import com.mobi.rest.security.annotations.DefaultResourceId;
import com.mobi.rest.security.annotations.ResourceAttributes;
import com.mobi.rest.security.annotations.ResourceId;
import com.mobi.rest.security.annotations.SubjectAttributes;
import com.mobi.rest.security.annotations.Value;
import com.mobi.rest.security.annotations.ValueType;
import com.mobi.exception.MobiException;
import com.mobi.rest.util.MobiWebException;
import com.mobi.rest.util.RestUtils;
import com.mobi.security.policy.api.Decision;
import com.mobi.security.policy.api.PDP;
import com.mobi.security.policy.api.Request;
import com.mobi.security.policy.api.Response;
import com.mobi.security.policy.api.ontologies.policy.Create;
import com.mobi.security.policy.api.ontologies.policy.Delete;
import com.mobi.security.policy.api.ontologies.policy.Read;
import com.mobi.security.policy.api.ontologies.policy.Update;
import org.apache.commons.fileupload.FileItemIterator;
import org.apache.commons.fileupload.FileItemStream;
import org.apache.commons.fileupload.FileUpload;
import org.apache.commons.fileupload.FileUploadBase;
import org.apache.commons.fileupload.RequestContext;
import org.apache.commons.fileupload.util.Streams;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.query.Binding;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ServiceScope;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.annotation.Annotation;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;
import javax.annotation.Priority;
import javax.ws.rs.Priorities;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerRequestFilter;
import javax.ws.rs.container.ResourceInfo;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Form;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.MultivaluedHashMap;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.core.UriInfo;
import javax.ws.rs.ext.Provider;
import javax.ws.rs.ext.Providers;

/**
 * Utilizes annotations set on the REST endpoint method to collect information about the request and
 * the PDP service to authorize the request.
 */
@Provider
@Priority(Priorities.AUTHORIZATION - 1)
@Component(scope = ServiceScope.PROTOTYPE, property = {
        "osgi.jaxrs.extension=true"
})
public class XACMLRequestFilter implements ContainerRequestFilter {

    private final Logger log = LoggerFactory.getLogger(XACMLRequestFilter.class);

    final ValueFactory vf = new ValidatingValueFactory();

    @Reference
    EngineManager engineManager;

    @Reference
    PDP pdp;

    @Reference(target = "(id=system)")
    OsgiRepository repository;

    @Context
    ResourceInfo resourceInfo;

    @Context
    UriInfo uriInfo;

    @Context
    Providers providers;

    @Override
    public void filter(ContainerRequestContext context) throws IOException {
        log.debug("Authorizing...");
        long start = System.currentTimeMillis();

        try {
            MultivaluedMap<String, String> pathParameters = uriInfo.getPathParameters();
            MultivaluedMap<String, String> queryParameters = uriInfo.getQueryParameters();
            Method method = resourceInfo.getResourceMethod();

            if (method.getAnnotation(ResourceId.class) == null) {
                log.info("Request authorization skipped. {}ms", System.currentTimeMillis() - start);
                return;
            }

            IRI subjectIdIri = (IRI) RestUtils.optActiveUser(context, engineManager).map(User::getResource)
                    .orElse(vf.createIRI(ANON_USER));

            // Subject

            SubjectAttributes subjectAttributesAnnotation = method.getAnnotation(SubjectAttributes.class);
            Map<String, Literal> subjectAttributes = new HashMap<>();
            if (subjectAttributesAnnotation != null) {
                setAttributes(subjectAttributes, subjectAttributesAnnotation.value(), pathParameters, queryParameters,
                        context);
            }

            // Resource

            ResourceId resourceIdAnnotation = method.getAnnotation(ResourceId.class);
            IRI resourceIdIri;
            try {
                resourceIdIri = getResourceIdIri(resourceIdAnnotation, context, queryParameters, pathParameters);
            } catch (MobiWebException ex) {
                DefaultResourceId[] defaultValArr = resourceIdAnnotation.defaultValue();
                if (defaultValArr.length != 0) {
                    log.info("Attempting to resolve a default Resource ID.");
                    DefaultResourceId defaultVal = defaultValArr[0];
                    ResourceId defaultResourceId = getResourceIdFromDefault(defaultVal);
                    resourceIdIri = getResourceIdIri(defaultResourceId, context, queryParameters, pathParameters);
                } else {
                    throw ex;
                }
            }

            ResourceAttributes resourceAttributesAnnotation = method.getAnnotation(ResourceAttributes.class);
            Map<String, Literal> resourceAttributes = new HashMap<>();
            if (resourceAttributesAnnotation != null) {
                setAttributes(resourceAttributes, resourceAttributesAnnotation.value(), pathParameters, queryParameters,
                        context);
            }

            // Action

            ActionId actionIdAnnotation = method.getAnnotation(ActionId.class);
            IRI actionId;
            if (actionIdAnnotation == null) {
                switch (context.getMethod()) {
                    case "POST":
                        actionId = vf.createIRI(Create.TYPE);
                        break;
                    case "DELETE":
                        actionId = vf.createIRI(Delete.TYPE);
                        break;
                    case "PUT":
                        actionId = vf.createIRI(Update.TYPE);
                        break;
                    case "GET":
                    default:
                        actionId = vf.createIRI(Read.TYPE);
                        break;
                }
            } else {
                actionId = vf.createIRI(actionIdAnnotation.value());
            }

            ActionAttributes actionAttributesAnnotation = method.getAnnotation(ActionAttributes.class);
            Map<String, Literal> actionAttributes = new HashMap<>();
            if (actionAttributesAnnotation != null) {
                setAttributes(actionAttributes, actionAttributesAnnotation.value(), pathParameters, queryParameters,
                        context);
            }

            Request request = pdp.createRequest(Arrays.asList(subjectIdIri), subjectAttributes,
                    Arrays.asList(resourceIdIri), resourceAttributes, Arrays.asList(actionId), actionAttributes);
            log.debug(request.toString());
            Response response = pdp.evaluate(request, vf.createIRI(POLICY_PERMIT_OVERRIDES));
            log.debug(response.toString());

            Decision decision = response.getDecision();
            if (decision != Decision.PERMIT) {
                if (decision == Decision.DENY) {
                    String statusMessage = getMessageOrDefault(response,
                            "You do not have permission to perform this action");
                    throw RestUtils.getErrorObjForbidden(new IllegalAccessException(statusMessage));
                }
                if (decision == Decision.INDETERMINATE) {
                    String statusMessage = getMessageOrDefault(response, "Request indeterminate");
                    throw RestUtils.getErrorObjInternalServerError(new MobiException(statusMessage));
                }
            }
            log.info("Request permitted. {}ms", System.currentTimeMillis() - start);
        } catch (IllegalArgumentException e) {
            throw RestUtils.getErrorObjBadRequest(e);
        } catch (IllegalStateException e) {
            throw RestUtils.getErrorObjInternalServerError(e);
        }
    }

    private IRI getResourceIdIri(ResourceId resourceIdAnnotation, ContainerRequestContext context,
                                 MultivaluedMap<String, String> queryParameters,
                                 MultivaluedMap<String, String> pathParameters) {
        IRI resourceIdIri;
        if (resourceIdAnnotation == null) {
            resourceIdIri = vf.createIRI(uriInfo.getAbsolutePath().toString());
        } else {
            String resourceValueStr = resourceIdAnnotation.value();
            switch (resourceIdAnnotation.type()) {
                case PATH:
                    validatePathParam(resourceValueStr, pathParameters, true);
                    resourceIdIri = vf.createIRI(pathParameters.getFirst(resourceValueStr));
                    break;
                case QUERY:
                    validateQueryParam(resourceValueStr, queryParameters, true);
                    resourceIdIri = vf.createIRI(queryParameters.getFirst(resourceValueStr));
                    break;
                case BODY:
                    MultivaluedMap<String, String> formMap = getFormData(context);
                    validateFormParam(resourceValueStr, formMap, true);
                    resourceIdIri = vf.createIRI(formMap.getFirst(resourceValueStr));
                    break;
                case PROP_PATH:
                    IRI pathStart = getPropPathStart(validatePropPathValue(resourceIdAnnotation.start()),
                            pathParameters, queryParameters, context, true);
                    try (RepositoryConnection conn = repository.getConnection()) {
                        TupleQueryResult result = getPropPathResult(pathStart, resourceIdAnnotation.value(), conn);
                        if (!result.hasNext()) {
                            throw RestUtils.getErrorObjBadRequest(new IllegalArgumentException("No results returned for property path"));
                        }
                        resourceIdIri = (IRI) Bindings.requiredResource(result.next(), "value");
                        result.close();
                    }
                    break;
                case PRIMITIVE:
                default:
                    resourceIdIri = vf.createIRI(resourceIdAnnotation.value());
                    break;
            }
        }

        return resourceIdIri;
    }

    private Literal getLiteral(String value, String datatype) {
        return vf.createLiteral(value, vf.createIRI(datatype));
    }

    private ResourceId getResourceIdFromDefault(DefaultResourceId defaultVal) {
        return new ResourceId() {
            @Override
            public String value() {
                return defaultVal.value();
            }

            @Override
            public ValueType type() {
                return defaultVal.type();
            }

            @Override
            public Value[] start() {
                return defaultVal.start();
            }

            @Override
            public DefaultResourceId[] defaultValue() {
                return new DefaultResourceId[]{};
            }

            @Override
            public Class<? extends Annotation> annotationType() {
                return ResourceId.class;
            }
        };
    }

    private String getMessageOrDefault(Response response, String defaultMessage) {
        return StringUtils.isEmpty(response.getStatusMessage()) ? defaultMessage : response.getStatusMessage();
    }

    private boolean validatePathParam(String key, MultivaluedMap<String, String> params, boolean isRequired) {
        if (!params.containsKey(key) && isRequired) {
            throw RestUtils.getErrorObjBadRequest(new IllegalArgumentException("Path does not contain parameter " + key));
        }
        return params.containsKey(key);
    }

    private boolean validateQueryParam(String key, MultivaluedMap<String, String> params, boolean isRequired) {
        if (!params.containsKey(key) && isRequired) {
            throw RestUtils.getErrorObjBadRequest(new IllegalArgumentException("Query parameters do not contain " + key));
        }
        return params.containsKey(key);
    }

    private boolean validateFormParam(String key, MultivaluedMap<String, String> params, boolean isRequired) {
        if ((!params.containsKey(key) || params.get(key) == null) && isRequired) {
            throw RestUtils.getErrorObjBadRequest(new IllegalArgumentException("Form parameters do not contain " + key));
        }
        return params.containsKey(key) && params.get(key) != null;
    }

    private Value validatePropPathValue(Value[] values) {
        if (values.length != 1) {
            throw RestUtils.getErrorObjBadRequest(new IllegalArgumentException("A Property Path value requires exactly one starting point"));
        }
        return values[0];
    }

    private MultivaluedMap<String, String> getFormData(ContainerRequestContext context) {
        if (!context.hasEntity()
                || (!typeEqual(MediaType.MULTIPART_FORM_DATA_TYPE, context.getMediaType())
                && !typeEqual(MediaType.APPLICATION_FORM_URLENCODED_TYPE, context.getMediaType()))) {
            throw RestUtils.getErrorObjBadRequest(new IllegalArgumentException("Expected Request to have form data"));
        }

        if (typeEqual(MediaType.MULTIPART_FORM_DATA_TYPE, context.getMediaType())) {
            return getFormDataMultipart(context);
        } else if (typeEqual(MediaType.APPLICATION_FORM_URLENCODED_TYPE, context.getMediaType())) {
            return getFormDataUrlEncoded(context);
        }
        throw RestUtils.getErrorObjBadRequest(new IllegalArgumentException("Expected Request to have form data"));
    }

    private MultivaluedMap<String, String> getFormDataMultipart(ContainerRequestContext context) {
        try {
            ByteArrayInputStream resettableIS = Models.toByteArrayInputStream(context.getEntityStream());
            MultivaluedMap<String, String> formMap = new MultivaluedHashMap<>();

            FileUploadBase upload = new FileUpload();
            RequestContext requestContext = new RequestContext() {
                @Override
                public String getCharacterEncoding() {
                    return StandardCharsets.UTF_8.name();
                }

                @Override
                public String getContentType() {
                    return context.getMediaType().toString();
                }

                // Deprecated
                @Override
                public int getContentLength() {
                    return 0;
                }

                @Override
                public InputStream getInputStream() throws IOException {
                    return resettableIS;
                }
            };

            FileItemIterator iter = upload.getItemIterator(requestContext);
            while (iter.hasNext()) {
                FileItemStream item = iter.next();
                String name = item.getFieldName();
                if (item.isFormField()) {
                    try (InputStream stream = item.openStream()) {
                        formMap.add(name, Streams.asString(stream));
                    }
                }
            }
            resettableIS.reset();
            context.setEntityStream(resettableIS);
            return formMap;
        } catch (Exception e) {
            throw RestUtils.getErrorObjInternalServerError(e);
        }
    }

    private MultivaluedMap<String, String> getFormDataUrlEncoded(ContainerRequestContext context) {
        try {
            ByteArrayInputStream resettableIS = Models.toByteArrayInputStream(context.getEntityStream());
            Form form = providers.getMessageBodyReader(Form.class, Form.class, new Annotation[0],
                            MediaType.APPLICATION_FORM_URLENCODED_TYPE)
                    .readFrom(Form.class, Form.class, new Annotation[0], MediaType.APPLICATION_FORM_URLENCODED_TYPE,
                            null, resettableIS);

            resettableIS.reset();
            context.setEntityStream(resettableIS);
            return form.asMap();
        } catch (Exception e) {
            throw RestUtils.getErrorObjInternalServerError(e);
        }
    }

    private boolean typeEqual(MediaType m1, MediaType m2) {
        if (m1 == null || m2 == null) {
            return false;
        }

        return m1.getSubtype().equalsIgnoreCase(m2.getSubtype()) && m1.getType().equalsIgnoreCase(m2.getType());
    }

    private void setAttributes(Map<String, Literal> attrs, AttributeValue[] values,
                               MultivaluedMap<String, String> pathParameters,
                               MultivaluedMap<String, String> queryParameters, ContainerRequestContext context) {
        Stream.of(values)
                .forEach(attributeValue -> {
                    String valueStr = attributeValue.value();
                    String datatype = attributeValue.datatype();
                    boolean isRequired = attributeValue.required();
                    Literal value;
                    switch (attributeValue.type()) {
                        case PATH:
                            value = validatePathParam(valueStr, pathParameters, isRequired)
                                    ? getLiteral(pathParameters.getFirst(valueStr), datatype)
                                    : null;
                            break;
                        case QUERY:
                            value = validateQueryParam(valueStr, queryParameters, isRequired)
                                    ? getLiteral(queryParameters.getFirst(valueStr), datatype)
                                    : null;
                            break;
                        case BODY:
                            MultivaluedMap<String, String> formMap = getFormData(context);
                            value = validateFormParam(valueStr, formMap, isRequired)
                                    ? getLiteral(formMap.getFirst(valueStr), datatype)
                                    : null;
                            break;
                        case PROP_PATH:
                            IRI pathStart = getPropPathStart(validatePropPathValue(attributeValue.start()),
                                    pathParameters, queryParameters, context, isRequired);
                            try (RepositoryConnection conn = repository.getConnection()) {
                                TupleQueryResult result = getPropPathResult(pathStart, attributeValue.value(), conn);
                                if (!result.hasNext()) {
                                    if (isRequired) {
                                        value = null;
                                    } else {
                                        throw RestUtils.getErrorObjBadRequest(new IllegalArgumentException("No results returned for property path"));
                                    }
                                } else {
                                    Binding binding = Optional.ofNullable(result.next().getBinding("value"))
                                            .orElseThrow(() ->
                                                    RestUtils.getErrorObjInternalServerError(new MobiException("Property Value binding is not present")));
                                    value = getLiteral(binding.getValue().stringValue(), datatype);
                                }
                                result.close();
                            }
                            break;
                        case PRIMITIVE:
                        default:
                            value = getLiteral(valueStr, datatype);
                            break;
                    }

                    if (value != null) {
                        attrs.put(attributeValue.id(), value);
                    }
                });
    }

    private IRI getPropPathStart(Value valueAnnotation, MultivaluedMap<String, String> pathParameters,
                                 MultivaluedMap<String, String> queryParameters, ContainerRequestContext context,
                                 boolean isRequired) {
        IRI propPathStart;
        String propPathValue = valueAnnotation.value();
        switch (valueAnnotation.type()) {
            case PATH:
                propPathStart = validatePathParam(propPathValue, pathParameters, isRequired)
                        ? vf.createIRI(pathParameters.getFirst(propPathValue))
                        : null;
                break;
            case QUERY:
                propPathStart = validateQueryParam(propPathValue, queryParameters, isRequired)
                        ? vf.createIRI(queryParameters.getFirst(propPathValue))
                        : null;
                break;
            case BODY:
                MultivaluedMap<String, String> formMap = getFormData(context);
                propPathStart = validateFormParam(propPathValue, formMap, isRequired)
                        ? vf.createIRI(formMap.getFirst(propPathValue))
                        : null;
                break;
            case PROP_PATH:
                throw RestUtils.getErrorObjInternalServerError(new MobiException("Property Path not supported as a property path starting point"));
            case PRIMITIVE:
            default:
                propPathStart = vf.createIRI(valueAnnotation.value());
                break;
        }
        return propPathStart;
    }

    private TupleQueryResult getPropPathResult(IRI start, String propPath, RepositoryConnection conn) {
        TupleQuery query = conn.prepareTupleQuery("select ?value where { ?start " + propPath + " ?value }");
        query.setBinding("start", start);
        return query.evaluate();
    }
}
