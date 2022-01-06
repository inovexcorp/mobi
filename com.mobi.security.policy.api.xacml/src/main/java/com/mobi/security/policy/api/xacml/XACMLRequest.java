package com.mobi.security.policy.api.xacml;

/*-
 * #%L
 * com.mobi.security.policy.api.xacml
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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

    protected List<IRI> subjectIds;
    protected IRI subjectCategory;
    protected Map<String, Literal> subjectAttrs;
    protected List<IRI> resourceIds;
    protected IRI resourceCategory;
    protected Map<String, Literal> resourceAttrs;
    protected List<IRI> actionIds;
    protected IRI actionCategory;
    protected Map<String, Literal> actionAttrs;
    protected IRI requestTimeAttribute;
    protected OffsetDateTime requestTime;

    protected RequestType requestType;
    protected ObjectFactory of;
    protected JAXBContext jaxbContext;

    protected ValueFactory vf;

    protected XACMLRequest() {}

    protected XACMLRequest(Builder builder) {
        this.subjectIds = builder.subjectIds;
        this.subjectCategory = builder.subjectCategory;
        this.subjectAttrs = builder.subjectAttrs;
        this.resourceIds = builder.resourceIds;
        this.resourceCategory = builder.resourceCategory;
        this.resourceAttrs = builder.resourceAttrs;
        this.actionIds = builder.actionIds;
        this.actionCategory = builder.actionCategory;
        this.actionAttrs = builder.actionAttrs;
        this.requestTime = builder.requestTime;
        this.requestTimeAttribute = builder.requestTimeAttribute;
        this.jaxbContext = builder.jaxbContext;

        of = new ObjectFactory();
        this.vf = builder.vf;
        this.requestType = of.createRequestType();
        requestType.setCombinedDecision(false);
        requestType.setReturnPolicyIdList(true);
        List<AttributesType> attributesList = requestType.getAttributes();
        subjectIds.forEach(id -> {
            Map<String, Literal> subjectMap = new HashMap<>();
            subjectMap.putAll(subjectAttrs);
            subjectMap.put(SUBJECT_ID, builder.vf.createLiteral(id.stringValue()));
            attributesList.add(createAttributes(SUBJECT_CATEGORY, subjectMap, SUBJECT_ID, id));
        });
        resourceIds.forEach(id -> {
            Map<String, Literal> resourceMap = new HashMap<>();
            resourceMap.putAll(resourceAttrs);
            resourceMap.put(RESOURCE_ID, builder.vf.createLiteral(id.stringValue()));
            attributesList.add(createAttributes(RESOURCE_CATEGORY, resourceMap, RESOURCE_ID, id));
        });
        actionIds.forEach(id -> {
            Map<String, Literal> actionMap = new HashMap<>();
            actionMap.putAll(actionAttrs);
            actionMap.put(ACTION_ID, builder.vf.createLiteral(id.stringValue()));
            attributesList.add(createAttributes(ACTION_CATEGORY, actionMap, ACTION_ID, id));
        });

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
    public List<IRI> getSubjectIds() {
        return subjectIds;
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
    public List<IRI> getResourceIds() {
        return resourceIds;
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
    public List<IRI> getActionIds() {
        return actionIds;
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
        private List<IRI> subjectIds;
        private IRI subjectCategory;
        private Map<String, Literal> subjectAttrs = new HashMap<>();
        private List<IRI> resourceIds;
        private IRI resourceCategory;
        private Map<String, Literal> resourceAttrs = new HashMap<>();
        private List<IRI> actionIds;
        private IRI actionCategory;
        private Map<String, Literal> actionAttrs = new HashMap<>();
        private IRI requestTimeAttribute;
        private OffsetDateTime requestTime;
        private JAXBContext jaxbContext;
        public ValueFactory vf;

        public Builder(List<IRI> subjectIds, List<IRI> resourceIds, List<IRI> actionIds, OffsetDateTime requestTime, ValueFactory vf,
                       JAXBContext jaxbContext) {
            this.subjectIds = subjectIds;
            this.resourceIds = resourceIds;
            this.actionIds = actionIds;
            this.requestTime = requestTime;
            this.subjectCategory = vf.createIRI(SUBJECT_CATEGORY);
            this.resourceCategory = vf.createIRI(RESOURCE_CATEGORY);
            this.actionCategory = vf.createIRI(ACTION_CATEGORY);
            this.requestTimeAttribute = vf.createIRI(CURRENT_DATETIME);
            this.jaxbContext = jaxbContext;
            this.vf = vf;
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
                    attributeType.setIncludeInResult(true);
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
