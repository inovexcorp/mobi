package org.matonto.web.authentication;

/*-
 * #%L
 * org.matonto.web
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

import org.matonto.jaas.api.config.MatontoConfiguration;
import org.matonto.jaas.api.engines.EngineManager;
import org.matonto.jaas.api.ontologies.usermanagement.Role;
import org.matonto.jaas.api.principals.UserPrincipal;
import org.matonto.web.security.util.RestSecurityUtils;
import org.osgi.framework.Bundle;
import org.osgi.framework.BundleContext;
import org.osgi.framework.wiring.BundleWire;
import org.osgi.framework.wiring.BundleWiring;
import org.osgi.service.http.HttpContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.security.Principal;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.stream.Collectors;
import javax.security.auth.Subject;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public abstract class AuthHttpContext implements HttpContext {

    private final Logger log = LoggerFactory.getLogger(this.getClass().getName());

    private final ConcurrentMap<String, URL> resourceCache = new ConcurrentHashMap<>();

    protected MatontoConfiguration configuration;
    protected EngineManager engineManager;

    private final static String REQUIRED_ROLE = "user";

    public void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
    }

    public void setConfiguration(MatontoConfiguration configuration) {
        this.configuration = configuration;
    }

    /**
     * The bundle that registered the service.
     */
    protected Bundle bundle;

    /**
     * The root path of the web app inside the bundle.
     */
    protected String rootPath = "/";

    public void setBundle(Bundle bundle) {
        this.bundle = bundle;
    }

    public void setRootPath(String rootPath) {
        this.rootPath = rootPath;
    }

    static final URL NO_URL;

    static {
        try {
            NO_URL = new URL("http:");
        } catch (MalformedURLException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public boolean handleSecurity(HttpServletRequest req, HttpServletResponse res) throws IOException {
        log.debug("Requesting Authorization...");

        if (handleAuth(req, res)) {
            log.debug("Authorization Granted.");
            return true;
        } else {
            log.debug("Authorization Denied.");
            handleAuthDenied(req, res);
            return false;
        }
    }

    protected abstract boolean handleAuth(HttpServletRequest req, HttpServletResponse res) throws IOException;

    protected abstract void handleAuthDenied(HttpServletRequest req, HttpServletResponse res) throws IOException;

    protected boolean authenticated(HttpServletRequest req, String username, String password) {
        Optional<Subject> subjectOptional = doAuthenticate(username, password);

        if (subjectOptional.isPresent()) {
            req.setAttribute(REMOTE_USER, username);
            return true;
        } else {
            return false;
        }
    }

    public Optional<Subject> doAuthenticate(final String username, final String password) {
        Subject subject = new Subject();

        if (!RestSecurityUtils.authenticateUser("matonto", subject, username, password, configuration)) {
            return Optional.empty();
        }

        List<Principal> principals = subject.getPrincipals().stream()
                .filter(p -> p instanceof UserPrincipal)
                .collect(Collectors.toList());
        if (principals.isEmpty()) {
            log.debug("No UserPrincipals found");
            return Optional.empty();
        }
        boolean found = false;
        for (Role role : engineManager.getUserRoles(principals.get(0).getName())) {
            if (role.getResource().stringValue().contains(REQUIRED_ROLE)) {
                found = true;
                break;
            }
        }
        if (!found) {
            log.debug("User does not have the required role " + REQUIRED_ROLE);
            return Optional.empty();
        }
        return Optional.of(subject);
    }

    @Override
    public URL getResource(String name) {
        final String normalizedName = normalizeResourcePath(rootPath + (name.startsWith("/") ? "" : "/") + name).trim();

        log.debug(String.format("Searching bundle " + bundle + " for resource [%s], normalized to [%s]",
                name, normalizedName));

        URL url = resourceCache.get(normalizedName);

        if (url == null && !normalizedName.isEmpty()) {
            url = bundle.getEntry(normalizedName);
            if (url == null) {
                log.debug("getEntry failed, trying with /META-INF/resources/ in bundle class space");
                // Search attached bundles for web-fragments
                Set<Bundle> bundlesInClassSpace = getBundlesInClassSpace(bundle, new HashSet<>());
                for (Bundle bundleInClassSpace : bundlesInClassSpace) {
                    url = bundleInClassSpace.getEntry("/META-INF/resources/" + normalizedName);
                    if (url != null) {
                        break;
                    }
                }
            }
            // obviously still not found might be available from a attached bundle resource
            if (url == null) {
                log.debug("getEntry failed, fallback to getResource");
                url = bundle.getResource(normalizedName);
            }
            if (url == null) {
                log.debug("getResource failed, fallback to system bundle getResource");
                url = bundle.getClass().getClassLoader().getResource(normalizedName);
            }
            if (url == null) {
                url = NO_URL;
            }
            resourceCache.putIfAbsent(normalizedName, url);
        }

        if (url != null && url != NO_URL) {
            log.debug(String.format("Resource found as url [%s]", url));
        } else {
            log.debug("Resource not found");
            url = null;
        }
        return url;
    }

    @Override
    public String getMimeType(String str) {
        if (str.endsWith(".jpg")) {
            return "image/jpeg";
        } else if (str.endsWith(".png")) {
            return "image/png";
        }  else if (str.endsWith(".css")) {
            return "text/css";
        } else if (str.endsWith(".js")) {
            return "application/javascript";
        } else {
            return "text/html";
        }
    }

    /**
     * Normalize the path for accesing a resource, meaning that will replace
     * consecutive slashes and will remove a leading slash if present.
     *
     * @param path
     *            path to normalize
     *
     * @return normalized path or the original path if there is nothing to be
     *         replaced.
     */
    private String normalizeResourcePath(final String path) {
        if (path == null) {
            return null;
        }
        String normalizedPath = replaceSlashes(path.trim());
        if (normalizedPath.startsWith("/") && normalizedPath.length() > 1) {
            normalizedPath = normalizedPath.substring(1);
        }
        return normalizedPath;
    }

    /**
     * Replaces multiple subsequent slashes with one slash. E.g. ////a//path//
     * will becaome /a/path/
     *
     * @param target
     *            target sring to be replaced
     *
     * @return a string where the subsequent slashes are replaced with one slash
     */
    private String replaceSlashes(final String target) {
        String replaced = target;
        if (replaced != null) {
            replaced = replaced.replaceAll("/+", "/");
        }
        return replaced;
    }

    /**
     * Gets a list of bundles that are imported or required by this bundle.
     *
     * @param bundle
     *            the bundle for which to perform the lookup
     *
     * @return list of imported and required bundles
     *
     */
    private Set<Bundle> getBundlesInClassSpace(Bundle bundle,
                                                     Set<Bundle> bundleSet) {
        return getBundlesInClassSpace(bundle.getBundleContext(), bundle,
                bundleSet);
    }

    private Set<Bundle> getBundlesInClassSpace(BundleContext context,
                                                      Bundle bundle, Set<Bundle> bundleSet) {
        Set<Bundle> bundles = new HashSet<>(); // The set containing the
        // bundles either being
        // imported or required
        if (bundle == null) {
            log.error("Incoming bundle is null");
            return bundles;
        }
        if (context == null) {
            log.error("Incoming context is null");
            return bundles;
        }

        BundleWiring bundleWiring = bundle.adapt(BundleWiring.class);
        if (bundleWiring == null) {
            log.error("BundleWiring is null for: " + bundle);
            return bundles;
        }

        // This will give us all required Wires (including require-bundle)
        List<BundleWire> requiredWires = bundleWiring.getRequiredWires(null);
        for (BundleWire bundleWire : requiredWires) {
            Bundle exportingBundle = bundleWire.getCapability().getRevision()
                    .getBundle();

            if (exportingBundle.getBundleId() == 0) {
                continue; // system bundle is skipped this one isn't needed
            }
            if (!bundles.contains(exportingBundle)) {
                bundles.add(exportingBundle);
            }
        }

//        Set<Bundle> transitiveBundles = new HashSet<>();

        if (!bundleSet.containsAll(bundles)) { // now let's scan transitively
            bundles.removeAll(bundleSet);
            bundleSet.addAll(bundles);
//            for (Bundle importedBundle : bundles) {
//                transitiveBundles.addAll(getBundlesInClassSpace(context,
//                        importedBundle, bundleSet));
//            }
        }

        // Sanity checkpoint to remove uninstalled bundles
        bundleSet.removeIf(auxBundle -> auxBundle.getState() == Bundle.UNINSTALLED);

        return bundleSet;
    }
}
