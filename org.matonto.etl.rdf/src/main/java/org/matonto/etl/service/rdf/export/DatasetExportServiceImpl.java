package org.matonto.etl.service.rdf.export;

/*-
 * #%L
 * org.matonto.etl.rdf
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import org.matonto.dataset.api.DatasetConnection;
import org.matonto.dataset.api.DatasetManager;
import org.matonto.etl.api.config.rdf.export.BaseExportConfig;
import org.matonto.etl.api.rdf.export.DatasetExportService;
import org.matonto.exception.MatOntoException;
import org.matonto.persistence.utils.RepositoryResults;
import org.matonto.persistence.utils.api.SesameTransformer;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Statement;
import org.matonto.rdf.api.ValueFactory;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.RDFHandler;
import org.openrdf.rio.RDFHandlerException;
import org.openrdf.rio.Rio;
import org.openrdf.rio.helpers.BufferedGroupingRDFHandler;
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

    private ValueFactory vf;
    private DatasetManager datasetManager;
    private SesameTransformer transformer;

    @Reference
    public void setValueFactory(ValueFactory vf) {
        this.vf = vf;
    }

    @Reference
    public void setDatasetManager(DatasetManager datasetManager) {
        this.datasetManager = datasetManager;
    }

    @Reference
    public void setTransformer(SesameTransformer transformer) {
        this.transformer = transformer;
    }

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
            List<Resource> defaultsList = RepositoryResults.asList(conn.getDefaultNamedGraphs());
            defaultsList.add(conn.getSystemDefaultNamedGraph());
            Resource[] defaults = defaultsList.toArray(new Resource[defaultsList.size()]);
            for (Statement st: conn.getStatements(null, null, null, defaults)) {
                Statement noContext = vf.createStatement(st.getSubject(), st.getPredicate(), st.getObject());
                rdfWriter.handleStatement(transformer.sesameStatement(noContext));
            }

            if (quadFormats.contains(format)) {
                List<Resource> graphsList = RepositoryResults.asList(conn.getNamedGraphs());
                if (!graphsList.isEmpty()) {
                    Resource[] graphs = graphsList.toArray(new Resource[graphsList.size()]);
                    for (Statement st: conn.getStatements(null, null, null, graphs)) {
                        rdfWriter.handleStatement(transformer.sesameStatement(st));
                    }
                }
            }
        } catch (RDFHandlerException e) {
            throw new MatOntoException(e);
        }

        rdfWriter.endRDF();
    }
}
