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
import com.mobi.rdf.api.Literal;

import java.time.OffsetDateTime;
import java.util.Map;

public interface Request {

    /**
     * The IRI representing the category of Subject attributes for {@link AttributeDesignator AttributeDesignators}.
     */
    IRI getSubjectCategory();

    /**
     * The ID of the Subject of this authorization Request.
     */
    IRI getSubjectId();

    /**
     * A map of other attributes on the Subject that are sent as a part of this authorization Request.
     */
    Map<String, Literal> getSubjectAttrs();

    /**
     * The IRI representing the category of Resources attributes for {@link AttributeDesignator AttributeDesignators}.
     */
    IRI getResourceCategory();

    /**
     * The ID of the Resource of this authorization Request.
     */
    IRI getResourceId();

    /**
     * A map of other attributes on the Resource that are sent as a part of this authorization Request.
     */
    Map<String, Literal> getResourceAttrs();

    /**
     * The IRI representing the category of Action attributes for {@link AttributeDesignator AttributeDesignators}.
     */
    IRI getActionCategory();

    /**
     * The ID of the Action of this authorization Request.
     */
    IRI getActionId();

    /**
     * A map of other attributes on the Action that are sent as a part of this authorization Request.
     */
    Map<String, Literal> getActionAttrs();

    /**
     * The identifier of the request time attribute.
     */
    IRI getRequestTimeAttribute();

    /**
     * The date and time of this authorization Request.
     */
    OffsetDateTime getRequestTime();
}
