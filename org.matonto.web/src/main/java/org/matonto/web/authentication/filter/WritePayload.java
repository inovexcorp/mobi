package org.matonto.web.authentication.filter;

import com.nimbusds.jwt.SignedJWT;
import org.apache.log4j.Logger;
import org.matonto.jaas.utils.TokenUtils;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public class WritePayload implements Filter {

    private final Logger log = Logger.getLogger(this.getClass().getName());

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
