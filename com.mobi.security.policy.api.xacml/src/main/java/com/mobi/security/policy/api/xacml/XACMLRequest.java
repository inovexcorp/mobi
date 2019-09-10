package com.mobi.security.policy.api.xacml;

/*-
 * #%L
 * com.mobi.security.policy.api.xacml
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

import static com.mobi.security.policy.api.xacml.XACML.ACTION_CATEGORY;
import static com.mobi.security.policy.api.xacml.XACML.ACTION_ID;
import static com.mobi.security.policy.api.xacml.XACML.CURRENT_DATETIME;
import static com.mobi.security.policy.api.xacml.XACML.ENVIRONMENT_CATEGORY;
import static com.mobi.security.policy.api.xacml.XACML.RESOURCE_CATEGORY;
import static com.mobi.security.policy.api.xacml.XACML.RESOURCE_ID;
import static com.mobi.security.policy.api.xacml.XACML.SUBJECT_CATEGORY;
import static com.mobi.security.policy.api.xacml.XACML.SUBJECT_ID;

import com.mobi.exception.MobiException;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Literal;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.security.policy.api.Request;
import com.mobi.security.policy.api.xacml.jaxb.AttributeType;
import com.mobi.security.policy.api.xacml.jaxb.AttributeValueType;
import com.mobi.security.policy.api.xacml.jaxb.AttributesType;
import com.mobi.security.policy.api.xacml.jaxb.ObjectFactory;
import com.mobi.security.policy.api.xacml.jaxb.RequestType;
import com.mobi.vocabularies.xsd.XSD;

import java.io.StringWriter;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import javax.xml.bind.JAXBContext;
import javax.xml.bind.JAXBException;

public class XACMLRequest implements Request {

    protected IRI subjectId;
    protected IRI subjectCategory;
    protected Map<String, Literal> subjectAttrs;
    protected IRI resourceId;
    protected IRI resourceCategory;
    protected Map<String, Literal> resourceAttrs;
    protected IRI actionId;
    protected IRI actionCategory;
    protected Map<String, Literal> actionAttrs;
    protected IRI requestTimeAttribute;
    protected OffsetDateTime requestTime;

    protected RequestType requestType;
    protected ObjectFactory of;
    protected JAXBContext jaxbContext;

    protected XACMLRequest() {}

    protected XACMLRequest(Builder builder) {
        this.subjectId = builder.subjectId;
        this.subjectCategory = builder.subjectCategory;
        this.subjectAttrs = builder.subjectAttrs;
        this.resourceId = builder.resourceId;
        this.resourceCategory = builder.resourceCategory;
        this.resourceAttrs = builder.resourceAttrs;
        this.actionId = builder.actionId;
        this.actionCategory = builder.actionCategory;
        this.actionAttrs = builder.actionAttrs;
        this.requestTime = builder.requestTime;
        this.requestTimeAttribute = builder.requestTimeAttribute;
        this.jaxbContext = builder.jaxbContext;

        of = new ObjectFactory();

        this.requestType = of.createRequestType();
        requestType.setCombinedDecision(false);
        requestType.setReturnPolicyIdList(true);
        List<AttributesType> attributesList = requestType.getAttributes();
        attributesList.add(createAttributes(SUBJECT_CATEGORY, subjectAttrs, SUBJECT_ID, subjectId));
        attributesList.add(createAttributes(RESOURCE_CATEGORY, resourceAttrs, RESOURCE_ID, resourceId));
        attributesList.add(createAttributes(ACTION_CATEGORY, actionAttrs, ACTION_ID, actionId));

        AttributeValueType requestTimeAttributeValue = of.createAttributeValueType();
        requestTimeAttributeValue.setDataType(XSD.DATE_TIME);
        requestTimeAttributeValue.getContent().add(DateTimeFormatter.ISO_OFFSET_DATE_TIME.format(this.requestTime));
        AttributeType currentDateTimeAttribute = of.createAttributeType();
        currentDateTimeAttribute.setAttributeId(requestTimeAttribute.stringValue());
        currentDateTimeAttribute.getAttributeValue().add(requestTimeAttributeValue);
        AttributesType environmentAttributes = of.createAttributesType();
        environmentAttributes.setCategory(ENVIRONMENT_CATEGORY);
        environmentAttributes.getAttribute().add(currentDateTimeAttribute);
        attributesList.add(environmentAttributes);
    }

    @Override
    public IRI getSubjectCategory() {
        return subjectCategory;
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
    public IRI getResourceCategory() {
        return resourceCategory;
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
    public IRI getActionCategory() {
        return actionCategory;
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
    public IRI getRequestTimeAttribute() {
        return requestTimeAttribute;
    }

    @Override
    public OffsetDateTime getRequestTime() {
        return requestTime;
    }

    @Override
    public String toString() {
        StringWriter sw = new StringWriter();
        try {
            jaxbContext.createMarshaller().marshal(of.createRequest(requestType), sw);
        } catch (JAXBException e) {
            throw new MobiException(e);
        }
        return sw.toString();
    }

    public RequestType getJaxbRequest() {
        return requestType;
    }

    public static class Builder {
        private IRI subjectId;
        private IRI subjectCategory;
        private Map<String, Literal> subjectAttrs = new HashMap<>();
        private IRI resourceId;
        private IRI resourceCategory;
        private Map<String, Literal> resourceAttrs = new HashMap<>();
        private IRI actionId;
        private IRI actionCategory;
        private Map<String, Literal> actionAttrs = new HashMap<>();
        private IRI requestTimeAttribute;
        private OffsetDateTime requestTime;
        private JAXBContext jaxbContext;

        public Builder(IRI subjectId, IRI resourceId, IRI actionId, OffsetDateTime requestTime, ValueFactory vf,
                       JAXBContext jaxbContext) {
            this.subjectId = subjectId;
            this.resourceId = resourceId;
            this.actionId = actionId;
            this.requestTime = requestTime;
            this.subjectCategory = vf.createIRI(SUBJECT_CATEGORY);
            this.resourceCategory = vf.createIRI(RESOURCE_CATEGORY);
            this.actionCategory = vf.createIRI(ACTION_CATEGORY);
            this.requestTimeAttribute = vf.createIRI(CURRENT_DATETIME);
            this.jaxbContext = jaxbContext;
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

    private AttributesType createAttributes(String category, Map<String, Literal> attrs, String attributeId,
                                            IRI idStr) {
        AttributesType attributesType = of.createAttributesType();
        attributesType.setCategory(category);
        attributesType.getAttribute().addAll(attrs.keySet().stream()
                .map(key -> {
                    Literal value = attrs.get(key);
                    AttributeType attributeType = of.createAttributeType();
                    attributeType.setAttributeId(key);
                    AttributeValueType attributeValueType = of.createAttributeValueType();
                    attributeValueType.setDataType(value.getDatatype().stringValue());
                    attributeValueType.getContent().add(value.stringValue());
                    attributeType.getAttributeValue().add(attributeValueType);
                    return attributeType;
                })
                .collect(Collectors.toList())
        );
        AttributeValueType idAttributeValue = of.createAttributeValueType();
        idAttributeValue.setDataType(XSD.STRING);
        idAttributeValue.getContent().add(idStr.stringValue());
        AttributeType idAttribute = of.createAttributeType();
        idAttribute.setAttributeId(attributeId);
        idAttribute.getAttributeValue().add(idAttributeValue);
        attributesType.getAttribute().add(idAttribute);

        return attributesType;
    }
}
