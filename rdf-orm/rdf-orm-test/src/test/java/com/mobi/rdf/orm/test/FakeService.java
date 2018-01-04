package com.mobi.rdf.orm.test;

/*-
 * #%L
 * rdf-orm-test
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

import aQute.bnd.annotation.component.Reference;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.impl.ThingFactory;

/**
 * This is an example of a service that will have a {@link ThingFactory} reference we can test the auto-injection
 * with.
 */
class FakeService {

    private OrmFactory<Thing> thingOrmFactory;

    /**
     * Reference method we should find to inject our {@link ThingFactory} into.
     *
     * @param factory Our target {@link OrmFactory}
     */
    @Reference
    void setFactory(ThingFactory factory) {
        this.thingOrmFactory = factory;
    }

    public OrmFactory<Thing> getThingOrmFactory() {
        return thingOrmFactory;
    }
}
