package com.mobi.security.impl;

/*-
 * #%L
 * com.mobi.security.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import com.mobi.security.api.EncryptionServiceConfig;
import com.mobi.service.config.ConfigUtils;
import org.jasypt.encryption.StringEncryptor;
import org.jasypt.encryption.pbe.StandardPBEStringEncryptor;
import org.jasypt.exceptions.EncryptionOperationNotPossibleException;
import org.jasypt.iv.RandomIvGenerator;
import org.jasypt.properties.PropertyValueEncryptionUtils;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.junit.runner.RunWith;
import org.mockito.*;
import org.osgi.service.cm.Configuration;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;

import java.util.Dictionary;
import java.util.Hashtable;
import java.util.Map;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.mockito.Mockito.*;
import static org.powermock.api.mockito.PowerMockito.mockStatic;
import static org.powermock.api.mockito.PowerMockito.verifyStatic;

@RunWith(PowerMockRunner.class)
@PrepareForTest({ConfigUtils.class, PropertyValueEncryptionUtils.class})
@PowerMockIgnore("javax.crypto.*")
public class SimpleEncryptionServiceTest {
    private SimpleEncryptionService es;

    @Mock
    EncryptionServiceConfig encryptionServiceConfig;

    @Mock
    private Configuration configuration;

    @Rule
    public ExpectedException expectedEx = ExpectedException.none();

    @Captor
    private ArgumentCaptor<Map<String, Object>> configPropertiesCaptor;

    @Before
    public void setUp() throws Exception {
        MockitoAnnotations.initMocks(this);
        es = new SimpleEncryptionService();
        when(encryptionServiceConfig.enabled()).thenReturn(true);
    }

    @Test
    public void startNoPasswordTest() throws Exception {
        expectedEx.expect(MobiException.class);
        expectedEx.expectMessage("Password or variable must be set if encryption is enabled.");
        es.start(encryptionServiceConfig);
    }

    @Test
    public void startUsePasswordTest() throws Exception {
        when(encryptionServiceConfig.password()).thenReturn("TEST_MASTER_PASS");
        es.start(encryptionServiceConfig);
    }

    @Test
    public void startEnvVariableNotSetTest() throws Exception {
        expectedEx.expect(MobiException.class);
        expectedEx.expectMessage("Could not set encryption master password.");
        when(encryptionServiceConfig.variable()).thenReturn("MASTER_PASS");
        es.start(encryptionServiceConfig);
    }

    @Test
    public void startUseEnvVarTest() throws Exception {
        when(encryptionServiceConfig.variable()).thenReturn("TEST_MASTER_PASS_TEST"); // This environment variable is configured in the Maven Surefire Plugin
        es.start(encryptionServiceConfig);
    }

    @Test
    public void startChangeMasterPassTest() throws Exception {
        String testMasterPass = "TEST_MASTER_PASS";
        String testPasswordToBeEncrypted = "TEST_CLIENT_PASS";
        StandardPBEStringEncryptor encryptor = new StandardPBEStringEncryptor();
        encryptor.setPassword(testMasterPass);
        encryptor.setIvGenerator(new RandomIvGenerator());
        encryptor.setAlgorithm("PBEWithHmacSHA512AndAES_128");

        String toDecrypt = PropertyValueEncryptionUtils.encrypt(testPasswordToBeEncrypted, encryptor);
        assertEquals(true, PropertyValueEncryptionUtils.isEncryptedValue(toDecrypt));

        // Initialize first encryptor with master password
        when(encryptionServiceConfig.password()).thenReturn(testMasterPass);
        es.start(encryptionServiceConfig);

        when(configuration.getPid()).thenReturn("testEncryptionPid");

        // Decrypt
        String decrypted = es.decrypt(toDecrypt, "password", configuration);
        assertEquals(testPasswordToBeEncrypted, decrypted);

        String newMasterPass = "NEW_MASTER_PASS";
        when(encryptionServiceConfig.password()).thenReturn(newMasterPass);
        es.start(encryptionServiceConfig);

        when(configuration.getPid()).thenReturn("testEncryptionPid");
        expectedEx.expect(MobiException.class);
        expectedEx.expectMessage("Could not encrypt/decrypt");
        String unableToDecrypt = es.decrypt(toDecrypt, "password", configuration);
        expectedEx = ExpectedException.none();

        StandardPBEStringEncryptor newEncryptor = new StandardPBEStringEncryptor();
        newEncryptor.setPassword(newMasterPass);
        newEncryptor.setIvGenerator(new RandomIvGenerator());
        newEncryptor.setAlgorithm("PBEWithHmacSHA512AndAES_128");

        String newToDecrypt = PropertyValueEncryptionUtils.encrypt(testPasswordToBeEncrypted, encryptor);
        String newDecrypted = es.decrypt(newToDecrypt, "password", configuration);
        assertEquals(testPasswordToBeEncrypted, newDecrypted);
    }

    @Test
    public void encryptTest() throws Exception {
        String testPassword = "FAKE_PASSWORD";
        when(encryptionServiceConfig.password()).thenReturn("TEST_MASTER_PASS");

        Dictionary<String, Object> configProperties = new Hashtable<>();
        configProperties.put("password", testPassword);

        when(configuration.getProperties()).thenReturn(configProperties);
        when(configuration.getPid()).thenReturn("testEncryptionPid");

        es.start(encryptionServiceConfig);

        mockStatic(ConfigUtils.class);
        String encrypted = es.encrypt(testPassword, "password", configuration);
        verifyStatic();
        ConfigUtils.updateServiceConfig(configPropertiesCaptor.capture(), eq(configuration));

        assertEquals(true, PropertyValueEncryptionUtils.isEncryptedValue(encrypted));
        assertEquals(encrypted, configPropertiesCaptor.getValue().get("password").toString());
    }

    @Test
    public void alreadyEncryptedTest() throws Exception {
        String testPassword = "ENC(ABCDEFG)";
        when(encryptionServiceConfig.password()).thenReturn("TEST_MASTER_PASS");

        es.start(encryptionServiceConfig);

        String encrypted = es.encrypt(testPassword, "password", configuration);
        assertEquals(encrypted, testPassword);
    }

    @Test
    public void encryptNullTest() throws Exception {
        when(encryptionServiceConfig.password()).thenReturn("TEST_MASTER_PASS");
        es.start(encryptionServiceConfig);

        String encrypted = es.encrypt(null, "password", configuration);
        assertNull(encrypted);
    }

    @Test
    public void encryptionExceptionTest() throws Exception {
        expectedEx.expect(MobiException.class);
        expectedEx.expectMessage("Could not encrypt/decrypt");

        String testPassword = "FAKE_PASSWORD";
        when(encryptionServiceConfig.password()).thenReturn("TEST_MASTER_PASS");

        Dictionary<String, Object> configProperties = new Hashtable<>();
        configProperties.put("password", testPassword);

        when(configuration.getProperties()).thenReturn(configProperties);
        when(configuration.getPid()).thenReturn("testEncryptionPid");

        es.start(encryptionServiceConfig);

        mockStatic(PropertyValueEncryptionUtils.class);
        when(PropertyValueEncryptionUtils.encrypt(anyString(), any(StringEncryptor.class))).thenThrow(EncryptionOperationNotPossibleException.class);
        es.encrypt(testPassword, "password", configuration);
        verifyStatic();
        PropertyValueEncryptionUtils.encrypt(anyString(), any(StringEncryptor.class));
    }

    @Test
    public void decryptTest() throws Exception {
        String testMasterPass = "TEST_MASTER_PASS";
        String testPasswordToBeEncrypted = "TEST_CLIENT_PASS";
        StandardPBEStringEncryptor encryptor = new StandardPBEStringEncryptor();
        encryptor.setPassword(testMasterPass);
        encryptor.setIvGenerator(new RandomIvGenerator());
        encryptor.setAlgorithm("PBEWithHmacSHA512AndAES_128");

        String toDecrypt = PropertyValueEncryptionUtils.encrypt(testPasswordToBeEncrypted, encryptor);
        assertEquals(true, PropertyValueEncryptionUtils.isEncryptedValue(toDecrypt));

        when(encryptionServiceConfig.password()).thenReturn(testMasterPass);
        es.start(encryptionServiceConfig);

        when(configuration.getPid()).thenReturn("testEncryptionPid");
        String decrypted = es.decrypt(toDecrypt, "password", configuration);
        assertEquals(testPasswordToBeEncrypted, decrypted);
    }

    @Test
    public void alreadyDecryptedTest() throws Exception {
        String testPlaintextPass = "TEST_PLAINTEXT_PASS";
        SimpleEncryptionService spyEncryptionService = spy(es);
        when(encryptionServiceConfig.password()).thenReturn("TEST_MASTER_PASS");
        spyEncryptionService.start(encryptionServiceConfig);

        when(configuration.getPid()).thenReturn("testEncryptionPid");
        doReturn("ENC(ABCDEFG)").when(spyEncryptionService).encrypt(any(), any(), any());
        String decrypted = spyEncryptionService.decrypt(testPlaintextPass, "password", configuration);
        verify(spyEncryptionService, times(1)).encrypt(any(), any(), any());
        assertEquals(testPlaintextPass, decrypted);
    }

    @Test
    public void decryptNullTest() throws Exception {
        when(encryptionServiceConfig.password()).thenReturn("TEST_MASTER_PASS");
        es.start(encryptionServiceConfig);

        String decrypted = es.decrypt(null, "password", configuration);
        assertNull(decrypted);
    }

    @Test
    public void decryptionExceptionTest() throws Exception {
        expectedEx.expect(MobiException.class);
        expectedEx.expectMessage("Could not encrypt/decrypt");

        String testMasterPass = "TEST_MASTER_PASS";
        String bogusEncrypedString = "ENC(ABCDEFG)";
        when(encryptionServiceConfig.password()).thenReturn(testMasterPass);
        es.start(encryptionServiceConfig);

        when(configuration.getPid()).thenReturn("testEncryptionPid");
        es.decrypt(bogusEncrypedString, "password", configuration);
    }
}
