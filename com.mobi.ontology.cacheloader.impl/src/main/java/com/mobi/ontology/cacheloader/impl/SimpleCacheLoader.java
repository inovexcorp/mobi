package com.mobi.ontology.cacheloader.impl;

/*-
 * #%L
 * com.mobi.ontology.cacheloader.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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

import com.mobi.exception.MobiException;
import com.mobi.etl.api.config.rdf.ImportServiceConfig;
import com.mobi.etl.api.rdf.RDFImportService;
import com.mobi.ontology.cacheloader.api.CacheLoader;
import com.mobi.rdf.api.Resource;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.ConfigurationPolicy;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.IOException;

@Component(configurationPolicy = ConfigurationPolicy.REQUIRE, name = SimpleCacheLoader.NAME)
public class SimpleCacheLoader implements CacheLoader {
    static final String NAME = "com.mobi.ontology.cacheloader.impl";

    private static final Logger LOG = LoggerFactory.getLogger(SimpleCacheLoader.class);

    @Reference
    RDFImportService importService;

    @Override
    public boolean loadOntologyFile(File ontologyFile, Resource graph, String repoId) {
        long importTimeStart = System.currentTimeMillis();
        try {
            ImportServiceConfig.Builder builder = new ImportServiceConfig.Builder()
                    .continueOnError(false)
                    .logOutput(true)
                    .printOutput(false)
                    .batchSize(50000)
                    .format(RDFFormat.NQUADS)
                    .repository(repoId);
            importService.importFile(builder.build(), ontologyFile, graph);
            ontologyFile.delete();
        } catch (IOException e) {
            throw new MobiException("Error writing file to repo or deleting file.", e);
        } finally {
            if (LOG.isTraceEnabled()) {
                LOG.trace("Import statements to repo in {} ms", System.currentTimeMillis() - importTimeStart);
            }
        }
        return true;
    }
}
