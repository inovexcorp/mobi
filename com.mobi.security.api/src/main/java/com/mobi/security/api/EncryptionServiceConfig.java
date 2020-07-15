package com.mobi.security.api;

/*-
 * #%L
 * com.mobi.security.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2020 iNovex Information Systems, Inc.
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


import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;

@ObjectClassDefinition(name = "Encryption Service Config", description = "Configure the encryption details")
public @interface EncryptionServiceConfig {

    @AttributeDefinition(name = "Enabled", description = "Boolean enabling/disabling encrypted passwords")
    boolean enabled();

    @AttributeDefinition(name = "Password", description = "Master password used to encrypt/decrypt passwords. Required if Variable not set")
    String password();

    @AttributeDefinition(name = "Variable", description = "Environment variable to use for storing the master password. Takes precedence over Password")
    String variable();
}