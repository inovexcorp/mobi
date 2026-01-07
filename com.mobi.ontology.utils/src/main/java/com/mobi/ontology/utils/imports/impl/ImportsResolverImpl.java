package com.mobi.ontology.utils.imports.impl;

/*-
 * #%L
 * com.mobi.ontology.utils
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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

import com.mobi.catalog.api.CompiledResourceManager;
import com.mobi.catalog.api.ThingManager;
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecordFactory;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.ontology.utils.imports.ImportsResolver;
import com.mobi.ontology.utils.imports.ImportsResolverConfig;
import com.mobi.persistence.utils.Bindings;
import com.mobi.persistence.utils.RDFFiles;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.RepositoryConnection;
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
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

@Component(
        configurationPolicy = ConfigurationPolicy.OPTIONAL,
        immediate = true,
        name = ImportsResolverImpl.COMPONENT_NAME
)
@Designate(ocd = ImportsResolverConfig.class)
public class ImportsResolverImpl implements ImportsResolver {
    private final Logger log = LoggerFactory.getLogger(ImportsResolverImpl.class);
    private final ValueFactory vf = new ValidatingValueFactory();

    private String userAgent;
    private int connectionTimeout;
    private int readTimeout;
    private String acceptHeaders;
    private final Set<String> contentTypes = new HashSet<>();

    static final String COMPONENT_NAME = "com.mobi.ontology.utils.imports.ImportsResolver";

    protected static final String FIND_RECORD;
    protected static final String ONTOLOGY_IRI = "ontologyIRI";
    protected static final String CATALOG = "catalog";
    protected static final String RECORD = "record";

    static {
        try {
            FIND_RECORD = IOUtils.toString(
                    Objects.requireNonNull(ImportsResolverImpl.class.getResourceAsStream("/find-record.rq")),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Reference
    ThingManager thingManager;

    @Reference
    CompiledResourceManager compiledResourceManager;

    @Reference
    BranchFactory branchFactory;

    @Reference
    VersionedRDFRecordFactory versionedRDFRecordFactory;

    @Reference
    CatalogConfigProvider catalogConfigProvider;

    @Activate
    protected void activate(final ImportsResolverConfig config) {
        if (config.userAgent() == null) {
            userAgent = "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:64.0) Gecko/20100101 Firefox/64.0";
        } else {
            userAgent = config.userAgent();
        }
        connectionTimeout = config.connectionTimeout();
        readTimeout = config.readTimeout();

        StringBuilder sb = new StringBuilder();
        RDFFiles.getFormats().forEach(format -> {
            format.getMIMETypes().forEach(mimeType -> {
                contentTypes.add(mimeType);
                sb.append(mimeType);
                if (RDFFiles.isOwlFormat(format)) {
                    sb.append("; q=0.5");
                }
                sb.append(", ");
            });
        });
        acceptHeaders = sb.toString();
    }

    /**
     * Retrieves the {@link InputStream} for the provided urlStr.
     *
     * @param urlStr The String representation of a URL.
     * @return A {@link InputStream} of the Ontology from the web.
     * @throws IOException if there is an error connecting to the online resource.
     */
    private HttpURLConnection getWebInputStream(String urlStr) throws IOException {
        String actualUrlStr = urlStr.endsWith("/") ? urlStr.substring(0, urlStr.lastIndexOf("/")) : urlStr;
        URL url = new URL(actualUrlStr);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestProperty("User-Agent", userAgent);
        conn.setConnectTimeout(connectionTimeout);
        conn.setReadTimeout(readTimeout);
        conn.setRequestProperty("Accept", acceptHeaders);
        conn.connect();

        int status = conn.getResponseCode();
        while (status == HttpURLConnection.HTTP_MOVED_TEMP
                || status == HttpURLConnection.HTTP_MOVED_PERM
                || status == HttpURLConnection.HTTP_SEE_OTHER
                || status == 307 || status == 308) {
            String originalProtocol = url.getProtocol();
            String location = conn.getHeaderField("Location");
            log.trace(actualUrlStr + " redirected to " + location);
            URL newURL = new URL(location);
            String newProtocol = newURL.getProtocol();
            if (!originalProtocol.equals(newProtocol)) {
                log.trace("Protocol changed during redirect from " + originalProtocol + " to " + newProtocol);
            }
            conn = (HttpURLConnection) newURL.openConnection();
            conn.addRequestProperty("Accept", acceptHeaders);
            conn.setConnectTimeout(connectionTimeout);
                conn.setReadTimeout(readTimeout);
            status = conn.getResponseCode();
        }
        return conn;
    }

    @Override
    public Optional<File> retrieveOntologyFromWebFile(Resource resource) {
        long startTime = getStartTime();
        try {
            String urlStr = resource.stringValue();
            try {
                HttpURLConnection conn = getWebInputStream(urlStr);
                RDFFormat format = RDFFiles.getFormatForMIMEType(conn.getContentType())
                        .or(() -> {
                            String connContentType = conn.getContentType();
                            return contentTypes.stream()
                                    .filter(connContentType::contains)
                                    .map(RDFFiles::getFormatForMIMEType)
                                    .filter(Optional::isPresent)
                                    .findFirst()
                                    .orElse(Optional.empty());
                        })
                        .or(() -> RDFFiles.getFormatForFileName(conn.getURL().getPath()))
                        .orElseThrow(() -> new IllegalStateException("Could not retrieve RDFFormat for " + resource));
                File tempFile = RDFFiles.writeStreamToTempFile(conn.getInputStream(), format);
                return Optional.of(RDFFiles.parseFileToFileFormat(tempFile, RDFFormat.NQUADS));
            } catch (Exception e) {
                log.error("Error opening InputStream from web ontology", e);
            }
            return Optional.empty();
        } finally {
            logDebug("Retrieving ontology File from web", startTime);
        }
    }

    @Override
    public Optional<File> retrieveOntologyLocalFile(Resource ontologyIRI) {
        Long startTime = getStartTime();
        try {
            Optional<Resource> recordIRIOpt = getRecordIRIFromOntologyIRI(ontologyIRI);
            if (recordIRIOpt.isPresent()) {
                return retrieveOntologyLocalFileFromRecordIRI(recordIRIOpt.get());
            }
            return Optional.empty();
        } finally {
            logDebug("Retrieving ontology from local catalog", startTime);
        }
    }

    @Override
    public Optional<File> retrieveOntologyLocalFileFromRecordIRI(Resource recordIRI) {
        Optional<Resource> masterHead = getMasterBranchHead(recordIRI);
        if (masterHead.isPresent()) {
            File file = getCompiledResourceFile(masterHead.get());
            return Optional.of(file);
        }
        return Optional.empty();
    }

    @Override
    public File retrieveOntologyLocalFileFromCommitIRI(Resource commitIRI) {
        return getCompiledResourceFile(commitIRI);
    }

    @Override
    public Optional<Resource> getRecordIRIFromOntologyIRI(Resource ontologyIRI) {
        try (RepositoryConnection conn = catalogConfigProvider.getRepository().getConnection()) {
            TupleQuery query = conn.prepareTupleQuery(FIND_RECORD);
            query.setBinding(ONTOLOGY_IRI, ontologyIRI);
            query.setBinding(CATALOG, catalogConfigProvider.getLocalCatalogIRI());
            TupleQueryResult result = query.evaluate();
            if (!result.hasNext()) {
                result.close();
                return Optional.empty();
            }
            Optional<Resource> recordIRIOpt = Optional.of(Bindings.requiredResource(result.next(), RECORD));
            result.close();
            return recordIRIOpt;
        }
    }

    private Long getStartTime() {
        return System.currentTimeMillis();
    }

    private void logDebug(String operationDescription, Long start) {
        log.debug(operationDescription + " complete in " + (System.currentTimeMillis() - start) + " ms");
    }

    private File getCompiledResourceFile(Resource commitIRI) {
        try (RepositoryConnection conn = catalogConfigProvider.getRepository().getConnection()) {
            thingManager.validateResource(commitIRI, vf.createIRI(Commit.TYPE), conn);
            return compiledResourceManager.getCompiledResourceFile(commitIRI, RDFFormat.TURTLE, conn);
        }
    }

    private Optional<Resource> getMasterBranchHead(Resource recordIRI) {
        try (RepositoryConnection conn = catalogConfigProvider.getRepository().getConnection()) {
            Optional<VersionedRDFRecord> record = thingManager.optObject(recordIRI, versionedRDFRecordFactory, conn);
            if (record.isEmpty()) {
                return Optional.empty();
            }
            Resource branchId = record.get().getMasterBranch_resource().orElseThrow(() ->
                    new IllegalStateException("Record " + recordIRI + " does not have a master Branch set."));
            return thingManager.getExpectedObject(branchId, branchFactory, conn).getHead_resource();
        }
    }
}
