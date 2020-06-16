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

import com.mobi.exception.MobiException;
import org.osgi.service.cm.Configuration;

/**
 * The Encryption service is designed to encrypt/decrypt passwords and other sensitive values in the config files of
 * other Mobi services. It can be used to automatically encrypt passwords on activation/modification of the service.
 */
public interface EncryptionService {
    /**
     * Takes the provided string, encrypts it, and updates the provided config with the encrypted string as the value
     * of the provided configFieldToUpdate.
     *
     * @param strToEncrypt The string that will be encrypted
     * @param configFieldToUpdate The config field whose value will be updated with the newly encrypted string
     * @param config The config that will be updated
     * @return The encrypted version of the string that was provided.
     */
    String encrypt(String strToEncrypt, String configFieldToUpdate, Configuration config) throws MobiException;

    /**
     * Takes the provided string and decrypts it. If the string is found to be already in plaintext form, encryption is
     * performed and the associated config is updated.
     *
     * @param strToDecrypt The string that will be decrypted
     * @param configFieldToDecrypt The config field whose value will be updated if encryption is performed
     * @param config The config that will be updated if encryption is performed
     * @return The decrypted version of the string that was provided.
     */
    String decrypt(String strToDecrypt, String configFieldToDecrypt, Configuration config) throws MobiException;

    /**
     *
     * @return A boolean reflecting the value of the isEnabled property of the encryption config.
     */
    boolean isEnabled();
}
