package org.matonto.jaas.modules.token;

import aQute.bnd.annotation.component.Component;
import org.apache.karaf.jaas.modules.BackingEngine;
import org.apache.karaf.jaas.modules.BackingEngineFactory;
import org.apache.karaf.jaas.modules.encryption.EncryptionSupport;

import java.util.Map;

@Component(immediate = true)
public class TokenBackingEngineFactory implements BackingEngineFactory {

    private static final String USER_FILE = "users";

    @Override
    public String getModuleClass() {
        return TokenLoginModule.class.getName();
    }

    @Override
    public BackingEngine build(Map<String, ?> options) {
        String usersFileString = (String) options.get(USER_FILE);
        EncryptionSupport encryptionSupport = new EncryptionSupport(options);
        return new TokenBackingEngine(usersFileString, encryptionSupport);
    }
}
