package com.mobi.web.authentication.filter;

/*-
 * #%L
 * com.mobi.web
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

import com.nimbusds.jwt.SignedJWT;
import com.mobi.jaas.api.utils.TokenUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class WritePayload implements Filter {

    private final Logger log = LoggerFactory.getLogger(this.getClass().getName());

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        log.debug("Initialized Filter.");
    }

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain)
            throws IOException, ServletException {
        log.debug("Writing Payload to Response.");

        HttpServletRequest request = (HttpServletRequest) servletRequest;
        HttpServletResponse response = (HttpServletResponse) servletResponse;

        SignedJWT token = (SignedJWT) request.getAttribute(TokenUtils.VERIFIED_TOKEN);
        if (token == null) {
            throw new ServletException("Token does not exist.");
        }

        String payload = token.getPayload().toString();
        response.getWriter().write(payload);
        response.getWriter().flush();

        response.setContentType("application/json");
    }

    @Override
    public void destroy() {
        log.debug("Destroyed Filter.");
    }
}
