package com.mobi.security.policy.impl.xacml;

/*-
 * #%L
 * com.mobi.security.policy.impl.xacml
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import static com.mobi.security.policy.api.xacml.XACML.CURRENT_DATETIME;
import static com.mobi.security.policy.api.xacml.XACML.RESOURCE_CATEGORY;
import static com.mobi.security.policy.api.xacml.XACML.SUBJECT_CATEGORY;

import com.mobi.exception.MobiException;
import com.mobi.security.policy.api.xacml.XACML;
import com.mobi.security.policy.api.xacml.XACMLRequest;
import com.mobi.security.policy.api.xacml.jaxb.ObjectFactory;
import com.mobi.security.policy.api.xacml.jaxb.RequestType;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.ValueFactory;
import org.wso2.balana.attr.AttributeValue;
import org.wso2.balana.ctx.AbstractRequestCtx;
import org.wso2.balana.ctx.Attribute;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Set;
import javax.xml.bind.JAXBContext;
import javax.xml.bind.JAXBElement;
import javax.xml.bind.JAXBException;
import javax.xml.bind.Unmarshaller;
import javax.xml.transform.stream.StreamSource;

public class BalanaRequest extends XACMLRequest {

    public BalanaRequest(AbstractRequestCtx context, ValueFactory vf, JAXBContext jaxbContext) {
        subjectCategory = vf.createIRI(SUBJECT_CATEGORY);
        resourceCategory = vf.createIRI(RESOURCE_CATEGORY);
        actionCategory = vf.createIRI(ACTION_CATEGORY);
        requestTimeAttribute = vf.createIRI(CURRENT_DATETIME);
        this.jaxbContext = jaxbContext;

        of = new ObjectFactory();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        context.encode(out);
        try {
            Unmarshaller unmarshaller = jaxbContext.createUnmarshaller();
            JAXBElement<RequestType> requestType = unmarshaller.unmarshal(new StreamSource(
                    new ByteArrayInputStream(out.toByteArray())), RequestType.class);
            this.requestType = requestType.getValue();
        } catch (JAXBException e) {
            throw new MobiException(e);
        }

        subjectAttrs = new HashMap<>();
        resourceAttrs = new HashMap<>();
        actionAttrs = new HashMap<>();
        context.getAttributesSet().forEach(attributes -> {
            Set<Attribute> attributeSet = attributes.getAttributes();
            switch (attributes.getCategory().toString()) {
                case SUBJECT_CATEGORY:
                    attributeSet.forEach(attribute -> {
                        if (attribute.getId().toString().equals(XACML.SUBJECT_ID)) {
                            if (this.subjectIds == null) {
                                this.subjectIds = new ArrayList<>();
                            }
                            this.subjectIds.add(vf.createIRI(attribute.getValue().encode()));
                        } else {
                            this.subjectAttrs.put(attribute.getId().toString(), getLiteral(attribute.getValue(), vf));
                        }
                    });
                    if (this.subjectIds == null) {
                        throw new IllegalArgumentException("No Subject ID passed in Request");
                    }
                    break;
                case XACML.RESOURCE_CATEGORY:
                    attributeSet.forEach(attribute -> {
                        if (attribute.getId().toString().equals(XACML.RESOURCE_ID)) {
                            if (this.resourceIds == null) {
                                this.resourceIds = new ArrayList<>();
                            }
                            this.resourceIds.add(vf.createIRI(attribute.getValue().encode()));
                        } else {
                            this.resourceAttrs.put(attribute.getId().toString(), getLiteral(attribute.getValue(), vf));
                        }
                    });
                    if (this.resourceIds == null) {
                        throw new IllegalArgumentException("No Resource ID passed in the request");
                    }
                    break;
                case XACML.ACTION_CATEGORY:
                    attributeSet.forEach(attribute -> {
                        if (attribute.getId().toString().equals(XACML.ACTION_ID)) {
                            if (this.actionIds == null) {
                                this.actionIds = new ArrayList<>();
                            }
                            this.actionIds.add(vf.createIRI(attribute.getValue().encode()));
                        } else {
                            this.actionAttrs.put(attribute.getId().toString(), getLiteral(attribute.getValue(), vf));
                        }
                    });
                    if (this.actionIds == null) {
                        throw new IllegalArgumentException("No Action ID passed in the request");
                    }
                    break;
                case XACML.ENVIRONMENT_CATEGORY:
                    attributeSet.forEach(attribute -> {
                        if (attribute.getId().toString().equals(XACML.CURRENT_DATETIME)) {
                            this.requestTime = OffsetDateTime.parse(attribute.getValue().encode());
                        }
                    });
                    if (this.requestTime == null) {
                        throw new IllegalArgumentException("No Environment Current Date Time passed in the request");
                    }
                    break;
                default:
                    throw new IllegalArgumentException("Unsupported category in request");
            }
        });
    }

    public BalanaRequest(Builder builder) {
        super(builder);
    }

    public static class Builder extends XACMLRequest.Builder {

        public Builder(List<IRI> subjectIds, List<IRI> resourceIds, List<IRI> actionIds, OffsetDateTime requestTime, ValueFactory vf,
                       JAXBContext jaxbContext) {
            super(subjectIds, resourceIds, actionIds, requestTime, vf, jaxbContext);
        }

        public BalanaRequest build() {
            return new BalanaRequest(this);
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
}
