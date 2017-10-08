package com.mobi.platform.config.impl.application;

/*-
 * #%L
 * com.mobi.platform.config.impl
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
import aQute.bnd.annotation.component.Reference;
import com.mobi.platform.config.api.ontologies.platformconfig.Application;
import com.mobi.platform.config.api.application.ApplicationManager;
import com.mobi.platform.config.api.application.ApplicationWrapper;
import com.mobi.platform.config.api.ontologies.platformconfig.Application;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Component(
        immediate = true,
        name = SimpleApplicationManager.COMPONENT_NAME
)
public class SimpleApplicationManager implements ApplicationManager {
    public static final String COMPONENT_NAME = "com.mobi.platform.config.api.ApplicationManager";
    private Map<String, ApplicationWrapper> applications = new HashMap<>();

    @Reference(type = '*', dynamic = true)
    public void addApplication(ApplicationWrapper applicationWrapper) {
        applications.put(applicationWrapper.getId(), applicationWrapper);
    }

    public void removeApplication(ApplicationWrapper applicationWrapper) {
        applications.remove(applicationWrapper.getId());
    }

    @Override
    public boolean applicationExists(String applicationId) {
        return applications.containsKey(applicationId);
    }

    @Override
    public Optional<Application> getApplication(String applicationId) {
        if (!applicationExists(applicationId)) {
            return Optional.empty();
        }
        return Optional.ofNullable(applications.get(applicationId).getApplication());
    }
}
