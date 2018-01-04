package com.mobi.rdf.orm.test;

import aQute.bnd.annotation.component.Reference;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.impl.ThingFactory;

public class FakeService {

    private OrmFactory<Thing> thingOrmFactory;

    @Reference
    protected void setFactory(ThingFactory factory) {
        this.thingOrmFactory = factory;
    }

    public OrmFactory<Thing> getThingOrmFactory() {
        return thingOrmFactory;
    }
}
