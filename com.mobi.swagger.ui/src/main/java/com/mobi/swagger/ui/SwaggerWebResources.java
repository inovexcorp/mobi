package com.mobi.swagger.ui;

/*-
 * #%L
 * com.mobi.swagger.ui
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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

@Component(service = { SwaggerWebResources.class, WebResources.class }, immediate = true)
@HttpWhiteboardContextSelect("(" + HttpWhiteboardConstants.HTTP_WHITEBOARD_CONTEXT_NAME + "="
        + SwaggerContextHelper.NAME + ")")
@HttpWhiteboardResource(pattern = "/*", prefix = "/swagger")
public class SwaggerWebResources implements WebResources {
    private final Logger log = LoggerFactory.getLogger(this.getClass().getName());

    @Activate
    public void start() {
        log.info("SwaggerWebResources registered");
    }

    @Deactivate
    public void stop() {
        log.info("SwaggerWebResources stopped");
    }

    @Override
    public String getAlias() {
        return "/swagger-ui";
    }
}
