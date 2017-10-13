package com.mobi.persistence.utils.api;

/*-
 * #%L
 * com.mobi.persistence.utils
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

import com.mobi.rdf.api.Statement;
import com.mobi.persistence.utils.exception.RDFHandlerException;
import com.mobi.rdf.api.Statement;

public interface RDFHandler {

    void startRDF() throws RDFHandlerException;

    void endRDF() throws RDFHandlerException;

    void handleNamespace(String prefix, String namespace) throws RDFHandlerException;

    void handleStatement(Statement statement) throws RDFHandlerException;

    void handleComment(String comment) throws RDFHandlerException;
}
