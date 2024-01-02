package com.mobi.swagger.ui;

/*-
 * #%L
 * com.mobi.swagger.ui
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

import org.osgi.service.component.ComponentContext;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.ServiceScope;
import org.osgi.service.http.context.ServletContextHelper;
import org.osgi.service.http.whiteboard.propertytypes.HttpWhiteboardContext;

import java.net.URL;
import java.util.Set;

@Component(service = ServletContextHelper.class, scope = ServiceScope.BUNDLE)
@HttpWhiteboardContext(name = SwaggerContextHelper.NAME, path = "/swagger-ui")
public class SwaggerContextHelper extends ServletContextHelper {
    public static final String NAME = "swagger";

    private ServletContextHelper delegatee;

    @Activate
    private void activate(final ComponentContext ctx) {
        delegatee = new ServletContextHelper(ctx.getUsingBundle()) {};
    }

    @Override
    public URL getResource(String name) {
        if ("swagger/".equals(name) || !name.matches("^.*\\.[^\\\\]+$")) {
            return delegatee.getResource("swagger/index.html");
        }
        return delegatee.getResource(name);
    }

    @Override
    public String getMimeType(String name) {
        return delegatee.getMimeType(name);
    }

    @Override
    public Set<String> getResourcePaths(String path) {
        return delegatee.getResourcePaths(path);
    }

    @Override
    public String getRealPath(String path) {
        return delegatee.getRealPath(path);
    }

}
