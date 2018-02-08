package com.mobi.security.policy.api;

import com.mobi.rdf.api.IRI;

public class BasicAttributeDesignator implements AttributeDesignator {
    private IRI attributeId;
    private IRI category;
    private IRI datatype;


    public BasicAttributeDesignator(IRI attributeId, IRI category, IRI datatype) {
        this.attributeId = attributeId;
        this.category = category;
        this.datatype = datatype;
    }

    @Override
    public IRI attributeId() {
        return null;
    }

    @Override
    public IRI category() {
        return null;
    }

    @Override
    public IRI datatype() {
        return null;
    }
}
