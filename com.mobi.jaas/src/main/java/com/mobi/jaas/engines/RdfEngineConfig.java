package com.mobi.jaas.engines;

/*-
 * #%L
 * com.mobi.jaas
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

import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;

@ObjectClassDefinition
public @interface RdfEngineConfig {

    /**
     * The list of roles for this engine.
     */
    @AttributeDefinition(name = "roles")
    String roles();

    /**
     * Boolean enabling / disabling encrypted passwords.
     */
    @AttributeDefinition(name = "encryption.enabled", defaultValue = "false")
    boolean encryption_enabled() default false;

    /**
     * Encryption Service name. The default one is 'basic'. A more powerful one named 'jasypt' is available
     * when installing the encryption feature.
     */
    @AttributeDefinition(name = "encryption.name", defaultValue = "basic")
    String encryption_name() default "basic";

    @AttributeDefinition(name = "encryption.prefix", defaultValue = "{CRYPT}")
    String encryption_prefix() default "{CRYPT}";

    @AttributeDefinition(name = "encryption.suffix", defaultValue = "{CRYPT}")
    String encryption_suffix() default "{CRYPT}";

    /**
     * Set the encryption algorithm to use in engine. Supported encryption algorithms follow:
     * <ul>
     *     <li>MD2</li>
     *     <li>MD5</li>
     *     <li>SHA-1</li>
     *     <li>SHA-256</li>
     *     <li>SHA-384</li>
     *     <li>SHA-512</li>
     * </ul>
     */
    @AttributeDefinition(name = "encryption.algorithm", defaultValue = "MD5")
    String encryption_algorithm() default "MD5";

    /**
     * Encoding of the encrypted password.
     * <ul>
     *     <li>hexadecimal</li>
     *     <li>base64</li>
     * </ul>
     */
    @AttributeDefinition(name = "encryption.encoding", defaultValue = "hexadecimal")
    String encryption_encoding() default "hexadecimal";

    @AttributeDefinition(name = "repository.target")
    String repository_id();
}
