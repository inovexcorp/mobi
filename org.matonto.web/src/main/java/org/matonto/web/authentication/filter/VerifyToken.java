package org.matonto.web.authentication.filter;

import com.nimbusds.jwt.SignedJWT;
import org.apache.log4j.Logger;
import org.matonto.web.authentication.utils.TokenUtils;

import java.io.IOException;
import java.util.Optional;
import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class VerifyToken implements Filter {

    private final Logger log = Logger.getLogger(this.getClass().getName());

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        log.debug("Initialized Filter.");
    }

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain)
            throws IOException, ServletException {
        log.debug("Verifying Token...");

        HttpServletRequest request = (HttpServletRequest) servletRequest;
        HttpServletResponse response = (HttpServletResponse) servletResponse;

        boolean verified;

        String token = TokenUtils.getTokenString(request);
        Optional<SignedJWT> tokenOptional = TokenUtils.verifyToken(token, response);

        verified = (token != null) && tokenOptional.isPresent();

        if (verified) {
            log.debug("Token verified.");
            request.setAttribute(TokenUtils.VERIFIED_TOKEN, tokenOptional.get());
        } else {
            log.debug("Token missing or verification failed.");
            request.setAttribute(TokenUtils.TOKEN_VERIFICATION_FAILED, true);
        }

        filterChain.doFilter(servletRequest, servletResponse);
    }

    @Override
    public void destroy() {
        log.debug("Destroyed Filter.");
    }
}
