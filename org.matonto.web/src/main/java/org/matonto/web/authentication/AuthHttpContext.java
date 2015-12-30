package org.matonto.web.authentication;

import org.apache.commons.codec.binary.Base64;
import org.apache.log4j.Logger;
import org.osgi.framework.Bundle;
import org.osgi.framework.BundleContext;
import org.osgi.framework.wiring.BundleWire;
import org.osgi.framework.wiring.BundleWiring;
import org.osgi.service.http.HttpContext;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

public class AuthHttpContext implements HttpContext {

    private final Logger log = Logger.getLogger(this.getClass().getName());

    private final ConcurrentMap<String, URL> resourceCache = new ConcurrentHashMap<>();

    /**
     * The bundle that registered the service.
     */
    private Bundle bundle;

    /**
     * The root path of the web app inside the bundle.
     */
    private String rootPath = "/";

    /**
     * List of pages that will not be authenticated.
     */
    private List<String> unsecuredPages;

    public void setBundle(Bundle bundle) {
        this.bundle = bundle;
    }

    public void setRootPath(String rootPath) {
        this.rootPath = rootPath;
    }

    public void setUnsecuredPages(List<String> unsecuredPages) {
        this.unsecuredPages = unsecuredPages;
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

        // Allow the login page
        if (unsecuredPages.contains(req.getRequestURI())) {
            return true;
        }

        if (req.getHeader("Authorization") == null) {
            log.debug("Authorization Denied. No Header.");
            res.sendError(HttpServletResponse.SC_UNAUTHORIZED);
            return false;
        }

        if (authenticated(req)) {
            log.debug("Authorization Granted.");
            return true;
        } else {
            log.debug("Authorization Denied. Unauthorized.");
            res.sendError(HttpServletResponse.SC_UNAUTHORIZED);
            return false;
        }
    }

    protected boolean authenticated(HttpServletRequest request) {
        request.setAttribute(AUTHENTICATION_TYPE, HttpServletRequest.BASIC_AUTH);

        String authzHeader = request.getHeader("Authorization");
        String usernameAndPassword = new String(Base64.decodeBase64(authzHeader.substring(6).getBytes()));

        int userNameIndex = usernameAndPassword.indexOf(":");
        String username = usernameAndPassword.substring(0, userNameIndex);
        String password = usernameAndPassword.substring(userNameIndex + 1);

        // Here I will do lame hard coded credential check. HIGHLY NOT RECOMMENDED!
        boolean success = ((username.equals("admin") && password.equals("admin")));

        if (success)
            request.setAttribute(REMOTE_USER, "admin");

        return success;
    }

    @Override
    public URL getResource(String name) {
        final String normalizedName = normalizeResourcePath(rootPath + (name.startsWith("/") ? "" : "/") + name).trim();

        log.debug(String.format("Searching bundle " + bundle + " for resource [%s], normalized to [%s]", name, normalizedName));

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
    public String getMimeType(String s) {
        if (s.endsWith(".jpg")) {
            return "image/jpeg";
        } else if (s.endsWith(".png")) {
            return "image/png";
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

        Set<Bundle> transitiveBundles = new HashSet<>();

        if (!bundleSet.containsAll(bundles)) { // now let's scan transitively
            bundles.removeAll(bundleSet);
            bundleSet.addAll(bundles);
            for (Bundle importedBundle : bundles) {
                transitiveBundles.addAll(getBundlesInClassSpace(context,
                        importedBundle, bundleSet));
            }
        }

        // Sanity checkpoint to remove uninstalled bundles
        Iterator<Bundle> bundleIterator = bundleSet.iterator();
        while (bundleIterator.hasNext()) {
            Bundle auxBundle = bundleIterator.next();
            if (auxBundle.getState() == Bundle.UNINSTALLED) {
                bundleIterator.remove();
            }
        }

        return bundleSet;
    }
}
