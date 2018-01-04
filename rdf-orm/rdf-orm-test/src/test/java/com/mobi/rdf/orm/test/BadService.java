package com.mobi.rdf.orm.test;

import jdk.nashorn.internal.ir.annotations.Reference;

public class BadService {

    private FakeThing factory;

    @Reference
    public void setFakeThing(FakeThing thing) {
        this.factory = thing;
    }

    public FakeThing getFactory() {
        return factory;
    }
}
