package com.mobi.security.impl;

import com.mobi.exception.MobiException;
import com.mobi.security.api.EncryptionServiceConfig;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import static org.mockito.Mockito.when;

public class SimpleEncryptionServiceTest {
    private SimpleEncryptionService es;

    @Mock
    EncryptionServiceConfig encryptionServiceConfig;

    @Rule
    public ExpectedException expectedEx = ExpectedException.none();

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
        when(encryptionServiceConfig.password()).thenReturn("TEST_MASTER_PASS");
        es.start(encryptionServiceConfig);
        when(encryptionServiceConfig.password()).thenReturn("TEST_NEW_PASS");
        es.start(encryptionServiceConfig);
    }
}