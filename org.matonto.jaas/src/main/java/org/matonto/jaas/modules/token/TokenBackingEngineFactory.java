package org.matonto.jaas.modules.token;

import aQute.bnd.annotation.component.Component;
import org.apache.karaf.jaas.modules.BackingEngine;
import org.apache.karaf.jaas.modules.BackingEngineFactory;
import org.apache.karaf.jaas.modules.encryption.EncryptionSupport;
import org.matonto.jaas.config.LoginModuleConfig;

import java.util.Map;

@Component(immediate = true)
public class TokenBackingEngineFactory implements BackingEngineFactory {

    @Override
    public String getModuleClass() {
        return TokenLoginModule.class.getName();
    }

    @Override
    public BackingEngine build(Map<String, ?> options) {
        String usersFileString = (String) options.get(LoginModuleConfig.USERS_FILE);
        EncryptionSupport encryptionSupport = new EncryptionSupport(options);
        return new TokenBackingEngine(usersFileString, encryptionSupport);
    }
}
