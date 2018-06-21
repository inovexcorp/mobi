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

import static com.mobi.security.policy.api.xacml.XACML.ACTION_CATEGORY;
import static com.mobi.security.policy.api.xacml.XACML.CURRENT_DATETIME;
import static com.mobi.security.policy.api.xacml.XACML.RESOURCE_CATEGORY;
import static com.mobi.security.policy.api.xacml.XACML.SUBJECT_CATEGORY;

import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Literal;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.security.policy.api.xacml.XACML;
import com.mobi.security.policy.api.xacml.XACMLRequest;
import com.mobi.security.policy.api.xacml.jaxb.ObjectFactory;
import com.mobi.security.policy.api.xacml.jaxb.RequestType;
import org.wso2.balana.attr.AttributeValue;
import org.wso2.balana.ctx.AbstractRequestCtx;
import org.wso2.balana.ctx.Attribute;

import java.io.ByteArrayOutputStream;
import java.io.StringReader;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Set;
import javax.xml.bind.JAXB;
import javax.xml.bind.JAXBContext;
import javax.xml.bind.JAXBException;

public class BalanaRequest extends XACMLRequest {

    public BalanaRequest(AbstractRequestCtx context, ValueFactory vf) {
        subjectCategory = vf.createIRI(SUBJECT_CATEGORY);
        resourceCategory = vf.createIRI(RESOURCE_CATEGORY);
        actionCategory = vf.createIRI(ACTION_CATEGORY);
        requestTimeAttribute = vf.createIRI(CURRENT_DATETIME);

        of = new ObjectFactory();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        context.encode(out);
        try {
            this.requestType = (RequestType) jaxbContext.createUnmarshaller().unmarshal(new StringReader
                    (new String(out.toByteArray())));
        } catch (JAXBException e) {
            e.printStackTrace();
        }
        //this.requestType = JAXB.unmarshal(new StringReader(new String(out.toByteArray())), RequestType.class);

        subjectAttrs = new HashMap<>();
        resourceAttrs = new HashMap<>();
        actionAttrs = new HashMap<>();
        context.getAttributesSet().forEach(attributes -> {
            Set<Attribute> attributeSet = attributes.getAttributes();
            switch (attributes.getCategory().toString()) {
                case SUBJECT_CATEGORY:
                    attributeSet.forEach(attribute -> {
                        if (attribute.getId().toString().equals(XACML.SUBJECT_ID)) {
                            this.subjectId = vf.createIRI(attribute.getValue().encode());
                        } else {
                            this.subjectAttrs.put(attribute.getId().toString(), getLiteral(attribute.getValue(), vf));
                        }
                    });
                    if (this.subjectId == null) {
                        throw new IllegalArgumentException("No Subject ID passed in Request");
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
                        throw new IllegalArgumentException("No Resource ID passed in the request");
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

        public Builder(IRI subjectId, IRI resourceId, IRI actionId, OffsetDateTime requestTime, ValueFactory vf,
                       JAXBContext jaxbContext) {
            super(subjectId, resourceId, actionId, requestTime, vf, jaxbContext);
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
