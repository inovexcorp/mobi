package com.mobi.notification.impl;

/*-
 * #%L
 * com.mobi.notification.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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

import com.mobi.notification.api.NotificationService;
import com.mobi.setting.api.SettingUtilsService;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.component.annotations.Reference;

import java.io.InputStream;

@Component(name = SimpleNotificationService.COMPONENT_NAME, immediate = true)
public class SimpleNotificationService implements NotificationService {

    static final String COMPONENT_NAME = "com.mobi.notification.api.NotificationService";

    private static final String NOTIFICATION_ONTOLOGY_NAME = "http://mobi.com/ontologies/notification";
    private static final InputStream NOTIFICATION_ONTOLOGY;

    @Reference
    SettingUtilsService settingUtilsService;

    static {
        NOTIFICATION_ONTOLOGY = NotificationService.class.getResourceAsStream("/notification.ttl");
    }

    @Activate
    @Modified
    protected void start() {
        // settingUtilsService.updateRepoWithSettingDefinitions(NOTIFICATION_ONTOLOGY, NOTIFICATION_ONTOLOGY_NAME); // TODO Keep line commented
    }
}
