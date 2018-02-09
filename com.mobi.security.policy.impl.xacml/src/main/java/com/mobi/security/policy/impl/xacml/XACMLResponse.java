package com.mobi.security.policy.impl.xacml;

import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.security.policy.api.Decision;
import com.mobi.security.policy.api.Response;
import com.mobi.security.policy.api.Status;
import com.mobi.security.policy.api.exception.ProcessingException;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import java.util.ArrayList;
import java.util.List;

public class XACMLResponse implements Response {

    private Decision decision;
    private Status status;
    private String statusMessage;
    private List<IRI> policyIds;

    private XACMLResponse(Builder builder) {
        this.decision = builder.decision;
        this.status = builder.status;
        this.statusMessage = builder.statusMessage;
        this.policyIds = builder.policyIds;
    }

    public XACMLResponse(Document response, ValueFactory vf) {
        NodeList decisionList = response.getElementsByTagName("Decision");
        if (decisionList.getLength() != 1) {
            throw new ProcessingException("Response does not include a Decision");
        }
        switch (decisionList.item(0).getFirstChild().getNodeValue()) {
            case "Permit":
                this.decision = Decision.PERMIT;
                break;
            case "Deny":
                this.decision = Decision.DENY;
                break;
            case "NotApplicable":
                this.decision = Decision.NOT_APPLICABLE;
                break;
            case "Indeterminate":
            default:
                this.decision = Decision.INDETERMINATE;
                break;
        }
        NodeList statusList = response.getElementsByTagName("Status");
        if (statusList.getLength() != 1) {
            throw new ProcessingException("Response does not include a Status");
        }
        NodeList statusStuff = statusList.item(0).getChildNodes();
        if (statusStuff.getLength() == 0) {
            throw new ProcessingException("Response's Status does not include any information");
        }
        for (int i = 0; i < statusStuff.getLength(); i++) {
            Node statusThing = statusStuff.item(i);
            if (statusThing.getLocalName().equals("StatusMessage")) {
                this.statusMessage = statusThing.getFirstChild().getNodeValue();
            } else if (statusThing.getLocalName().equals("StatusCode")) {
                switch (statusThing.getAttributes().item(0).getNodeValue()) {
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
        }
        if (this.status == null) {
            throw new ProcessingException("Response's Status does not include a StatusCode");
        }
        if (this.statusMessage == null) {
            this.statusMessage = "";
        }
        NodeList policyIdReferences = response.getElementsByTagName("PolicyIdReference");
        policyIds = new ArrayList<>();
        for (int i = 0; i < policyIdReferences.getLength(); i++) {
            String policyId = policyIdReferences.item(i).getFirstChild().getNodeValue();
            policyIds.add(vf.createIRI(policyId));
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

    @Override
    public String toString() {
        return "Decision: " + this.decision + "\nStatus: " + this.status + "\nStatus Message: "
                + this.statusMessage + "\nPolicy IDs: " + this.policyIds;
    }

    public static class Builder {
        private Decision decision;
        private Status status;
        private String statusMessage = "";
        private List<IRI> policyIds = new ArrayList<>();

        public Builder(Decision decision, Status status) {
            this.decision = decision;
            this.status = status;
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
}
