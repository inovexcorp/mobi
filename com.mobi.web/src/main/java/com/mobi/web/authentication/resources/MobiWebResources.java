package com.mobi.web.authentication.resources;

/*-
 * #%L
 * com.mobi.web
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

import com.mobi.web.security.resources.WebResources;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Deactivate;
import org.osgi.service.http.whiteboard.HttpWhiteboardConstants;
import org.osgi.service.http.whiteboard.propertytypes.HttpWhiteboardContextSelect;
import org.osgi.service.http.whiteboard.propertytypes.HttpWhiteboardResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component(service = { MobiWebResources.class, WebResources.class }, immediate = true)
@HttpWhiteboardResource(pattern = "/*", prefix = "/build")
@HttpWhiteboardContextSelect("(" + HttpWhiteboardConstants.HTTP_WHITEBOARD_CONTEXT_NAME + "="
  + com.mobi.web.authentication.resources.MobiContextHelper.NAME + ")")
public class MobiWebResources implements WebResources {
    private final Logger log = LoggerFactory.getLogger(this.getClass().getName());

    @Activate
    public void start() {
        log.info("MobiWebResources registered");
    }

    @Deactivate
    public void stop() {
        log.info("MobiWebResources stopped");
    }

    @Override
    public String getAlias() {
        return "/mobi";
    }

    @Override
    public boolean isBaseApp() {
        return true;
    }
}
