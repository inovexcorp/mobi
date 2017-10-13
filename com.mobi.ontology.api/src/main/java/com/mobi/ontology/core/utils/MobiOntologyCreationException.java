package com.mobi.ontology.core.utils;

/*-
 * #%L
 * com.mobi.ontology.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

public class MobiOntologyCreationException extends MobiOntologyException {

    public MobiOntologyCreationException() {}

    public MobiOntologyCreationException(String message) {
        super(message);
    }

    public MobiOntologyCreationException(String message, Throwable cause) {
        super(message, cause);
    }

    public MobiOntologyCreationException(Throwable cause) {
        super(cause);
    }
}
