package org.matonto.web.security;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.eclipsesource.jaxrs.provider.security.AuthenticationHandler;
import com.eclipsesource.jaxrs.provider.security.AuthorizationHandler;
import org.apache.commons.lang3.StringUtils;
import org.apache.karaf.jaas.boot.principal.RolePrincipal;
import org.apache.karaf.jaas.config.JaasRealm;
import org.apache.log4j.Logger;
import org.matonto.jaas.modules.token.TokenCallback;
import org.matonto.jaas.utils.TokenUtils;

import javax.security.auth.Subject;
import javax.security.auth.callback.Callback;
import javax.security.auth.callback.UnsupportedCallbackException;
import javax.security.auth.login.LoginContext;
import javax.security.auth.login.LoginException;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.SecurityContext;
import java.security.Principal;
import java.util.Set;
import java.util.stream.Collectors;

@Component(immediate = true)
public class RestSecurityHandler implements AuthenticationHandler, AuthorizationHandler {

    private static final Logger LOG = Logger.getLogger(RestSecurityHandler.class.getName());

    protected JaasRealm realm;
    private final static String ROLE_CLASS = "org.apache.karaf.jaas.boot.principal.RolePrincipal";

    @Reference(target = "(realmId=matonto)")
    protected void setRealm(JaasRealm realm) {
        this.realm = realm;
    }

    @Override
    public Principal authenticate(ContainerRequestContext containerRequestContext) {
        Subject subject = new Subject();
        String tokenString = TokenUtils.getTokenString(containerRequestContext);

        LoginContext loginContext;
        try {
            loginContext = new LoginContext(realm.getName(), subject, callbacks -> {
                for (Callback callback : callbacks) {
                    if (callback instanceof TokenCallback) {
                        ((TokenCallback) callback).setTokenString(tokenString);
                    } else {
                        throw new UnsupportedCallbackException(callback);
                    }
                }
            });
            loginContext.login();
        } catch (LoginException e) {
            LOG.debug("Authentication failed.");
            return null;
        }

        Set<String> roles = subject.getPrincipals().stream()
                .filter(p -> p.getClass().getName().equals(ROLE_CLASS))
                .map(Principal::getName)
                .collect(Collectors.toSet());

        // Return all roles as comma separated String because this security provider forces us
        // to return a Principal instead of a Subject. Lame.
        return new RolePrincipal(StringUtils.join(roles, ","));
    }

    @Override
    public String getAuthenticationScheme() {
        return SecurityContext.BASIC_AUTH;
    }

    @Override
    public boolean isUserInRole(Principal principal, String role) {
        if (principal.getClass().getName().equals(ROLE_CLASS)) {
            for (String userRole : principal.getName().split(",")) {
                if (userRole.equals(role)) {
                    return true;
                }
            }
        }

        return false;
    }
}
