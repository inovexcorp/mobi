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

import java.util.Map;
import org.osgi.service.cm.Configuration;

public interface EncryptionService {
    String encrypt(String strToEncrypt, String configFieldToUpdate, Configuration config);

    String decrypt(String strToDecrypt, String configFieldToDecrypt, Configuration config);

    boolean isEnabled();

    // Add interface method for updating service config?
}
