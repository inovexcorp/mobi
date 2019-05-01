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
import aQute.bnd.annotation.component.Reference;
import com.mobi.web.authentication.context.UserCurrentTokenContext;
import org.ops4j.pax.web.service.whiteboard.ServletMapping;
import org.osgi.service.http.HttpContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import javax.servlet.MultipartConfigElement;
import javax.servlet.Servlet;

@Component
public class UserCurrentTokenServletMapping implements ServletMapping {

    private final Logger log = LoggerFactory.getLogger(this.getClass().getName());
    private HttpContext context;
    private Servlet servlet;

    @Reference(target = "(httpContext.id=" + UserCurrentTokenContext.CONTEXT_ID + ")")
    void setHttpContext(HttpContext context) {
        this.context = context;
    }

    @Activate
    void setup() {
        log.trace("Starting UserCurrentTokenServletMapping");
        this.servlet = new UserServlet();
    }

    @Override
    public String getHttpContextId() {
        return UserCurrentTokenContext.CONTEXT_ID;
    }

    @Override
    public Servlet getServlet() {
        return servlet;
    }

    @Override
    public String getServletName() {
        return UserCurrentTokenServletMapping.class.getName();
    }

    @Override
    public String getAlias() {
        return "/mobirest/user/current";
    }

    @Override
    public String[] getUrlPatterns() {
        return new String[0];
    }

    @Override
    public Map<String, String> getInitParams() {
        return null;
    }

    @Override
    public Integer getLoadOnStartup() {
        return 1;
    }

    @Override
    public Boolean getAsyncSupported() {
        return false;
    }

    @Override
    public MultipartConfigElement getMultipartConfig() {
        return null;
    }
}
