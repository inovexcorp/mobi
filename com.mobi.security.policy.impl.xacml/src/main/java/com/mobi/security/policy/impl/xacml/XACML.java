package com.mobi.security.policy.impl.xacml;

/*-
 * #%L
 * security.policy.impl
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

public class XACML {

    // Categories
    public static final String SUBJECT_CATEGORY = "urn:oasis:names:tc:xacml:1.0:subject-category:access-subject";
    public static final String RESOURCE_CATEGORY = "urn:oasis:names:tc:xacml:3.0:attribute-category:resource";
    public static final String ACTION_CATEGORY = "urn:oasis:names:tc:xacml:3.0:attribute-category:action";

    // Attributes

    public static final String SUBJECT_ID = "urn:oasis:names:tc:xacml:1.0:subject:subject-id";
    public static final String RESOURCE_ID = "urn:oasis:names:tc:xacml:1.0:resource:resource-id";
    public static final String ACTION_ID = "urn:oasis:names:tc:xacml:1.0:action:action-id";
    public static final String CURRENT_DATETIME = "urn:oasis:names:tc:xacml:1.0:environment:current-dateTime";

    // Statuses
    public static final String OK = "urn:oasis:names:tc:xacml:1.0:status:ok";
    public static final String MISSING_ATTRIBUTE = "urn:oasis:names:tc:xacml:1.0:status:missing-attribute";
    public static final String SYNTAX_ERROR = "urn:oasis:names:tc:xacml:1.0:status:syntax-error";
    public static final String PROCESSING_ERROR = "urn:oasis:names:tc:xacml:1.0:status:processing-error";
}
