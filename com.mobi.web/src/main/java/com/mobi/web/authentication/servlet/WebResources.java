package com.mobi.web.authentication.servlet;

/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
import aQute.bnd.annotation.component.Deactivate;
import com.mobi.web.authentication.context.UITokenContext;
import org.ops4j.pax.web.service.whiteboard.ResourceMapping;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component(
        provide = { WebResources.class, ResourceMapping.class }
)
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
    public String getHttpContextId() {
        return UITokenContext.CONTEXT_ID;
    }

    @Override
    public String getAlias() {
        return "/mobi";
    }

    @Override
    public String getPath() {
        return "build";
    }
}
