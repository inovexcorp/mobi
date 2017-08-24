package org.matonto.etl.cli.export;

/*-
 * #%L
 * org.matonto.etl.cli
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

import org.apache.commons.lang3.StringUtils;
import org.apache.karaf.shell.api.action.Action;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.Option;
import org.apache.karaf.shell.api.action.lifecycle.Reference;
import org.apache.karaf.shell.api.action.lifecycle.Service;
import org.matonto.etl.api.config.rdf.export.RDFExportConfig;
import org.matonto.etl.api.rdf.export.RDFExportService;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;

@Command(scope = "mobi", name = "export", description = "Exports objects from a repository or dataset")
@Service
public class ExportRDF implements Action {

    private static final Logger LOGGER = LoggerFactory.getLogger(ExportRDF.class);

    // Service References

    @Reference
    private RDFExportService exportService;

    public void setExportService(RDFExportService exportService) {
        this.exportService = exportService;
    }

    // Command Parameters

    @Option(name = "-f", aliases = "--output-file", description = "The output file for the exported record data")
    private String filepathParam = null;

    @Option(name = "-t", aliases = "--format", description = "The output format (TRIG, NQUADS, JSONLD)")
    private String formatParam = null;

    @Option(name = "-r", aliases = "--repository", description = "The id of the repository that data will be "
            + "exported from")
    String repositoryId = null;

    @Option( name = "-subj", aliases = "--subject", description = "A subject that all exported triples will be "
            + "restricted to.")
    String subj = null;

    @Option(name = "-pred", aliases = "--predicate", description = "A predicate that all exported triples will be "
            + "restricted to.")
    String predicate = null;

    @Option(name = "-objIRI", aliases = "--objectIRI", description = "An object that all exported triples will be "
            + "restricted to. Takes precedence over ObjectLiteral")
    String objIRI = null;

    @Option(name = "-objLit", aliases = "--objectLiteral", description = "An object literal that all exported triples "
            + "will be restricted to. ObjectIRI takes precedence")
    String objLit = null;

    // Implementation

    @Override
    public Object execute() throws Exception {
        if (StringUtils.isEmpty(repositoryId)) {
            repositoryId = "system";
        }

        OutputStream output;
        if (filepathParam != null) {
            output = new FileOutputStream(filepathParam);
        } else {
            output = System.out;
        }

        RDFFormat outputFormat;
        if (formatParam != null) {
            outputFormat = Rio.getParserFormatForMIMEType(formatParam)
                    .orElseThrow(() -> new IOException("Invalid file format."));
        } else if (filepathParam != null) {
            outputFormat = Rio.getParserFormatForFileName(filepathParam).orElse(RDFFormat.TRIG);
        } else {
            outputFormat = RDFFormat.TRIG;
        }

        RDFExportConfig config = new RDFExportConfig.Builder(output, outputFormat)
                .subj(subj)
                .pred(predicate)
                .objIRI(objIRI)
                .objLit(objLit)
                .build();

        exportService.export(config, repositoryId);

        return null;
    }
}
