package com.mobi.sparql.rest;

import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;

/*-
 * #%L
 * com.mobi.sparql.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2020 iNovex Information Systems, Inc.
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
@ObjectClassDefinition(name = "SparqlRest Service Config", description = "Configure the SparqlRest Service details")
public @interface SparqlRestConfig {

    @AttributeDefinition(name = "limit", description = "Integer used for limit for limited-results endpoint", required=true, defaultValue="500")
    int limit();

}
