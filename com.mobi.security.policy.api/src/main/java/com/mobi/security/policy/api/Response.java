package com.mobi.security.policy.api;

/*-
 * #%L
 * com.mobi.security.policy.api
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

import com.mobi.rdf.api.IRI;

import java.util.List;

public interface Response {

    /**
     * The {@link Decision} of the authorization {@link Request}, i.e. whether the request was approved or denied.
     */
    Decision getDecision();

    /**
     * The {@link Status} of the authorization {@link Request}. Indicates whether the Request was evaluated
     * successfully or not.
     */
    Status getStatus();

    /**
     * A status message providing more context about the {@link Decision}.
     */
    String getStatusMessage();

    /**
     * The IDs of the {@link PolicyWrapper Policies} used to make the authorization {@link Decision}.
     */
    List<IRI> getPolicyIds();
}
