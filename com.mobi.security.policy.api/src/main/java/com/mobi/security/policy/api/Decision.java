package com.mobi.security.policy.api;

/*-
 * #%L
 * com.mobi.security.policy.api
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

public class Decision {
    private final String name;

    public static final Decision PERMIT = new Decision("Permit");
    public static final Decision DENY = new Decision("Deny");
    public static final Decision INDETERMINATE = new Decision("Indeterminate");
    public static final Decision NOT_APPLICABLE = new Decision("Not Applicable");

    public Decision(String name) {
        this.name = name;
    }

    @Override
    public String toString() {
        return name;
    }
}
