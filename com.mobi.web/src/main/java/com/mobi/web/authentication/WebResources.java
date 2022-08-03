package com.mobi.web.authentication;

/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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

import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Deactivate;
import org.ops4j.pax.web.service.whiteboard.ResourceMapping;
import org.osgi.service.http.whiteboard.HttpWhiteboardConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component(service = { WebResources.class, ResourceMapping.class }, immediate = true)
public class WebResources implements ResourceMapping {

    private final Logger log = LoggerFactory.getLogger(this.getClass().getName());

    @Activate
    public void start() {
        log.info("WebResources registered");
    }

    @Deactivate
    public void stop() {
        log.info("WebResources stopped");
    }

    @Override
    public String getContextId() {
        return UITokenContext.CONTEXT_ID;
    }

    @Override
    public String getAlias() {
        return "/mobi";
    }

    @Override
    public String[] getUrlPatterns() {
        return new String[0];
    }

    @Override
    public String getPath() {
        return "build";
    }

    @Override
    public String getContextSelectFilter() {
        return String.format("(%s=%s)", HttpWhiteboardConstants.HTTP_WHITEBOARD_CONTEXT_NAME,
                UITokenContext.CONTEXT_ID);
    }
}
