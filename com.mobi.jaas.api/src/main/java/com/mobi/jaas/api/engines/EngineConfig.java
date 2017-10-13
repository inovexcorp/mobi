package com.mobi.jaas.api.engines;

/*-
 * #%L
 * com.mobi.jaas.api
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

import aQute.bnd.annotation.metatype.Meta;

@Meta.OCD
public interface EngineConfig {
    /**
     * The list of roles for this engine.
     */
    @Meta.AD(id = "roles")
    String[] roles();

    /**
     * Boolean enabling / disabling encrypted passwords.
     */
    @Meta.AD(id = "encryption.enabled", deflt = "false")
    boolean encryptionEnabled();

    /**
     * Encryption Service name. The default one is 'basic'. A more powerful one named 'jasypt' is available
     * when installing the encryption feature.
     */
    @Meta.AD(id = "encryption.name", deflt = "basic")
    String encryptionName();

    @Meta.AD(id = "encryption.prefix", deflt = "{CRYPT}")
    String encryptionPrefix();

    @Meta.AD(id = "encryption.suffix", deflt = "{CRYPT}")
    String encryptionSuffix();

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
    @Meta.AD(id = "encryption.algorithm", deflt = "MD5")
    String encryptionAlgorithm();

    /**
     * Encoding of the encrypted password.
     * <ul>
     *     <li>hexadecimal</li>
     *     <li>base64</li>
     * </ul>
     */
    @Meta.AD(id = "encryption.encoding", deflt = "hexadecimal")
    String encryptionEncoding();
}
