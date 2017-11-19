package com.mobi.jaas.api.principals;

/*-
 * #%L
 * com.mobi.jaas
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

import java.security.Principal;

public class UserPrincipal implements Principal {
    private String name;
    private String className;

    public UserPrincipal(String name) {
        this.name = name;
        this.className = null;
    }

    public UserPrincipal(String name, String className) {
        this.name = name;
        this.className = className;
    }

    @Override
    public String getName() {
        return this.name;
    }

    public String getClassName() {
        return this.className;
    }

    public void setClassName(String className) {
        this.className = className;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        if (!(obj instanceof UserPrincipal)) {
            return false;
        }

        UserPrincipal that = (UserPrincipal) obj;
        return name != null ? name.equals(that.name) : that.name == null;
    }
}
