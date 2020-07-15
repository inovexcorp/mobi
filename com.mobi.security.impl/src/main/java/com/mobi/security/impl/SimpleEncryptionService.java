package com.mobi.security.impl;

/*-
 * #%L
 * com.mobi.security.impl
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
import com.mobi.security.api.EncryptionService;
import com.mobi.security.api.EncryptionServiceConfig;
import com.mobi.service.config.ConfigUtils;
import org.jasypt.encryption.pbe.StandardPBEStringEncryptor;
import org.jasypt.exceptions.EncryptionOperationNotPossibleException;
import org.jasypt.iv.RandomIvGenerator;
import org.jasypt.properties.PropertyValueEncryptionUtils;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.cm.Configuration;
import org.osgi.service.component.annotations.ConfigurationPolicy;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.metatype.annotations.Designate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component(name = SimpleEncryptionService.COMPONENT_NAME, immediate = true, configurationPolicy = ConfigurationPolicy.REQUIRE)
@Designate(ocd = EncryptionServiceConfig.class)
public class SimpleEncryptionService implements EncryptionService {

    static final String COMPONENT_NAME = "com.mobi.security.api.EncryptionService";

    private static final String AES_128 = "PBEWithHmacSHA512AndAES_128";
    private static final Logger LOGGER = LoggerFactory.getLogger(SimpleEncryptionService.class);
    private StandardPBEStringEncryptor encryptor = new StandardPBEStringEncryptor();
    private boolean isEnabled;

    @Activate
    @Modified
    protected void start(final EncryptionServiceConfig encryptionServiceConfig) {
        if (encryptor.isInitialized()) {
            LOGGER.debug("Encryptor has already been initialized. Modifications to the encryption config will not take effect until karaf is restarted." +
                    "If the master password is changed, you will need to re-store all passwords in plaintext before next run.");
            return;
        }
        isEnabled = encryptionServiceConfig.enabled();
        if (isEnabled) {
            String envVar = encryptionServiceConfig.variable();
            String password = encryptionServiceConfig.password();

            if (envVar == null && password == null) {
                throw new MobiException("Password or variable must be set if encryption is enabled.");
            }

            if (encryptionServiceConfig.variable() != null) {
                String envMasterPassword = System.getenv(encryptionServiceConfig.variable());
                if (envMasterPassword == null) {
                    throw new MobiException("Could not set encryption master password. The following environment variable was not set: " + encryptionServiceConfig.variable() + ". If " +
                            "you don't want to use an environment variable remove the 'variable' property from the config.");
                }
                encryptor.setPassword(envMasterPassword);
            } else {
                encryptor.setPassword(password);
            }

            encryptor.setIvGenerator(new RandomIvGenerator());
            encryptor.setAlgorithm(AES_128);
        }
    }

    @Override
    public String encrypt(String strToEncrypt, String configFieldToUpdate, final Configuration config) {
        LOGGER.trace("Attempting to encrypt " + configFieldToUpdate + " field in " + config.getPid() + " config.");
        try {
            if (strToEncrypt == null) {
                return null;
            } else if (PropertyValueEncryptionUtils.isEncryptedValue(strToEncrypt)) {
                LOGGER.trace("Value was found to already be encrypted.");
                return strToEncrypt;
            } else {
                String encrypted = PropertyValueEncryptionUtils.encrypt(strToEncrypt, encryptor);
                List<String> keys = Collections.list(config.getProperties().keys());
                Map<String, Object> configurationData = keys.stream()
                        .collect(Collectors.toMap(Function.identity(), config.getProperties()::get));
                configurationData.put(configFieldToUpdate, encrypted);
                ConfigUtils.updateServiceConfig(configurationData, config);
                LOGGER.trace("Encryption successful.");
                return encrypted;
            }
        } catch (EncryptionOperationNotPossibleException e) {
            throw new MobiException("Could not encrypt/decrypt the " + configFieldToUpdate + ". Make sure that you are not trying to decrypt a password that was " +
                    "encrypted with a different master password.", e);
        }
    }

    @Override
    public String decrypt(String strToDecrypt, String configFieldToDecrypt, final Configuration config) {
        try {
            LOGGER.trace("Decrypting " + configFieldToDecrypt + " field in " + config.getPid() + " config.");
            if (strToDecrypt == null) {
                return null;
            } else if (PropertyValueEncryptionUtils.isEncryptedValue(strToDecrypt)) {
                return PropertyValueEncryptionUtils.decrypt(strToDecrypt, encryptor);
            } else {
                LOGGER.trace("Found unencrypted value. Encryption will now be performed.");
                encrypt(strToDecrypt, configFieldToDecrypt, config);
                return strToDecrypt;
            }
        } catch (EncryptionOperationNotPossibleException e) {
            throw new MobiException("Could not encrypt/decrypt the " + configFieldToDecrypt + ". Make sure that you are not trying to decrypt a password that was " +
                    "encrypted with a different master password.", e);
        }
    }

    @Override
    public boolean isEnabled() {
        return this.isEnabled;
    }
}