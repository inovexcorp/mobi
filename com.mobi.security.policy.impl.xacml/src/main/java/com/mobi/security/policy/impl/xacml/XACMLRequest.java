package com.mobi.security.policy.impl.xacml;

/*-
 * #%L
 * com.mobi.security.policy.impl.xacml
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Literal;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.security.policy.api.Request;
import com.mobi.vocabularies.xsd.XSD;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.wso2.balana.ProcessingException;
import org.wso2.balana.attr.AttributeValue;
import org.wso2.balana.ctx.AbstractRequestCtx;
import org.wso2.balana.ctx.Attribute;
import org.wso2.balana.utils.PolicyUtils;
import org.wso2.balana.utils.Utils;
import org.wso2.balana.utils.exception.PolicyBuilderException;
import org.wso2.balana.utils.policy.dto.AttributeElementDTO;
import org.wso2.balana.utils.policy.dto.AttributesElementDTO;
import org.wso2.balana.utils.policy.dto.RequestElementDTO;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.TransformerException;

public class XACMLRequest implements Request {

    private IRI subjectId;
    private Map<String, Literal> subjectAttrs;
    private IRI resourceId;
    private Map<String, Literal> resourceAttrs;
    private IRI actionId;
    private Map<String, Literal> actionAttrs;
    private OffsetDateTime requestTime;

    private Document document;

    public XACMLRequest(AbstractRequestCtx context, ValueFactory vf) {
        this.document = context.getDocumentRoot().getOwnerDocument();
        subjectAttrs = new HashMap<>();
        resourceAttrs = new HashMap<>();
        actionAttrs = new HashMap<>();
        context.getAttributesSet().forEach(attributes -> {
            Set<Attribute> attributeSet = attributes.getAttributes();
            switch (attributes.getCategory().toString()) {
                case XACML.SUBJECT_CATEGORY:
                    attributeSet.forEach(attribute -> {
                        if (attribute.getId().toString().equals(XACML.SUBJECT_ID)) {
                            this.subjectId = vf.createIRI(attribute.getValue().encode());
                        } else {
                            this.subjectAttrs.put(attribute.getId().toString(), getLiteral(attribute.getValue(), vf));
                        }
                    });
                    if (this.subjectId == null) {
                        throw new ProcessingException("No Subject ID passed in Request");
                    }
                    break;
                case XACML.RESOURCE_CATEGORY:
                    attributeSet.forEach(attribute -> {
                        if (attribute.getId().toString().equals(XACML.RESOURCE_ID)) {
                            this.resourceId = vf.createIRI(attribute.getValue().encode());
                        } else {
                            this.resourceAttrs.put(attribute.getId().toString(), getLiteral(attribute.getValue(), vf));
                        }
                    });
                    if (this.resourceId == null) {
                        throw new ProcessingException("No Resource ID passed in the request");
                    }
                    break;
                case XACML.ACTION_CATEGORY:
                    attributeSet.forEach(attribute -> {
                        if (attribute.getId().toString().equals(XACML.ACTION_ID)) {
                            this.actionId = vf.createIRI(attribute.getValue().encode());
                        } else {
                            this.actionAttrs.put(attribute.getId().toString(), getLiteral(attribute.getValue(), vf));
                        }
                    });
                    if (this.actionId == null) {
                        throw new ProcessingException("No Action ID passed in the request");
                    }
                    break;
                case XACML.ENVIRONMENT_CATEGORY:
                    attributeSet.forEach(attribute -> {
                        if (attribute.getId().toString().equals(XACML.CURRENT_DATETIME)) {
                            this.requestTime = OffsetDateTime.parse(attribute.getValue().encode());
                        }
                    });
                    if (this.requestTime == null) {
                        throw new ProcessingException("No Environment Current Date Time passed in the request");
                    }
                    break;
                default:
                    throw new ProcessingException("Unsupported category in request");
            }
        });
    }

    private XACMLRequest(Builder builder) {
        this.subjectId = builder.subjectId;
        this.subjectAttrs = builder.subjectAttrs;
        this.resourceId = builder.resourceId;
        this.resourceAttrs = builder.resourceAttrs;
        this.actionId = builder.actionId;
        this.actionAttrs = builder.actionAttrs;
        this.requestTime = builder.requestTime;

        // Subject
        AttributesElementDTO subjectAttributes = new AttributesElementDTO();
        subjectAttributes.setCategory(XACML.SUBJECT_CATEGORY);
        List<AttributeElementDTO> subjectAttributeElements = new ArrayList<>();
        AttributeElementDTO subjectIdElement = new AttributeElementDTO();
        subjectIdElement.setAttributeId(XACML.SUBJECT_ID);
        subjectIdElement.setDataType(XSD.STRING);
        subjectIdElement.setAttributeValues(Collections.singletonList(this.subjectId.stringValue()));
        subjectAttributeElements.add(subjectIdElement);
        subjectAttrs.forEach((key, value) -> {
            AttributeElementDTO el = new AttributeElementDTO();
            el.setAttributeId(key);
            el.setDataType(value.getDatatype().stringValue());
            el.setAttributeValues(Collections.singletonList(value.stringValue()));
            subjectAttributeElements.add(el);
        });
        subjectAttributes.setAttributeElementDTOs(subjectAttributeElements);

        // Resource
        AttributesElementDTO resourceAttributes = new AttributesElementDTO();
        resourceAttributes.setCategory(XACML.RESOURCE_CATEGORY);
        List<AttributeElementDTO> resourceAttributeElements = new ArrayList<>();
        AttributeElementDTO resourceIdElement = new AttributeElementDTO();
        resourceIdElement.setAttributeId(XACML.RESOURCE_ID);
        resourceIdElement.setDataType(XSD.STRING);
        resourceIdElement.setAttributeValues(Collections.singletonList(this.resourceId.stringValue()));
        resourceAttributeElements.add(resourceIdElement);
        resourceAttrs.forEach((key, value) -> {
            AttributeElementDTO el = new AttributeElementDTO();
            el.setAttributeId(key);
            el.setDataType(value.getDatatype().stringValue());
            el.setAttributeValues(Collections.singletonList(value.stringValue()));
            resourceAttributeElements.add(el);
        });
        resourceAttributes.setAttributeElementDTOs(resourceAttributeElements);

        // Action
        AttributesElementDTO actionAttributes = new AttributesElementDTO();
        actionAttributes.setCategory(XACML.ACTION_CATEGORY);
        List<AttributeElementDTO> actionAttributeElements = new ArrayList<>();
        AttributeElementDTO actionIdElement = new AttributeElementDTO();
        actionIdElement.setAttributeId(XACML.ACTION_ID);
        actionIdElement.setDataType(XSD.STRING);
        actionIdElement.setAttributeValues(Collections.singletonList(this.actionId.stringValue()));
        actionAttributeElements.add(actionIdElement);
        actionAttrs.forEach((key, value) -> {
            AttributeElementDTO el = new AttributeElementDTO();
            el.setAttributeId(key);
            el.setDataType(value.getDatatype().stringValue());
            el.setAttributeValues(Collections.singletonList(value.stringValue()));
            actionAttributeElements.add(el);
        });
        actionAttributes.setAttributeElementDTOs(actionAttributeElements);

        // Environment
        AttributesElementDTO environmentAttributes = new AttributesElementDTO();
        environmentAttributes.setCategory(XACML.ENVIRONMENT_CATEGORY);
        AttributeElementDTO currentTimeElement = new AttributeElementDTO();
        currentTimeElement.setAttributeId(XACML.CURRENT_DATETIME);
        currentTimeElement.setAttributeValues(Collections.singletonList(this.requestTime.toString()));
        currentTimeElement.setDataType(XSD.DATE_TIME);
        environmentAttributes.setAttributeElementDTOs(Collections.singletonList(currentTimeElement));

        RequestElementDTO request = new RequestElementDTO();
        request.setAttributesElementDTOs(Stream.of(subjectAttributes, resourceAttributes, actionAttributes,
                environmentAttributes).collect(Collectors.toList()));
        request.setMultipleRequest(false);
        request.setCombinedDecision(false);
        request.setReturnPolicyIdList(true);

        try {
            this.document = Utils.createNewDocument();
            Element requestEl = PolicyUtils.createRequestElement(request, this.document);
            this.document.appendChild(requestEl);
        } catch (ParserConfigurationException | PolicyBuilderException e) {
            throw new ProcessingException(e);
        }
    }

    @Override
    public IRI getSubjectId() {
        return subjectId;
    }

    @Override
    public Map<String, Literal> getSubjectAttrs() {
        return subjectAttrs;
    }

    @Override
    public IRI getResourceId() {
        return resourceId;
    }

    @Override
    public Map<String, Literal> getResourceAttrs() {
        return resourceAttrs;
    }

    @Override
    public IRI getActionId() {
        return actionId;
    }

    @Override
    public Map<String, Literal> getActionAttrs() {
        return actionAttrs;
    }

    @Override
    public OffsetDateTime getRequestTime() {
        return requestTime;
    }

    @Override
    public String toString() {
        try {
            return Utils.getStringFromDocument(document);
        } catch (TransformerException e) {
            throw new MobiException(e);
        }
    }

    private Literal getLiteral(AttributeValue value, ValueFactory vf) {
        IRI datatype = vf.createIRI(value.getType().toString());
        switch (datatype.stringValue()) {
            case "http://www.w3.org/2001/XMLSchema#string":
            case "http://www.w3.org/2001/XMLSchema#boolean":
            case "http://www.w3.org/2001/XMLSchema#double":
            case "http://www.w3.org/2001/XMLSchema#integer":
            case "http://www.w3.org/2001/XMLSchema#anyURI":
            case "https://www.w3.org/2001/XMLSchema#dateTime":
                return vf.createLiteral(value.encode(), datatype);
            default:
                return vf.createLiteral(value.encode(), vf.createIRI("http://www.w3.org/2001/XMLSchema#string"));
        }
    }

    public static class Builder {
        private IRI subjectId;
        private Map<String, Literal> subjectAttrs = new HashMap<>();
        private IRI resourceId;
        private Map<String, Literal> resourceAttrs = new HashMap<>();
        private IRI actionId;
        private Map<String, Literal> actionAttrs = new HashMap<>();
        private OffsetDateTime requestTime;

        public Builder(IRI subjectId, IRI resourceId, IRI actionId, OffsetDateTime requestTime) {
            this.subjectId = subjectId;
            this.resourceId = resourceId;
            this.actionId = actionId;
            this.requestTime = requestTime;
        }

        public Builder addSubjectAttr(String attributeId, Literal value) {
            subjectAttrs.put(attributeId, value);
            return this;
        }

        public Builder addResourceAttr(String attributeId, Literal value) {
            resourceAttrs.put(attributeId, value);
            return this;
        }

        public Builder addActionAttr(String attributeId, Literal value) {
            actionAttrs.put(attributeId, value);
            return this;
        }

        public XACMLRequest build() {
            return new XACMLRequest(this);
        }
    }
}
