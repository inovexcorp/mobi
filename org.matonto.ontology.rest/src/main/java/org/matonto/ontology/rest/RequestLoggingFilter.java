package org.matonto.ontology.rest;

import aQute.bnd.annotation.component.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;

import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerRequestFilter;
import javax.ws.rs.ext.Provider;

@Provider
@Component(immediate = true)
public class RequestLoggingFilter implements ContainerRequestFilter {

    private final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);

    @Override
    public void filter(ContainerRequestContext containerRequestContext) throws IOException {
        if (log.isDebugEnabled()) {
            containerRequestContext.setProperty(Filters.REQ_START_TIME, System.currentTimeMillis());

            String path = containerRequestContext.getUriInfo().getPath();
            String method = containerRequestContext.getMethod();
            log.debug(String.format("%s: %s", method, path));
        }
    }
}
