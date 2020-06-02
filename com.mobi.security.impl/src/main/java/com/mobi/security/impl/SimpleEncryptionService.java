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
import org.jasypt.encryption.pbe.StandardPBEStringEncryptor;
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


import java.io.IOException;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component(service = SimpleEncryptionService.class, immediate = true, configurationPolicy = ConfigurationPolicy.REQUIRE)
@Designate(ocd = EncryptionServiceConfig.class)
public class SimpleEncryptionService implements EncryptionService {

    private static final String AES_128 = "PBEWithHmacSHA512AndAES_128";
    private static final Logger LOGGER = LoggerFactory.getLogger(SimpleEncryptionService.class);
    private StandardPBEStringEncryptor encryptor = new StandardPBEStringEncryptor(); // Make final?
    private boolean isEnabled;

    @Activate
    protected void start(final EncryptionServiceConfig encryptionServiceConfig) {
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
        LOGGER.info("Going to encrypt strToEncrypt");
        if (strToEncrypt == null) {
            return null;
        } else if (PropertyValueEncryptionUtils.isEncryptedValue(strToEncrypt)) {
            return strToEncrypt;
        } else {
            String encrypted = PropertyValueEncryptionUtils.encrypt(strToEncrypt, encryptor);
            List<String> keys = Collections.list(config.getProperties().keys());
            Map<String, Object> configurationData = keys.stream()
                    .collect(Collectors.toMap(Function.identity(), config.getProperties()::get));
            configurationData.put(configFieldToUpdate, encrypted);
            updateServiceConfig(configurationData, config);
            return encrypted;
        }
    }

    @Override
    public String decrypt(String strToDecrypt, String configFieldToDecrypt, final Configuration config) {
        if (strToDecrypt == null) {
            return null;
        } else if (PropertyValueEncryptionUtils.isEncryptedValue(strToDecrypt)) {
            return PropertyValueEncryptionUtils.decrypt(strToDecrypt, encryptor); // TODO: Don't see a point in checking for length of zero like ticket prescribes. Discuss with reviewer.
        } else {
            encrypt(strToDecrypt, configFieldToDecrypt, config);
            return strToDecrypt;
        }
    }

    @Override
    public boolean isEnabled() {
        return this.isEnabled;
    }

    private void updateServiceConfig(final Map<String, Object> newConfigurationData, Configuration config) {
        try {
            LOGGER.info("Going to update service config with encrypted password");
            config.update(new Hashtable<>(newConfigurationData));
        } catch (IOException e) {
            LOGGER.error("Issue saving encrypted password to service configuration.", e);
            // TODO: Come up with a way to identify the service without passing in service name. Passing in service name just to put in log statement feels wrong.
//            LOGGER.error("Issue saving server id to service configuration: " + SERVICE_NAME, e);
            // Continue along, since we'll just re-generate the service configuration next time the server starts.
        }
    }


}
