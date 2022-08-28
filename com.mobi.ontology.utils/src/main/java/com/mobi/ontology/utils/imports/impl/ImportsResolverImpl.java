package com.mobi.ontology.utils.imports.impl;

/*-
 * #%L
 * com.mobi.ontology.utils
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

import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.utils.imports.ImportsResolver;
import com.mobi.ontology.utils.imports.ImportsResolverConfig;
import com.mobi.persistence.utils.Models;
import com.mobi.persistence.utils.RDFFiles;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.ConfigurationPolicy;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.metatype.annotations.Designate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component(
        configurationPolicy = ConfigurationPolicy.OPTIONAL,
        immediate = true,
        name = ImportsResolverImpl.COMPONENT_NAME
)
@Designate(ocd = ImportsResolverConfig.class)
public class ImportsResolverImpl implements ImportsResolver {
    private final Logger log = LoggerFactory.getLogger(ImportsResolverImpl.class);

    private String userAgent;
    private static final String ACCEPT_HEADERS = "application/rdf+xml, application/xml; q=0.7, text/xml; q=0.6,"
            + "text/turtle; q=0.5, application/ld+json; q=0.4, application/trig; q=0.3, application/n-triples; q=0.2,"
            + " application/n-quads; q=0.19, text/n3; q=0.18, text/plain; q=0.1, */*; q=0.09";
    protected static Set<String> formats = Stream.of(".rdf", ".ttl", ".owl", ".xml", ".jsonld", ".trig", ".json", ".n3",
            ".nq", ".nt").collect(Collectors.toSet());
    static final String COMPONENT_NAME = "com.mobi.ontology.utils.imports.ImportsResolver";

    @Reference
    CatalogConfigProvider catalogConfigProvider;

    @Reference
    CatalogManager catalogManager;

    final ModelFactory mf = new DynamicModelFactory();

    @Activate
    protected void activate(final ImportsResolverConfig config) {
        if (config.userAgent() == null) {
            userAgent = "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:64.0) Gecko/20100101 Firefox/64.0";
        } else {
            userAgent = config.userAgent();
        }
    }

    @Override
    public Optional<Model> retrieveOntologyFromWeb(Resource resource) {
        long startTime = getStartTime();
        Model model = mf.createEmptyModel();
        String urlStr = resource.stringValue();
        Optional<Model> modelOpt = getModel(urlStr);
        if (modelOpt.isPresent()) {
            model = modelOpt.get();
        }
        logDebug("Retrieving " + resource + " from web", startTime);
        return !model.isEmpty() ? Optional.of(model) : Optional.empty();
    }

    /**
     * Retrieves the {@link InputStream} for the provided urlStr.
     *
     * @param urlStr The String representation of a URL.
     * @return A {@link InputStream} of the Ontology from the web.
     * @throws IOException if there is an error connecting to the online resource.
     */
    private InputStream getWebInputStream(String urlStr) throws IOException {
        String actualUrlStr = urlStr.endsWith("/") ? urlStr.substring(0, urlStr.lastIndexOf("/")) : urlStr;
        URL url = new URL(actualUrlStr);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestProperty("User-Agent", userAgent);
        conn.setConnectTimeout(3000);
        conn.setRequestProperty("Accept", ACCEPT_HEADERS);
        conn.connect();

        String originalProtocol = url.getProtocol();
        int status = conn.getResponseCode();
        if (status == HttpURLConnection.HTTP_MOVED_TEMP
                || status == HttpURLConnection.HTTP_MOVED_PERM
                || status == HttpURLConnection.HTTP_SEE_OTHER
                || status == 307 || status == 308) {
            String location = conn.getHeaderField("Location");
            log.trace(actualUrlStr + " redirected to " + location);
            URL newURL = new URL(location);
            String newProtocol = newURL.getProtocol();
            if (!originalProtocol.equals(newProtocol)) {
                log.trace("Protocol changed during redirect from " + originalProtocol + " to " + newProtocol);
                conn = (HttpURLConnection) newURL.openConnection();
                conn.addRequestProperty("Accept", ACCEPT_HEADERS);
                conn.setConnectTimeout(3000);
            }
        }
        return conn.getInputStream();
    }

    /**
     * Attempts to build a {@link Model} from the urlStr representing a web resource.
     *
     * @param urlStr The String representation of a URL.
     * @return An {@link Optional} of the {@link Model} if resolved and parsed. Otherwise, an empty {@link Optional}.
     */
    private Optional<Model> getModel(String urlStr) {
        Model model = mf.createEmptyModel();
        try {
            model = Models.createModel(getWebInputStream(urlStr));
        } catch (IOException | IllegalArgumentException e) {
            log.debug("Could not parse InputStream to model from URL: " + urlStr);
        }
        return model.isEmpty() ? Optional.empty() : Optional.of(model);
    }

    @Override
    public Optional<File> retrieveOntologyFromWebFile(Resource resource) {
        long startTime = getStartTime();
        try {
            String urlStr = resource.stringValue();
            try {
                File tempFile = RDFFiles.writeStreamToTempFile(getWebInputStream(urlStr));
                return RDFFiles.parseFileToFileFormat(tempFile, RDFFormat.NQUADS);
            } catch (IOException e) {
                log.error("Error opening InputStream from web ontology", e);
            }
            return Optional.empty();
        } finally {
            logDebug("Retrieving ontology File from web", startTime);
        }
    }

    @Override
    public Optional<Model> retrieveOntologyLocal(Resource ontologyIRI, OntologyManager ontologyManager) {
        Long startTime = getStartTime();
        Model model = mf.createEmptyModel();
        Optional<Resource> recordIRIOpt = ontologyManager.getOntologyRecordResource(ontologyIRI);
        if (recordIRIOpt.isPresent()) {
            Resource recordIRI = recordIRIOpt.get();
            Optional<Resource> masterHead = catalogManager.getMasterBranch(
                    catalogConfigProvider.getLocalCatalogIRI(), recordIRI).getHead_resource();
            if (masterHead.isPresent()) {
                model = catalogManager.getCompiledResource(masterHead.get());
            }
        }
        logDebug("Retrieving ontology from local catalog", startTime);
        return model.size() > 0 ? Optional.of(model) : Optional.empty();
    }

    @Override
    public Optional<File> retrieveOntologyLocalFile(Resource ontologyIRI, OntologyManager ontologyManager) {
        Long startTime = getStartTime();
        try {
            Optional<Resource> recordIRIOpt = ontologyManager.getOntologyRecordResource(ontologyIRI);
            if (recordIRIOpt.isPresent()) {
                Resource recordIRI = recordIRIOpt.get();
                Optional<Resource> masterHead = catalogManager.getMasterBranch(
                        catalogConfigProvider.getLocalCatalogIRI(), recordIRI).getHead_resource();
                if (masterHead.isPresent()) {
                    File file = catalogManager.getCompiledResourceFile(masterHead.get());
                    return Optional.of(file);
                }
            }
            return Optional.empty();
        } finally {
            logDebug("Retrieving ontology from local catalog", startTime);
        }
    }

    private Long getStartTime() {
        return System.currentTimeMillis();
    }

    private void logDebug(String operationDescription, Long start) {
        log.debug(operationDescription + " complete in " + (System.currentTimeMillis() - start) + " ms");
    }
}
