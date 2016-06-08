package org.matonto.web.security;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.eclipsesource.jaxrs.provider.security.AuthenticationHandler;
import com.eclipsesource.jaxrs.provider.security.AuthorizationHandler;
import com.nimbusds.jwt.SignedJWT;
import org.apache.http.auth.BasicUserPrincipal;
import org.apache.karaf.jaas.config.JaasRealm;
import org.apache.log4j.Logger;
import org.matonto.web.security.utils.TokenUtils;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.SecurityContext;
import java.security.Principal;
import java.text.ParseException;
import java.util.Optional;

@Component
public class SecurityHandler implements AuthenticationHandler, AuthorizationHandler {

    private static final Logger LOG = Logger.getLogger(TokenUtils.class.getName());

    protected JaasRealm realm;
    private final static String REQUIRED_ROLE = "user";

    @Reference
    protected void setRealm(JaasRealm realm) {
        this.realm = realm;
    }

    @Override
    public Principal authenticate(ContainerRequestContext containerRequestContext) {
        String tokenString = TokenUtils.getTokenString(containerRequestContext);
        Optional<SignedJWT> tokenOptional = TokenUtils.verifyToken(tokenString);

        if (tokenOptional.isPresent()) {
            LOG.debug("Token found and verified.");

            SignedJWT token = tokenOptional.get();

            String scope;
            String subject;
            try {
                scope = token.getJWTClaimsSet().getStringClaim("scope");
                subject = token.getJWTClaimsSet().getSubject();
            } catch (ParseException e) {
                String msg = "Problem Parsing JWT Token";
                LOG.error(msg, e);
                throw new WebApplicationException(msg, e, Response.Status.INTERNAL_SERVER_ERROR);
            }

            if (scope.equals(TokenUtils.ANON_SCOPE)) {
                LOG.debug("Anon user rejected.");
                return null;
            }

            return new BasicUserPrincipal(subject);
        } else {
            LOG.debug("Token missing or unverified.");
            return null;
        }
    }

    @Override
    public String getAuthenticationScheme() {
        return SecurityContext.BASIC_AUTH;
    }

    @Override
    public boolean isUserInRole(Principal principal, String role) {
        return role.equals(REQUIRED_ROLE);
    }
}
