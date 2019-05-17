package com.mobi.ontology.utils.imports.impl;

/*-
 * #%L
 * com.mobi.ontology.utils
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import aQute.bnd.annotation.metatype.Configurable;
import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.utils.imports.ImportsResolver;
import com.mobi.ontology.utils.imports.ImportsResolverConfig;
import com.mobi.persistence.utils.Models;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.rdf4j.rio.RDFParser;
import org.semanticweb.owlapi.rio.RioFunctionalSyntaxParserFactory;
import org.semanticweb.owlapi.rio.RioManchesterSyntaxParserFactory;
import org.semanticweb.owlapi.rio.RioOWLXMLParserFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URISyntaxException;
import java.net.URL;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component(
        designateFactory = ImportsResolverConfig.class,
        name = ImportsResolverImpl.COMPONENT_NAME
)
public class ImportsResolverImpl implements ImportsResolver {
    private final Logger log = LoggerFactory.getLogger(ImportsResolverImpl.class);

    private CatalogConfigProvider catalogConfigProvider;
    private CatalogManager catalogManager;
    private ModelFactory mf;
    private SesameTransformer transformer;
    private String userAgent;

    protected static Set<String> formats = Stream.of(".rdf", ".ttl", ".owl", ".xml", ".jsonld", ".trig", ".json", ".n3",
            ".nq", ".nt").collect(Collectors.toSet());
    static final String COMPONENT_NAME = "com.mobi.ontology.utils.imports.ImportsResolver";

    @Reference
    void setCatalogConfigProvider(CatalogConfigProvider catalogConfigProvider) {
        this.catalogConfigProvider = catalogConfigProvider;
    }

    @Reference
    void setCatalogManager(CatalogManager catalogManager) {
        this.catalogManager = catalogManager;
    }

    @Reference
    void setModelFactory(ModelFactory mf) {
        this.mf = mf;
    }

    @Reference
    void setTransformer(SesameTransformer transformer) {
        this.transformer = transformer;
    }

    @Activate
    protected void activate(Map<String, Object> props) {
        ImportsResolverConfig config = Configurable.createConfigurable(ImportsResolverConfig.class, props);
        userAgent = config.userAgent();
    }

    @Override
    public Optional<Model> retrieveOntologyFromWeb(Resource resource) {
        long startTime = getStartTime();
        RDFParser[] parsers = {new RioFunctionalSyntaxParserFactory().getParser(),
                new RioManchesterSyntaxParserFactory().getParser(),
                new RioOWLXMLParserFactory().getParser()};
        Model model = mf.createModel();
        String urlStr = resource.stringValue();

        try {
            Optional<Model> modelOpt = getModel(urlStr, parsers);
            if (modelOpt.isPresent()) {
                model = modelOpt.get();
            }
        } catch (IOException | IllegalArgumentException | URISyntaxException e) {
            model = mf.createModel();
        }
        logDebug("Retrieving " + resource + " from web", startTime);
        return model.size() > 0 ? Optional.of(model) : Optional.empty();
    }

    private Optional<Model> getModel(String urlStr, RDFParser... parsers) throws IOException, URISyntaxException {
        Set<String> processedURLs = new HashSet<>();
        processedURLs.add(urlStr);

        Optional<Model> returnOpt = getModelFromUrl(urlStr, parsers);
        if (returnOpt.isPresent()) {
            return returnOpt;
        } else {
            int status = 0;
            do {
                URL url = new URL(urlStr);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("HEAD");
                conn.setRequestProperty("User-Agent", userAgent);
                conn.setInstanceFollowRedirects(false);
                conn.setConnectTimeout(3000);

                status = conn.getResponseCode();
                if (status == 200) {
                    returnOpt = getModelFromUrl(urlStr, parsers);
                    if (returnOpt.isPresent()) {
                        break;
                    }
                } else if (status == HttpURLConnection.HTTP_MOVED_TEMP
                        || status == HttpURLConnection.HTTP_MOVED_PERM
                        || status == HttpURLConnection.HTTP_SEE_OTHER
                        || status == 307 || status == 308) {
                    String redirectUrl = conn.getHeaderField("Location");
                    log.debug("URL " + url.toURI().toString() + " redirected to " + redirectUrl);
                    returnOpt = getModelFromUrl(redirectUrl, parsers);
                    if (returnOpt.isPresent()) {
                        break;
                    }
                    if (processedURLs.contains(redirectUrl)) {
                        returnOpt = Optional.empty();
                        log.debug("Redirect loop detected. Ending attempt to resolve url.");
                        break;
                    }
                    processedURLs.add(redirectUrl);
                    urlStr = redirectUrl;
                } else {
                    returnOpt = Optional.empty();
                    break;
                }
            } while (status >= 300 && status < 400);
        }
        return returnOpt;
    }

    private Optional<Model> getModelFromUrl(String urlStr, RDFParser... parsers) throws IOException {
        Model model = mf.createModel();
        if (urlStr.endsWith("/")) {
            urlStr = urlStr.substring(0, urlStr.lastIndexOf("/"));
        }
        if (StringUtils.endsWithAny(urlStr, formats.stream().toArray(String[]::new))) {
            URL url = new URL(urlStr);
            try {
                model = Models.createModel(url.openConnection().getInputStream(), transformer, parsers);
            } catch (IOException | IllegalArgumentException e) {
                log.debug("Could not parse inputstream to model from URL ending in a valid rdf extension.");
            }
        } else {
            for (String format : formats) {
                try {
                    URL url = new URL(urlStr + format);
                    model = Models.createModel(url.openConnection().getInputStream(), transformer,
                            parsers);
                    log.debug("Model parsed from URL: " + urlStr + format);
                    break;
                } catch (IOException | IllegalArgumentException e) {
                    log.debug("Could not parse inputstream to model from URL: " + urlStr + format);
                }
            }
        }
        return model.isEmpty() ? Optional.empty() : Optional.of(model);
    }

    @Override
    public Optional<Model> retrieveOntologyLocal(Resource ontologyIRI, OntologyManager ontologyManager) {
        Long startTime = getStartTime();
        Model model = mf.createModel();
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

    private Long getStartTime() {
        return System.currentTimeMillis();
    }

    private void logDebug(String operationDescription, Long start) {
        log.debug(operationDescription + " complete in " + (System.currentTimeMillis() - start) + " ms");
    }
}
