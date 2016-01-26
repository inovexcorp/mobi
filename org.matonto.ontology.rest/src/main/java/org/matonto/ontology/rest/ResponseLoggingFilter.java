package org.matonto.ontology.rest;

import aQute.bnd.annotation.component.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;

import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerResponseContext;
import javax.ws.rs.container.ContainerResponseFilter;
import javax.ws.rs.ext.Provider;

@Provider
@Component(immediate = true)
public class ResponseLoggingFilter implements ContainerResponseFilter {

    private final Logger log = LoggerFactory.getLogger(ResponseLoggingFilter.class);

    @Override
    public void filter(ContainerRequestContext containerRequestContext, ContainerResponseContext
            containerResponseContext) throws IOException {
        if (log.isDebugEnabled()) {
            String path = containerRequestContext.getUriInfo().getPath();
            String method = containerRequestContext.getMethod();
            int statusCode = containerResponseContext.getStatusInfo().getStatusCode();
            String statusMsg = containerResponseContext.getStatusInfo().getReasonPhrase();

            log.debug(String.format("%s: %s -> %d: %s", method, path, statusCode, statusMsg));
        }
    }
}