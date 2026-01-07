package com.mobi.etl.service.rdf.export;

/*-
 * #%L
 * com.mobi.etl.rdf
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

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.query.QueryResults;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import com.mobi.dataset.api.DatasetConnection;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.etl.api.config.rdf.export.BaseExportConfig;
import com.mobi.etl.api.rdf.export.DatasetExportService;
import com.mobi.exception.MobiException;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFHandler;
import org.eclipse.rdf4j.rio.RDFHandlerException;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.helpers.BufferedGroupingRDFHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Component
public class DatasetExportServiceImpl implements DatasetExportService {

    private static final Logger LOG = LoggerFactory.getLogger(DatasetExportServiceImpl.class);

    private List<RDFFormat> quadFormats = Arrays.asList(RDFFormat.JSONLD, RDFFormat.NQUADS, RDFFormat.TRIG,
            RDFFormat.TRIX);

    final ValueFactory vf = new ValidatingValueFactory();

    @Reference
    DatasetManager datasetManager;

    @Override
    public void export(BaseExportConfig config, String datasetRecord) throws IOException {
        IRI datasetRecordID = vf.createIRI(datasetRecord);

        RDFFormat format = config.getFormat();
        if (!quadFormats.contains(format)) {
            LOG.warn("RDF format does not support quads so they will not be exported.");
            System.out.println("WARN: RDF format does not support quads so they will not be exported.");
        }

        RDFHandler rdfWriter = new BufferedGroupingRDFHandler(Rio.createWriter(format, config.getOutput()));
        rdfWriter.startRDF();

        try (DatasetConnection conn = datasetManager.getConnection(datasetRecordID)) {
            List<Resource> defaultsList = QueryResults.asList(conn.getDefaultNamedGraphs());
            defaultsList.add(conn.getSystemDefaultNamedGraph());
            Resource[] defaults = defaultsList.toArray(new Resource[defaultsList.size()]);
            for (Statement st: conn.getStatements(null, null, null, defaults)) {
                Statement noContext = vf.createStatement(st.getSubject(), st.getPredicate(), st.getObject());
                rdfWriter.handleStatement(noContext);
            }

            if (quadFormats.contains(format)) {
                List<Resource> graphsList = QueryResults.asList(conn.getNamedGraphs());
                if (!graphsList.isEmpty()) {
                    Resource[] graphs = graphsList.toArray(new Resource[graphsList.size()]);
                    for (Statement st: conn.getStatements(null, null, null, graphs)) {
                        rdfWriter.handleStatement(st);
                    }
                }
            }
        } catch (RDFHandlerException e) {
            throw new MobiException(e);
        }

        rdfWriter.endRDF();
    }
}
