package org.matonto.jaas.realm;

/*-
 * #%L
 * org.matonto.jaas
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

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.ConfigurationPolicy;
import aQute.bnd.annotation.component.Modified;
import aQute.bnd.annotation.metatype.Configurable;
import org.apache.karaf.jaas.boot.ProxyLoginModule;
import org.apache.karaf.jaas.config.JaasRealm;
import org.matonto.jaas.config.LoginModuleConfig;
import org.osgi.framework.BundleContext;

import javax.security.auth.login.AppConfigurationEntry;
import java.io.File;
import java.util.HashMap;
import java.util.Map;

@Component(
        immediate = true,
        designateFactory = RealmConfig.class,
        configurationPolicy = ConfigurationPolicy.require,
        properties = { "realmId=matonto" }
)
public class MatontoRealm implements JaasRealm {

    private static final String KARAF_ETC = System.getProperty("karaf.etc");
    private static final String REALM = "matonto";
    private static final String PROPERTIES_MODULE = "org.apache.karaf.jaas.modules.properties.PropertiesLoginModule";
    private static final String TOKEN_MODULE = "org.matonto.jaas.modules.token.TokenLoginModule";

    private BundleContext bundleContext;
    private volatile Map<String, Object> properties;

    @Activate
    public void start(BundleContext bundleContext, Map<String, Object> properties) {
        this.bundleContext = bundleContext;
        updated(properties);
    }

    @Modified
    public void updated(Map<String, Object> properties) {
        this.properties = properties;
    }

    @Override
    public String getName() {
        return REALM;
    }

    @Override
    public int getRank() {
        return 0;
    }

    @Override
    public AppConfigurationEntry[] getEntries() {
        RealmConfig config = Configurable.createConfigurable(RealmConfig.class, properties);

        Map<String, Object> propertiesOptions = new HashMap<>();
        propertiesOptions.put(BundleContext.class.getName(), bundleContext);
        propertiesOptions.put(ProxyLoginModule.PROPERTY_MODULE, PROPERTIES_MODULE);
        propertiesOptions.put(ProxyLoginModule.PROPERTY_BUNDLE, Long.toString(bundleContext.getBundle().getBundleId()));
        propertiesOptions.put(LoginModuleConfig.USERS_FILE, KARAF_ETC + File.separatorChar + "matonto-users.properties");
        propertiesOptions.put("detailed.login.exception", properties.get("detailed.login.exception"));
        propertiesOptions.put("encryption.name", config.encryptionName());
        propertiesOptions.put("encryption.enabled", config.encryptionEnabled());
        propertiesOptions.put("encryption.prefix", config.encryptionPrefix());
        propertiesOptions.put("encryption.suffix", config.encryptionSuffix());
        propertiesOptions.put("encryption.algorithm", config.encryptionAlgorithm());
        propertiesOptions.put("encryption.encoding", config.encryptionEncoding());

        Map<String, Object> tokenOptions = new HashMap<>();
        tokenOptions.put(BundleContext.class.getName(), bundleContext);
        tokenOptions.put(ProxyLoginModule.PROPERTY_MODULE, TOKEN_MODULE);
        tokenOptions.put(ProxyLoginModule.PROPERTY_BUNDLE, Long.toString(bundleContext.getBundle().getBundleId()));
        tokenOptions.put(LoginModuleConfig.USERS_FILE, KARAF_ETC + File.separatorChar + "matonto-users.properties");
        tokenOptions.put("detailed.login.exception", properties.get("detailed.login.exception"));
        tokenOptions.put("encryption.name", config.encryptionName());
        tokenOptions.put("encryption.enabled", config.encryptionEnabled());
        tokenOptions.put("encryption.prefix", config.encryptionPrefix());
        tokenOptions.put("encryption.suffix", config.encryptionSuffix());
        tokenOptions.put("encryption.algorithm", config.encryptionAlgorithm());
        tokenOptions.put("encryption.encoding", config.encryptionEncoding());

        return new AppConfigurationEntry[] {
                new AppConfigurationEntry(ProxyLoginModule.class.getName(),
                        AppConfigurationEntry.LoginModuleControlFlag.OPTIONAL, propertiesOptions),
                new AppConfigurationEntry(ProxyLoginModule.class.getName(),
                        AppConfigurationEntry.LoginModuleControlFlag.OPTIONAL, tokenOptions),
        };
    }
}
