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

import com.mobi.exception.MobiException;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.security.policy.api.Decision;
import com.mobi.security.policy.api.Response;
import com.mobi.security.policy.api.Status;
import com.mobi.security.policy.api.xacml.jaxb.DecisionType;
import com.mobi.security.policy.api.xacml.jaxb.IdReferenceType;
import com.mobi.security.policy.api.xacml.jaxb.ObjectFactory;
import com.mobi.security.policy.api.xacml.jaxb.PolicyIdentifierListType;
import com.mobi.security.policy.api.xacml.jaxb.ResponseType;
import com.mobi.security.policy.api.xacml.jaxb.ResultType;
import com.mobi.security.policy.api.xacml.jaxb.StatusCodeType;
import com.mobi.security.policy.api.xacml.jaxb.StatusType;

import java.io.Reader;
import java.io.StringReader;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import javax.xml.bind.JAXBContext;
import javax.xml.bind.JAXBException;
import javax.xml.bind.Unmarshaller;
import javax.xml.stream.XMLInputFactory;
import javax.xml.stream.XMLStreamException;
import javax.xml.stream.XMLStreamReader;

public class XACMLResponse implements Response {

    private Decision decision;
    private Status status;
    private String statusMessage;
    private List<IRI> policyIds;

    private ResponseType responseType;
    private ObjectFactory of;

    protected JAXBContext jaxbContext;

    public XACMLResponse(Builder builder) {
        this.decision = builder.decision;
        this.status = builder.status;
        this.statusMessage = builder.statusMessage;
        this.policyIds = builder.policyIds;
        this.jaxbContext = builder.jaxbContext;

        of = new ObjectFactory();

        StatusCodeType statusCodeType = of.createStatusCodeType();
        statusCodeType.setValue(status.toString());
        StatusType statusType = of.createStatusType();
        statusType.setStatusMessage(statusMessage);
        statusType.setStatusCode(statusCodeType);
        ResultType resultType = of.createResultType();
        resultType.setStatus(statusType);
        resultType.setDecision(getDecisionType());
        PolicyIdentifierListType policyIdentifierListType = of.createPolicyIdentifierListType();
        resultType.setPolicyIdentifierList(policyIdentifierListType);
        policyIdentifierListType.getPolicyIdReferenceOrPolicySetIdReference().addAll(this.policyIds.stream()
                .map(policyId -> {
                    IdReferenceType idReferenceType = of.createIdReferenceType();
                    idReferenceType.setValue(policyId.stringValue());
                    return idReferenceType;
                })
                .map(of::createPolicyIdReference)
                .collect(Collectors.toList()));

        this.responseType = of.createResponseType();
        this.responseType.getResult().add(resultType);
    }

    public XACMLResponse(String response, ValueFactory vf, JAXBContext jaxbContext) {
        this.jaxbContext = jaxbContext;
        try {
            Unmarshaller unmarshaller = jaxbContext.createUnmarshaller();
            final XMLInputFactory xmlInputFactory = XMLInputFactory.newFactory();
            final Reader reader = new StringReader(response);
            final XMLStreamReader xmlStreamReader = xmlInputFactory.createXMLStreamReader(reader);
            this.responseType = unmarshaller.unmarshal(xmlStreamReader, ResponseType.class).getValue();
        } catch (JAXBException | XMLStreamException e) {
            throw new MobiException(e);
        }
        of = new ObjectFactory();

        ResultType resultType = this.responseType.getResult().get(0);
        setDecision(resultType.getDecision());
        StatusType statusType = resultType.getStatus();
        setStatus(statusType.getStatusCode().getValue());
        this.statusMessage = statusType.getStatusMessage() == null ? "" : statusType.getStatusMessage();
        PolicyIdentifierListType policyIdentifierListType = resultType.getPolicyIdentifierList();
        if (policyIdentifierListType != null) {
            this.policyIds = policyIdentifierListType.getPolicyIdReferenceOrPolicySetIdReference().stream()
                    .map(idReferenceTypeJAXBElement -> vf.createIRI(idReferenceTypeJAXBElement.getValue().getValue()))
                    .collect(Collectors.toList());
        } else {
            this.policyIds = new ArrayList<>();
        }
    }

    @Override
    public Decision getDecision() {
        return this.decision;
    }

    @Override
    public Status getStatus() {
        return this.status;
    }

    @Override
    public String getStatusMessage() {
        return this.statusMessage;
    }

    @Override
    public List<IRI> getPolicyIds() {
        return this.policyIds;
    }

    public ResponseType getJaxbResponse() {
        return responseType;
    }

    @Override
    public String toString() {
        StringWriter sw = new StringWriter();
        try {
            jaxbContext.createMarshaller().marshal(of.createResponse(responseType), sw);
        } catch (JAXBException e) {
            throw new MobiException(e);
        }
        return sw.toString();
    }

    public static class Builder {
        private Decision decision;
        private Status status;
        private String statusMessage = "";
        private List<IRI> policyIds = new ArrayList<>();
        public JAXBContext jaxbContext;

        public Builder(Decision decision, Status status, JAXBContext jaxbContext) {
            this.decision = decision;
            this.status = status;
            this.jaxbContext = jaxbContext;
        }

        public Builder statusMessage(String statusMessage) {
            this.statusMessage = statusMessage;
            return this;
        }

        public Builder setPolicyIds(List<IRI> policyIds) {
            this.policyIds = policyIds;
            return this;
        }

        public Builder addPolicyId(IRI policyId) {
            this.policyIds.add(policyId);
            return this;
        }

        public XACMLResponse build() {
            return new XACMLResponse(this);
        }
    }

    private void setDecision(DecisionType decisionType) {
        if (decisionType.equals(DecisionType.PERMIT)) {
            this.decision = Decision.PERMIT;
        } else if (decisionType.equals(DecisionType.DENY)) {
            this.decision = Decision.DENY;
        } else if (decisionType.equals(DecisionType.INDETERMINATE)) {
            this.decision = Decision.INDETERMINATE;
        } else {
            this.decision = Decision.NOT_APPLICABLE;
        }
    }

    private void setStatus(String status) {
        switch (status) {
            case XACML.OK:
                this.status = Status.OK;
                break;
            case XACML.MISSING_ATTRIBUTE:
                this.status = Status.MISSING_ATTRIBUTE;
                break;
            case XACML.SYNTAX_ERROR:
                this.status = Status.SYNTAX_ERROR;
                break;
            case XACML.PROCESSING_ERROR:
            default:
                this.status = Status.PROCESSING_ERROR;
                break;
        }
    }

    private DecisionType getDecisionType() {
        if (decision.equals(Decision.PERMIT)) {
            return DecisionType.PERMIT;
        } else if (decision.equals(Decision.DENY)) {
            return DecisionType.DENY;
        } else if (decision.equals(Decision.INDETERMINATE)) {
            return DecisionType.INDETERMINATE;
        } else {
            return DecisionType.NOT_APPLICABLE;
        }
    }
}
