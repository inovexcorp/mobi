package com.mobi.security.policy.api.xacml;

/*-
 * #%L
 * security.policy.impl
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

public class XACML {

    // Categories
    public static final String SUBJECT_CATEGORY = "urn:oasis:names:tc:xacml:1.0:subject-category:access-subject";
    public static final String RESOURCE_CATEGORY = "urn:oasis:names:tc:xacml:3.0:attribute-category:resource";
    public static final String ACTION_CATEGORY = "urn:oasis:names:tc:xacml:3.0:attribute-category:action";
    public static final String ENVIRONMENT_CATEGORY = "urn:oasis:names:tc:xacml:3.0:attribute-category:environment";

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

    // Policy Algorithms
    public static final String POLICY_DENY_OVERRIDES =
            "urn:oasis:names:tc:xacml:3.0:policy-combining-algorithm:deny-overrides";
    public static final String POLICY_DENY_UNLESS_PERMIT =
            "urn:oasis:names:tc:xacml:3.0:policy-combining-algorithm:deny-unless-permit";
    public static final String POLICY_ORDERED_DENY_OVERRIDES =
            "urn:oasis:names:tc:xacml:3.0:policy-combining-algorithm:ordered-deny-overrides";
    public static final String POLICY_ORDERED_PERMIT_OVERRIDES =
            "urn:oasis:names:tc:xacml:3.0:policy-combining-algorithm:ordered-permit-overrides";
    public static final String POLICY_PERMIT_OVERRIDES =
            "urn:oasis:names:tc:xacml:3.0:policy-combining-algorithm:permit-overrides";
    public static final String POLICY_PERMIT_UNLESS_DENY =
            "urn:oasis:names:tc:xacml:3.0:policy-combining-algorithm:permit-unless-deny";
    public static final String POLICY_FIRST_APPLICABLE =
            "urn:oasis:names:tc:xacml:1.0:policy-combining-algorithm:first-applicable";
    public static final String POLICY_ONLY_ONE_APPLICABLE =
            "urn:oasis:names:tc:xacml:1.0:policy-combining-algorithm:only-one-applicable";

    // Functions
    public static final String OR_FUNCTION = "urn:oasis:names:tc:xacml:1.0:function:or";
    public static final String NOT_FUNCTION = "urn:oasis:names:tc:xacml:1.0:function:not";
    public static final String ANY_OF_FUNCTION = "urn:oasis:names:tc:xacml:1.0:function:any-of";
    public static final String STRING_EQUALS = "urn:oasis:names:tc:xacml:1.0:function:string-equal";
}
