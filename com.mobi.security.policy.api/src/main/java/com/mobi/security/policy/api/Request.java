package com.mobi.security.policy.api;

/*-
 * #%L
 * com.mobi.security.policy.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import java.util.List;
import java.util.Map;

public interface Request {

    /**
     * The IRI representing the category of Subject attributes for {@link AttributeDesignator AttributeDesignators}.
     */
    IRI getSubjectCategory();

    /**
     * The IDs of the Subjects of this authorization Request.
     */
    List<IRI> getSubjectIds();

    /**
     * A map of other attributes on the Subject that are sent as a part of this authorization Request.
     */
    Map<String, Literal> getSubjectAttrs();

    /**
     * The IRI representing the category of Resources attributes for {@link AttributeDesignator AttributeDesignators}.
     */
    IRI getResourceCategory();

    /**
     * The IDs of the Resources of this authorization Request.
     */
    List<IRI> getResourceIds();

    /**
     * A map of other attributes on the Resource that are sent as a part of this authorization Request.
     */
    Map<String, Literal> getResourceAttrs();

    /**
     * The IRI representing the category of Action attributes for {@link AttributeDesignator AttributeDesignators}.
     */
    IRI getActionCategory();

    /**
     * The IDs of the Actions of this authorization Request.
     */
    List<IRI> getActionIds();

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
