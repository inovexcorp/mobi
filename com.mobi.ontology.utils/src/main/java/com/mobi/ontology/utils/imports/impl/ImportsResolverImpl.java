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
import java.net.URL;
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

    private CatalogManager catalogManager;
    private ModelFactory mf;
    private SesameTransformer transformer;
    private Set<String> formats = Stream.of(".rdf", ".ttl", ".owl", ".xml", ".jsonld", ".trig", ".json", ".n3", ".nq",
            ".nt").collect(Collectors.toSet());
    private String userAgent;

    static final String COMPONENT_NAME = "com.mobi.ontology.utils.imports.ImportsResolver";

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
        if (urlStr.endsWith("/")) {
            urlStr = urlStr.substring(0, urlStr.lastIndexOf("/"));
        }
        try {
            if (StringUtils.endsWithAny(urlStr, formats.stream().toArray(String[]::new))) {
                Optional<URL> urlOpt = getURL(urlStr);
                if (urlOpt.isPresent()) {
                    model = Models.createModel(urlOpt.get().openConnection().getInputStream(), transformer, parsers);
                }
            } else {
                for (String format : formats) {
                    try {
                        Optional<URL> urlOpt = getURL(urlStr + format);
                        if (urlOpt.isPresent()) {
                            model = Models.createModel(urlOpt.get().openConnection().getInputStream(), transformer, parsers);
                            break;
                        }
                    } catch (IOException e) {
                        continue;
                    }
                }
            }
        } catch (IOException | IllegalArgumentException e) {
            model = mf.createModel();
        }
        logDebug("Retrieving " + resource + " from web", startTime);
        return model.size() > 0 ? Optional.of(model) : Optional.empty();
    }

    private Optional<URL> getURL(String urlStr) throws IOException {
        URL url = new URL(urlStr);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("HEAD");
        conn.setRequestProperty("User-Agent", userAgent);
        conn.setInstanceFollowRedirects(true);
        conn.setConnectTimeout(3000);

        int status = conn.getResponseCode();
        if (status == 200) {
            return Optional.of(url);
        } else if (status == HttpURLConnection.HTTP_MOVED_TEMP
                || status == HttpURLConnection.HTTP_MOVED_PERM
                || status == HttpURLConnection.HTTP_SEE_OTHER
                || status == 307 || status == 308) {
            String redirectUrl = conn.getHeaderField("Location");
            log.debug("URL " + urlStr + " redirected to " + redirectUrl);
            return Optional.of(new URL(redirectUrl));
        }
        return Optional.empty();
    }

    @Override
    public Optional<Model> retrieveOntologyLocal(Resource ontologyIRI, OntologyManager ontologyManager) {
        Long startTime = getStartTime();
        Model model = mf.createModel();
        Optional<Resource> recordIRIOpt = ontologyManager.getOntologyRecordResource(ontologyIRI);
        if (recordIRIOpt.isPresent()) {
            Resource recordIRI = recordIRIOpt.get();
            Optional<Resource> masterHead = catalogManager.getMasterBranch(
                    catalogManager.getLocalCatalog().getResource(), recordIRI).getHead_resource();
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
