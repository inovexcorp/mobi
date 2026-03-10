package com.mobi.rest.util.swagger;

/*-
 * #%L
 * com.mobi.rest.util
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Class representing user data for Swagger documentation.
 */
public class UserData {

    @Schema(description = "First Name of the user", example = "John")
    public String firstName;

    @Schema(description = "Last Name of the user", example = "Doe")
    public String lastName;

    @Schema(description = "Username credential", example = "jdoe")
    public String username;

    public UserData() {
    }
}
