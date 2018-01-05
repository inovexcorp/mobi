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

/**
 * This {@link RuntimeException} extension represents when there is an issue that occurs in the
 * {@link OrmEnabledTestCase}.  When making use of this framework, this exception may be thrown from either the
 * initialization of the {@link com.mobi.rdf.orm.OrmFactory} system initialization, or when trying to work
 * with the {@link com.mobi.rdf.orm.OrmFactory}s in your runtime.
 */
public class OrmTestCaseException extends RuntimeException {

    public OrmTestCaseException(String msg) {
        super(msg);
    }

    public OrmTestCaseException(String msg, Throwable cause) {
        super(msg, cause);
    }

}
