package org.matonto.jaas.modules.token;

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
