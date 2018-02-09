package com.mobi.security.policy.impl.xacml;

import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.security.policy.api.Policy;
import org.wso2.balana.AbstractPolicy;

import java.util.Optional;

public class XACMLPolicy implements Policy {

    private AbstractPolicy abstractPolicy;
    private IRI id;

    public XACMLPolicy(AbstractPolicy abstractPolicy, ValueFactory vf) {
        this.abstractPolicy = abstractPolicy;
        this.id = vf.createIRI(this.abstractPolicy.getId().toString());
    }

    @Override
    public IRI getId() {
        return this.id;
    }

    @Override
    public Optional<String> getDescription() {
        return Optional.ofNullable(this.abstractPolicy.getDescription());
    }

    @Override
    public String toString() {
        return this.abstractPolicy.encode();
    }
}
