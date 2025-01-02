package com.mobi.rdf.orm.test;

/*-
 * #%L
 * rdf-orm-test
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

/**
 * This is simply an example of a service that we'll use in our test case that will <b>not</b>
 * have a OrmFactory registered for it.
 */
class BadService {

    private FakeThing factory;

    /**
     * The bad reference...
     * @param thing A type of thing we don't have a factory for in our conf files
     */
    @Reference
    public void setFakeThing(FakeThing thing) {
        this.factory = thing;
    }

    public FakeThing getFactory() {
        return factory;
    }
}
