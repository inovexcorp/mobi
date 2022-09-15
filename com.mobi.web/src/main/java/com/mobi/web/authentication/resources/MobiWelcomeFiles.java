package com.mobi.web.authentication.resources;

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

import com.mobi.web.authentication.UITokenContext;
import org.ops4j.pax.web.service.whiteboard.WelcomeFileMapping;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.http.whiteboard.HttpWhiteboardConstants;

@Component(service = { MobiWelcomeFiles.class, WelcomeFileMapping.class }, immediate = true)
public class MobiWelcomeFiles implements WelcomeFileMapping {
    @Override
    public boolean isRedirect() {
        return false;
    }

    @Override
    public String[] getWelcomeFiles() {
        return new String[]{"index.html"};
    }

    @Override
    public String getContextSelectFilter() {
        return String.format("(%s=%s)", HttpWhiteboardConstants.HTTP_WHITEBOARD_CONTEXT_NAME,
                UITokenContext.CONTEXT_ID);
    }

    @Override
    public String getContextId() {
        return UITokenContext.CONTEXT_ID;
    }
}
